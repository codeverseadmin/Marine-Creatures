import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'dispatch.read');
  if (errorResponse) return errorResponse;

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
  const { auth, errorResponse } = await requirePermission(req, 'dispatch.update');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      orderId,
      awbNumber,
      awb,
      courierName,
      courier,
      estimatedDelivery,
      eta,
      currentStep,
      step,
      dispatchNote,
      isShippedViaPartner,
      fulfillmentType,
    } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const resolvedAwb = awbNumber !== undefined ? awbNumber : awb;
    const resolvedCourier = courierName !== undefined ? courierName : courier;
    const resolvedEta = estimatedDelivery !== undefined ? estimatedDelivery : eta;
    const resolvedStep = currentStep || (step ? step.toLowerCase() : undefined);

    if (isShippedViaPartner !== undefined) {
      order.isShippedViaPartner = Boolean(isShippedViaPartner);
      order.fulfillmentType = order.isShippedViaPartner ? 'partner_shipment' : 'direct_delivery';
      if (!order.isShippedViaPartner) {
        order.awbNumber = '';
        order.courierName = '';
      }
    } else if (fulfillmentType !== undefined) {
      order.fulfillmentType = fulfillmentType === 'partner_shipment' ? 'partner_shipment' : 'direct_delivery';
      order.isShippedViaPartner = order.fulfillmentType === 'partner_shipment';
      if (!order.isShippedViaPartner) {
        order.awbNumber = '';
        order.courierName = '';
      }
    }

    if (resolvedAwb !== undefined && order.isShippedViaPartner !== false) {
      order.awbNumber = typeof resolvedAwb === 'string' ? resolvedAwb.trim() : '';
    }
    if (resolvedCourier !== undefined && order.isShippedViaPartner !== false) {
      order.courierName = typeof resolvedCourier === 'string' ? resolvedCourier.trim() : order.courierName;
    }
    if (resolvedEta !== undefined) {
      order.estimatedDelivery = typeof resolvedEta === 'string' ? resolvedEta.trim() : order.estimatedDelivery;
    }

    if (resolvedStep && ['packed', 'dispatched', 'delivered'].includes(resolvedStep)) {
      order.currentStep = resolvedStep as any;

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
