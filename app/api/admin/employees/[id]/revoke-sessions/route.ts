import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel } from '@/models/Employee';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { getClientIp } from '@/lib/rate-limit';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'employees.update');
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const ip = getClientIp(req);

  try {
    await connectToDatabase();
    const employee = await EmployeeModel.findById(id);

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Bump sessionVersion to immediately invalidate all current sessions
    employee.sessionVersion = (employee.sessionVersion || 1) + 1;
    await employee.save();

    await recordAuditLog({
      action: 'EMPLOYEE_SESSIONS_REVOKED',
      entityType: 'employee',
      entityId: employee._id.toString(),
      entityName: employee.name,
      summary: `Revoked all active sessions for ${employee.name} (${employee.email})`,
      actor: auth!.actorEmail,
      ip,
      details: { newSessionVersion: employee.sessionVersion },
    });

    return NextResponse.json({
      success: true,
      message: `All active sessions for ${employee.name} have been revoked.`,
      sessionVersion: employee.sessionVersion,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to revoke employee sessions' },
      { status: 500 }
    );
  }
}

