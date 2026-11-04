import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel } from '@/models/Employee';
import { RoleModel } from '@/models/Role';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { SYSTEM_ROLES } from '@/lib/rbac/permissions';
import { getClientIp } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── GET /api/admin/employees/[id] ──────────────────────────────────────────
export async function GET(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'employees.read');
  if (errorResponse) return errorResponse;

  try {
    const { id } = await context.params;
    await connectToDatabase();

    const employee = await EmployeeModel.findById(id)
      .select('-passwordHash -invitationTokenHash')
      .lean();

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve employee details' },
      { status: 500 }
    );
  }
}

// ── PATCH /api/admin/employees/[id] ────────────────────────────────────────
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const { name, roleId, status, customPermissions } = body;

    // Check permission based on what's changing
    const isStatusOnlyChange = status !== undefined && name === undefined && roleId === undefined;
    const requiredPerm = isStatusOnlyChange && status === 'suspended' ? 'employees.suspend' : 'employees.update';

    const { auth, errorResponse } = await requirePermission(req, requiredPerm);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    const before = {
      name: employee.name,
      roleId: employee.roleId,
      status: employee.status,
      customPermissions: employee.customPermissions,
    };

    // ── Last Active Owner Protection ─────────────────────────────────────────
    if (employee.roleId === 'owner' && employee.status === 'active') {
      const willDemote = roleId && roleId !== 'owner';
      const willSuspend = status && status === 'suspended';

      if (willDemote || willSuspend) {
        const activeOwners = await EmployeeModel.countDocuments({
          roleId: 'owner',
          status: 'active',
          _id: { $ne: employee._id },
        });

        if (activeOwners === 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot modify or suspend the only active Owner. Designate another active Owner first.',
            },
            { status: 400 }
          );
        }
      }
    }

    // ── Owner Role Privilege Escalation Check ────────────────────────────────
    if (roleId && roleId === 'owner' && !auth!.isOwner) {
      return NextResponse.json(
        { success: false, error: 'Only an existing Owner can grant the Owner role' },
        { status: 403 }
      );
    }

    if (name && typeof name === 'string') {
      employee.name = name.trim();
    }

    if (roleId && typeof roleId === 'string') {
      const isSystem = Boolean(SYSTEM_ROLES[roleId]);
      if (!isSystem) {
        const customRole = await RoleModel.findOne({ id: roleId });
        if (!customRole) {
          return NextResponse.json(
            { success: false, error: `Role '${roleId}' does not exist` },
            { status: 400 }
          );
        }
      }
      employee.roleId = roleId.trim();
      // Role changed: bump sessionVersion so employee gets fresh permissions
      employee.sessionVersion = (employee.sessionVersion || 1) + 1;
    }

    if (customPermissions && Array.isArray(customPermissions)) {
      employee.customPermissions = customPermissions;
      employee.sessionVersion = (employee.sessionVersion || 1) + 1;
    }

    let statusAction: 'EMPLOYEE_SUSPENDED' | 'EMPLOYEE_REACTIVATED' | null = null;
    if (status && ['active', 'suspended'].includes(status)) {
      if (employee.status !== status) {
        if (status === 'suspended') {
          statusAction = 'EMPLOYEE_SUSPENDED';
          // Immediately bump session version so active sessions die instantly
          employee.sessionVersion = (employee.sessionVersion || 1) + 1;
        } else if (status === 'active') {
          statusAction = 'EMPLOYEE_REACTIVATED';
        }
        employee.status = status;
      }
    }

    await employee.save();

    // Audit logs
    if (statusAction) {
      await recordAuditLog({
        action: statusAction,
        entityType: 'employee',
        entityId: employee._id.toString(),
        entityName: employee.name,
        summary: `${statusAction === 'EMPLOYEE_SUSPENDED' ? 'Suspended' : 'Reactivated'} employee account: ${employee.name} (${employee.email})`,
        actor: auth!.actorEmail,
        ip,
        details: { before: before.status, after: employee.status },
      });
    } else {
      await recordAuditLog({
        action: 'EMPLOYEE_UPDATED',
        entityType: 'employee',
        entityId: employee._id.toString(),
        entityName: employee.name,
        summary: `Updated employee profile for ${employee.name} (${employee.email})`,
        actor: auth!.actorEmail,
        ip,
        details: { before, after: { name: employee.name, roleId: employee.roleId, status: employee.status } },
      });
    }

    const sanitized = employee.toObject();
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).invitationTokenHash;

    return NextResponse.json({ success: true, employee: sanitized });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/admin/employees/[id] ───────────────────────────────────────
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'employees.delete');
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const ip = getClientIp(req);

  try {
    await connectToDatabase();
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (auth!.actorId === employee._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'You cannot delete your own administrative account' },
        { status: 400 }
      );
    }

    // Last active Owner check
    if (employee.roleId === 'owner' && employee.status === 'active') {
      const activeOwners = await EmployeeModel.countDocuments({
        roleId: 'owner',
        status: 'active',
        _id: { $ne: employee._id },
      });

      if (activeOwners === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot delete the only active Owner. Designate another active Owner first.',
          },
          { status: 400 }
        );
      }
    }

    await EmployeeModel.findByIdAndDelete(id);

    await recordAuditLog({
      action: 'EMPLOYEE_DELETED',
      entityType: 'employee',
      entityId: id,
      entityName: employee.name,
      summary: `Permanently deleted employee account: ${employee.name} (${employee.email})`,
      actor: auth!.actorEmail,
      ip,
      details: { email: employee.email, roleId: employee.roleId },
    });

    return NextResponse.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete employee' },
      { status: 500 }
    );
  }
}

