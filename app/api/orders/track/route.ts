import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { isAdminRequest } from '@/lib/auth';
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
    const isAdmin = isAdminRequest(req);

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
    };

    if (isAuthorizedForManifest) {
      // Authorized tier: Disclose actual courier, full AWB, and specific specimen manifest
      return NextResponse.json({
        success: true,
        data: {
          ...baseTrackingData,
          courierName: order.courierName || 'Priority Air Cargo Express',
          awbNumber: order.awbNumber || null,
          items: (order.items || []).map((it: any) => ({
            id: it.id || it.product?.id,
            name: it.name || it.product?.name,
            quantity: it.quantity || 1,
            category: it.category || it.product?.category,
            image: it.image || it.product?.images?.[0] || '',
          })),
        },
      });
    }

    // Basic public tier: Disclose progress milestones without leaking flight manifests or item list
    return NextResponse.json({
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
    });
  } catch (error: any) {
    console.error('Tracking endpoint error:', error.message);
    return NextResponse.json(
      { success: false, error: 'Internal tracking error' },
      { status: 500 }
    );
  }
}
