import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { EmployeeModel, IEmployeeDocument } from '@/models/Employee';
import { RoleModel } from '@/models/Role';
import { AuditLogModel, AuditAction, AuditEntityType } from '@/models/AuditLog';
import { verifyEmployeeSessionToken, SESSION_COOKIE } from './session';
import { SYSTEM_ROLES, PERMISSIONS_REGISTRY } from './permissions';
import { isAdminAuthenticated, verifyPasscode } from '@/lib/auth';
import { getClientIp } from '@/lib/rate-limit';
import { isBootstrapAllowed } from './bootstrap';

export interface AuthenticatedAuthContext {
  authenticated: true;
  type: 'employee' | 'bootstrap_owner' | 'service';
  employee: IEmployeeDocument | null;
  actorId: string;
  actorName: string;
  actorEmail: string;
  roleId: string;
  permissions: Set<string>;
  isOwner: boolean;
}

export interface UnauthenticatedAuthContext {
  authenticated: false;
  error: string;
  statusCode: number;
}

export type AuthContext = AuthenticatedAuthContext | UnauthenticatedAuthContext;

/**
 * Resolves current authentication context from request cookies or headers.
 * Deny by default. Enforces:
 * 1. Employee HMAC signature & expiration.
 * 2. Real-time active status check in MongoDB (suspended employees fail immediately).
 * 3. Real-time session version check (revoked sessions fail immediately).
 * 4. First-owner bootstrap support (if no active owner exists, allows legacy admin login to bootstrap).
 */
export async function resolveAuthContext(req: NextRequest): Promise<AuthContext> {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;

  // 1. Check for Employee Session Token
  if (cookie) {
    const payload = verifyEmployeeSessionToken(cookie);
    if (payload) {
      try {
        await connectToDatabase();
        const employee = await EmployeeModel.findById(payload.sub);

        if (!employee) {
          return {
            authenticated: false,
            error: 'Employee account no longer exists',
            statusCode: 401,
          };
        }

        // Real-time suspension check: Suspended employees lose access IMMEDIATELY
        if (employee.status !== 'active') {
          return {
            authenticated: false,
            error: `Account is ${employee.status}. Access denied.`,
            statusCode: 403,
          };
        }

        // Real-time session revocation check: Session version must match
        if (employee.sessionVersion !== payload.ver) {
          return {
            authenticated: false,
            error: 'Session has been revoked. Please sign in again.',
            statusCode: 401,
          };
        }

        // Resolve Permissions
        const effectivePerms = new Set<string>();
        const roleId = employee.roleId;

        // Check if role is system role
        if (SYSTEM_ROLES[roleId]) {
          SYSTEM_ROLES[roleId].permissions.forEach((p) => effectivePerms.add(p));
        } else {
          // Custom role in database
          const customRole = await RoleModel.findOne({ id: roleId });
          if (customRole) {
            customRole.permissions.forEach((p) => effectivePerms.add(p));
          }
        }

        // Add custom per-employee permissions
        if (employee.customPermissions && employee.customPermissions.length > 0) {
          employee.customPermissions.forEach((p) => effectivePerms.add(p));
        }

        const isOwner = roleId === 'owner' || effectivePerms.has('*');

        return {
          authenticated: true,
          type: 'employee',
          employee,
          actorId: employee._id.toString(),
          actorName: employee.name,
          actorEmail: employee.email,
          roleId,
          permissions: effectivePerms,
          isOwner,
        };
      } catch (err: any) {
        return {
          authenticated: false,
          error: 'Authentication verification failure',
          statusCode: 500,
        };
      }
    }
  }

  // 2. Fallback / Bootstrap Authentication
  // SEC-RBAC-P0-02 & MC-PHASE-3.1 Remediation: Permanent Bootstrap Lifecycle.
  // Master passcode / secret headers are strictly permitted ONLY when isBootstrapAllowed() is true.
  // Once an initial Owner is created or the seal is set in MongoDB, bootstrap mode is permanently sealed.
  const isLegacyAdminCookie = cookie ? isAdminAuthenticated(req) : false;
  const secretHeader = req.headers.get('x-admin-secret') || req.headers.get('x-admin-passcode');
  const isSecretHeaderValid = secretHeader ? verifyPasscode(secretHeader) : false;

  if (isLegacyAdminCookie || isSecretHeaderValid) {
    try {
      await connectToDatabase();
      const allowed = await isBootstrapAllowed();

      // ONLY permitted during genuine unsealed first-time initialisation
      if (allowed) {
        return {
          authenticated: true,
          type: 'bootstrap_owner',
          employee: null,
          actorId: 'bootstrap_owner',
          actorName: 'Founder (Bootstrap)',
          actorEmail: 'owner@marinecreatures.local',
          roleId: 'owner',
          permissions: new Set(Object.keys(PERMISSIONS_REGISTRY)),
          isOwner: true,
        };
      }

      // Bootstrap is permanently sealed: Secret header overrides are DEACTIVATED.
      return {
        authenticated: false,
        error: 'System requires authenticated employee session credentials. Bootstrap mode is permanently deactivated.',
        statusCode: 401,
      };
    } catch {
      // Strictly fail closed if security state cannot be reliably determined
      return {
        authenticated: false,
        error: 'Security state verification failure',
        statusCode: 500,
      };
    }
  }

  return {
    authenticated: false,
    error: 'Unauthorized: Authentication required',
    statusCode: 401,
  };
}

/**
 * Gatekeeper enforcing that an employee is logged in and active.
 */
export async function requireAuthenticatedEmployee(req: NextRequest) {
  const auth = await resolveAuthContext(req);
  if (!auth.authenticated) {
    return {
      auth: null,
      errorResponse: NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.statusCode }
      ),
    };
  }
  return { auth, errorResponse: null };
}

/**
 * Gatekeeper enforcing a specific granular permission.
 * Owners bypass all specific checks (super-admin).
 */
export async function requirePermission(req: NextRequest, permission: string) {
  const { auth, errorResponse } = await requireAuthenticatedEmployee(req);
  if (errorResponse) return { auth: null, errorResponse };

  if (auth!.isOwner || auth!.permissions.has(permission)) {
    return { auth, errorResponse: null };
  }

  return {
    auth: null,
    errorResponse: NextResponse.json(
      {
        success: false,
        error: `Forbidden: Lacking required permission [${permission}]`,
      },
      { status: 403 }
    ),
  };
}

/**
 * Gatekeeper enforcing at least one permission from a given list.
 */
export async function requireAnyPermission(req: NextRequest, permissions: string[]) {
  const { auth, errorResponse } = await requireAuthenticatedEmployee(req);
  if (errorResponse) return { auth: null, errorResponse };

  if (auth!.isOwner) {
    return { auth, errorResponse: null };
  }

  const hasAny = permissions.some((p) => auth!.permissions.has(p));
  if (hasAny) {
    return { auth, errorResponse: null };
  }

  return {
    auth: null,
    errorResponse: NextResponse.json(
      {
        success: false,
        error: `Forbidden: Requires at least one of [${permissions.join(', ')}]`,
      },
      { status: 403 }
    ),
  };
}

/**
 * Gatekeeper enforcing all permissions from a given list.
 */
export async function requireAllPermissions(req: NextRequest, permissions: string[]) {
  const { auth, errorResponse } = await requireAuthenticatedEmployee(req);
  if (errorResponse) return { auth: null, errorResponse };

  if (auth!.isOwner) {
    return { auth, errorResponse: null };
  }

  const hasAll = permissions.every((p) => auth!.permissions.has(p));
  if (hasAll) {
    return { auth, errorResponse: null };
  }

  return {
    auth: null,
    errorResponse: NextResponse.json(
      {
        success: false,
        error: `Forbidden: Requires all permissions [${permissions.join(', ')}]`,
      },
      { status: 403 }
    ),
  };
}

/**
 * Audit log recording helper for RBAC and employee events.
 */
export async function recordAuditLog(params: {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName: string;
  summary: string;
  actor: string;
  details?: Record<string, any>;
  ip?: string;
}) {
  try {
    await connectToDatabase();
    await AuditLogModel.create({
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      summary: params.summary,
      actor: params.actor,
      details: params.details || {},
      ip: params.ip,
    });
  } catch (err) {
    console.error('Failed to persist audit log record:', err);
  }
}

