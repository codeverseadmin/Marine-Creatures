import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { ReviewInvitationModel } from '@/models/ReviewInvitation';
import { ProductReviewModel } from '@/models/ProductReview';
import { OrderModel } from '@/models/Order';
import { recordAuditLog } from '@/lib/audit';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

function maskPhoneNumber(phone: string): string {
  if (!phone) return 'Hidden';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.length < 8) return 'Protected';
  const start = clean.slice(0, 4);
  const end = clean.slice(-2);
  return `${start}******${end}`;
}

function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[<>]/g, '') // Strip basic HTML tags
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const postRateLimit = await checkRateLimit(`rate:reviews:submit:ip:${clientIp}`, 5, 900);
    if (!postRateLimit.allowed) {
      return rateLimitResponse(postRateLimit.retryAfter, 'Too many review submissions. Please wait.');
    }

    const body = await req.json();
    const {
      token,
      rating,
      title,
      comment,
      customerDisplayName,
      customerLocation,
      images,
    } = body;

    // 1. Validate Token format
    if (!token || typeof token !== 'string' || token.trim().length < 16) {
      return NextResponse.json(
        { success: false, error: 'A valid review invitation token is required.' },
        { status: 400 }
      );
    }

    // 2. Validate Rating (Integer 1 to 5)
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be an integer between 1 and 5 stars.' },
        { status: 400 }
      );
    }

    // 3. Validate Title and Comment
    const cleanTitle = sanitizeText(title);
    if (!cleanTitle || cleanTitle.length < 3 || cleanTitle.length > 120) {
      return NextResponse.json(
        { success: false, error: 'Review headline must be between 3 and 120 characters.' },
        { status: 400 }
      );
    }

    const cleanComment = sanitizeText(comment);
    if (!cleanComment || cleanComment.length < 10 || cleanComment.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Review experience details must be between 10 and 2000 characters.',
        },
        { status: 400 }
      );
    }

    // 4. Validate images (optional, max 5)
    const sanitizedImages: Array<{
      id: string;
      url: string;
      mimeType: string;
      fileSize: number;
      isApproved: boolean;
    }> = [];

    if (Array.isArray(images)) {
      if (images.length > 5) {
        return NextResponse.json(
          { success: false, error: 'Maximum of 5 photographs allowed per review.' },
          { status: 400 }
        );
      }
      for (const img of images) {
        if (img && typeof img.url === 'string' && img.url.startsWith('/api/media/')) {
          sanitizedImages.push({
            id: String(img.id || `img-${Date.now()}`),
            url: img.url,
            mimeType: String(img.mimeType || 'image/jpeg'),
            fileSize: Number(img.fileSize || 0),
            isApproved: true,
          });
        }
      }
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    await connectToDatabase();

    // 5. Transactional Execution for Guaranteed Atomicity
    const session = await mongoose.startSession();
    let createdReviewId: string | undefined;
    let auditData: {
      orderId: string;
      productId: string;
      productName: string;
    } | undefined;

    try {
      session.startTransaction();

      // Look up Invitation within transaction
      const invitation = await ReviewInvitationModel.findOne({ tokenHash }).session(session);
      if (!invitation) {
        await session.abortTransaction();
        await session.endSession();
        return NextResponse.json(
          { success: false, error: 'Invalid or unrecognized review invitation token.' },
          { status: 404 }
        );
      }

      if (invitation.isUsed) {
        await session.abortTransaction();
        await session.endSession();
        return NextResponse.json(
          {
            success: false,
            error: 'This review invitation has already been submitted and completed.',
          },
          { status: 410 }
        );
      }

      if (new Date() > new Date(invitation.expiresAt)) {
        await session.abortTransaction();
        await session.endSession();
        return NextResponse.json(
          { success: false, error: 'This review invitation has expired.' },
          { status: 410 }
        );
      }

      // Verify Delivered and Approved Order
      const order = await OrderModel.findOne({ id: invitation.orderId }).session(session);
      if (!order) {
        await session.abortTransaction();
        await session.endSession();
        return NextResponse.json(
          { success: false, error: 'Delivered order record not found.' },
          { status: 404 }
        );
      }

      if (order.currentStep !== 'delivered' || !order.isApproved) {
        await session.abortTransaction();
        await session.endSession();
        return NextResponse.json(
          {
            success: false,
            error: 'Reviews are only enabled after confirmed specimen delivery of an approved order.',
          },
          { status: 400 }
        );
      }

      // Check duplicate review constraint
      const existingReview = await ProductReviewModel.findOne({
        orderId: invitation.orderId,
        productId: invitation.productId,
      }).session(session);

      if (existingReview) {
        await session.abortTransaction();
        await session.endSession();
        return NextResponse.json(
          {
            success: false,
            error: 'A verified review has already been submitted for this item from your order.',
          },
          { status: 409 }
        );
      }

      // Resolve Customer Display Name
      let finalDisplayName = sanitizeText(customerDisplayName);
      if (!finalDisplayName) {
        const rawName = invitation.customerName || order.customerName || 'Valued Client';
        const parts = rawName.trim().split(/\s+/);
        finalDisplayName =
          parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase()}.`;
      }

      const finalLocation = sanitizeText(customerLocation) || (order.city ? `${order.city}` : undefined);
      const maskedPhone = maskPhoneNumber(invitation.customerPhone || order.phone);

      const reviewId = `rev-${Date.now()}-${crypto.randomBytes(5).toString('hex')}`;

      // Mark invitation as used
      invitation.isUsed = true;
      invitation.usedAt = new Date();
      invitation.reviewId = reviewId;
      await invitation.save({ session });

      // Create Review (PENDING moderation)
      const [newReview] = await ProductReviewModel.create(
        [
          {
            id: reviewId,
            productId: invitation.productId,
            productName: invitation.productName,
            orderId: invitation.orderId,
            customerDisplayName: finalDisplayName,
            customerLocation: finalLocation,
            customerPhoneMasked: maskedPhone,
            rating: numRating,
            title: cleanTitle,
            comment: cleanComment,
            images: sanitizedImages,
            verifiedPurchase: true,
            status: 'PENDING',
            invitationTokenHash: tokenHash,
            submittedAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      await session.endSession();

      createdReviewId = newReview.id;
      auditData = {
        orderId: invitation.orderId,
        productId: invitation.productId,
        productName: invitation.productName,
      };
    } catch (txnError: any) {
      try {
        await session.abortTransaction();
        await session.endSession();
      } catch (abortErr) {
        // session already finished
      }

      if (txnError?.code === 11000) {
        return NextResponse.json(
          {
            success: false,
            error: 'A verified review for this order item or token is already in progress or has been submitted.',
          },
          { status: 409 }
        );
      }
      throw txnError;
    }

    // 6. Audit Log (asynchronous, outside transaction)
    if (createdReviewId && auditData) {
      recordAuditLog({
        action: 'REVIEW_SUBMITTED',
        entityType: 'review',
        entityId: createdReviewId,
        entityName: `${auditData.productName} Review`,
        summary: `Customer submitted ${numRating}-star review for "${auditData.productName}" (Order #${auditData.orderId})`,
        details: {
          orderId: auditData.orderId,
          productId: auditData.productId,
          rating: numRating,
          imagesCount: sanitizedImages.length,
        },
        req,
      }).catch((auditErr) => {
        console.error('Non-critical audit logging error on review submission:', auditErr);
      });
    }

    return NextResponse.json({
      success: true,
      reviewId: createdReviewId,
      message:
        'Review submitted for concierge moderation. Thank you for sharing your aquarium journey with Marine Creatures.',
    });
  } catch (error: any) {
    console.error('Failed to submit customer review:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred while submitting your review.',
      },
      { status: 500 }
    );
  }
}
