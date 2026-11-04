import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel } from '@/models/Employee';
import { hashToken } from '@/lib/rbac/password';
import { SYSTEM_ROLES } from '@/lib/rbac/permissions';
import { RoleModel } from '@/models/Role';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimit = await checkRateLimit(`invite_verify_${ip}`, 30, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again shortly.' },
      { status: 429 }
    );
  }

  const token = req.nextUrl.searchParams.get('token');
  if (!token || typeof token !== 'string' || token.length < 32) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing invitation token' },
      { status: 400 }
    );
  }

  try {
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
          error: 'This invitation link has expired. Please ask your administrator to send a new invitation.',
        },
        { status: 400 }
      );
    }

    let roleName = employee.roleId;
    if (SYSTEM_ROLES[employee.roleId]) {
      roleName = SYSTEM_ROLES[employee.roleId].name;
    } else {
      const customRole = await RoleModel.findOne({ id: employee.roleId });
      if (customRole) {
        roleName = customRole.name;
      }
    }

    return NextResponse.json({
      success: true,
      employee: {
        name: employee.name,
        email: employee.email,
        roleId: employee.roleId,
        roleName,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

