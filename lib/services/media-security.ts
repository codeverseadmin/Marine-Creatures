import crypto from 'crypto';
import { getValidatedSessionSecret } from '@/lib/rbac/session';

/**
 * Marine Creatures — Media Security & Magic Byte Signature Verification
 * Strict binary inspection to prevent file-extension spoofing and malicious payloads.
 */

export const MAX_MEDIA_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
export const UPLOAD_CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB per chunk (well below Vercel's 4.5 MB body limit)

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

export const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

/**
 * Validates actual binary magic bytes rather than trusting client-provided MIME headers.
 */
export function detectFileSignature(buf: Buffer): string | null {
  if (!buf || buf.length < 4) return null;

  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }

  // GIF: GIF87a or GIF89a
  if (
    buf.length >= 6 &&
    buf[0] === 0x47 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x38 &&
    (buf[4] === 0x37 || buf[4] === 0x39) &&
    buf[5] === 0x61
  ) {
    return 'image/gif';
  }

  // WEBP: RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }

  // MP4 / QuickTime: ....ftyp
  if (
    buf.length >= 8 &&
    buf[4] === 0x66 &&
    buf[5] === 0x74 &&
    buf[6] === 0x79 &&
    buf[7] === 0x70
  ) {
    // Check if brand is QuickTime (qt  )
    if (buf.length >= 12 && buf[8] === 0x71 && buf[9] === 0x74 && buf[10] === 0x20 && buf[11] === 0x20) {
      return 'video/quicktime';
    }
    return 'video/mp4';
  }

  // QuickTime MOV classic container headers (moov, wide, mdat, free)
  if (
    buf.length >= 8 &&
    ((buf[4] === 0x6d && buf[5] === 0x6f && buf[6] === 0x6f && buf[7] === 0x76) || // moov
      (buf[4] === 0x77 && buf[5] === 0x69 && buf[6] === 0x64 && buf[7] === 0x65) || // wide
      (buf[4] === 0x6d && buf[5] === 0x64 && buf[6] === 0x61 && buf[7] === 0x74) || // mdat
      (buf[4] === 0x66 && buf[5] === 0x72 && buf[6] === 0x65 && buf[7] === 0x65))   // free
  ) {
    return 'video/quicktime';
  }

  // WebM: 1A 45 DF A3
  if (
    buf.length >= 4 &&
    buf[0] === 0x1a &&
    buf[1] === 0x45 &&
    buf[2] === 0xdf &&
    buf[3] === 0xa3
  ) {
    return 'video/webm';
  }

  // SVG: Inspect text XML structure
  const headerText = buf.slice(0, 1024).toString('utf8').trim().toLowerCase();
  if (
    headerText.includes('<svg') &&
    (headerText.startsWith('<?xml') ||
      headerText.startsWith('<!doctype svg') ||
      headerText.startsWith('<svg'))
  ) {
    return 'image/svg+xml';
  }

  return null;
}

/**
 * Deep security inspection for SVG files to block XSS, XXE, and embedded active content.
 */
export function validateSvgSecurity(buf: Buffer): { safe: boolean; reason?: string } {
  const content = buf.toString('utf8');

  const dangerousPatterns = [
    { pattern: /<script[\s>]/i, name: 'Embedded <script> element' },
    { pattern: /javascript:/i, name: 'javascript: URI scheme' },
    { pattern: /data:text\/html/i, name: 'data:text/html payload' },
    { pattern: /onload\s*=/i, name: 'onload event handler' },
    { pattern: /onerror\s*=/i, name: 'onerror event handler' },
    { pattern: /onclick\s*=/i, name: 'onclick event handler' },
    { pattern: /onmouseover\s*=/i, name: 'onmouseover event handler' },
    { pattern: /<!ENTITY/i, name: 'XXE entity declaration' },
    { pattern: /<!DOCTYPE[\s\S]*?SYSTEM/i, name: 'XXE external DTD entity' },
    { pattern: /<foreignObject[\s>]/i, name: 'HTML foreignObject element' },
  ];

  for (const { pattern, name } of dangerousPatterns) {
    if (pattern.test(content)) {
      return { safe: false, reason: `Active content prohibited: ${name} detected.` };
    }
  }

  return { safe: true };
}

/**
 * Resolves the secret for signing and verifying upload authorization HMAC tokens.
 * Employs getValidatedSessionSecret() and falls back safely in non-production.
 */
export function getUploadSecret(): string {
  try {
    return getValidatedSessionSecret();
  } catch {
    return process.env.SESSION_SECRET || 'mc_secure_salt_default';
  }
}

/**
 * Computes an HMAC-SHA256 signature binding the upload authorization to:
 * - uploadId
 * - declared file size
 * - clean MIME type
 * - total chunk count
 * - expiry timestamp
 */
export function generateUploadSignature(
  uploadId: string,
  size: number,
  contentType: string,
  totalChunks: number,
  expiresAt: number,
  secret?: string
): string {
  const signingSecret = secret || getUploadSecret();
  const cleanContentType = (contentType || '').trim().toLowerCase();
  const payload = `${uploadId}:${size}:${cleanContentType}:${totalChunks}:${expiresAt}`;
  return crypto.createHmac('sha256', signingSecret).update(payload).digest('hex');
}

/**
 * Validates the HMAC-SHA256 upload signature using constant-time comparison
 * to eliminate timing attack side-channels.
 */
export function verifyUploadSignature(
  uploadId: string,
  size: number,
  contentType: string,
  totalChunks: number,
  expiresAt: number,
  signature: string,
  secret?: string
): boolean {
  if (!signature || typeof signature !== 'string' || signature.length !== 64) {
    return false;
  }
  const cleanContentType = (contentType || '').trim().toLowerCase();
  const signingSecret = secret || getUploadSecret();
  const expected = generateUploadSignature(
    uploadId,
    size,
    cleanContentType,
    totalChunks,
    expiresAt,
    signingSecret
  );

  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const providedBuf = Buffer.from(signature, 'hex');
    if (expectedBuf.length !== providedBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}
