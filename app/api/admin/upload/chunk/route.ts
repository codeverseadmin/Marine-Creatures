import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';
import { MediaChunkModel } from '@/models/MediaChunk';
import { requirePermission } from '@/lib/rbac/guard';
import {
  MAX_MEDIA_FILE_SIZE,
  verifyUploadSignature,
  getUploadCorsHeaders,
} from '@/lib/services/media-security';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Maximum chunk size allowed (3.5 MB - well below Vercel's 4.5 MB serverless limit)
const MAX_CHUNK_SIZE = 3.5 * 1024 * 1024;

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getUploadCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getUploadCorsHeaders(req);

  try {
    // 1. Mandatory Admin Authentication: Every chunk upload requires an active session with media.upload permission
    const { auth, errorResponse } = await requirePermission(req, 'media.upload');
    if (errorResponse) {
      Object.entries(corsHeaders).forEach(([k, v]) => errorResponse.headers.set(k, v));
      return errorResponse;
    }

    const formData = await req.formData();
    const uploadId = (formData.get('uploadId') as string) || '';
    const chunkIndexStr = (formData.get('chunkIndex') as string) || '';
    const totalChunksStr = (formData.get('totalChunks') as string) || '';
    const sizeStr = (formData.get('size') as string) || '';
    const contentType = (formData.get('contentType') as string) || '';
    const signature = (formData.get('signature') as string) || '';
    const expiresAtStr = (formData.get('expiresAt') as string) || '';
    const chunkFile = (formData.get('chunk') || formData.get('file')) as File | null;

    if (!uploadId || chunkIndexStr === '' || !chunkFile) {
      return NextResponse.json(
        { success: false, error: 'Missing required chunk parameters (uploadId, chunkIndex, chunk).' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!signature || !expiresAtStr || !totalChunksStr || !sizeStr || !contentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing upload authorization parameters (signature, expiresAt, totalChunks, size, contentType).',
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const totalChunks = parseInt(totalChunksStr, 10);
    const declaredSize = parseInt(sizeStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json({ success: false, error: 'Invalid chunkIndex.' }, { status: 400, headers: corsHeaders });
    }

    if (isNaN(totalChunks) || totalChunks <= 0 || chunkIndex >= totalChunks) {
      return NextResponse.json(
        { success: false, error: `Invalid chunkIndex ${chunkIndex} for totalChunks ${totalChunks}.` },
        { status: 400, headers: corsHeaders }
      );
    }

    if (isNaN(declaredSize) || declaredSize <= 0 || declaredSize > MAX_MEDIA_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Invalid declared file size.' }, { status: 400, headers: corsHeaders });
    }

    // 2. Enforce signature expiration
    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Upload authorization session has expired.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 3. Recompute and verify HMAC signature using constant-time comparison
    // Bound to: uploadId, declared file size, MIME type, total chunk count, expiry timestamp
    const isSignatureValid = verifyUploadSignature(
      uploadId,
      declaredSize,
      contentType,
      totalChunks,
      expiresAt,
      signature
    );

    if (!isSignatureValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or tampered upload authorization signature.' },
        { status: 401, headers: corsHeaders }
      );
    }

    await connectToDatabase();

    // 4. Ensure upload session has not already been finalized
    const existingMedia = await MediaModel.findOne({ uploadId }).select('_id').lean();
    if (existingMedia) {
      return NextResponse.json(
        { success: false, error: 'Upload has already been finalized. Chunk writes are rejected.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Enforce chunk size limit
    if (chunkFile.size > MAX_CHUNK_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Chunk size ${(chunkFile.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed chunk size of 3.5MB.`,
        },
        { status: 413, headers: corsHeaders }
      );
    }

    if (chunkFile.size === 0) {
      return NextResponse.json({ success: false, error: 'Empty chunk data received (0 bytes).' }, { status: 400, headers: corsHeaders });
    }

    const buffer = Buffer.from(await chunkFile.arrayBuffer());

    // 6. Fast Upsert chunk in mediachunks collection without round-trip read
    await MediaChunkModel.updateOne(
      { uploadId, chunkIndex },
      {
        $set: {
          uploadId,
          chunkIndex,
          totalChunks,
          size: buffer.length,
          data: buffer,
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      uploadId,
      chunkIndex,
      bytesReceived: buffer.length,
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('[UploadChunk] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to persist upload chunk.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
