import { NextRequest } from 'next/server';
import { AuditLogModel, AuditAction } from '@/models/AuditLog';
import { connectToDatabase } from '@/lib/mongodb';

export interface RecordAuditParams {
  action: AuditAction;
  entityType?: 'product' | 'banner' | 'order' | 'setting';
  entityId: string;
  entityName: string;
  summary: string;
  details?: Record<string, any>;
  req?: NextRequest;
}

/**
 * Strips sensitive keys to guarantee zero credential exposure in audit collections.
 */
function sanitizeAuditDetails(details?: Record<string, any>): Record<string, any> | undefined {
  if (!details) return undefined;
  const sanitized: Record<string, any> = {};
  const forbiddenPatterns = ['passcode', 'password', 'secret', 'token', 'auth', 'cookie', 'session'];

  for (const [key, value] of Object.entries(details)) {
    const lowerKey = key.toLowerCase();
    if (forbiddenPatterns.some((pattern) => lowerKey.includes(pattern))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeAuditDetails(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Asynchronously records an operational audit log entry.
 * Fails safely without throwing errors into user operations.
 */
export async function recordAuditLog({
  action,
  entityType = 'product',
  entityId,
  entityName,
  summary,
  details,
  req,
}: RecordAuditParams): Promise<void> {
  try {
    await connectToDatabase();

    let ip = 'unknown';
    if (req) {
      ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    }

    await AuditLogModel.create({
      action,
      entityType,
      entityId,
      entityName,
      summary,
      details: sanitizeAuditDetails(details),
      actor: 'mc_admin_session',
      ip,
    });
  } catch (err: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AuditLog] Failed to record audit entry:', err.message);
    }
  }
}
