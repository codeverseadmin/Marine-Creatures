import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { isAdminRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'all'; // 'ready_to_pack', 'packed', 'dispatched', 'delivered'

    const query: Record<string, any> = {};

    if (filter === 'ready_to_pack') {
      query.currentStep = 'quarantine';
    } else if (filter === 'packed') {
      query.currentStep = 'packed';
    } else if (filter === 'dispatched') {
      query.currentStep = 'dispatched';
    } else if (filter === 'delivered') {
      query.currentStep = 'delivered';
    } else {
      query.currentStep = { $in: ['packed', 'dispatched', 'delivered'] };
    }

    const orders = await OrderModel.find(query).sort({ _id: -1 }).lean();

    return NextResponse.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { orderId, awbNumber, courierName, estimatedDelivery, currentStep, dispatchNote } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (awbNumber) order.awbNumber = awbNumber.trim();
    if (courierName) order.courierName = courierName.trim();
    if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery.trim();

    if (currentStep && ['packed', 'dispatched', 'delivered'].includes(currentStep)) {
      order.currentStep = currentStep;

      const nowFormatted = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      order.history.push({
        step: currentStep as any,
        timestamp: nowFormatted,
        note: dispatchNote || `Shipment marked as ${currentStep.toUpperCase()} via ${order.courierName} (AWB: ${order.awbNumber || 'Pending'})`,
      } as any);
    }

    await order.save();

    await recordAuditLog({
      action: 'ORDER_TRACKING_UPDATED',
      entityType: 'order',
      entityId: order.id,
      entityName: `Order ${order.id} Dispatch`,
      summary: `Dispatch info updated for ${order.id}. AWB: ${order.awbNumber}, Carrier: ${order.courierName}, Step: ${order.currentStep}`,
      req,
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
