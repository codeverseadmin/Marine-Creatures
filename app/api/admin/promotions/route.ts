import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { CouponModel, DiscountType, CouponStatus, CustomerEligibility } from '@/models/Coupon';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';
import { normalizeCouponCode } from '@/lib/services/promotion-engine';

export const dynamic = 'force-dynamic';

const VALID_STATUSES: CouponStatus[] = [
  'draft',
  'active',
  'paused',
  'expired',
  'exhausted',
  'deactivated',
];

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'promotions.view');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status')?.toLowerCase();
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, any> = {};

    if (status && status !== 'all' && VALID_STATUSES.includes(status as CouponStatus)) {
      query.status = status;
    }

    if (search) {
      const sanitized = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [{ code: searchRegex }, { description: searchRegex }, { id: searchRegex }];
    }

    const [total, coupons] = await Promise.all([
      CouponModel.countDocuments(query),
      CouponModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return NextResponse.json({
      success: true,
      total,
      limit,
      skip,
      data: coupons,
    });
  } catch (error: any) {
    console.error('[AdminPromotions GET] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'promotions.create');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();

    const rawCode = body.code;
    const code = normalizeCouponCode(rawCode);

    if (!code || code.length < 3 || code.length > 30) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coupon code must be between 3 and 30 characters long.',
        },
        { status: 400 }
      );
    }

    if (!/^[A-Z0-9_-]+$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coupon code must only contain letters, numbers, hyphens, and underscores.',
        },
        { status: 400 }
      );
    }

    // Check code uniqueness
    const existing = await CouponModel.findOne({ code }).lean();
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Coupon code '${code}' already exists.` },
        { status: 409 }
      );
    }

    const discountType: DiscountType = body.discountType;
    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Discount type must be either 'percentage' or 'fixed'.",
        },
        { status: 400 }
      );
    }

    const discountValue = Number(body.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Discount value must be a positive number.' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && (discountValue < 1 || discountValue > 100)) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount must be between 1 and 100.' },
        { status: 400 }
      );
    }

    let maxDiscount: number | undefined = undefined;
    if (discountType === 'percentage' && body.maxDiscount !== undefined && body.maxDiscount !== null) {
      const parsedMax = Number(body.maxDiscount);
      if (!isNaN(parsedMax) && parsedMax > 0) {
        maxDiscount = Math.round(parsedMax);
      }
    }

    const minSubtotal = Math.max(0, Number(body.minSubtotal) || 0);

    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid start date provided.' },
        { status: 400 }
      );
    }

    if (!body.expiryDate) {
      return NextResponse.json(
        { success: false, error: 'Expiry date is required.' },
        { status: 400 }
      );
    }

    const expiryDate = new Date(body.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid expiry date provided.' },
        { status: 400 }
      );
    }

    if (expiryDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'Expiry date must be after start date.' },
        { status: 400 }
      );
    }

    const requestedStatus = (body.status || 'draft').toLowerCase();
    const status: CouponStatus = ['draft', 'active', 'paused'].includes(requestedStatus)
      ? (requestedStatus as CouponStatus)
      : 'draft';

    let totalUsageLimit: number | undefined = undefined;
    if (body.totalUsageLimit !== undefined && body.totalUsageLimit !== null && body.totalUsageLimit !== '') {
      const parsedLimit = Number(body.totalUsageLimit);
      if (Number.isInteger(parsedLimit) && parsedLimit >= 1) {
        totalUsageLimit = parsedLimit;
      }
    }

    let perCustomerUsageLimit: number | undefined = 1;
    if (
      body.perCustomerUsageLimit !== undefined &&
      body.perCustomerUsageLimit !== null &&
      body.perCustomerUsageLimit !== ''
    ) {
      const parsedPerCust = Number(body.perCustomerUsageLimit);
      if (Number.isInteger(parsedPerCust) && parsedPerCust >= 1) {
        perCustomerUsageLimit = parsedPerCust;
      }
    }

    const customerEligibility: CustomerEligibility = ['all', 'first_order', 'existing'].includes(
      body.customerEligibility
    )
      ? body.customerEligibility
      : 'all';

    const productRestrictions = {
      includedProductIds: Array.isArray(body.productRestrictions?.includedProductIds)
        ? body.productRestrictions.includedProductIds.map((s: any) => String(s).trim())
        : [],
      includedCategories: Array.isArray(body.productRestrictions?.includedCategories)
        ? body.productRestrictions.includedCategories.map((s: any) => String(s).trim())
        : [],
      includedBrands: Array.isArray(body.productRestrictions?.includedBrands)
        ? body.productRestrictions.includedBrands.map((s: any) => String(s).trim())
        : [],
      excludedProductIds: Array.isArray(body.productRestrictions?.excludedProductIds)
        ? body.productRestrictions.excludedProductIds.map((s: any) => String(s).trim())
        : [],
      excludedCategories: Array.isArray(body.productRestrictions?.excludedCategories)
        ? body.productRestrictions.excludedCategories.map((s: any) => String(s).trim())
        : [],
    };

    const id = `CPN-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
    const internalNotes = typeof body.internalNotes === 'string' ? body.internalNotes.trim().slice(0, 2000) : '';

    const newCoupon = await CouponModel.create({
      id,
      code,
      description,
      discountType,
      discountValue,
      maxDiscount,
      minSubtotal,
      startDate,
      expiryDate,
      status,
      totalUsageLimit,
      perCustomerUsageLimit,
      customerEligibility,
      productRestrictions,
      internalNotes,
      createdBy: auth.actorEmail || 'admin',
    });

    await recordAuditLog({
      action: 'COUPON_CREATED',
      entityType: 'coupon',
      entityId: id,
      entityName: code,
      summary: `Created ${discountType} coupon ${code} (Value: ${discountValue}${discountType === 'percentage' ? '%' : ' INR'})`,
      details: {
        code,
        discountType,
        discountValue,
        maxDiscount,
        minSubtotal,
        status,
        customerEligibility,
      },
      req,
    });

    return NextResponse.json({ success: true, data: newCoupon }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'A coupon with this code already exists.' },
        { status: 409 }
      );
    }
    console.error('[AdminPromotions POST] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
