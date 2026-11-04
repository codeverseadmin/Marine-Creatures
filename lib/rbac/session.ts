import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

export const SESSION_COOKIE = 'mc_admin_session';
export const EMPLOYEE_SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export interface EmployeeSessionPayload {
  type: 'employee';
  sub: string; // Employee ID
  email: string;
  ver: number; // Session version for immediate revocation
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
  nonce: string;
}

/**
 * Resolves session signing secret from environment.
 * Requires SESSION_SECRET or ADMIN_PASSCODE.
 */
function getSigningSecret(): string {
  const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSCODE;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is not configured');
    }
    return 'dev-mc-insecure-session-secret-change-in-production';
  }
  return secret.trim();
}

/**
 * Creates a cryptographically signed HMAC-SHA256 employee session token.
 * Format: <base64url(JSON_payload)>.<hex_signature>
 */
export function createEmployeeSessionToken(employee: {
  _id: string | { toString: () => string };
  email: string;
  sessionVersion: number;
}): string {
  const secret = getSigningSecret();
  const now = Date.now();
  const payload: EmployeeSessionPayload = {
    type: 'employee',
    sub: employee._id.toString(),
    email: employee.email.toLowerCase().trim(),
    ver: employee.sessionVersion || 1,
    iat: now,
    exp: now + EMPLOYEE_SESSION_TTL_MS,
    nonce: randomBytes(16).toString('hex'),
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payloadBase64).digest('hex');

  return `${payloadBase64}.${signature}`;
}

/**
 * Cryptographically verifies and parses an employee session token.
 * Returns decoded payload if valid and unexpired, null otherwise.
 */
export function verifyEmployeeSessionToken(token: string): EmployeeSessionPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  if (!payloadBase64 || !signature) return null;

  const secret = getSigningSecret();
  const expectedSignature = createHmac('sha256', secret).update(payloadBase64).digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return null;
  }

  const isValidSignature = timingSafeEqual(sigBuffer, expectedBuffer);
  if (!isValidSignature) return null;

  try {
    const rawJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload = JSON.parse(rawJson) as EmployeeSessionPayload;

    if (payload.type !== 'employee' || !payload.sub || !payload.email) {
      return null;
    }

    // Check expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

