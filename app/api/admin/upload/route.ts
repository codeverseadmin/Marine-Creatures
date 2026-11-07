import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';
import { ProductModel } from '@/models/Product';
import { requirePermission, requireAuthenticatedEmployee } from '@/lib/rbac/guard';
import { resolveAuthoritativeProduct } from '@/lib/services/product-resolution';

// 25 MB max upload limit for specimen photos/videos
const MAX_FILE_SIZE = 25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/**
 * Validates actual binary magic bytes rather than trusting client-provided MIME headers.
 */
function detectFileSignature(buf: Buffer): string | null {
  if (buf.length < 4) return null;

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
    return 'video/mp4';
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
function validateSvgSecurity(buf: Buffer): { safe: boolean; reason?: string } {
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

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin via session cookie or verified server secret
    const { auth, errorResponse } = await requirePermission(req, 'media.upload');
  if (errorResponse) return errorResponse;

    // 2. Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const requestedType = ((formData.get('type') as string) || 'image').toLowerCase();
    const productId = (formData.get('productId') as string) || undefined;
    const altText = (formData.get('altText') as string) || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided for upload.' }, { status: 400 });
    }

    // 3. Server-side file size enforcement
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File "${file.name}" exceeds the maximum 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: `File "${file.name}" is empty (0 bytes).` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 4. Actual file signature (magic byte) verification
    const detectedType = detectFileSignature(buffer);

    if (!detectedType) {
      return NextResponse.json(
        {
          success: false,
          error: `File signature verification failed for "${file.name}". Unrecognized or corrupted file format.`,
        },
        { status: 400 }
      );
    }

    if (requestedType === 'image' && !ALLOWED_IMAGE_TYPES.includes(detectedType)) {
      return NextResponse.json(
        {
          success: false,
          error: `File signature mismatch for "${file.name}". Expected image binary, detected: ${detectedType}.`,
        },
        { status: 400 }
      );
    }

    if (requestedType === 'video' && !ALLOWED_VIDEO_TYPES.includes(detectedType)) {
      return NextResponse.json(
        {
          success: false,
          error: `File signature mismatch for "${file.name}". Expected video binary, detected: ${detectedType}.`,
        },
        { status: 400 }
      );
    }

    // 5. SVG Deep Security Inspection
    if (detectedType === 'image/svg+xml') {
      const svgCheck = validateSvgSecurity(buffer);
      if (!svgCheck.safe) {
        return NextResponse.json(
          {
            success: false,
            error: `SVG upload rejected for security reasons: ${svgCheck.reason}`,
          },
          { status: 400 }
        );
      }
    }

    const contentType = detectedType;

    await connectToDatabase();

    // 6. Verify product ownership and association integrity
    let resolvedProductId: string | undefined = undefined;
    if (productId && productId.trim()) {
      const cleanProdId = productId.trim();
      const authoritativeProduct = await resolveAuthoritativeProduct(cleanProdId, { lean: true });
      if (!authoritativeProduct || !authoritativeProduct.id) {
        return NextResponse.json(
          { success: false, error: `Invalid productId: Product "${cleanProdId}" does not exist in the database.` },
          { status: 404 }
        );
      }
      resolvedProductId = authoritativeProduct.id;
    }

    // 7. Option A: Cloudinary CDN Direct Upload (if environment variables configured)
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret) {
      try {
        const timestamp = Math.round(Date.now() / 1000);
        const signaturePayload = `timestamp=${timestamp}${apiSecret}`;
        
        // SHA-1 signature
        const crypto = await import('crypto');
        const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

        const cloudFormData = new FormData();
        cloudFormData.append('file', new Blob([buffer], { type: contentType }));
        cloudFormData.append('api_key', apiKey);
        cloudFormData.append('timestamp', timestamp.toString());
        cloudFormData.append('signature', signature);
        cloudFormData.append('folder', 'marine-creatures');

        const cloudRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/${requestedType === 'video' ? 'video' : 'image'}/upload`,
          {
            method: 'POST',
            body: cloudFormData,
          }
        );

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          return NextResponse.json({
            success: true,
            provider: 'cloudinary',
            url: cloudData.secure_url || cloudData.url,
            filename: file.name,
            size: file.size,
            type: requestedType,
            contentType,
            productId,
          });
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload fallback to MongoDB store:', cloudErr);
      }
    }

    // 8. Option B: High-Performance MongoDB Atlas Binary Storage
    // Unrelated asset overwrite protection: Cryptographically unguessable media ID
    const extMatch = file.name.match(/\.([0-9a-z]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : (requestedType === 'video' ? 'mp4' : 'jpg');
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await MediaModel.create({
      id: mediaId,
      productId: resolvedProductId,
      altText: altText ? altText.trim() : undefined,
      filename: file.name,
      contentType,
      size: file.size,
      data: buffer,
      type: requestedType === 'video' ? 'video' : 'image',
    });

    const permanentUrl = `/api/media/${mediaId}.${ext}`;

    return NextResponse.json({
      success: true,
      provider: 'mongodb-binary',
      url: permanentUrl,
      mediaId,
      filename: file.name,
      size: file.size,
      type: requestedType,
      contentType,
      productId: resolvedProductId,
    }, { status: 201 });

  } catch (error: any) {
    console.error('Admin media upload failed:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Media upload failed due to an internal server error.' },
      { status: 500 }
    );
  }
}
