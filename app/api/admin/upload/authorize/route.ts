import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requirePermission } from '@/lib/rbac/guard';
import {
  MAX_MEDIA_FILE_SIZE,
  UPLOAD_CHUNK_SIZE,
  ALL_ALLOWED_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  generateUploadSignature,
  getUploadCorsHeaders,
} from '@/lib/services/media-security';
import { resolveAuthoritativeProduct } from '@/lib/services/product-resolution';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getUploadCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getUploadCorsHeaders(req);

  try {
    // 1. Authenticate admin with media.upload permission
    const { auth, errorResponse } = await requirePermission(req, 'media.upload');
    if (errorResponse) {
      // Merge CORS headers into auth error response
      Object.entries(corsHeaders).forEach(([k, v]) => errorResponse.headers.set(k, v));
      return errorResponse;
    }

    const body = await req.json().catch(() => ({}));
    const { filename, contentType, size, productId, altText } = body;

    if (!filename || typeof filename !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Filename is required for upload authorization.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!contentType || typeof contentType !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Content-Type is required for upload authorization.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanContentType = contentType.trim().toLowerCase();
    const cleanSize = Number(size);

    if (isNaN(cleanSize) || cleanSize <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid file size in bytes is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2. Enforce 25 MB max size
    if (cleanSize > MAX_MEDIA_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File "${filename}" exceeds the maximum 25MB limit (${(cleanSize / (1024 * 1024)).toFixed(1)}MB).`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Verify MIME type is in allowed image or video lists
    const isAllowedMime = ALL_ALLOWED_TYPES.includes(cleanContentType);
    const extMatch = filename.match(/\.([0-9a-z]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : '';
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mov'];

    if (!isAllowedMime && !allowedExts.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `File format "${cleanContentType}" (.${ext}) is not supported. Allowed: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, MOV.`,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Validate productId if provided
    let resolvedProductId: string | undefined = undefined;
    if (productId && typeof productId === 'string' && productId.trim()) {
      await connectToDatabase();
      const product = await resolveAuthoritativeProduct(productId.trim(), { lean: true });
      if (!product || !product.id) {
        return NextResponse.json(
          { success: false, error: `Invalid productId: Product "${productId}" does not exist in catalog.` },
          { status: 404, headers: corsHeaders }
        );
      }
      resolvedProductId = product.id;
    }

    // 5. Generate secure upload session
    const uploadId = `mc_up_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const chunkSize = UPLOAD_CHUNK_SIZE; // 512 KB per chunk
    const totalChunks = Math.ceil(cleanSize / chunkSize);
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour validity

    const signature = generateUploadSignature(
      uploadId,
      cleanSize,
      cleanContentType,
      totalChunks,
      expiresAt
    );

    return NextResponse.json({
      success: true,
      uploadId,
      chunkSize,
      totalChunks,
      expiresAt,
      signature,
      maxFileSize: MAX_MEDIA_FILE_SIZE,
      productId: resolvedProductId,
      filename,
      contentType: cleanContentType,
      size: cleanSize,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[UploadAuthorize] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to authorize upload session.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
