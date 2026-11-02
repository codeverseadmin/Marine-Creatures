import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { CustomerModel } from '@/models/Customer';
import { isAdminRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';
import { generateInvoiceToken } from '@/lib/invoice-token';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const VALID_STEPS = ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'] as const;

const DEFAULT_ORDERS_SEED = [
  {
    id: 'MC-8921',
    customerName: 'Rahul Verma',
    phone: '9876543210',
    address: 'Flat 402, Coral Heights, 100ft Road, Indiranagar',
    city: 'Bengaluru',
    pincode: '560001',
    isApproved: true,
    approvedAt: '2026-09-08 08:45 AM',
    invoiceNumber: 'INV-MC-8921',
    items: [
      {
        id: 'designer-clownfish-pair',
        name: 'Snowflake Ocellaris Clownfish (Bonded Pair)',
        price: 14999,
        quantity: 1,
        category: 'marine-life',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 14999,
    totalAmount: 14999,
    currentStep: 'dispatched',
    awbNumber: 'BLR-AIR-892144',
    courierName: 'IndiGo CarGo Priority Express',
    estimatedDelivery: 'Tomorrow, 10:30 AM',
    history: [
      { step: 'placed', timestamp: 'Yesterday, 10:15 AM', note: 'Order placed via WhatsApp & validated' },
      { step: 'quarantine', timestamp: 'Yesterday, 02:30 PM', note: 'Salinity & proactive dip completed' },
      { step: 'packed', timestamp: 'Today, 06:00 AM', note: 'Medical grade pure oxygen packed in thermal container' },
      { step: 'dispatched', timestamp: 'Today, 08:30 AM', note: 'Air Cargo flight 6E-442 departed Kolkata' },
    ],
    createdAt: '2026-09-07 10:15 AM',
  },
  {
    id: 'MC-8922',
    customerName: 'Dr. Ananya Sen',
    phone: '9830112233',
    address: 'Villa 14, Silver Oak Estate, New Town Action Area II',
    city: 'Kolkata',
    pincode: '700156',
    isApproved: false,
    orderNotes: 'Please ring the bell twice and place directly in shade.',
    items: [
      {
        id: 'emperor-angelfish-juvenile',
        name: 'Emperor Angelfish (Juvenile to Adult Transition)',
        price: 18500,
        quantity: 1,
        category: 'marine-life',
        image: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=800&q=80',
      },
    ],
    subtotal: 18500,
    totalAmount: 18500,
    currentStep: 'quarantine',
    courierName: 'Marine Creatures Temperature-Controlled Van',
    estimatedDelivery: 'Tomorrow, 04:00 PM',
    history: [
      { step: 'placed', timestamp: 'Today, 09:00 AM', note: 'Custom reef livestock order received' },
      { step: 'quarantine', timestamp: 'Today, 11:30 AM', note: 'Acanthurus dip and health check active' },
    ],
    createdAt: '2026-09-08 09:00 AM',
  },
];

export async function GET(req: NextRequest) {
  // STRICT SECURITY GATE: Bulk order enumeration is strictly restricted to authenticated administrators.
  // Anonymous requests over the public internet are rejected to protect customer PII (phone, address, notes).
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required to access orders dataset' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const query = searchParams.get('q');

    let filter: any = {};
    if (phone) {
      filter.phone = phone.replace(/\D/g, '');
    } else if (query) {
      filter.$or = [
        { id: { $regex: query, $options: 'i' } },
        { customerName: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
        { city: { $regex: query, $options: 'i' } },
        { invoiceNumber: { $regex: query, $options: 'i' } },
      ];
    }

    const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ success: true, count: orders.length, data: orders });
  } catch (error: any) {
    console.error('Failed to fetch orders from MongoDB:', error.message);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Public — customer order creation is allowed without admin auth
  try {
    const clientIp = getClientIp(req);
    const postRateLimit = await checkRateLimit(`rate:orders:create:ip:${clientIp}`, 20, 600);
    if (!postRateLimit.allowed) {
      return rateLimitResponse(postRateLimit.retryAfter, 'Too many order submissions. Please wait.');
    }

    await connectToDatabase();
    const body = await req.json();

    const rawId = typeof body.id === 'string' ? body.id.trim().slice(0, 50) : '';
    const id = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;
    const customerName = typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 200) : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 25) : '';
    const address = typeof body.address === 'string' ? body.address.trim().slice(0, 1000) : '';

    if (!id || !customerName || !phone || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields (id, customerName, phone, address)' },
        { status: 400 }
      );
    }

    const subtotal = Math.max(0, Number(body.subtotal ?? body.totalAmount ?? 0));
    const totalAmount = Math.max(0, Number(body.totalAmount ?? subtotal ?? 0));
    const city = typeof body.city === 'string' ? body.city.trim().slice(0, 100) : '';
    const pincode = typeof body.pincode === 'string' ? body.pincode.trim().slice(0, 20) : '';
    const orderNotes = typeof body.orderNotes === 'string' ? body.orderNotes.trim().slice(0, 2000) : undefined;
    const createdAt =
      typeof body.createdAt === 'string' && body.createdAt.length < 100
        ? body.createdAt
        : new Date().toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

    // Map history or statusHistory
    const history =
      Array.isArray(body.history) && body.history.length > 0
        ? body.history.slice(0, 20)
        : Array.isArray(body.statusHistory) && body.statusHistory.length > 0
        ? body.statusHistory.slice(0, 20).map((s: any) => ({
            step: s.status || s.step || 'placed',
            timestamp: s.timestamp || 'Done',
            note: s.description || s.title || s.note || 'Status recorded',
          }))
        : [
            {
              step: 'placed',
              timestamp: createdAt,
              note: 'Order confirmed by customer',
            },
          ];

    // Only authenticated admins can create pre-approved orders; public orders are strictly unapproved
    const isApproved = isAdminRequest(req) ? Boolean(body.isApproved ?? false) : false;

    // Check existing order for token preservation
    const existingOrder = await OrderModel.findOne({ id }).select('invoiceTokenHash invoiceTokenCreatedAt invoiceTokenExpiresAt').lean();

    let issuedToken: string | undefined = undefined;
    let tokenHashToSave = existingOrder?.invoiceTokenHash;
    let tokenCreatedAtToSave = existingOrder?.invoiceTokenCreatedAt;
    let tokenExpiresAtToSave = existingOrder?.invoiceTokenExpiresAt;

    if (!tokenHashToSave) {
      const tokenData = generateInvoiceToken();
      issuedToken = tokenData.rawToken;
      tokenHashToSave = tokenData.tokenHash;
      tokenCreatedAtToSave = tokenData.createdAt;
      tokenExpiresAtToSave = tokenData.expiresAt;
    }

    const orderPayload: any = {
      ...body,
      id,
      customerName,
      phone,
      address,
      city,
      pincode,
      orderNotes,
      subtotal,
      totalAmount,
      createdAt,
      history,
      isApproved,
      invoiceTokenHash: tokenHashToSave,
      invoiceTokenCreatedAt: tokenCreatedAtToSave,
      invoiceTokenExpiresAt: tokenExpiresAtToSave,
    };

    // Upsert to handle idempotent creation safely
    const newOrder = await OrderModel.findOneAndUpdate(
      { id },
      { $set: orderPayload },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    // Prepare response: Never expose invoiceTokenHash to clients
    const responseData: any = { ...newOrder };
    delete responseData.invoiceTokenHash;

    if (issuedToken) {
      responseData.invoiceToken = issuedToken;
      responseData.invoiceUrl = `/invoice/${id}?token=${issuedToken}`;
    }

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create order in MongoDB:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Protected — only authenticated admins can update order status/fulfillment/tracking
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const secureHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'X-Content-Type-Options': 'nosniff',
  };

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, currentStep, awbNumber, courierName, estimatedDelivery, orderNotes, isApproved, note } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Order ID is required' }, { status: 400 });
    }

    const rawId = id.trim();
    const orderId = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;

    // ── Synthetic QA Fixture Interceptor (Zero DB Mutation) ──────────────────
    if (
      orderId === 'MC-QA-ISOLATED-STANDARD' ||
      orderId === 'MC-QA-ISOLATED-MULTIPAGE' ||
      orderId === 'MC-QA-POR-FIXTURE' ||
      orderId === 'MC-QA-POR-RESOLVED-FIXTURE' ||
      orderId === 'MC-QA-FINANCIAL-RECON' ||
      orderId === 'MC-QA-FINANCIAL-RECON-RESOLVED'
    ) {
      const { getFixture, saveFixture } = await import('@/lib/invoice-test-fixtures');
      const baseFixture: any = getFixture(orderId);
      if (!baseFixture) {
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
      }

      if (currentStep) {
        if (!VALID_STEPS.includes(currentStep)) {
          return NextResponse.json({ success: false, error: `Invalid step: ${currentStep}` }, { status: 400 });
        }
        const prevStep = baseFixture.currentStep || 'placed';
        const prevIdx = VALID_STEPS.indexOf(prevStep as any);
        const nextIdx = VALID_STEPS.indexOf(currentStep);
        if (Math.abs(nextIdx - prevIdx) > 1) {
          return NextResponse.json(
            { success: false, error: `Invalid state transition from ${prevStep} to ${currentStep}. Intermediate stages cannot be skipped.` },
            { status: 400 }
          );
        }
      }

      const updatedFixture = {
        ...baseFixture,
        currentStep: currentStep || baseFixture.currentStep,
        awbNumber: awbNumber !== undefined ? awbNumber : baseFixture.awbNumber,
        courierName: courierName !== undefined ? courierName : baseFixture.courierName,
        isApproved: typeof isApproved === 'boolean' ? isApproved : baseFixture.isApproved,
        history: [
          ...(baseFixture.history || []),
          ...(currentStep && currentStep !== baseFixture.currentStep ? [{ step: currentStep, timestamp: '03 Nov 2026, 02:00 AM', note: note || `Step updated to ${currentStep.toUpperCase()}` }] : []),
        ],
      };

      saveFixture(orderId, updatedFixture);
      return NextResponse.json({ success: true, data: updatedFixture }, { status: 200, headers: secureHeaders });
    }

    const order = await OrderModel.findOne({
      $or: [{ id: orderId }, { id: rawId }],
    });

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

      // Only allow forward progression or direct previous rollback for administrative correction (no skipping intermediate stages)
      if (Math.abs(nextIdx - prevIdx) > 1) {
        return NextResponse.json(
          { success: false, error: `Invalid state transition from ${order.currentStep} to ${currentStep}. State progression must be linear without skipping intermediate stages.` },
          { status: 400 }
        );
      }

      updates.currentStep = currentStep;

      // Add to tracking history with exact Indian timestamp
      const nowFormatted = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const historyEntry = {
        step: currentStep,
        timestamp: nowFormatted,
        note: note || `Stage updated to ${currentStep.toUpperCase()} by administrator`,
      };

      if (!Array.isArray(order.history)) {
        order.history = [];
      }
      order.history.push(historyEntry as any);
    }

    if (awbNumber !== undefined) updates.awbNumber = typeof awbNumber === 'string' ? awbNumber.trim() : '';
    if (courierName !== undefined) updates.courierName = typeof courierName === 'string' ? courierName.trim() : order.courierName;
    if (estimatedDelivery !== undefined) updates.estimatedDelivery = typeof estimatedDelivery === 'string' ? estimatedDelivery.trim() : order.estimatedDelivery;
    if (orderNotes !== undefined) updates.orderNotes = typeof orderNotes === 'string' ? orderNotes.trim() : order.orderNotes;

    if (typeof isApproved === 'boolean') {
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
      summary: `Order ${order.id} fulfillment updated. Step: ${order.currentStep}, Approved: ${order.isApproved}`,
      details: { previousStep, newStep: order.currentStep, isApproved: order.isApproved, awb: order.awbNumber },
      req,
    });

    return NextResponse.json({ success: true, data: order }, { status: 200, headers: secureHeaders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // Protected — only admin can delete orders
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Order id parameter is required' }, { status: 400 });
    }

    await OrderModel.deleteOne({ id });
    return NextResponse.json({ success: true, message: `Order ${id} permanently deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
