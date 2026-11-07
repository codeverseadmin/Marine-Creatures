import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel, EmployeeStatus } from '@/models/Employee';
import { RoleModel } from '@/models/Role';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { SYSTEM_ROLES, PERMISSIONS_REGISTRY } from '@/lib/rbac/permissions';
import { generateInvitationToken } from '@/lib/rbac/password';
import { getClientIp } from '@/lib/rate-limit';
import { claimBootstrapSeal, sealBootstrap } from '@/lib/rbac/bootstrap';

// ── GET /api/admin/employees ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'employees.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.trim() || '';
    const role = url.searchParams.get('role')?.trim() || '';
    const status = url.searchParams.get('status')?.trim() || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && role !== 'all') {
      query.roleId = role;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    const [employees, total, totalActive, totalSuspended, totalInvited] = await Promise.all([
      EmployeeModel.find(query)
        .select('-passwordHash -invitationTokenHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EmployeeModel.countDocuments(query),
      EmployeeModel.countDocuments({ status: 'active' }),
      EmployeeModel.countDocuments({ status: 'suspended' }),
      EmployeeModel.countDocuments({ status: 'invited' }),
    ]);

    return NextResponse.json({
      success: true,
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      stats: {
        total: totalActive + totalSuspended + totalInvited,
        active: totalActive,
        suspended: totalSuspended,
        invited: totalInvited,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve employee directory' },
      { status: 500 }
    );
  }
}

// ── POST /api/admin/employees ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'employees.create');
  if (errorResponse) return errorResponse;

  const ip = getClientIp(req);

  try {
    const body = await req.json();
    const { name, email, roleId, customPermissions = [] } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'A valid employee name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = (roleId || '').trim();

    await connectToDatabase();

    // 1. Check duplicate email
    const existing = await EmployeeModel.findOne({ email: cleanEmail });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An employee account with this email address already exists' },
        { status: 409 }
      );
    }

    // 2. Validate role
    const isSystemRole = Boolean(SYSTEM_ROLES[cleanRole]);
    if (!isSystemRole) {
      const customRole = await RoleModel.findOne({ id: cleanRole });
      if (!customRole) {
        return NextResponse.json(
          { success: false, error: `Specified role '${cleanRole}' does not exist` },
          { status: 400 }
        );
      }
    }

    // 3. Prevent privilege escalation: Only an Owner can assign the 'owner' role
    if (cleanRole === 'owner') {
      if (!auth!.isOwner) {
        return NextResponse.json(
          { success: false, error: 'Only an existing Owner can create or assign the Owner role' },
          { status: 403 }
        );
      }

      // If in bootstrap mode, atomically claim the bootstrap seal to prevent concurrency races
      if (auth!.type === 'bootstrap_owner') {
        const claimed = await claimBootstrapSeal(cleanEmail);
        if (!claimed) {
          return NextResponse.json(
            { success: false, error: 'Bootstrap ownership has already been claimed and sealed.' },
            { status: 409 }
          );
        }
      }
    }

    // 4. Custom Permissions Guard: Only an Owner can assign custom permissions; wildcard '*' is banned
    const validatedCustomPermissions: string[] = [];
    if (Array.isArray(customPermissions) && customPermissions.length > 0) {
      if (!auth!.isOwner) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only an Owner can assign custom permissions during invitation creation' },
          { status: 403 }
        );
      }

      if (customPermissions.includes('*')) {
        return NextResponse.json(
          { success: false, error: "Wildcard '*' permission cannot be assigned via custom permissions." },
          { status: 400 }
        );
      }

      for (const perm of customPermissions) {
        if (typeof perm !== 'string' || !PERMISSIONS_REGISTRY[perm]) {
          return NextResponse.json(
            { success: false, error: `Invalid permission '${perm}' in custom permissions` },
            { status: 400 }
          );
        }
        validatedCustomPermissions.push(perm);
      }
    }

    // 5. Generate one-time invitation token (48-hour expiration)
    const { rawToken, tokenHash } = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const employee = await EmployeeModel.create({
      name: name.trim(),
      email: cleanEmail,
      roleId: cleanRole,
      customPermissions: validatedCustomPermissions,
      status: 'invited',
      invitationTokenHash: tokenHash,
      invitationExpiresAt: expiresAt,
      sessionVersion: 1,
      invitedBy: auth!.actorEmail,
    });

    if (cleanRole === 'owner') {
      await sealBootstrap('owner_invitation_created', cleanEmail);
    }

    await recordAuditLog({
      action: 'EMPLOYEE_INVITED',
      entityType: 'employee',
      entityId: employee._id.toString(),
      entityName: employee.name,
      summary: `Created invitation for employee ${employee.name} (${cleanEmail}) with role ${cleanRole}`,
      actor: auth!.actorEmail,
      ip,
      details: {
        roleId: cleanRole,
        invitedBy: auth!.actorEmail,
        expiresAt: expiresAt.toISOString(),
      },
    });

    const sanitized = employee.toObject();
    delete (sanitized as any).passwordHash;
    delete (sanitized as any).invitationTokenHash;

    const origin = req.headers.get('origin') || req.nextUrl.origin || '';
    const inviteUrl = `${origin}/admin/invite?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      employee: sanitized,
      invitation: {
        token: rawToken,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create employee invitation' },
      { status: 500 }
    );
  }
}

