import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const rawId = resolvedParams.id;
    const orderId = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;

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

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
