import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel } from '@/models/Employee';
import { verifyPasscode, createSessionToken, SESSION_COOKIE } from '@/lib/auth';
import { createEmployeeSessionToken, EMPLOYEE_SESSION_TTL_MS } from '@/lib/rbac/session';
import { verifyPassword } from '@/lib/rbac/password';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { recordAuditLog } from '@/lib/rbac/guard';
import { isBootstrapAllowed } from '@/lib/rbac/bootstrap';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 120 login attempts per 60 seconds per IP (corporate network & multi-staff friendly)
  const rateLimit = await checkRateLimit(`login_ip_${ip}`, 120, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many login attempts. Please try again in ${rateLimit.retryAfter} seconds.`,
      },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter) },
      }
    );
  }

  try {
    const body = await req.json();
    const { email, password, passcode } = body;

    // ── Flow 1: Individual Employee Login (Email + Password) ───────────────
    if (email && password) {
      if (typeof email !== 'string' || typeof password !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password format' },
          { status: 400 }
        );
      }

      const cleanEmail = email.toLowerCase().trim();
      await connectToDatabase();

      const employee = await EmployeeModel.findOne({ email: cleanEmail }).select('+passwordHash');

      if (!employee || !employee.passwordHash) {
        await new Promise((r) => setTimeout(r, 400));
        await recordAuditLog({
          action: 'EMPLOYEE_LOGIN_FAILED',
          entityType: 'employee',
          entityId: cleanEmail,
          entityName: cleanEmail,
          summary: `Failed login attempt for nonexistent or unconfigured email: ${cleanEmail}`,
          actor: 'unauthenticated',
          ip,
          details: { email: cleanEmail, reason: 'user_not_found' },
        });

        return NextResponse.json(
          { success: false, error: 'Invalid email address or password' },
          { status: 401 }
        );
      }

      // Check account status
      if (employee.status === 'suspended') {
        await recordAuditLog({
          action: 'EMPLOYEE_LOGIN_FAILED',
          entityType: 'employee',
          entityId: employee._id.toString(),
          entityName: employee.name,
          summary: `Login blocked: Account suspended for ${cleanEmail}`,
          actor: 'unauthenticated',
          ip,
          details: { email: cleanEmail, reason: 'account_suspended' },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'This account has been suspended. Please contact the system administrator.',
          },
          { status: 403 }
        );
      }

      if (employee.status === 'invited') {
        return NextResponse.json(
          {
            success: false,
            error: 'This account has not yet accepted its invitation. Please use your invitation link.',
          },
          { status: 403 }
        );
      }

      // Verify password using timingSafeEqual scrypt asynchronously (non-blocking)
      const isPasswordValid = await verifyPassword(password, employee.passwordHash);
      if (!isPasswordValid) {
        await new Promise((r) => setTimeout(r, 400));
        await recordAuditLog({
          action: 'EMPLOYEE_LOGIN_FAILED',
          entityType: 'employee',
          entityId: employee._id.toString(),
          entityName: employee.name,
          summary: `Failed login attempt for ${cleanEmail} (incorrect password)`,
          actor: 'unauthenticated',
          ip,
          details: { email: cleanEmail, reason: 'invalid_password' },
        });

        return NextResponse.json(
          { success: false, error: 'Invalid email address or password' },
          { status: 401 }
        );
      }

      // Successful login
      employee.lastLoginAt = new Date();
      employee.lastLoginIp = ip;
      await employee.save();

      const sessionToken = createEmployeeSessionToken(employee);

      await recordAuditLog({
        action: 'EMPLOYEE_LOGIN_SUCCESS',
        entityType: 'employee',
        entityId: employee._id.toString(),
        entityName: employee.name,
        summary: `Employee ${employee.name} (${employee.roleId}) authenticated successfully`,
        actor: employee.email,
        ip,
        details: { roleId: employee.roleId },
      });

      const response = NextResponse.json({
        success: true,
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
    }

    // ── Flow 2: Passcode Login (Founder Bootstrap / Fallback) ──────────────
    if (passcode) {
      if (typeof passcode !== 'string') {
        return NextResponse.json({ success: false, error: 'Passcode is required' }, { status: 400 });
      }

      if (!verifyPasscode(passcode)) {
        await new Promise((r) => setTimeout(r, 500));
        return NextResponse.json({ success: false, error: 'Invalid passcode' }, { status: 401 });
      }

      await connectToDatabase();
      const allowed = await isBootstrapAllowed();

      // SEC-RBAC-P0-02 & MC-PHASE-3.1 Remediation: Master passcode is ONLY permitted during initial unsealed bootstrap
      // when zero Owner accounts have ever existed. Once sealed or an Owner is created, passcode login is permanently deactivated.
      if (!allowed) {
        await recordAuditLog({
          action: 'EMPLOYEE_LOGIN_FAILED',
          entityType: 'security',
          entityId: 'master_passcode',
          entityName: 'Master Passcode Attempt',
          summary: 'Rejected master passcode login attempt: Bootstrap mode is permanently sealed.',
          actor: 'unauthenticated',
          ip,
          details: { reason: 'bootstrap_permanently_sealed' },
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Master passcode login is deactivated because bootstrap mode is permanently sealed. Please sign in with your employee email and password.',
          },
          { status: 403 }
        );
      }

      // Issue temporary bootstrap session token strictly for initial Owner account creation
      const token = createSessionToken();
      const response = NextResponse.json({
        success: true,
        isBootstrap: true,
        message: 'Bootstrap Mode: No active Owner exists. You may now create the initial Owner account.',
      });

      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8-hour session
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Email and password (or passcode) are required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Authentication processing failed' },
      { status: 500 }
    );
  }
}
