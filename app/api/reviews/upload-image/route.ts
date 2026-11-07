import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';
import { connectToDatabase } from '@/lib/mongodb';
import { ReviewInvitationModel } from '@/models/ReviewInvitation';
import { MediaModel } from '@/models/Media';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 4096; // 4096 x 4096 px maximum
const MAX_PIXELS = 16 * 1024 * 1024; // 16 megapixels input limit (guards against decompression bombs)

type SupportedMime = 'image/jpeg' | 'image/png' | 'image/webp';

/**
 * Validates actual binary magic bytes. Strictly allows only JPEG, PNG, and WebP.
 */
function detectImageSignature(buf: Buffer): SupportedMime | null {
  if (buf.length < 8) return null;

  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
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

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const uploadRateLimit = await checkRateLimit(`rate:reviews:upload:ip:${clientIp}`, 10, 600);
    if (!uploadRateLimit.allowed) {
      return rateLimitResponse(uploadRateLimit.retryAfter, 'Too many image uploads. Please wait.');
    }

    const formData = await req.formData();
    const rawToken =
      (formData.get('token') as string) ||
      req.headers.get('x-review-token') ||
      req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!rawToken || rawToken.trim().length < 16) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid review invitation token required for upload.' },
        { status: 401 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    await connectToDatabase();

    const invitation = await ReviewInvitationModel.findOne({ tokenHash }).lean();
    if (!invitation || invitation.isUsed || new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired review invitation token.' },
        { status: 403 }
      );
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file provided.' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Image exceeds maximum allowed size of 5 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
        },
        { status: 400 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const detectedType = detectImageSignature(rawBuffer);

    if (!detectedType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file format. Only genuine JPEG, PNG, or WebP images are permitted.',
        },
        { status: 400 }
      );
    }

    // Process and sanitize image using sharp:
    // 1. Defend against decompression bombs using limitInputPixels
    // 2. Inspect metadata and enforce max dimensions (4096 x 4096)
    // 3. Re-encode without .withMetadata() to completely strip EXIF, GPS, XMP, IPTC
    let sanitizedBuffer: Buffer;
    let ext: string;
    let mimeType: SupportedMime;

    try {
      const sharpInspector = sharp(rawBuffer, { limitInputPixels: MAX_PIXELS, failOn: 'error' });
      const metadata = await sharpInspector.metadata();

      if (!metadata.width || !metadata.height) {
        return NextResponse.json(
          { success: false, error: 'Unable to decode image geometry.' },
          { status: 400 }
        );
      }

      if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
        return NextResponse.json(
          {
            success: false,
            error: `Image dimensions (${metadata.width}x${metadata.height}) exceed the maximum limit of ${MAX_DIMENSION}x${MAX_DIMENSION} pixels.`,
          },
          { status: 400 }
        );
      }

      const sharpTransformer = sharp(rawBuffer, { limitInputPixels: MAX_PIXELS });

      if (detectedType === 'image/jpeg') {
        sanitizedBuffer = await sharpTransformer.jpeg({ quality: 85, mozjpeg: true }).toBuffer();
        ext = 'jpg';
        mimeType = 'image/jpeg';
      } else if (detectedType === 'image/png') {
        sanitizedBuffer = await sharpTransformer.png({ compressionLevel: 8 }).toBuffer();
        ext = 'png';
        mimeType = 'image/png';
      } else {
        // image/webp
        sanitizedBuffer = await sharpTransformer.webp({ quality: 85 }).toBuffer();
        ext = 'webp';
        mimeType = 'image/webp';
      }
    } catch (sharpError: any) {
      console.error('Image processing/sanitization failed:', sharpError.message);
      return NextResponse.json(
        {
          success: false,
          error: 'Corrupted image file or decompression safety limit exceeded.',
        },
        { status: 400 }
      );
    }

    const imageId = `review-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;

    // Store in MongoDB Media collection with exact review invitation ownership binding
    await MediaModel.create({
      id: imageId,
      productId: invitation.productId,
      invitationTokenHash: tokenHash,
      orderId: invitation.orderId,
      altText: `Customer aquarium photo for ${invitation.productName}`,
      filename: `${imageId}.${ext}`,
      contentType: mimeType,
      size: sanitizedBuffer.length,
      data: sanitizedBuffer,
      type: 'image',
    });

    const permanentUrl = `/api/media/${imageId}.${ext}`;

    return NextResponse.json({
      success: true,
      image: {
        id: imageId,
        url: permanentUrl,
        mimeType,
        fileSize: sanitizedBuffer.length,
      },
    });
  } catch (error: any) {
    console.error('Review image upload failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image upload.' },
      { status: 500 }
    );
  }
}
