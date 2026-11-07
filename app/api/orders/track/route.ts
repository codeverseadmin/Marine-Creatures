import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { requirePermission } from '@/lib/rbac/guard';
import { verifyInvoiceTokenHash } from '@/lib/invoice-token';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = (searchParams.get('orderId') || searchParams.get('id') || '').trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Tracking reference is required' },
        { status: 400 }
      );
    }

    const normalizedId = orderId.startsWith('MC-') ? orderId : `MC-${orderId}`;
    const adminCheck = await requirePermission(req, 'orders.read');
    const isAdmin = !adminCheck.errorResponse;

    const secureHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'X-Content-Type-Options': 'nosniff',
    };

    // ── Synthetic QA Fixture Interceptor (Development only, strictly isolated from production) ─
    const allowFixtures = process.env.NODE_ENV !== 'production' && process.env.ALLOW_QA_FIXTURES === 'true';
    if (
      allowFixtures &&
      (normalizedId === 'MC-QA-ISOLATED-STANDARD' ||
        normalizedId === 'MC-QA-ISOLATED-MULTIPAGE' ||
        normalizedId === 'MC-QA-POR-FIXTURE' ||
        normalizedId === 'MC-QA-POR-RESOLVED-FIXTURE' ||
        normalizedId === 'MC-QA-FINANCIAL-RECON' ||
        normalizedId === 'MC-QA-FINANCIAL-RECON-RESOLVED')
    ) {
      const { getFixture } = await import('@/lib/invoice-test-fixtures');
      const fixture: any = getFixture(normalizedId);
      if (!fixture) {
        return NextResponse.json({ success: false, error: 'Tracking reference not found' }, { status: 404 });
      }

      const providedToken = (searchParams.get('token') || '').trim();
      const providedPhone = (searchParams.get('phone') || '').replace(/\D/g, '');
      const fixtureCleanPhone = (fixture.phone || '').replace(/\D/g, '');

      const isFixtureAuthorized =
        isAdmin ||
        Boolean(providedToken) ||
        Boolean(providedPhone.length >= 4 && fixtureCleanPhone.endsWith(providedPhone));

      const baseFixtureData = {
        id: normalizedId,
        customerMaskedName: 'Q* S******** C********',
        city: fixture.city,
        currentStep: fixture.currentStep || 'placed',
        estimatedDelivery: fixture.estimatedDelivery,
        isApproved: fixture.isApproved,
        createdAt: fixture.createdAt,
        statusHistory: fixture.history || [
          { step: 'placed', timestamp: '07 Oct 2026, 10:00 AM', note: 'Order registered and confirmed' },
        ],
        detailedShipment: isFixtureAuthorized,
        hasUnresolvedPorItems: Boolean(fixture.hasUnresolvedPorItems),
      };

      if (isFixtureAuthorized) {
        return NextResponse.json(
          {
            success: true,
            data: {
              ...baseFixtureData,
              courierName: fixture.courierName,
              awbNumber: fixture.awbNumber,
              totalAmount: fixture.totalAmount,
              subtotal: fixture.subtotal,
              items: fixture.items.map((it: any) => ({
                id: it.id || 'item',
                name: it.name,
                quantity: it.quantity,
                category: it.categoryLabel,
                price: typeof it.agreedUnitPrice === 'number' && it.agreedUnitPrice > 0 ? it.agreedUnitPrice : (it.price || 0),
                priceOnRequest: Boolean(it.priceOnRequest),
                pricingStatus: it.pricingStatus || (it.priceOnRequest ? 'PENDING_POR' : 'STANDARD'),
                image: '/logo.png',
              })),
            },
          },
          { status: 200, headers: secureHeaders }
        );
      }

      // Basic public tier for synthetic fixtures — zero financial info, zero address, zero phone
      const fixtureItemCount = Array.isArray(fixture.items) ? fixture.items.length : 0;
      return NextResponse.json(
        {
          success: true,
          data: {
            ...baseFixtureData,
            courierName: 'Priority Air Cargo Partner',
            awbNumber: null,
            itemCount: fixtureItemCount,
            items: [
              {
                id: 'specimens',
                name: `${fixtureItemCount} Marine Specimen(s) in Oxygen Thermal Packaging`,
                quantity: fixtureItemCount,
                category: 'Protected Manifest',
                image: '/logo.png',
              },
            ],
            requiresVerificationForManifest: true,
          },
        },
        { status: 200, headers: secureHeaders }
      );
    }

    if (!isAdmin) {
      const clientIp = getClientIp(req);

      // 1. Server-side Rate Limiting: Per-IP throttle (max 60 queries per 10 minutes)
      const ipRateLimit = await checkRateLimit(`rate:track:ip:${clientIp}`, 60, 600);
      if (!ipRateLimit.allowed) {
        return rateLimitResponse(
          ipRateLimit.retryAfter,
          'Tracking query rate limit exceeded for this IP. Please wait before retrying.'
        );
      }

      // 2. Server-side Rate Limiting: Per-Order throttle (max 20 queries per 10 minutes)
      const orderRateLimit = await checkRateLimit(`rate:track:order:${normalizedId}`, 20, 600);
      if (!orderRateLimit.allowed) {
        return rateLimitResponse(
          orderRateLimit.retryAfter,
          'Too many tracking requests for this reference. Please retry shortly.'
        );
      }
    }

    await connectToDatabase();

    const order = await OrderModel.findOne({
      $or: [
        { id: normalizedId },
        { id: orderId },
        { awbNumber: orderId },
      ],
    }).lean();

    // Generic error response for missing or invalid orders to prevent oracle discovery
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Tracking information is unavailable for the requested identifier' },
        { status: 404 }
      );
    }

    // 3. Multi-Tier Authorization Evaluation for Detailed Shipment Information
    const providedToken = (searchParams.get('token') || '').trim();
    const providedPhone = (searchParams.get('phone') || '').replace(/\D/g, '');
    const cleanOrderPhone = (order.phone || '').replace(/\D/g, '');

    const hasValidToken = Boolean(
      providedToken &&
      order.invoiceTokenHash &&
      verifyInvoiceTokenHash(providedToken, order.invoiceTokenHash)
    );

    const hasValidPhone = Boolean(
      providedPhone.length >= 4 &&
      cleanOrderPhone.length >= 4 &&
      cleanOrderPhone.endsWith(providedPhone)
    );

    // Authorization required to view sensitive carrier AWB and individual specimen contents
    const isAuthorizedForManifest = isAdmin || hasValidToken || hasValidPhone;

    // Mask customer name (e.g., 'R**** V****')
    const rawName = order.customerName || 'Valued Client';
    const maskedName = rawName
      .split(' ')
      .map((part: string) => {
        if (part.length <= 1) return part;
        return part.charAt(0) + '*'.repeat(Math.max(1, part.length - 1));
      })
      .join(' ');

    const itemCount = Array.isArray(order.items) ? order.items.length : 0;

    // Base Public Tracking Payload — Zero PII (Zero address, phone, notes, financial data)
    const baseTrackingData = {
      id: order.id,
      customerMaskedName: maskedName,
      city: order.city || 'Destination City',
      currentStep: order.currentStep || 'placed',
      estimatedDelivery: order.estimatedDelivery || '1–2 Business Days (Express Air Cargo)',
      isApproved: Boolean(order.isApproved),
      createdAt: order.createdAt,
      statusHistory: order.history || (order as any).statusHistory || [],
      detailedShipment: isAuthorizedForManifest,
      hasUnresolvedPorItems: Boolean(order.hasUnresolvedPorItems),
    };

    if (isAuthorizedForManifest) {
      // Authorized tier: Disclose actual courier, full AWB, total amounts, and specific specimen manifest
      return NextResponse.json(
        {
          success: true,
          data: {
            ...baseTrackingData,
            courierName: order.courierName || 'Priority Air Cargo Express',
            awbNumber: order.awbNumber || null,
            totalAmount: order.totalAmount,
            subtotal: order.subtotal,
            items: (order.items || []).map((it: any) => ({
              id: it.id || it.product?.id,
              name: it.name || it.product?.name,
              quantity: it.quantity || 1,
              category: it.category || it.product?.category,
              image: it.image || it.product?.images?.[0] || '',
              price: typeof it.agreedUnitPrice === 'number' && it.agreedUnitPrice > 0 ? it.agreedUnitPrice : (it.price || 0),
              priceOnRequest: Boolean(it.priceOnRequest),
              pricingStatus: it.pricingStatus || (it.priceOnRequest ? 'PENDING_POR' : 'STANDARD'),
              warranty: it.warranty
                ? {
                    hasWarranty: Boolean(it.warranty.hasWarranty),
                    provider: it.warranty.provider,
                    durationValue: it.warranty.durationValue,
                    durationUnit: it.warranty.durationUnit,
                    terms: it.warranty.terms,
                  }
                : undefined,
            })),
          },
        },
        { status: 200, headers: secureHeaders }
      );
    }

    // Basic public tier: Disclose progress milestones without leaking flight manifests or item list
    return NextResponse.json(
      {
        success: true,
        data: {
          ...baseTrackingData,
          courierName: 'Priority Air Cargo Partner',
          awbNumber: null,
          itemCount,
          items: [
            {
              id: 'specimens',
              name: `${itemCount} Marine Specimen(s) in Oxygen Thermal Packaging`,
              quantity: itemCount,
              category: 'Protected Manifest',
              image: '/logo.png',
            },
          ],
          requiresVerificationForManifest: true,
        },
      },
      { status: 200, headers: secureHeaders }
    );
  } catch (error: any) {
    console.error('Tracking endpoint error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal tracking error' },
      { status: 500 }
    );
  }
}
