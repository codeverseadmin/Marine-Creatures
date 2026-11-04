import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { RoleModel } from '@/models/Role';
import { EmployeeModel } from '@/models/Employee';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { SYSTEM_ROLES, PERMISSIONS_REGISTRY } from '@/lib/rbac/permissions';
import { getClientIp } from '@/lib/rate-limit';

// ── GET /api/admin/roles ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'roles.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();

    const [customRoles, employeeCounts] = await Promise.all([
      RoleModel.find({}).sort({ createdAt: 1 }).lean(),
      EmployeeModel.aggregate([
        { $group: { _id: '$roleId', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap: Record<string, number> = {};
    employeeCounts.forEach((c: any) => {
      countMap[c._id] = c.count;
    });

    const systemRoleList = Object.values(SYSTEM_ROLES).map((role) => ({
      ...role,
      assignedCount: countMap[role.id] || 0,
      isSystem: true,
    }));

    const customRoleList = customRoles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      isSystem: false,
      version: role.version,
      createdAt: role.createdAt,
      assignedCount: countMap[role.id] || 0,
    }));

    return NextResponse.json({
      success: true,
      roles: [...systemRoleList, ...customRoleList],
      permissionsRegistry: Object.values(PERMISSIONS_REGISTRY),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve role registry' },
      { status: 500 }
    );
  }
}

// ── POST /api/admin/roles ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'roles.create');
  if (errorResponse) return errorResponse;

  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const { id, name, description = '', permissions = [] } = body;

    if (!id || typeof id !== 'string' || !/^[a-z0-9_-]{2,30}$/.test(id.trim().toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Role identifier must be 2-30 lowercase alphanumeric characters (hyphens and underscores permitted)',
        },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Role display name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    const cleanId = id.trim().toLowerCase();

    // Check conflict with system roles
    if (SYSTEM_ROLES[cleanId] || cleanId === 'owner' || cleanId === 'super_admin') {
      return NextResponse.json(
        { success: false, error: `Role ID '${cleanId}' is reserved by the system` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingCustom = await RoleModel.findOne({ id: cleanId });
    if (existingCustom) {
      return NextResponse.json(
        { success: false, error: `A custom role with ID '${cleanId}' already exists` },
        { status: 409 }
      );
    }

    // Validate permissions array
    if (!Array.isArray(permissions)) {
      return NextResponse.json(
        { success: false, error: 'Permissions must be an array of strings' },
        { status: 400 }
      );
    }

    for (const p of permissions) {
      if (!PERMISSIONS_REGISTRY[p]) {
        return NextResponse.json(
          { success: false, error: `Invalid permission identifier: '${p}'` },
          { status: 400 }
        );
      }
    }

    const role = await RoleModel.create({
      id: cleanId,
      name: name.trim(),
      description: description.trim(),
      isSystem: false,
      permissions,
      version: 1,
      createdBy: auth!.actorEmail,
    });

    await recordAuditLog({
      action: 'ROLE_CREATED',
      entityType: 'role',
      entityId: role.id,
      entityName: role.name,
      summary: `Created custom role '${role.name}' with ${permissions.length} permissions`,
      actor: auth!.actorEmail,
      ip,
      details: { roleId: role.id, permissions },
    });

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create custom role' },
      { status: 500 }
    );
  }
}

