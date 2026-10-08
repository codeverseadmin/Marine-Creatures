import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { isAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    // Authenticated admin has full operational access
    if (isAdminRequest(req)) {
      return NextResponse.json({ success: true, data: order });
    }

    // Unauthenticated customer access requires phone verification (matching last 4 digits or full phone)
    const { searchParams } = new URL(req.url);
    const phoneInput = (searchParams.get('phone') || '').replace(/\D/g, '');
    const cleanOrderPhone = (order.phone || '').replace(/\D/g, '');

    const isMatch =
      phoneInput.length >= 4 &&
      cleanOrderPhone.length >= 4 &&
      cleanOrderPhone.endsWith(phoneInput);

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Phone verification required to view invoice details',
          requiresPhoneVerification: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
