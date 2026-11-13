import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { ProductModel } from '@/models/Product';
import { PRODUCTS } from '@/lib/data/products';
import { CustomerModel } from '@/models/Customer';
import { requirePermission, requireAnyPermission, resolveAuthContext } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';
import { generateInvoiceToken } from '@/lib/invoice-token';
import { getClientIp, checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { validateAndCalculateCoupon, recordCouponRedemption } from '@/lib/services/promotion-engine';

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
  // STRICT SECURITY GATE: Bulk order enumeration is strictly restricted to employees with orders.read.
  // Anonymous requests over the public internet are rejected to protect customer PII (phone, address, notes).
  const { auth, errorResponse } = await requirePermission(req, 'orders.read');
  if (errorResponse) return errorResponse;

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
  let idempotencyKey: string | undefined = undefined;
  try {
    const clientIp = getClientIp(req);
    const postRateLimit = await checkRateLimit(`rate:orders:create:ip:${clientIp}`, 20, 600);
    if (!postRateLimit.allowed) {
      return rateLimitResponse(postRateLimit.retryAfter, 'Too many order submissions. Please wait.');
    }

    await connectToDatabase();
    const body = await req.json();
    const auth = await resolveAuthContext(req);
    const isAdmin =
      auth.authenticated &&
      (auth.isOwner ||
        auth.permissions.has('orders.create') ||
        auth.permissions.has('orders.update_status'));

    // 0. Idempotency Gate: if client submits with an idempotencyKey, return existing order
    idempotencyKey =
      typeof body.idempotencyKey === 'string' && body.idempotencyKey.trim().length > 0
        ? body.idempotencyKey.trim().slice(0, 100)
        : typeof body.clientOrderId === 'string' && body.clientOrderId.trim().length > 0
        ? body.clientOrderId.trim().slice(0, 100)
        : undefined;

    if (idempotencyKey) {
      const existingByIdempotency = await OrderModel.findOne({ idempotencyKey }).lean();
      if (existingByIdempotency) {
        const responseData: any = { ...existingByIdempotency };
        delete responseData.invoiceTokenHash;
        return NextResponse.json({ success: true, data: responseData, idempotent: true }, { status: 200 });
      }
    }

    // 1. Order ID Generation & Overwrite Elimination
    // Public requests NEVER trust client-supplied IDs. Server generates an authoritative unique reference.
    // Admin callers may specify an ID, but collision with an existing order is rejected with 409 Conflict.
    let id = '';
    if (isAdmin && typeof body.id === 'string' && body.id.trim().length > 0) {
      const rawId = body.id.trim().slice(0, 50);
      id = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;
      const existing = await OrderModel.findOne({ id }).select('id').lean();
      if (existing) {
        return NextResponse.json(
          { success: false, error: `Order #${id} already exists. Use PATCH to update existing orders.` },
          { status: 409 }
        );
      }
    } else {
      // Server-authoritative ID generation for public storefront orders
      // Format: MC-<timestamp>-<32-character-random-hex> (128 bits of cryptographic randomness)
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        attempts++;
        const tsPart = Date.now().toString();
        const randHex = crypto.randomBytes(16).toString('hex').toUpperCase();
        const candidateId = `MC-${tsPart}-${randHex}`;
        const existing = await OrderModel.findOne({ id: candidateId }).select('id').lean();
        if (!existing) {
          id = candidateId;
          isUnique = true;
        }
      }
      if (!isUnique || !id) {
        return NextResponse.json(
          { success: false, error: 'Could not generate unique order reference. Please retry.' },
          { status: 409 }
        );
      }
    }

    const customerName = typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 200) : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 25) : '';
    const address = typeof body.address === 'string' ? body.address.trim().slice(0, 1000) : '';

    if (!customerName || !phone || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required order fields (customerName, phone, address)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item.' },
        { status: 400 }
      );
    }

    // 2. Authoritative Item & Pricing Validation
    // Resolves every item strictly from the server-side catalogue.
    // Completely ignores client-supplied unit prices, subtotals, and totals.
    const validatedItems: any[] = [];
    for (const rawItem of body.items) {
      const rawItemId = String(rawItem?.id || '').trim();
      if (!rawItemId) {
        return NextResponse.json(
          { success: false, error: 'Item ID is required for all order items.' },
          { status: 400 }
        );
      }

      // Parse variant if present in ID (e.g. "product-id__variant-id") or passed as property
      let baseProductId = rawItemId;
      let variantId = typeof rawItem.variantId === 'string' ? rawItem.variantId.trim() : undefined;
      if (rawItemId.includes('__')) {
        const parts = rawItemId.split('__');
        baseProductId = parts[0];
        variantId = parts[1];
      }

      // Authoritative lookup: MongoDB first, fallback to static PRODUCTS
      let product: any = await ProductModel.findOne({ id: baseProductId.toLowerCase() }).lean();
      if (!product) {
        product = PRODUCTS.find((p) => p.id === baseProductId.toLowerCase());
      }

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product '${baseProductId}' does not exist in the official catalogue.` },
          { status: 400 }
        );
      }

      if (product.inStock === false || product.availabilityStatus === 'OUT OF STOCK') {
        return NextResponse.json(
          { success: false, error: `Product '${product.name}' is currently unavailable.` },
          { status: 400 }
        );
      }

      // Quantity validation: must be integer between 1 and 100
      const rawQuantity = Number(rawItem.quantity);
      if (!Number.isInteger(rawQuantity) || rawQuantity < 1 || rawQuantity > 100) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid quantity for '${product.name}'. Quantity must be an integer between 1 and 100.`,
          },
          { status: 400 }
        );
      }
      const quantity = rawQuantity;

      // Variant resolution
      let authoritativeUnitPrice = product.price;
      let authoritativeItemName = product.name;
      let resolvedItemId = product.id;
      let matchedVariant: any = undefined;

      if (variantId) {
        matchedVariant = product.variants?.find(
          (v: any) =>
            v.id.toLowerCase() === variantId!.toLowerCase() ||
            (v.sku && v.sku.toLowerCase() === variantId!.toLowerCase())
        );

        if (!matchedVariant) {
          return NextResponse.json(
            {
              success: false,
              error: `Variant '${variantId}' does not belong to product '${product.name}'.`,
            },
            { status: 400 }
          );
        }

        if (matchedVariant.inStock === false) {
          return NextResponse.json(
            {
              success: false,
              error: `Variant '${matchedVariant.name}' of '${product.name}' is currently unavailable.`,
            },
            { status: 400 }
          );
        }

        if (matchedVariant.price !== undefined) {
          authoritativeUnitPrice = matchedVariant.price;
        } else if (product.variants && product.variants.some((v: any) => v.price !== undefined)) {
          return NextResponse.json(
            { success: false, error: `Variant '${matchedVariant.name}' of '${product.name}' is missing authoritative pricing.` },
            { status: 400 }
          );
        } else {
          authoritativeUnitPrice = product.price;
        }

        authoritativeItemName = `${product.name} — ${matchedVariant.name}`;
        resolvedItemId = `${product.id}__${matchedVariant.id}`;
      } else if (
        product.variants &&
        product.variants.length > 0 &&
        (product.price === 0 || product.variants.some((v: any) => v.price !== undefined)) &&
        !product.priceOnRequest
      ) {
        // Multi-variant product with variant-specific pricing requires variant selection — NEVER silently fall back!
        return NextResponse.json(
          { success: false, error: `Please select a specific variant for '${product.name}'.` },
          { status: 400 }
        );
      }

      // Price on Request (POR) vs Standard Pricing
      const isPor = Boolean(product.priceOnRequest || authoritativeUnitPrice === 0);
      let finalPrice = 0;
      let finalPricingStatus = 'STANDARD';
      let finalPriceOnRequest = false;
      let agreedUnitPrice: number | undefined = undefined;

      if (isPor) {
        finalPriceOnRequest = true;
        if (isAdmin && typeof rawItem.agreedUnitPrice === 'number' && rawItem.agreedUnitPrice > 0) {
          finalPrice = rawItem.agreedUnitPrice;
          finalPricingStatus = 'AGREED';
          agreedUnitPrice = rawItem.agreedUnitPrice;
        } else {
          // Public customers cannot invent agreed pricing; must be PENDING_POR with 0
          finalPrice = 0;
          finalPricingStatus = 'PENDING_POR';
        }
      } else {
        // Authoritative standard price — strictly ignores any client price!
        finalPrice = authoritativeUnitPrice;
        finalPricingStatus = 'STANDARD';
        finalPriceOnRequest = false;
      }

      // Authoritative Warranty Snapshot (MC-FEATURE-PRODUCT-WARRANTY-V1)
      // Variant-level override takes precedence if explicitly configured; otherwise inherit product-level warranty
      const itemWarrantySetting = (matchedVariant && matchedVariant.warranty && typeof matchedVariant.warranty.enabled === 'boolean')
        ? matchedVariant.warranty
        : product.warranty;

      const hasWarranty = Boolean(itemWarrantySetting && itemWarrantySetting.enabled);
      const warrantySnapshot = hasWarranty
        ? {
            hasWarranty: true,
            provider: itemWarrantySetting.provider || 'manufacturer',
            durationValue: typeof itemWarrantySetting.durationValue === 'number' ? itemWarrantySetting.durationValue : 1,
            durationUnit: itemWarrantySetting.durationUnit || 'years',
            terms: typeof itemWarrantySetting.terms === 'string' ? itemWarrantySetting.terms : '',
          }
        : {
            hasWarranty: false,
          };

      validatedItems.push({
        id: resolvedItemId,
        name: authoritativeItemName,
        price: finalPrice,
        quantity,
        image:
          product.images && product.images.length > 0
            ? product.images[0]
            : typeof rawItem.image === 'string'
            ? rawItem.image.slice(0, 1000)
            : undefined,
        category: product.category,
        priceOnRequest: finalPriceOnRequest,
        agreedUnitPrice,
        pricingStatus: finalPricingStatus,
        warranty: warrantySnapshot,
      });
    }

    // Authoritative subtotal calculation — completely ignores client subtotal & totalAmount
    const subtotal = validatedItems.reduce((sum: number, it: any) => sum + it.price * it.quantity, 0);
    let totalAmount = subtotal;
    let couponSnapshot: any = undefined;

    // Optional Promotional Coupon Application
    const couponCode = typeof body.couponCode === 'string' ? body.couponCode.trim() : undefined;
    if (couponCode) {
      const couponValidation = await validateAndCalculateCoupon(couponCode, validatedItems, phone);
      if (!couponValidation.valid || !couponValidation.coupon) {
        return NextResponse.json(
          { success: false, error: couponValidation.error || 'Invalid coupon code.' },
          { status: 400 }
        );
      }

      const validatedCoupon = couponValidation.coupon;
      totalAmount = Math.max(0, subtotal - validatedCoupon.discountAmount);
      couponSnapshot = {
        couponId: validatedCoupon.id,
        code: validatedCoupon.code,
        discountType: validatedCoupon.discountType,
        discountValue: validatedCoupon.discountValue,
        discountAmount: validatedCoupon.discountAmount,
        eligibleSubtotal: validatedCoupon.eligibleSubtotal,
        appliedAt: new Date().toISOString(),
        description: validatedCoupon.description || '',
      };
    }

    const hasUnresolvedPorItems = validatedItems.some(
      (i: any) => i.priceOnRequest || i.pricingStatus === 'PENDING_POR' || (i.price === 0 && (!i.agreedUnitPrice || i.agreedUnitPrice <= 0))
    );

    const city = typeof body.city === 'string' && body.city.trim() ? body.city.trim().slice(0, 100) : 'Destination City';
    const pincode = typeof body.pincode === 'string' && body.pincode.trim() ? body.pincode.trim().slice(0, 20) : '700001';
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

    // Only authenticated admins can create pre-approved or progressed orders; public orders are strictly unapproved and 'placed'
    const currentStep =
      isAdmin && typeof body.currentStep === 'string' && VALID_STEPS.includes(body.currentStep as any)
        ? body.currentStep
        : 'placed';

    const isApproved = isAdmin ? Boolean(body.isApproved ?? false) : false;
    const approvedAt = isAdmin && typeof body.approvedAt === 'string' ? body.approvedAt : undefined;

    // Fulfillment & tracking metadata strictly server-controlled
    const courierName =
      isAdmin && typeof body.courierName === 'string'
        ? body.courierName.slice(0, 100)
        : 'Priority Air Cargo Express';

    const estimatedDelivery =
      isAdmin && typeof body.estimatedDelivery === 'string'
        ? body.estimatedDelivery.slice(0, 100)
        : 'Within 24-48 Hours';

    const awbNumber = isAdmin && typeof body.awbNumber === 'string' ? body.awbNumber.trim().slice(0, 100) : undefined;

    const invoiceNumber =
      isAdmin && typeof body.invoiceNumber === 'string' ? body.invoiceNumber.trim().slice(0, 100) : undefined;

    // Fresh Invoice Token generation (strictly withheld if order contains unresolved POR items)
    let issuedToken: string | undefined = undefined;
    let tokenHashToSave: string | undefined = undefined;
    let tokenCreatedAtToSave: Date | undefined = undefined;
    let tokenExpiresAtToSave: Date | undefined = undefined;

    if (!hasUnresolvedPorItems) {
      const tokenData = generateInvoiceToken();
      issuedToken = tokenData.rawToken;
      tokenHashToSave = tokenData.tokenHash;
      tokenCreatedAtToSave = tokenData.createdAt;
      tokenExpiresAtToSave = tokenData.expiresAt;
    }

    const initialInvoiceNumber = hasUnresolvedPorItems ? undefined : invoiceNumber;

    // Explicit server-controlled order payload — ZERO client-payload spreading
    const orderPayload = {
      id,
      customerName,
      phone,
      address,
      city,
      pincode,
      orderNotes,
      items: validatedItems,
      subtotal,
      totalAmount,
      coupon: couponSnapshot,
      currentStep,
      hasUnresolvedPorItems,
      awbNumber,
      courierName,
      estimatedDelivery,
      history,
      isApproved,
      approvedAt,
      invoiceNumber: initialInvoiceNumber,
      invoiceTokenHash: tokenHashToSave,
      invoiceTokenCreatedAt: tokenCreatedAtToSave,
      invoiceTokenExpiresAt: tokenExpiresAtToSave,
      idempotencyKey,
      createdAt,
    };

    // Create order using OrderModel.create — NEVER upsert or overwrite
    // Safe retry on duplicate-key (E11000) collision (up to 3 insertion attempts)
    let createdOrderDoc: any = null;
    let insertAttempts = 0;
    while (!createdOrderDoc && insertAttempts < 3) {
      insertAttempts++;
      try {
        orderPayload.id = id;
        if (!hasUnresolvedPorItems && !orderPayload.invoiceNumber) {
          orderPayload.invoiceNumber = `INV-${id}`;
        }
        const [doc] = await OrderModel.create([orderPayload]);
        createdOrderDoc = doc;
      } catch (err: any) {
        if (idempotencyKey && (err?.keyPattern?.idempotencyKey || err?.message?.includes('idempotencyKey'))) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          const existing = await OrderModel.findOne({ idempotencyKey }).lean();
          if (existing) {
            const responseData: any = { ...existing };
            delete responseData.invoiceTokenHash;
            return NextResponse.json({ success: true, data: responseData, idempotent: true }, { status: 200 });
          }
        }
        if (err?.code === 11000 && !isAdmin && insertAttempts < 3) {
          console.warn(`[OrderCreation] Duplicate key collision on ${id}, regenerating with fresh 128-bit entropy...`);
          id = `MC-${Date.now()}-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
          continue;
        }
        throw err;
      }
    }

    if (!createdOrderDoc) {
      return NextResponse.json(
        { success: false, error: 'Failed to create order after collision retries. Please try again.' },
        { status: 409 }
      );
    }

    // Atomic Coupon Redemption Commitment
    if (couponSnapshot) {
      const redemptionResult = await recordCouponRedemption({
        couponId: couponSnapshot.couponId,
        couponCode: couponSnapshot.code,
        orderId: id,
        customerPhone: phone,
        customerName,
        discountAmount: couponSnapshot.discountAmount,
        eligibleSubtotal: couponSnapshot.eligibleSubtotal,
        orderTotal: totalAmount,
      });

      if (!redemptionResult.success) {
        // Rollback created order to strictly prevent limit bypass or orphaned discount
        await OrderModel.deleteOne({ id });
        return NextResponse.json(
          { success: false, error: redemptionResult.error || 'Coupon usage limit was reached during checkout.' },
          { status: 409 }
        );
      }

      // Record audit log for authoritative coupon redemption
      await recordAuditLog({
        action: 'COUPON_REDEEMED',
        entityType: 'coupon',
        entityId: couponSnapshot.couponId,
        entityName: couponSnapshot.code,
        summary: `Coupon ${couponSnapshot.code} redeemed for Order #${id} (Savings: ₹${couponSnapshot.discountAmount})`,
        details: {
          orderId: id,
          customerPhone: phone.replace(/\D/g, ''),
          discountAmount: couponSnapshot.discountAmount,
          orderTotal: totalAmount,
        },
        req,
      });
    }

    const newOrder = createdOrderDoc.toObject();

    // Prepare response: Never expose invoiceTokenHash to clients
    const responseData: any = { ...newOrder };
    delete responseData.invoiceTokenHash;
    if (hasUnresolvedPorItems) {
      responseData.invoiceToken = null;
      responseData.invoiceUrl = null;
      responseData.requiresPorPricing = true;
    } else {
      responseData.invoiceToken = issuedToken;
      responseData.invoiceUrl = `/invoice/${id}?token=${issuedToken}`;
    }

    // Upsert customer record in CustomerModel for Customer 360 visibility
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone) {
      await CustomerModel.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $setOnInsert: {
            id: `CUST-${cleanPhone}`,
            firstContactDate: new Date(),
          },
          $set: {
            name: customerName,
            city,
            address,
            pincode,
            lastActiveDate: new Date(),
          },
          $inc: {
            totalOrdersCount: 1,
            totalSpend: totalAmount,
          },
        },
        { upsert: true }
      ).catch((err: any) => console.warn('[OrderCreation] Failed to upsert customer:', err));
    }

    return NextResponse.json({ success: true, data: responseData }, { status: 201 });
  } catch (error: any) {
    if (idempotencyKey && (error?.keyPattern?.idempotencyKey || error?.message?.includes('idempotencyKey'))) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const existing = await OrderModel.findOne({ idempotencyKey }).lean();
      if (existing) {
        const responseData: any = { ...existing };
        delete responseData.invoiceTokenHash;
        return NextResponse.json({ success: true, data: responseData, idempotent: true }, { status: 200 });
      }
    }
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Order reference collision occurred. Please retry.' },
        { status: 409 }
      );
    }
    console.error('Failed to create order in MongoDB:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // Protected — requires orders.update_status, orders.approve, or orders.tracking.update
  const { auth, errorResponse } = await requireAnyPermission(req, [
    'orders.update_status',
    'orders.approve',
    'orders.tracking.update',
  ]);
  if (errorResponse) return errorResponse;

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

    // ── Synthetic QA Fixture Interceptor (Zero DB Mutation, Development only) ─
    const allowFixtures = process.env.NODE_ENV !== 'production' && process.env.ALLOW_QA_FIXTURES === 'true';
    if (
      allowFixtures &&
      (orderId === 'MC-QA-ISOLATED-STANDARD' ||
        orderId === 'MC-QA-ISOLATED-MULTIPAGE' ||
        orderId === 'MC-QA-POR-FIXTURE' ||
        orderId === 'MC-QA-POR-RESOLVED-FIXTURE' ||
        orderId === 'MC-QA-FINANCIAL-RECON' ||
        orderId === 'MC-QA-FINANCIAL-RECON-RESOLVED')
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
        const hasUnresolved = Boolean(
          order.hasUnresolvedPorItems ||
          (Array.isArray(order.items) && order.items.some((it: any) =>
            (it.pricingStatus === 'PENDING_POR' || it.priceOnRequest || it.price === 0) &&
            (!it.agreedUnitPrice || it.agreedUnitPrice <= 0)
          ))
        );
        if (!hasUnresolved && !order.invoiceNumber) {
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
  // Protected — strictly requires orders.delete permission
  const { auth, errorResponse } = await requirePermission(req, 'orders.delete');
  if (errorResponse) return errorResponse;

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
