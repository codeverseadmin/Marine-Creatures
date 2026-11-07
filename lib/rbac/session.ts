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

// Minimum cryptographic entropy threshold: exactly 32 bytes (256 bits) of true binary entropy
export const REQUIRED_SESSION_SECRET_BYTES = 32;

// Ephemeral process-level secret for local non-production development if none is supplied
let devEphemeralSecret: string | null = null;

/**
 * Decodes and validates that a candidate secret string represents exactly 32 bytes (256 bits)
 * of true cryptographic entropy.
 *
 * Supported encodings:
 * 1. Preferred standard: Exactly 64 hexadecimal characters ([0-9a-fA-F]{64}) -> decodes to exactly 32 bytes.
 * 2. Supported equivalent: 32-byte Base64 (44 chars ending in '=') or Base64URL (43 chars) -> decodes to exactly 32 bytes.
 *
 * Rejects:
 * - Missing or empty values.
 * - Malformed hex strings (non-hex characters, length !== 64).
 * - Plain ASCII strings (e.g. 32 arbitrary ASCII characters, which lack 256 bits of entropy).
 * - Weak / low-entropy repetitions (e.g. repeated characters like all zeroes, all f's).
 * - Trivial patterns.
 */
export function validateSessionSecret(secret: string): { valid: boolean; error?: string } {
  if (!secret || typeof secret !== 'string') {
    return { valid: false, error: 'SESSION_SECRET is missing or empty' };
  }

  const trimmed = secret.trim();

  // 1. Check for 64-character Hexadecimal Encoding (Preferred standard)
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    const buf = Buffer.from(trimmed, 'hex');
    if (buf.length !== REQUIRED_SESSION_SECRET_BYTES) {
      return { valid: false, error: `Decoded hex secret yields ${buf.length} bytes (exactly 32 bytes required)` };
    }
    // Reject trivial low-entropy patterns (e.g. repeated characters like 0000... or ffff...)
    const uniqueChars = new Set(trimmed.toLowerCase()).size;
    if (uniqueChars < 8) {
      return { valid: false, error: 'SESSION_SECRET has insufficient character entropy (<8 distinct characters)' };
    }
    return { valid: true };
  }

  // 2. Check for 32-byte Base64 / Base64URL Encoding (Supported equivalent)
  if (/^[A-Za-z0-9+/_-]{43,44}={0,2}$/.test(trimmed)) {
    try {
      const normalized = trimmed.replace(/-/g, '+').replace(/_/g, '/');
      const buf = Buffer.from(normalized, 'base64');
      if (buf.length === REQUIRED_SESSION_SECRET_BYTES) {
        const uniqueChars = new Set(trimmed).size;
        if (uniqueChars < 8) {
          return { valid: false, error: 'SESSION_SECRET has insufficient character entropy (<8 distinct characters)' };
        }
        return { valid: true };
      }
    } catch {
      // Base64 decode failed
    }
  }

  // 3. Diagnose specific failure reasons for clear operator guidance without leaking secrets
  if (/^[0-9a-fA-F]+$/.test(trimmed)) {
    return {
      valid: false,
      error: `Hexadecimal SESSION_SECRET is malformed (${trimmed.length} hex chars; exactly 64 hex characters representing 32 bytes required)`,
    };
  }

  return {
    valid: false,
    error: `SESSION_SECRET must be a 32-byte cryptographically secure key (prefer 64 hexadecimal characters, e.g. from 'openssl rand -hex 32', or 32-byte base64). Provided value has length ${trimmed.length} with invalid or malformed encoding. Plain ASCII passwords are not accepted as 256-bit keys.`,
  };
}

/**
 * Resolves the authoritative session signing secret from the server environment.
 * Strict rules:
 * 1. ADMIN_PASSCODE is NEVER accepted as a session-signing fallback.
 * 2. SESSION_SECRET is the exclusive session-signing secret.
 * 3. In production, SESSION_SECRET must represent exactly 32 bytes (256 bits) of true binary entropy.
 * 4. Production fails closed immediately if SESSION_SECRET is missing, malformed, or weak.
 * 5. Secret values are NEVER logged.
 * 6. Development uses a secure in-memory random 32-byte hex secret if none is configured.
 */
export function getValidatedSessionSecret(): string {
  const rawSecret = process.env.SESSION_SECRET;
  const secret = rawSecret ? rawSecret.trim() : '';

  if (process.env.NODE_ENV === 'production') {
    if (!secret) {
      throw new Error(
        'CRITICAL SECURITY CONFIGURATION ERROR: SESSION_SECRET environment variable is missing on the production server. Server failed closed.'
      );
    }

    const validation = validateSessionSecret(secret);
    if (!validation.valid) {
      throw new Error(
        `CRITICAL SECURITY CONFIGURATION ERROR: ${validation.error}. Server failed closed.`
      );
    }

    return secret;
  }

  // Non-production (development / test)
  if (secret) {
    const validation = validateSessionSecret(secret);
    if (!validation.valid) {
      console.warn(
        `[SECURITY WARNING] Insecure development SESSION_SECRET detected: ${validation.error}. In production, this will fail closed.`
      );
    }
    return secret;
  }

  if (!devEphemeralSecret) {
    devEphemeralSecret = randomBytes(32).toString('hex');
  }
  return devEphemeralSecret;
}

function getSigningSecret(): string {
  return getValidatedSessionSecret();
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

