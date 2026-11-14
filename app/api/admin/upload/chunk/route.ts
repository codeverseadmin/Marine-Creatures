import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';
import { MediaChunkModel } from '@/models/MediaChunk';
import { requirePermission } from '@/lib/rbac/guard';
import {
  MAX_MEDIA_FILE_SIZE,
  verifyUploadSignature,
} from '@/lib/services/media-security';

// Maximum chunk size allowed (3 MB - well below Vercel's 4.5 MB serverless limit)
const MAX_CHUNK_SIZE = 3 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    // 1. Mandatory Admin Authentication: Every chunk upload requires an active session with media.upload permission
    const { auth, errorResponse } = await requirePermission(req, 'media.upload');
    if (errorResponse) return errorResponse;

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
        { status: 400 }
      );
    }

    if (!signature || !expiresAtStr || !totalChunksStr || !sizeStr || !contentType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing upload authorization parameters (signature, expiresAt, totalChunks, size, contentType).',
        },
        { status: 401 }
      );
    }

    const chunkIndex = parseInt(chunkIndexStr, 10);
    const totalChunks = parseInt(totalChunksStr, 10);
    const declaredSize = parseInt(sizeStr, 10);
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(chunkIndex) || chunkIndex < 0) {
      return NextResponse.json({ success: false, error: 'Invalid chunkIndex.' }, { status: 400 });
    }

    if (isNaN(totalChunks) || totalChunks <= 0 || chunkIndex >= totalChunks) {
      return NextResponse.json(
        { success: false, error: `Invalid chunkIndex ${chunkIndex} for totalChunks ${totalChunks}.` },
        { status: 400 }
      );
    }

    if (isNaN(declaredSize) || declaredSize <= 0 || declaredSize > MAX_MEDIA_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Invalid declared file size.' }, { status: 400 });
    }

    // 2. Enforce signature expiration
    if (Date.now() > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Upload authorization session has expired.' },
        { status: 401 }
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
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 4. Ensure upload session has not already been finalized
    const existingMedia = await MediaModel.findOne({ uploadId }).select('_id').lean();
    if (existingMedia) {
      return NextResponse.json(
        { success: false, error: 'Upload has already been finalized. Chunk writes are rejected.' },
        { status: 400 }
      );
    }

    // 5. Enforce chunk size limit
    if (chunkFile.size > MAX_CHUNK_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `Chunk size ${(chunkFile.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed chunk size of 3MB.`,
        },
        { status: 413 }
      );
    }

    if (chunkFile.size === 0) {
      return NextResponse.json({ success: false, error: 'Empty chunk data received (0 bytes).' }, { status: 400 });
    }

    const buffer = Buffer.from(await chunkFile.arrayBuffer());

    // 6. Upsert chunk in mediachunks collection
    await MediaChunkModel.findOneAndUpdate(
      { uploadId, chunkIndex },
      {
        uploadId,
        chunkIndex,
        totalChunks,
        size: buffer.length,
        data: buffer,
        createdAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({
      success: true,
      uploadId,
      chunkIndex,
      bytesReceived: buffer.length,
    });
  } catch (error: any) {
    console.error('[UploadChunk] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to persist upload chunk.' },
      { status: 500 }
    );
  }
}
