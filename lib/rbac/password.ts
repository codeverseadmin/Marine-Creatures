import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'crypto';

const SALT_BYTES = 16;
const KEY_LEN_BYTES = 64;

/**
 * Validates password strength policy:
 * - At least 8 characters
 * - Contains at least one lowercase letter
 * - Contains at least one uppercase letter
 * - Contains at least one number or symbol
 */
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9\W]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number or special character' };
  }
  return { valid: true };
}

/**
 * Hashes a plaintext password using Node.js crypto.scryptSync with a unique cryptographically random salt.
 * Returns formatted string: <salt_hex>:<derived_key_hex>
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES);
  const derivedKey = scryptSync(password, salt, KEY_LEN_BYTES);
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored scrypt hash using timingSafeEqual.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;

  const [saltHex, expectedKeyHex] = parts;
  if (!saltHex || !expectedKeyHex) return false;

  try {
    const salt = Buffer.from(saltHex, 'hex');
    const expectedKey = Buffer.from(expectedKeyHex, 'hex');
    const derivedKey = scryptSync(password, salt, KEY_LEN_BYTES);

    if (derivedKey.length !== expectedKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

/**
 * Creates a SHA-256 hash of a one-time invitation token for secure database storage.
 */
export function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Generates a one-time invitation token (32 random bytes hex) and its SHA-256 hash.
 */
export function generateInvitationToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

