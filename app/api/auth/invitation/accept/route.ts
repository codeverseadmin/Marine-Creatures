import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel } from '@/models/Employee';
import { hashToken, hashPassword, validatePasswordStrength } from '@/lib/rbac/password';
import { createEmployeeSessionToken, EMPLOYEE_SESSION_TTL_MS, SESSION_COOKIE } from '@/lib/rbac/session';
import { recordAuditLog } from '@/lib/rbac/guard';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`invite_accept_${ip}`, 10, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many attempts. Please try again shortly.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== 'string' || token.length < 32) {
      return NextResponse.json(
        { success: false, error: 'Invalid invitation token' },
        { status: 400 }
      );
    }

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { success: false, error: strengthCheck.message },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    await connectToDatabase();

    const employee = await EmployeeModel.findOne({
      invitationTokenHash: tokenHash,
      status: 'invited',
    });

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: 'This invitation link is invalid or has already been used.',
        },
        { status: 400 }
      );
    }

    if (employee.invitationExpiresAt && employee.invitationExpiresAt.getTime() < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: 'This invitation link has expired. Please request a new invitation link from your administrator.',
        },
        { status: 400 }
      );
    }

    // Set password, activate account, and invalidate invitation token
    employee.passwordHash = hashPassword(password);
    employee.status = 'active';
    employee.invitationTokenHash = null;
    employee.invitationExpiresAt = null;
    employee.sessionVersion = 1;
    employee.lastLoginAt = new Date();
    employee.lastLoginIp = ip;
    await employee.save();

    await recordAuditLog({
      action: 'EMPLOYEE_INVITATION_ACCEPTED',
      entityType: 'employee',
      entityId: employee._id.toString(),
      entityName: employee.name,
      summary: `Employee ${employee.name} accepted invitation and activated account`,
      actor: employee.email,
      ip,
      details: { roleId: employee.roleId },
    });

    // Create session token and log in immediately
    const sessionToken = createEmployeeSessionToken(employee);

    const response = NextResponse.json({
      success: true,
      message: 'Your account has been successfully activated. Welcome to Control OS.',
      user: {
        id: employee._id.toString(),
        name: employee.name,
        email: employee.email,
        roleId: employee.roleId,
      },
    });

    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: Math.floor(EMPLOYEE_SESSION_TTL_MS / 1000),
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to activate employee account' },
      { status: 500 }
    );
  }
}

