import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel } from '@/models/Employee';
import { hashToken, hashPassword, validatePasswordStrength } from '@/lib/rbac/password';
import { createEmployeeSessionToken, EMPLOYEE_SESSION_TTL_MS, SESSION_COOKIE } from '@/lib/rbac/session';
import { recordAuditLog } from '@/lib/rbac/guard';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sealBootstrap } from '@/lib/rbac/bootstrap';

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

    const hashedPassword = await hashPassword(password);

    // SEC-RBAC-P1-02 Remediation: Atomic invitation redemption via findOneAndUpdate
    // Guarantees strictly single-use consumption and eliminates TOCTOU race conditions under concurrent requests.
    const employee = await EmployeeModel.findOneAndUpdate(
      {
        invitationTokenHash: tokenHash,
        status: 'invited',
        $or: [
          { invitationExpiresAt: null },
          { invitationExpiresAt: { $gt: new Date() } },
        ],
      },
      {
        $set: {
          passwordHash: hashedPassword,
          status: 'active',
          invitationTokenHash: null,
          invitationExpiresAt: null,
          sessionVersion: 1,
          lastLoginAt: new Date(),
          lastLoginIp: ip,
        },
      },
      { new: true }
    );

    if (!employee) {
      const expiredCheck = await EmployeeModel.findOne({
        invitationTokenHash: tokenHash,
        invitationExpiresAt: { $lte: new Date() },
      }).lean();

      if (expiredCheck) {
        return NextResponse.json(
          {
            success: false,
            error: 'This invitation link has expired. Please request a new invitation link from your administrator.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'This invitation link is invalid or has already been used.',
        },
        { status: 400 }
      );
    }

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

    if (employee.roleId === 'owner') {
      await sealBootstrap('first_owner_activated', employee.email);
    }

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

