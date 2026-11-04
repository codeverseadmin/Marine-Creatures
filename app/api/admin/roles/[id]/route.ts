import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { RoleModel } from '@/models/Role';
import { EmployeeModel } from '@/models/Employee';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { SYSTEM_ROLES, PERMISSIONS_REGISTRY } from '@/lib/rbac/permissions';
import { getClientIp } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ── PATCH /api/admin/roles/[id] ────────────────────────────────────────────
export async function PATCH(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'roles.update');
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const ip = getClientIp(req);
  const cleanId = id.trim().toLowerCase();

  // Protect system roles from permission alteration
  if (SYSTEM_ROLES[cleanId] || cleanId === 'owner') {
    return NextResponse.json(
      { success: false, error: 'System roles are protected and cannot be directly modified' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    await connectToDatabase();
    const role = await RoleModel.findOne({ id: cleanId });

    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    const before = {
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
    };

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      role.name = name.trim();
    }

    if (description !== undefined && typeof description === 'string') {
      role.description = description.trim();
    }

    let permissionsChanged = false;
    if (permissions && Array.isArray(permissions)) {
      for (const p of permissions) {
        if (!PERMISSIONS_REGISTRY[p]) {
          return NextResponse.json(
            { success: false, error: `Invalid permission identifier: '${p}'` },
            { status: 400 }
          );
        }
      }
      role.permissions = permissions;
      role.version = (role.version || 1) + 1;
      permissionsChanged = true;
    }

    await role.save();

    // Invalidate stale employee sessions for users assigned to this role
    if (permissionsChanged) {
      await EmployeeModel.updateMany(
        { roleId: cleanId },
        { $inc: { sessionVersion: 1 } }
      );
    }

    await recordAuditLog({
      action: 'ROLE_UPDATED',
      entityType: 'role',
      entityId: role.id,
      entityName: role.name,
      summary: `Updated role '${role.name}' (version ${role.version})`,
      actor: auth!.actorEmail,
      ip,
      details: { before, after: { name: role.name, permissions: role.permissions } },
    });

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}

// ── DELETE /api/admin/roles/[id] ───────────────────────────────────────────
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'roles.delete');
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const ip = getClientIp(req);
  const cleanId = id.trim().toLowerCase();

  // Prevent deleting system roles
  if (SYSTEM_ROLES[cleanId] || cleanId === 'owner') {
    return NextResponse.json(
      { success: false, error: 'System roles are protected and cannot be deleted' },
      { status: 403 }
    );
  }

  try {
    await connectToDatabase();

    const role = await RoleModel.findOne({ id: cleanId });
    if (!role) {
      return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    }

    // Safety check: Prevent deleting role if assigned to any employee
    const assignedCount = await EmployeeModel.countDocuments({ roleId: cleanId });
    if (assignedCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete role '${role.name}'. It is currently assigned to ${assignedCount} employee(s). Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await RoleModel.deleteOne({ id: cleanId });

    await recordAuditLog({
      action: 'ROLE_DELETED',
      entityType: 'role',
      entityId: cleanId,
      entityName: role.name,
      summary: `Deleted custom role '${role.name}' (${cleanId})`,
      actor: auth!.actorEmail,
      ip,
      details: { roleId: cleanId, name: role.name },
    });

    return NextResponse.json({ success: true, message: `Role '${role.name}' deleted successfully` });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete role' },
      { status: 500 }
    );
  }
}

