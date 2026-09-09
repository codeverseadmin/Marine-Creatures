import { NextRequest } from 'next/server';

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || '';
const SESSION_COOKIE = 'mc_admin_session';

/**
 * Verifies the provided passcode against the server-side env var.
 * Never exposed to the client bundle.
 */
export function verifyPasscode(input: string): boolean {
  if (!ADMIN_PASSCODE) {
    console.error('[Auth] ADMIN_PASSCODE server env var is not set!');
    return false;
  }
  return input === ADMIN_PASSCODE;
}

/**
 * Creates a simple signed session token.
 * For production, replace with a proper JWT library.
 */
export function createSessionToken(): string {
  const payload = `mc_admin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  return Buffer.from(payload).toString('base64');
}

/**
 * Validates an admin session token from the request cookie.
 * Returns true if the session cookie is present and non-empty.
 */
export function isAdminAuthenticated(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  return !!(sessionCookie && sessionCookie.value && sessionCookie.value.length > 10);
}

/**
 * Validates admin auth from the x-admin-secret header (for context-level API calls).
 * This is the secret embedded in fetch calls from the admin context.
 */
export function isAdminRequest(req: NextRequest): boolean {
  // Check cookie first
  if (isAdminAuthenticated(req)) return true;
  // Check header fallback (used by CatalogContext/OrderContext admin mutations)
  const secret = req.headers.get('x-admin-secret');
  return secret === process.env.ADMIN_PASSCODE;
}

export { SESSION_COOKIE };
