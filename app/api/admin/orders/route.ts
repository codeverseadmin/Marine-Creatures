import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { CustomerModel } from '@/models/Customer';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';

const VALID_STEPS = ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'] as const;

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'orders.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get('search') || '').trim();
    const step = searchParams.get('step') || 'all';
    const isApproved = searchParams.get('isApproved');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, any> = {};

    if (step !== 'all' && VALID_STEPS.includes(step as any)) {
      query.currentStep = step;
    }

    if (isApproved !== null && isApproved !== undefined && isApproved !== 'all') {
      query.isApproved = isApproved === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { id: searchRegex },
        { customerName: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { awbNumber: searchRegex },
      ];
    }

    const [total, orders, countsByStep] = await Promise.all([
      OrderModel.countDocuments(query),
      OrderModel.find(query).sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.aggregate([
        { $group: { _id: '$currentStep', count: { $sum: 1 } } },
      ]),
    ]);

    const stepBreakdown: Record<string, number> = {
      placed: 0,
      quarantine: 0,
      packed: 0,
      dispatched: 0,
      delivered: 0,
    };
    countsByStep.forEach((c: { _id: string; count: number }) => {
      if (c._id && stepBreakdown[c._id] !== undefined) {
        stepBreakdown[c._id] = c.count;
      }
    });

    return NextResponse.json({
      success: true,
      total,
      limit,
      skip,
      stepBreakdown,
      data: orders,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'orders.update_status');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, currentStep, awbNumber, courierName, estimatedDelivery, orderNotes, isApproved, note } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const order = await OrderModel.findOne({ id });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const updates: Record<string, any> = {};
    const previousStep = order.currentStep;

    // Validate state transition if changing step
    if (currentStep && currentStep !== order.currentStep) {
      if (!VALID_STEPS.includes(currentStep)) {
        return NextResponse.json({ success: false, error: `Invalid step: ${currentStep}` }, { status: 400 });
      }

      const prevIdx = VALID_STEPS.indexOf(order.currentStep as any);
      const nextIdx = VALID_STEPS.indexOf(currentStep);

      // Only allow forward progression or direct previous rollback for administrative correction
      if (Math.abs(nextIdx - prevIdx) > 2) {
        return NextResponse.json(
          { success: false, error: `Invalid state transition from ${order.currentStep} to ${currentStep}. State progression must be linear.` },
          { status: 400 }
        );
      }

      updates.currentStep = currentStep;

      // Add to tracking history
      const nowFormatted = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

      const historyEntry = {
        step: currentStep,
        timestamp: nowFormatted,
        note: note || `Step updated to ${currentStep.toUpperCase()} by administrator`,
      };

      order.history.push(historyEntry as any);
    }

    if (awbNumber !== undefined) updates.awbNumber = typeof awbNumber === 'string' ? awbNumber.trim() : '';
    if (courierName !== undefined) updates.courierName = typeof courierName === 'string' ? courierName.trim() : order.courierName;
    if (estimatedDelivery !== undefined) updates.estimatedDelivery = typeof estimatedDelivery === 'string' ? estimatedDelivery.trim() : order.estimatedDelivery;
    if (orderNotes !== undefined) updates.orderNotes = typeof orderNotes === 'string' ? orderNotes.trim() : order.orderNotes;

    if (typeof isApproved === 'boolean') {
      if (!auth!.isOwner && !auth!.permissions.has('orders.approve')) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Missing permission [orders.approve]' },
          { status: 403 }
        );
      }
      updates.isApproved = isApproved;
      if (isApproved && !order.isApproved) {
        updates.approvedAt = new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        if (!order.invoiceNumber) {
          updates.invoiceNumber = `INV-${order.id}`;
        }
      }
    }

    Object.assign(order, updates);
    await order.save();

    // Upsert / sync customer profile
    if (order.phone) {
      const cleanPhone = order.phone.replace(/\D/g, '');
      await CustomerModel.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $setOnInsert: {
            id: `CUST-${cleanPhone}`,
            firstContactDate: new Date(),
          },
          $set: {
            name: order.customerName,
            city: order.city,
            address: order.address,
            pincode: order.pincode,
            lastActiveDate: new Date(),
          },
          $inc: {
            totalOrdersCount: previousStep ? 0 : 1,
            totalSpend: previousStep ? 0 : order.totalAmount,
          },
        },
        { upsert: true }
      );
    }

    // Record audit log
    await recordAuditLog({
      action: 'ORDER_STATUS_CHANGED',
      entityType: 'order',
      entityId: order.id,
      entityName: `Order ${order.id} (${order.customerName})`,
      summary: `Order ${order.id} updated. Step: ${order.currentStep}, Approved: ${order.isApproved}`,
      details: { previousStep, newStep: order.currentStep, isApproved: order.isApproved, awb: order.awbNumber },
      req,
    });

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
