import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = (searchParams.get('orderId') || searchParams.get('id') || '').trim();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required for tracking lookup' },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const normalizedId = orderId.startsWith('MC-') ? orderId : `MC-${orderId}`;

    const order = await OrderModel.findOne({
      $or: [
        { id: normalizedId },
        { id: orderId },
        { awbNumber: orderId },
      ],
    }).lean();

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'No order located with the provided identifier' },
        { status: 404 }
      );
    }

    // Mask customer name to protect identity while confirming identity to the customer
    const rawName = order.customerName || 'Valued Client';
    const maskedName = rawName
      .split(' ')
      .map((part: string) => {
        if (part.length <= 1) return part;
        return part.charAt(0) + '*'.repeat(Math.max(1, part.length - 1));
      })
      .join(' ');

    // Whitelist only public tracking properties — ZERO PII (full address, phone, internal order notes)
    const trackingData = {
      id: order.id,
      customerMaskedName: maskedName,
      city: order.city || 'Destination City',
      currentStep: order.currentStep || 'placed',
      estimatedDelivery: order.estimatedDelivery || '1–2 Business Days (Express Air Cargo)',
      courierName: order.courierName || 'Marine Express Air Cargo',
      awbNumber: order.awbNumber || null,
      isApproved: Boolean(order.isApproved),
      createdAt: order.createdAt,
      statusHistory: order.history || (order as any).statusHistory || [],
      items: (order.items || []).map((it: any) => ({
        id: it.id || it.product?.id,
        name: it.name || it.product?.name,
        quantity: it.quantity || 1,
        category: it.category || it.product?.category,
        image: it.image || it.product?.images?.[0] || '',
      })),
    };

    return NextResponse.json({ success: true, data: trackingData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
