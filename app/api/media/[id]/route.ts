import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Readable } from 'stream';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';
import { ProductReviewModel } from '@/models/ProductReview';
import { ReviewInvitationModel } from '@/models/ReviewInvitation';
import { resolveAuthContext } from '@/lib/rbac/guard';

export interface ByteRange {
  start: number;
  end: number;
  length: number;
}

/**
 * Standard RFC 7233 Byte Range Parser
 * Supports:
 * - Suffix ranges: bytes=-500, bytes=-1
 * - Standard ranges: bytes=0-, bytes=100-500, bytes=100-
 * - Unsatisfiable ranges: bytes=999999-999999, bytes=-0, bytes=500-100
 */
export function parseByteRange(
  rangeHeader: string,
  totalSize: number
): { type: 'range'; range: ByteRange } | { type: 'unsatisfiable' } | { type: 'none' } {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return { type: 'none' };
  }

  // Handle first byte-range-spec (RFC 7233)
  const spec = rangeHeader.slice(6).split(',')[0].trim();

  // Suffix Byte Range: "-<suffix-length>" (e.g. "-500", "-1")
  if (spec.startsWith('-')) {
    const suffixStr = spec.slice(1).trim();
    const suffixLength = parseInt(suffixStr, 10);
    // RFC 7233: A suffix-length of zero or non-numeric is unsatisfiable
    if (isNaN(suffixLength) || suffixLength <= 0) {
      return { type: 'unsatisfiable' };
    }
    const actualLength = Math.min(suffixLength, totalSize);
    const start = totalSize - actualLength;
    const end = totalSize - 1;
    return {
      type: 'range',
      range: {
        start,
        end,
        length: end - start + 1,
      },
    };
  }

  // Standard Range: "<start>-[<end>]"
  const dashIndex = spec.indexOf('-');
  if (dashIndex === -1) {
    return { type: 'unsatisfiable' };
  }

  const startStr = spec.slice(0, dashIndex).trim();
  const endStr = spec.slice(dashIndex + 1).trim();

  const start = parseInt(startStr, 10);
  if (isNaN(start) || start < 0 || start >= totalSize) {
    return { type: 'unsatisfiable' };
  }

  let end: number;
  if (endStr === '') {
    // e.g. "bytes=0-" or "bytes=100-"
    end = totalSize - 1;
  } else {
    end = parseInt(endStr, 10);
    if (isNaN(end) || end < start) {
      return { type: 'unsatisfiable' };
    }
    // Clamped per RFC 7233: If end-byte-pos is >= totalSize, it is clamped to totalSize - 1
    end = Math.min(end, totalSize - 1);
  }

  return {
    type: 'range',
    range: {
      start,
      end,
      length: end - start + 1,
    },
  };
}

async function handleMediaStream(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
  isHead: boolean
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return new NextResponse('Media ID required', { status: 400 });
    }

    // Strip optional file extension (e.g. "media-1725...mp4" -> "media-1725...")
    const cleanId = id.replace(/\.[^/.]+$/, '');

    await connectToDatabase();
    const media = await MediaModel.findOne({ id: cleanId }).lean();

    if (!media || (!media.data && !media.gridFsFileId)) {
      return new NextResponse('Media not found', { status: 404 });
    }

    const isReviewMedia = cleanId.startsWith('review-');
    let cacheControlHeader = 'public, max-age=31536000, immutable';

    if (isReviewMedia) {
      // Check if this media is linked to a ProductReview
      const associatedReview = await ProductReviewModel.findOne({
        'images.id': cleanId,
      }).select('status').lean();

      if (associatedReview) {
        if (associatedReview.status === 'APPROVED') {
          cacheControlHeader = 'public, max-age=86400';
        } else {
          const auth = await resolveAuthContext(req);
          const hasStaffAccess =
            auth.authenticated &&
            (auth.isOwner ||
              auth.permissions.has('reviews.read') ||
              auth.permissions.has('reviews.moderate') ||
              auth.permissions.has('*'));

          if (!hasStaffAccess) {
            return new NextResponse('Access denied: Review image is pending moderation.', {
              status: 403,
            });
          }
          cacheControlHeader = 'private, no-cache, no-store, must-revalidate';
        }
      } else {
        const auth = await resolveAuthContext(req);
        const hasStaffAccess =
          auth.authenticated &&
          (auth.isOwner ||
            auth.permissions.has('reviews.read') ||
            auth.permissions.has('reviews.moderate') ||
            auth.permissions.has('*'));

        let hasTokenAccess = false;
        if (!hasStaffAccess) {
          const { searchParams } = new URL(req.url);
          const rawToken =
            req.headers.get('x-review-token') ||
            searchParams.get('token') ||
            req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

          if (rawToken && rawToken.trim().length >= 16) {
            const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
            const inv = await ReviewInvitationModel.findOne({ tokenHash }).lean();
            if (inv && !inv.isUsed && new Date() <= new Date(inv.expiresAt)) {
              if (media.invitationTokenHash && media.invitationTokenHash === tokenHash) {
                hasTokenAccess = true;
              }
            }
          }
        }

        if (!hasStaffAccess && !hasTokenAccess) {
          return new NextResponse('Access denied: Unauthorized media preview.', {
            status: 403,
          });
        }
        cacheControlHeader = 'private, no-cache, no-store, must-revalidate';
      }
    }

    const isSvg = media.contentType === 'image/svg+xml';
    const rangeHeader = req.headers.get('range');

    // ── PATH A: GridFS Chunked Storage (Videos & Large Media) ──
    if (media.gridFsFileId) {
      const db = mongoose.connection.db;
      if (!db) {
        return new NextResponse('Database connection unavailable', { status: 500 });
      }

      const gridFsObjectId = new mongoose.Types.ObjectId(media.gridFsFileId);
      const fileDoc = await db.collection('media_files.files').findOne({ _id: gridFsObjectId });
      if (!fileDoc) {
        return new NextResponse('Media content not found in storage bucket', { status: 404 });
      }

      const totalSize = fileDoc.length || media.size;
      const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'media_files' });
      const parsedRange = rangeHeader ? parseByteRange(rangeHeader, totalSize) : { type: 'none' as const };

      if (parsedRange.type === 'unsatisfiable') {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      if (parsedRange.type === 'range') {
        const { start, end, length } = parsedRange.range;
        const rangeHeaders: Record<string, string> = {
          'Content-Type': media.contentType || 'application/octet-stream',
          'Content-Length': length.toString(),
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Cache-Control': cacheControlHeader,
          'Accept-Ranges': 'bytes',
          'X-Content-Type-Options': 'nosniff',
        };

        if (isSvg) {
          rangeHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
          rangeHeaders['X-Frame-Options'] = 'DENY';
        }

        if (isHead) {
          return new NextResponse(null, { status: 206, headers: rangeHeaders });
        }

        // GridFS end option is exclusive (end + 1)
        const downloadStream = bucket.openDownloadStream(gridFsObjectId, {
          start,
          end: end + 1,
        });
        const webStream = Readable.toWeb(downloadStream as any);

        return new NextResponse(webStream as any, {
          status: 206,
          headers: rangeHeaders,
        });
      }

      // Full file (200 OK)
      const headers: Record<string, string> = {
        'Content-Type': media.contentType || 'video/mp4',
        'Content-Length': totalSize.toString(),
        'Cache-Control': cacheControlHeader,
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      };

      if (isSvg) {
        headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
        headers['X-Frame-Options'] = 'DENY';
      }

      if (isHead) {
        return new NextResponse(null, { status: 200, headers });
      }

      const downloadStream = bucket.openDownloadStream(gridFsObjectId);
      const webStream = Readable.toWeb(downloadStream as any);

      return new NextResponse(webStream as any, {
        status: 200,
        headers,
      });
    }

    // ── PATH B: Legacy In-Document MongoDB Binary Buffer ──
    const rawData = (media.data as any).buffer || media.data;
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);
    const totalSize = buffer.length;
    const parsedRange = rangeHeader ? parseByteRange(rangeHeader, totalSize) : { type: 'none' as const };

    if (parsedRange.type === 'unsatisfiable') {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${totalSize}`,
          'Accept-Ranges': 'bytes',
        },
      });
    }

    if (parsedRange.type === 'range') {
      const { start, end, length } = parsedRange.range;
      const rangeHeaders: Record<string, string> = {
        'Content-Type': media.contentType || 'application/octet-stream',
        'Content-Length': length.toString(),
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Cache-Control': cacheControlHeader,
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      };

      if (isSvg) {
        rangeHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
        rangeHeaders['X-Frame-Options'] = 'DENY';
      }

      if (isHead) {
        return new NextResponse(null, { status: 206, headers: rangeHeaders });
      }

      const slicedBuffer = buffer.subarray(start, end + 1);
      return new NextResponse(slicedBuffer, {
        status: 206,
        headers: rangeHeaders,
      });
    }

    // Full legacy file (200 OK)
    const headers: Record<string, string> = {
      'Content-Type': media.contentType || 'image/jpeg',
      'Content-Length': totalSize.toString(),
      'Cache-Control': cacheControlHeader,
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };

    if (isSvg) {
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
      headers['X-Frame-Options'] = 'DENY';
    }

    if (isHead) {
      return new NextResponse(null, { status: 200, headers });
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Failed to stream media:', error);
    return new NextResponse('Failed to retrieve media: ' + error.message, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleMediaStream(req, context, false);
}

export async function HEAD(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return handleMediaStream(req, context, true);
}
