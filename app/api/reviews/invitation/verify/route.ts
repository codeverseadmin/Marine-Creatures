import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { ReviewInvitationModel } from '@/models/ReviewInvitation';
import { OrderModel } from '@/models/Order';
import { ProductModel } from '@/models/Product';
import { PRODUCTS } from '@/lib/data/products';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

function maskCustomerName(fullName: string): string {
  if (!fullName) return 'Valued Client';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase();
  return `${first} ${lastInitial}.`;
}

export async function GET(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);
    const verifyRateLimit = await checkRateLimit(`rate:reviews:verify:ip:${clientIp}`, 30, 300);
    if (!verifyRateLimit.allowed) {
      return rateLimitResponse(verifyRateLimit.retryAfter, 'Too many verification attempts. Please wait.');
    }

    const { searchParams } = new URL(req.url);
    const rawToken = searchParams.get('token');

    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length < 16) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'A valid review invitation token is required.',
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

    await connectToDatabase();

    const invitation = await ReviewInvitationModel.findOne({ tokenHash }).lean();

    if (!invitation) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Review invitation not found. The link may be invalid or expired.',
        },
        { status: 404 }
      );
    }

    if (invitation.isUsed) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'This review invitation has already been completed and submitted.',
        },
        { status: 410 }
      );
    }

    if (new Date() > new Date(invitation.expiresAt)) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'This review invitation has expired. Invitations remain valid for 7 days post-delivery.',
        },
        { status: 410 }
      );
    }

    // Verify order exists, is approved, and is delivered
    const order = await OrderModel.findOne({ id: invitation.orderId }).lean();
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Associated order record was not found.',
        },
        { status: 404 }
      );
    }

    if (order.currentStep !== 'delivered' || !order.isApproved) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: 'Reviews are only enabled after confirmed specimen delivery of an approved order.',
        },
        { status: 400 }
      );
    }

    // Find product image and details
    let productImage = '';
    const dbProduct = await ProductModel.findOne({ id: invitation.productId }).lean();
    if (dbProduct && dbProduct.images && dbProduct.images.length > 0) {
      productImage = dbProduct.images[0];
    } else {
      const staticProd = PRODUCTS.find((p) => p.id === invitation.productId);
      if (staticProd && staticProd.images && staticProd.images.length > 0) {
        productImage = staticProd.images[0];
      }
    }

    // If order item had a specific thumbnail
    if (!productImage && order.items) {
      const orderItem = order.items.find(
        (i) => i.id === invitation.productId || i.id.startsWith(`${invitation.productId}__`)
      );
      if (orderItem?.image) {
        productImage = orderItem.image;
      }
    }

    const customerDisplayName = maskCustomerName(invitation.customerName || order.customerName);
    const customerLocation = order.city ? `${order.city}` : undefined;

    return NextResponse.json({
      success: true,
      valid: true,
      invitation: {
        orderId: invitation.orderId,
        productId: invitation.productId,
        productName: invitation.productName,
        productImage,
        customerDisplayName,
        customerLocation,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Error verifying review invitation token:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: 'Failed to verify review invitation due to a server error.',
      },
      { status: 500 }
    );
  }
}
