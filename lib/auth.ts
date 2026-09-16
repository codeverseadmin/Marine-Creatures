import { NextRequest } from 'next/server';
import { createHmac, timingSafeEqual, randomBytes } from 'crypto';

const DEFAULT_PASSCODE = 'mc@admin#2026!';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Server-only passcode resolution. Never exposes to the client bundle.
 */
export function getAdminPasscode(): string {
  return (process.env.ADMIN_PASSCODE || DEFAULT_PASSCODE).trim();
}

/**
 * Server-only session signing key.
 */
function getSessionSecret(): string {
  return (process.env.SESSION_SECRET || process.env.ADMIN_PASSCODE || DEFAULT_PASSCODE).trim();
}

export const SESSION_COOKIE = 'mc_admin_session';

/**
 * Verifies the provided passcode against the server-side env var or fallback.
 * Uses timing-safe string comparison to prevent timing attacks.
 */
export function verifyPasscode(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const cleanInput = input.trim();
  const actualPasscode = getAdminPasscode();

  const inputBuffer = Buffer.from(cleanInput);
  const actualBuffer = Buffer.from(actualPasscode);

  if (inputBuffer.length !== actualBuffer.length) {
    return false;
  }
  return timingSafeEqual(inputBuffer, actualBuffer);
}

/**
 * Creates a cryptographically signed HMAC-SHA256 session token.
 * Format: <base64url(payload)>.<hex_signature>
 */
export function createSessionToken(): string {
  const secret = getSessionSecret();
  const timestamp = Date.now();
  const nonce = randomBytes(16).toString('hex');
  const payload = `mc_admin_${timestamp}_${nonce}`;
  const payloadBase64 = Buffer.from(payload).toString('base64url');

  const signature = createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('hex');

  return `${payloadBase64}.${signature}`;
}

/**
 * Validates cryptographic integrity, signature, and expiration of the session token.
 */
export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [payloadBase64, signature] = parts;
  if (!payloadBase64 || !signature) return false;

  const secret = getSessionSecret();
  const expectedSignature = createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('hex');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    return false;
  }

  const isValidSignature = timingSafeEqual(sigBuffer, expectedBuffer);
  if (!isValidSignature) return false;

  try {
    const rawPayload = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const segments = rawPayload.split('_');
    // Format: mc_admin_<timestamp>_<nonce>
    if (segments.length < 4 || segments[0] !== 'mc' || segments[1] !== 'admin') {
      return false;
    }

    const timestamp = parseInt(segments[2], 10);
    if (isNaN(timestamp) || Date.now() - timestamp > SESSION_TTL_MS) {
      return false; // Expired session
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an admin session token from the request cookie.
 */
export function isAdminAuthenticated(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  if (!sessionCookie || !sessionCookie.value) return false;
  return verifySessionToken(sessionCookie.value);
}

/**
 * Validates admin auth from the session cookie or server-to-server header.
 */
export function isAdminRequest(req: NextRequest): boolean {
  // Check signed session cookie first
  if (isAdminAuthenticated(req)) return true;

  // Server-to-server header fallback (validated against server-side secret)
  const secretHeader = req.headers.get('x-admin-secret') || req.headers.get('x-admin-passcode');
  if (secretHeader && verifyPasscode(secretHeader)) {
    return true;
  }

  return false;
}

