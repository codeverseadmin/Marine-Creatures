import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';
import { MediaChunkModel } from '@/models/MediaChunk';
import { ProductModel } from '@/models/Product';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';
import { resolveAuthoritativeProduct } from '@/lib/services/product-resolution';
import {
  detectFileSignature,
  validateSvgSecurity,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  verifyUploadSignature,
} from '@/lib/services/media-security';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin with media.upload permission
    const { auth, errorResponse } = await requirePermission(req, 'media.upload');
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { uploadId, filename, contentType, size, totalChunks, signature, expiresAt, productId, altText } = body;

    if (!uploadId || !filename || !totalChunks) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters: uploadId, filename, totalChunks.' },
        { status: 400 }
      );
    }

    // Verify HMAC signature if provided
    if (signature && expiresAt && size && contentType) {
      if (Date.now() > Number(expiresAt)) {
        return NextResponse.json(
          { success: false, error: 'Upload authorization session has expired.' },
          { status: 401 }
        );
      }

      const isSignatureValid = verifyUploadSignature(
        uploadId,
        Number(size),
        contentType,
        Number(totalChunks),
        Number(expiresAt),
        signature
      );

      if (!isSignatureValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or tampered upload authorization signature.' },
          { status: 401 }
        );
      }
    }

    await connectToDatabase();

    // 2. Idempotency Check: If already completed, return existing media record
    const existingMedia = await MediaModel.findOne({ uploadId }, { data: 0 }).lean();
    if (existingMedia) {
      // Disallow replaying authorization to alter product association
      if (productId && existingMedia.productId && productId !== existingMedia.productId) {
        return NextResponse.json(
          { success: false, error: 'Upload has already been finalized with a different product association.' },
          { status: 400 }
        );
      }

      const extMatch = existingMedia.filename.match(/\.([0-9a-z]+)$/i);
      const ext = extMatch ? extMatch[1].toLowerCase() : (existingMedia.type === 'video' ? 'mp4' : 'jpg');
      return NextResponse.json({
        success: true,
        provider: existingMedia.storageProvider || 'mongodb-gridfs',
        url: `/api/media/${existingMedia.id}.${ext}`,
        mediaId: existingMedia.id,
        filename: existingMedia.filename,
        size: existingMedia.size,
        type: existingMedia.type,
        contentType: existingMedia.contentType,
        productId: existingMedia.productId,
      }, { status: 200 });
    }

    // 3. Retrieve all uploaded chunks for this uploadId
    const chunks = await MediaChunkModel.find({ uploadId }).sort({ chunkIndex: 1 }).lean();

    const expectedTotal = parseInt(totalChunks, 10);
    if (chunks.length < expectedTotal) {
      const receivedIndices = new Set(chunks.map((c) => c.chunkIndex));
      const missingIndices: number[] = [];
      for (let i = 0; i < expectedTotal; i++) {
        if (!receivedIndices.has(i)) {
          missingIndices.push(i);
        }
      }
      return NextResponse.json(
        {
          success: false,
          error: `Upload incomplete: received ${chunks.length} of ${expectedTotal} chunks.`,
          missingChunks: missingIndices,
        },
        { status: 400 }
      );
    }

    // Calculate total assembled size
    const totalAccumulatedSize = chunks.reduce((acc, c) => acc + (c.size || c.data.length), 0);

    // 4. Magic Byte Verification on initial chunk
    const firstChunkData = Buffer.isBuffer(chunks[0].data)
      ? chunks[0].data
      : Buffer.from((chunks[0].data as any).buffer || chunks[0].data);

    const detectedType = detectFileSignature(firstChunkData);

    if (!detectedType) {
      return NextResponse.json(
        {
          success: false,
          error: `File signature verification failed for "${filename}". Unrecognized or corrupted format.`,
        },
        { status: 400 }
      );
    }

    // Determine whether image or video
    let finalMediaType: 'image' | 'video';
    if (ALLOWED_VIDEO_TYPES.includes(detectedType)) {
      finalMediaType = 'video';
    } else if (ALLOWED_IMAGE_TYPES.includes(detectedType)) {
      finalMediaType = 'image';
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `File signature mismatch for "${filename}". Type "${detectedType}" is not supported.`,
        },
        { status: 400 }
      );
    }

    // SVG Security Check
    if (detectedType === 'image/svg+xml') {
      const fullBuffer = Buffer.concat(
        chunks.map((c) =>
          Buffer.isBuffer(c.data) ? c.data : Buffer.from((c.data as any).buffer || c.data)
        )
      );
      const svgCheck = validateSvgSecurity(fullBuffer);
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

    // 5. Verify product ownership if productId provided
    let resolvedProductId: string | undefined = undefined;
    if (productId && typeof productId === 'string' && productId.trim()) {
      const authoritativeProduct = await resolveAuthoritativeProduct(productId.trim(), { lean: true });
      if (!authoritativeProduct || !authoritativeProduct.id) {
        return NextResponse.json(
          { success: false, error: `Invalid productId: Product "${productId}" does not exist.` },
          { status: 404 }
        );
      }
      resolvedProductId = authoritativeProduct.id;
    }

    // 6. Stream assembled chunks directly into GridFS bucket 'media_files'
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection is not ready.');
    }

    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'media_files' });
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType: detectedType,
        uploadId,
        productId: resolvedProductId,
        uploadedBy: auth?.actorId || 'admin',
        totalSize: totalAccumulatedSize,
        createdAt: new Date(),
      },
    });

    await new Promise<void>((resolve, reject) => {
      uploadStream.on('error', reject);
      uploadStream.on('finish', () => resolve());

      for (const chunk of chunks) {
        const chunkBuf = Buffer.isBuffer(chunk.data)
          ? chunk.data
          : Buffer.from((chunk.data as any).buffer || chunk.data);
        uploadStream.write(chunkBuf);
      }
      uploadStream.end();
    });

    const gridFsFileId = uploadStream.id;

    // 7. Persist Media record with GridFS pointer (no raw binary in BSON document)
    const extMatch = filename.match(/\.([0-9a-z]+)$/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : (finalMediaType === 'video' ? 'mp4' : 'jpg');
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await MediaModel.create({
      id: mediaId,
      productId: resolvedProductId,
      altText: altText ? altText.trim() : undefined,
      filename,
      contentType: detectedType,
      size: totalAccumulatedSize,
      type: finalMediaType,
      storageProvider: 'mongodb-gridfs',
      gridFsFileId,
      uploadId,
    });

    // 8. Auto-associate media with product if requested
    if (resolvedProductId) {
      const permanentUrl = `/api/media/${mediaId}.${ext}`;
      const product = await ProductModel.findOne({ id: resolvedProductId });
      if (product) {
        if (finalMediaType === 'video') {
          const currentVideos = Array.isArray(product.videos) ? [...product.videos] : [];
          if (!currentVideos.includes(permanentUrl)) {
            product.videos = [...currentVideos, permanentUrl];
          }
        } else {
          const currentImages = Array.isArray(product.images) ? [...product.images] : [];
          if (!currentImages.includes(permanentUrl)) {
            product.images = [...currentImages, permanentUrl];
            product.imageStatus = 'VERIFIED';
          }
        }
        await product.save();
      }
    }

    // 9. Clean up temporary chunks
    await MediaChunkModel.deleteMany({ uploadId });

    // 10. Audit Log
    await recordAuditLog({
      action: 'PRODUCT_MEDIA_UPDATED',
      entityId: mediaId,
      entityName: filename,
      summary: `Uploaded and assembled ${finalMediaType} "${filename}" (${(totalAccumulatedSize / (1024 * 1024)).toFixed(2)} MB) via GridFS chunked pipeline.`,
      details: {
        uploadId,
        gridFsFileId: gridFsFileId.toString(),
        totalChunks: chunks.length,
        size: totalAccumulatedSize,
        type: finalMediaType,
        contentType: detectedType,
        productId: resolvedProductId,
      },
      req,
    });

    const permanentUrl = `/api/media/${mediaId}.${ext}`;

    return NextResponse.json(
      {
        success: true,
        provider: 'mongodb-gridfs',
        url: permanentUrl,
        mediaId,
        filename,
        size: totalAccumulatedSize,
        type: finalMediaType,
        contentType: detectedType,
        productId: resolvedProductId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[UploadComplete] error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to complete media upload.' },
      { status: 500 }
    );
  }
}
