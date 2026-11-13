import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { requirePermission, requireAnyPermission } from '@/lib/rbac/guard';
import {
  generateInvoiceToken,
  verifyInvoiceTokenHash,
  isInvoiceTokenExpired,
  serializeCustomerInvoice,
} from '@/lib/invoice-token';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getUpiPaymentSettings, resolveOrderInvoicePaymentData } from '@/lib/services/upi-qr';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const rawId = (resolvedParams.id || '').trim();
    const orderId = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;

    // 0. Isolated Synthetic QA Test Fixture Gatekeeper (Development only, strictly isolated from production)
    const allowFixtures = process.env.NODE_ENV !== 'production' && process.env.ALLOW_QA_FIXTURES === 'true';
    if (allowFixtures && (orderId === 'MC-QA-ISOLATED-STANDARD' || orderId === 'MC-QA-ISOLATED-MULTIPAGE')) {
      const { searchParams } = new URL(req.url);
      const token = (searchParams.get('token') || req.headers.get('x-invoice-token') || '').trim();

      const adminCheck = await requirePermission(req, 'orders.read');
      if (adminCheck.errorResponse && !token) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Valid invoice access token required to view customer invoice data',
            requiresToken: true,
          },
          { status: 401 }
        );
      }

      const { QA_STANDARD_FIXTURE } = await import('@/lib/invoice-test-fixtures');
      return NextResponse.json({ success: true, data: QA_STANDARD_FIXTURE });
    }

    // 1. Authenticated Employee Session with orders.read has full operational access and bypasses consumer rate limiting
    const adminCheck = await requirePermission(req, 'orders.read');
    if (!adminCheck.errorResponse) {
      const order = await OrderModel.findOne({
        $or: [
          { id: orderId },
          { id: rawId },
          { invoiceNumber: rawId },
          { invoiceNumber: `INV-${rawId}` },
        ],
      }).lean();

      if (!order) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      const upiSettings = await getUpiPaymentSettings();
      const upiPayment = await resolveOrderInvoicePaymentData(order, upiSettings);

      return NextResponse.json({ success: true, data: { ...order, upiPayment }, isAdmin: true });
    }

    const clientIp = getClientIp(req);

    // 2. Server-side Rate Limiting for Public / Customer Access:
    // Per-IP throttle (max 30 requests per 15 minutes)
    const ipRateLimit = await checkRateLimit(`rate:invoice:ip:${clientIp}`, 30, 900);
    if (!ipRateLimit.allowed) {
      return rateLimitResponse(
        ipRateLimit.retryAfter,
        'Too many invoice verification requests from this IP. Please wait before retrying.'
      );
    }

    // Per-Order throttle (max 20 requests per 15 minutes)
    const orderRateLimit = await checkRateLimit(`rate:invoice:order:${orderId}`, 20, 900);
    if (!orderRateLimit.allowed) {
      return rateLimitResponse(
        orderRateLimit.retryAfter,
        'Too many verification attempts for this order. Please try again later.'
      );
    }

    const order = await OrderModel.findOne({
      $or: [
        { id: orderId },
        { id: rawId },
        { invoiceNumber: rawId },
        { invoiceNumber: `INV-${rawId}` },
      ],
    }).lean();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Strict POR Invoice Gating: An invoice CANNOT be viewed or generated for an order
    // containing unresolved Price on Request (POR) items.
    const hasUnresolvedPor = Boolean(
      order.hasUnresolvedPorItems ||
      (Array.isArray(order.items) &&
        order.items.some(
          (it: any) =>
            (it.priceOnRequest || it.pricingStatus === 'PENDING_POR' || it.price === 0) &&
            (!it.agreedUnitPrice || it.agreedUnitPrice <= 0)
        ))
    );

    if (hasUnresolvedPor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice generation is blocked because one or more Price on Request items still require admin price settlement.',
          code: 'POR_PRICING_PENDING',
          requiresPorPricing: true,
        },
        { status: 409 }
      );
    }

    // 4. Customer Access: STRICT Token-Based Authorization (Min 128-bit CSPRNG entropy)
    // Legacy 4-digit phone matching is REMOVED as an authorization mechanism.
    const { searchParams } = new URL(req.url);
    const token = (searchParams.get('token') || req.headers.get('x-invoice-token') || '').trim();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Valid invoice access token required to view customer invoice data',
          requiresToken: true,
        },
        { status: 401 }
      );
    }

    // Order must have a registered token hash in database
    if (!order.invoiceTokenHash) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invoice access token is not registered for this order. Please contact support.',
          requiresToken: true,
        },
        { status: 401 }
      );
    }

    // Verify token expiration if configured
    if (isInvoiceTokenExpired(order.invoiceTokenExpiresAt)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invoice access token has expired. Please request a reissued link.',
          tokenExpired: true,
        },
        { status: 401 }
      );
    }

    // Timing-safe verification of the cryptographic token hash
    const isValidToken = verifyInvoiceTokenHash(token, order.invoiceTokenHash);
    if (!isValidToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid invoice access token',
          requiresToken: true,
        },
        { status: 401 }
      );
    }

    // 5. Serialize ONLY the fields required by the invoice page (Zero raw MongoDB leak)
    const upiSettings = await getUpiPaymentSettings();
    const upiPayment = await resolveOrderInvoicePaymentData(order, upiSettings);
    (order as any).upiPayment = upiPayment;
    const sanitizedInvoice = serializeCustomerInvoice(order);
    return NextResponse.json({ success: true, data: sanitizedInvoice });
  } catch (error: any) {
    console.error('Invoice retrieval error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Administrative Token Issuance and Reissuance Endpoint
 * Allows authenticated store managers to issue or rotate an order's access token
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  // Strictly restricted to authenticated employees with invoice generation or order update permissions
  const { auth, errorResponse } = await requireAnyPermission(req, [
    'orders.invoice.generate',
    'orders.update_status',
  ]);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const rawId = (resolvedParams.id || '').trim();
    const orderId = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;

    const order = await OrderModel.findOne({
      $or: [{ id: orderId }, { id: rawId }],
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Strict POR Invoice Gating: An invoice CANNOT be viewed or generated for an order
    // containing unresolved Price on Request (POR) items.
    const hasUnresolvedPor = Boolean(
      order.hasUnresolvedPorItems ||
      (Array.isArray(order.items) &&
        order.items.some(
          (it: any) =>
            (it.priceOnRequest || it.pricingStatus === 'PENDING_POR' || it.price === 0) &&
            (!it.agreedUnitPrice || it.agreedUnitPrice <= 0)
        ))
    );

    if (hasUnresolvedPor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invoice generation is blocked because one or more Price on Request items still require admin price settlement.',
          code: 'POR_PRICING_PENDING',
          requiresPorPricing: true,
        },
        { status: 409 }
      );
    }

    // Generate fresh cryptographically random token (256 bits entropy)
    const { rawToken, tokenHash, createdAt, expiresAt } = generateInvoiceToken();

    await OrderModel.updateOne(
      { _id: order._id },
      {
        $set: {
          invoiceTokenHash: tokenHash,
          invoiceTokenCreatedAt: createdAt,
          invoiceTokenExpiresAt: expiresAt,
        },
      }
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      token: rawToken,
      invoiceUrl: `/invoice/${order.id}?token=${rawToken}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to issue invoice token:', error.message);
    return NextResponse.json({ success: false, error: 'Failed to issue token' }, { status: 500 });
  }
}
