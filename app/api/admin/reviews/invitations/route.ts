import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { ReviewInvitationModel } from '@/models/ReviewInvitation';
import { OrderModel } from '@/models/Order';
import { ProductModel } from '@/models/Product';
import { PRODUCTS } from '@/lib/data/products';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'reviews.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const query: Record<string, any> = {};
    if (orderId) {
      query.orderId = orderId.trim();
    }

    const invitations = await ReviewInvitationModel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      count: invitations.length,
      data: invitations.map((inv) => ({
        tokenHash: inv.tokenHash.substring(0, 12) + '...',
        orderId: inv.orderId,
        productId: inv.productId,
        productName: inv.productName,
        customerName: inv.customerName,
        customerPhone: inv.customerPhone,
        expiresAt: inv.expiresAt,
        isUsed: inv.isUsed,
        usedAt: inv.usedAt,
        reviewId: inv.reviewId,
        createdBy: inv.createdBy,
        createdAt: inv.createdAt,
        isExpired: !inv.isUsed && new Date() > new Date(inv.expiresAt),
      })),
    });
  } catch (error: any) {
    console.error('Failed to list invitations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve review invitations.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'reviews.invite.create');
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { orderId, productId, expiryDays = 7 } = body;

    if (!orderId || !productId) {
      return NextResponse.json(
        { success: false, error: 'Both orderId and productId are required.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const cleanOrderId = String(orderId).trim();
    const cleanProductId = String(productId).trim().toLowerCase();

    // 1. Verify order exists and is both approved and delivered
    const order = await OrderModel.findOne({ id: cleanOrderId });
    if (!order) {
      return NextResponse.json(
        { success: false, error: `Order #${cleanOrderId} not found.` },
        { status: 404 }
      );
    }

    if (!order.isApproved) {
      return NextResponse.json(
        {
          success: false,
          error: `Order #${cleanOrderId} is unapproved. Review invitations require an authoritative, approved order.`,
        },
        { status: 400 }
      );
    }

    if (order.currentStep !== 'delivered') {
      return NextResponse.json(
        {
          success: false,
          error: `Order #${cleanOrderId} is currently "${order.currentStep}". Review invitations are strictly permitted only for confirmed "delivered" orders.`,
        },
        { status: 400 }
      );
    }

    // 2. Verify product is in order
    const orderItem = order.items.find(
      (item) => item.id.toLowerCase() === cleanProductId || item.id.toLowerCase().startsWith(`${cleanProductId}__`)
    );

    if (!orderItem) {
      return NextResponse.json(
        {
          success: false,
          error: `Product "${cleanProductId}" was not purchased in Order #${cleanOrderId}.`,
        },
        { status: 400 }
      );
    }

    // Resolve accurate product name
    let productName = orderItem.name;
    const dbProduct = await ProductModel.findOne({ id: cleanProductId }).lean();
    if (dbProduct && dbProduct.name) {
      productName = dbProduct.name;
    } else {
      const staticProd = PRODUCTS.find((p) => p.id === cleanProductId);
      if (staticProd) productName = staticProd.name;
    }

    // 3. Generate Cryptographic Random Token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const durationDays = Math.max(1, Math.min(Number(expiryDays) || 7, 30));
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // Save invitation
    await ReviewInvitationModel.create({
      tokenHash,
      orderId: cleanOrderId,
      productId: cleanProductId,
      productName,
      customerName: order.customerName || 'Valued Client',
      customerPhone: order.phone || '',
      expiresAt,
      isUsed: false,
      createdBy: auth!.actorName,
    });

    // Formulate review URL
    const host = req.headers.get('host') || 'marinecreatures.com';
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const invitationUrl = `${protocol}://${host}/review?token=${rawToken}`;

    // Record audit log
    await recordAuditLog({
      action: 'REVIEW_INVITATION_CREATED',
      entityType: 'review_invitation',
      entityId: `${cleanOrderId}_${cleanProductId}`,
      entityName: `${productName} Review Invitation`,
      summary: `${auth!.actorName} generated review invitation for ${order.customerName} (Order #${cleanOrderId})`,
      details: {
        orderId: cleanOrderId,
        productId: cleanProductId,
        productName,
        customerName: order.customerName,
        customerPhone: order.phone,
        expiresAt,
        actor: auth!.actorName,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Cryptographic review invitation generated successfully.',
      invitation: {
        rawToken,
        invitationUrl,
        orderId: cleanOrderId,
        productId: cleanProductId,
        productName,
        customerName: order.customerName,
        customerPhone: order.phone,
        expiresAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create review invitation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate review invitation.' },
      { status: 500 }
    );
  }
}

