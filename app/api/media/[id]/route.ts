import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { MediaModel } from '@/models/Media';
import { ProductReviewModel } from '@/models/ProductReview';
import { ReviewInvitationModel } from '@/models/ReviewInvitation';
import { resolveAuthContext } from '@/lib/rbac/guard';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse('Media ID required', { status: 400 });
    }

    // Strip optional file extension (e.g. "review-1725...jpg" -> "review-1725...")
    const cleanId = id.replace(/\.[^/.]+$/, '');

    await connectToDatabase();
    const media = await MediaModel.findOne({ id: cleanId }).lean();

    if (!media || !media.data) {
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
          // Public access permitted for approved reviews
          cacheControlHeader = 'public, max-age=86400';
        } else {
          // PENDING or REJECTED: Deny public, require staff review permissions
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
        // Unassociated review media (uploaded in draft before review creation):
        // Allow staff OR valid review invitation bearer
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
              // Exact Invitation Ownership Gate:
              // The media record must be explicitly bound to this exact review invitation
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

    // Convert BSON Binary / Buffer into standard Uint8Array
    const rawData = (media.data as any).buffer || media.data;
    const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);
    const totalSize = buffer.length;

    const isSvg = media.contentType === 'image/svg+xml';
    const rangeHeader = req.headers.get('range');

    // HTTP 206 Partial Content Range streaming (vital for video playback and seek operations)
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      // Handle unsatisfiable range
      if (isNaN(start) || isNaN(end) || start > end || start >= totalSize) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            'Content-Range': `bytes */${totalSize}`,
            'Accept-Ranges': 'bytes',
          },
        });
      }

      const clampedEnd = Math.min(end, totalSize - 1);
      const chunkSize = clampedEnd - start + 1;
      const slicedBuffer = buffer.subarray(start, clampedEnd + 1);

      const rangeHeaders: Record<string, string> = {
        'Content-Type': media.contentType || 'application/octet-stream',
        'Content-Length': chunkSize.toString(),
        'Content-Range': `bytes ${start}-${clampedEnd}/${totalSize}`,
        'Cache-Control': cacheControlHeader,
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      };

      if (isSvg) {
        rangeHeaders['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
        rangeHeaders['X-Frame-Options'] = 'DENY';
      }

      return new NextResponse(slicedBuffer, {
        status: 206,
        headers: rangeHeaders,
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': media.contentType || 'image/jpeg',
      'Content-Length': totalSize.toString(),
      'Cache-Control': cacheControlHeader,
      'Accept-Ranges': 'bytes',
      'X-Content-Type-Options': 'nosniff',
    };

    // If SVG, add strict Content-Security-Policy to neutralize any embedded scripts
    if (isSvg) {
      headers['Content-Security-Policy'] = "default-src 'none'; style-src 'unsafe-inline'";
      headers['X-Frame-Options'] = 'DENY';
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
