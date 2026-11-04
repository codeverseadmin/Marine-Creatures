import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'quarantine.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') || 'active'; // 'active', 'all', 'ready'

    const query: Record<string, any> = {};

    if (filter === 'active') {
      query.currentStep = { $in: ['placed', 'quarantine'] };
    } else if (filter === 'ready') {
      query.currentStep = 'packed';
    }

    // Find orders with items in quarantine
    const orders = await OrderModel.find(query).sort({ _id: -1 }).lean();

    // Map into quarantine operational entries
    const quarantineBatches = orders.map((order) => {
      const marineItems = order.items.filter(
        (i) => i.category === 'marine-life' || i.name.toLowerCase().includes('tang') || i.name.toLowerCase().includes('clownfish') || i.name.toLowerCase().includes('angel')
      );

      const quarantineLog = order.history?.find((h) => h.step === 'quarantine');

      return {
        orderId: order.id,
        customerName: order.customerName,
        city: order.city,
        currentStep: order.currentStep,
        specimensCount: marineItems.length || order.items.length,
        specimens: marineItems.length > 0 ? marineItems : order.items,
        quarantineStarted: quarantineLog?.timestamp || order.createdAt,
        quarantineNotes: quarantineLog?.note || 'Standard prophylactic quarantine & salinity equilibration in progress',
        isApproved: order.isApproved,
        readyToPack: order.currentStep === 'quarantine' || order.currentStep === 'packed',
      };
    });

    return NextResponse.json({
      success: true,
      count: quarantineBatches.length,
      data: quarantineBatches,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'quarantine.update');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { orderId, action, note } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'Order ID required' }, { status: 400 });
    }

    const order = await OrderModel.findOne({ id: orderId });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const nowFormatted = new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (action === 'start_quarantine') {
      order.currentStep = 'quarantine';
      order.history.push({
        step: 'quarantine',
        timestamp: nowFormatted,
        note: note || 'Specimen prophylactic dip and salinity matching initiated in dedicated quarantine tank',
      } as any);
    } else if (action === 'pass_quarantine' || action === 'PASS') {
      order.currentStep = 'packed';
      order.history.push({
        step: 'packed',
        timestamp: nowFormatted,
        note: note || 'Quarantine health check passed. Specimen certified clean and transferred to thermal shipping pod',
      } as any);
    } else if (action === 'EXTEND') {
      order.history.push({
        step: 'quarantine',
        timestamp: nowFormatted,
        note: note || 'Quarantine extended by 7 days for observation stability',
      } as any);
    } else if (note) {
      order.history.push({
        step: order.currentStep as any,
        timestamp: nowFormatted,
        note: `Quarantine Log: ${note}`,
      } as any);
    }

    await order.save();

    await recordAuditLog({
      action: 'ORDER_STATUS_CHANGED',
      entityType: 'order',
      entityId: order.id,
      entityName: `Order ${order.id} Quarantine`,
      summary: `Quarantine action '${action}' recorded for order ${order.id}`,
      details: { action, note, newStep: order.currentStep },
      req,
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
