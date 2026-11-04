import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel } from '@/models/Employee';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { generateInvitationToken } from '@/lib/rbac/password';
import { getClientIp } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'employees.create');
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const ip = getClientIp(req);

  try {
    await connectToDatabase();
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    if (employee.status !== 'invited') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot generate invitation for an employee with status '${employee.status}'. Account has already been activated.`,
        },
        { status: 400 }
      );
    }

    const { rawToken, tokenHash } = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    employee.invitationTokenHash = tokenHash;
    employee.invitationExpiresAt = expiresAt;
    employee.sessionVersion = (employee.sessionVersion || 1) + 1;
    await employee.save();

    await recordAuditLog({
      action: 'EMPLOYEE_INVITED',
      entityType: 'employee',
      entityId: employee._id.toString(),
      entityName: employee.name,
      summary: `Regenerated invitation token for ${employee.name} (${employee.email})`,
      actor: auth!.actorEmail,
      ip,
      details: { expiresAt: expiresAt.toISOString() },
    });

    const origin = req.headers.get('origin') || req.nextUrl.origin || '';
    const inviteUrl = `${origin}/admin/invite?token=${rawToken}`;

    return NextResponse.json({
      success: true,
      invitation: {
        token: rawToken,
        inviteUrl,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to regenerate invitation' },
      { status: 500 }
    );
  }
}

