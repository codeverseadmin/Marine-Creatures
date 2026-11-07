import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductReviewModel, ReviewStatus } from '@/models/ProductReview';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await requirePermission(req, 'reviews.read');
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    await connectToDatabase();

    const review = await ProductReviewModel.findOne({ id }).lean();
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve review details.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await requirePermission(req, 'reviews.moderate');
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, moderationReason } = body;

    if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid moderation status. Must be APPROVED, REJECTED, or PENDING.' },
        { status: 400 }
      );
    }

    if (status === 'REJECTED' && (!moderationReason || String(moderationReason).trim().length < 5)) {
      return NextResponse.json(
        {
          success: false,
          error: 'A specific moderation rationale (minimum 5 characters) is required when rejecting a review.',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const review = await ProductReviewModel.findOne({ id });
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found.' }, { status: 404 });
    }

    const previousStatus = review.status;
    review.status = status as ReviewStatus;
    review.moderatedAt = new Date();
    review.moderatedBy = auth!.actorName;
    if (moderationReason !== undefined) {
      review.moderationReason = String(moderationReason).trim();
    }

    await review.save();

    // Record Audit Log
    const auditAction = status === 'APPROVED' ? 'REVIEW_APPROVED' : 'REVIEW_REJECTED';
    await recordAuditLog({
      action: auditAction,
      entityType: 'review',
      entityId: review.id,
      entityName: `${review.productName} Review (${status})`,
      summary: `${auth!.actorName} set review status from ${previousStatus} to ${status}${moderationReason ? `: ${moderationReason}` : ''}`,
      details: {
        reviewId: review.id,
        productId: review.productId,
        orderId: review.orderId,
        previousStatus,
        newStatus: status,
        moderator: auth!.actorName,
        reason: moderationReason || null,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Review has been successfully marked as ${status}.`,
      data: review,
    });
  } catch (error: any) {
    console.error('Failed to moderate review:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update review moderation status.' },
      { status: 500 }
    );
  }
}

