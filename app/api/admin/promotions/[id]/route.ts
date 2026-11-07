import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { CouponModel, CouponStatus, DiscountType, CustomerEligibility } from '@/models/Coupon';
import { CouponRedemptionModel } from '@/models/CouponRedemption';
import { requirePermission, requireAnyPermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';
import { normalizeCouponCode } from '@/lib/services/promotion-engine';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'promotions.view');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const targetId = resolvedParams.id;

    const orQueries: any[] = [{ id: targetId }, { code: normalizeCouponCode(targetId) }];
    if (mongoose.isValidObjectId(targetId)) {
      orQueries.push({ _id: targetId });
    }

    const coupon = await CouponModel.findOne({ $or: orQueries }).lean();
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    const redemptions = await CouponRedemptionModel.find({
      $or: [{ couponId: (coupon as any)._id.toString() }, { couponCode: coupon.code }],
    })
      .sort({ redeemedAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...coupon,
        redemptions,
      },
    });
  } catch (error: any) {
    console.error('[AdminPromotion ID GET] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const targetId = resolvedParams.id;
    const body = await req.json();

    const orQueries: any[] = [{ id: targetId }, { code: normalizeCouponCode(targetId) }];
    if (mongoose.isValidObjectId(targetId)) {
      orQueries.push({ _id: targetId });
    }

    const existingCoupon = await CouponModel.findOne({ $or: orQueries });
    if (!existingCoupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    // Determine required permission based on payload
    const isStatusChange = body.status && body.status !== existingCoupon.status;
    let requiredPerm = 'promotions.update';

    if (isStatusChange) {
      if (body.status === 'active') {
        requiredPerm = 'promotions.activate';
      } else if (body.status === 'paused' || body.status === 'deactivated') {
        requiredPerm = 'promotions.deactivate';
      }
    }

    const { auth, errorResponse } = await requirePermission(req, requiredPerm);
    if (errorResponse) return errorResponse;

    const updates: Record<string, any> = {};
    const beforeState: Record<string, any> = {};

    // 1. Code update
    if (body.code !== undefined) {
      const newCode = normalizeCouponCode(body.code);
      if (newCode !== existingCoupon.code) {
        if (!newCode || newCode.length < 3 || newCode.length > 30 || !/^[A-Z0-9_-]+$/.test(newCode)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Coupon code must be 3-30 characters alphanumeric (with hyphens/underscores).',
            },
            { status: 400 }
          );
        }
        const duplicate = await CouponModel.findOne({
          code: newCode,
          _id: { $ne: existingCoupon._id },
        }).lean();
        if (duplicate) {
          return NextResponse.json(
            { success: false, error: `Coupon code '${newCode}' is already in use.` },
            { status: 409 }
          );
        }
        beforeState.code = existingCoupon.code;
        updates.code = newCode;
      }
    }

    // 2. Status update
    if (body.status !== undefined && body.status !== existingCoupon.status) {
      const validStatuses: CouponStatus[] = [
        'draft',
        'active',
        'paused',
        'expired',
        'exhausted',
        'deactivated',
      ];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Invalid coupon status.' }, { status: 400 });
      }
      beforeState.status = existingCoupon.status;
      updates.status = body.status;
    }

    // 3. Discount Value & Caps
    if (body.discountValue !== undefined) {
      const val = Number(body.discountValue);
      if (isNaN(val) || val <= 0) {
        return NextResponse.json(
          { success: false, error: 'Discount value must be a positive number.' },
          { status: 400 }
        );
      }
      const discType = body.discountType || existingCoupon.discountType;
      if (discType === 'percentage' && (val < 1 || val > 100)) {
        return NextResponse.json(
          { success: false, error: 'Percentage discount must be between 1 and 100.' },
          { status: 400 }
        );
      }
      beforeState.discountValue = existingCoupon.discountValue;
      updates.discountValue = val;
    }

    if (body.maxDiscount !== undefined) {
      beforeState.maxDiscount = existingCoupon.maxDiscount;
      updates.maxDiscount =
        body.maxDiscount === null || body.maxDiscount === '' ? undefined : Math.max(0, Number(body.maxDiscount));
    }

    if (body.minSubtotal !== undefined) {
      beforeState.minSubtotal = existingCoupon.minSubtotal;
      updates.minSubtotal = Math.max(0, Number(body.minSubtotal) || 0);
    }

    // 4. Dates
    if (body.startDate !== undefined) {
      const sDate = new Date(body.startDate);
      if (isNaN(sDate.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid start date.' }, { status: 400 });
      }
      beforeState.startDate = existingCoupon.startDate;
      updates.startDate = sDate;
    }

    if (body.expiryDate !== undefined) {
      const eDate = new Date(body.expiryDate);
      if (isNaN(eDate.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid expiry date.' }, { status: 400 });
      }
      const start = updates.startDate || existingCoupon.startDate;
      if (eDate <= start) {
        return NextResponse.json(
          { success: false, error: 'Expiry date must be after start date.' },
          { status: 400 }
        );
      }
      beforeState.expiryDate = existingCoupon.expiryDate;
      updates.expiryDate = eDate;
    }

    // 5. Usage Limits
    if (body.totalUsageLimit !== undefined) {
      beforeState.totalUsageLimit = existingCoupon.totalUsageLimit;
      updates.totalUsageLimit =
        body.totalUsageLimit === null || body.totalUsageLimit === ''
          ? undefined
          : Math.max(1, Number(body.totalUsageLimit));
    }

    if (body.perCustomerUsageLimit !== undefined) {
      beforeState.perCustomerUsageLimit = existingCoupon.perCustomerUsageLimit;
      updates.perCustomerUsageLimit =
        body.perCustomerUsageLimit === null || body.perCustomerUsageLimit === ''
          ? 1
          : Math.max(1, Number(body.perCustomerUsageLimit));
    }

    // 6. Eligibility & Restrictions
    if (body.customerEligibility !== undefined) {
      if (['all', 'first_order', 'existing'].includes(body.customerEligibility)) {
        beforeState.customerEligibility = existingCoupon.customerEligibility;
        updates.customerEligibility = body.customerEligibility;
      }
    }

    if (body.productRestrictions !== undefined) {
      beforeState.productRestrictions = existingCoupon.productRestrictions;
      updates.productRestrictions = {
        includedProductIds: Array.isArray(body.productRestrictions.includedProductIds)
          ? body.productRestrictions.includedProductIds.map((s: any) => String(s).trim())
          : [],
        includedCategories: Array.isArray(body.productRestrictions.includedCategories)
          ? body.productRestrictions.includedCategories.map((s: any) => String(s).trim())
          : [],
        includedBrands: Array.isArray(body.productRestrictions.includedBrands)
          ? body.productRestrictions.includedBrands.map((s: any) => String(s).trim())
          : [],
        excludedProductIds: Array.isArray(body.productRestrictions.excludedProductIds)
          ? body.productRestrictions.excludedProductIds.map((s: any) => String(s).trim())
          : [],
        excludedCategories: Array.isArray(body.productRestrictions.excludedCategories)
          ? body.productRestrictions.excludedCategories.map((s: any) => String(s).trim())
          : [],
      };
    }

    if (body.description !== undefined) {
      beforeState.description = existingCoupon.description;
      updates.description = String(body.description || '').trim().slice(0, 500);
    }

    if (body.internalNotes !== undefined) {
      beforeState.internalNotes = existingCoupon.internalNotes;
      updates.internalNotes = String(body.internalNotes || '').trim().slice(0, 2000);
    }

    const updatedCoupon = await CouponModel.findByIdAndUpdate(
      existingCoupon._id,
      { $set: updates },
      { new: true }
    );

    let auditAction = 'COUPON_UPDATED';
    if (updates.status === 'active') auditAction = 'COUPON_ACTIVATED';
    else if (updates.status === 'paused') auditAction = 'COUPON_PAUSED';
    else if (updates.status === 'deactivated') auditAction = 'COUPON_DEACTIVATED';

    await recordAuditLog({
      action: auditAction as any,
      entityType: 'coupon',
      entityId: existingCoupon.id,
      entityName: existingCoupon.code,
      summary: `${auditAction} on coupon ${existingCoupon.code}`,
      details: {
        before: beforeState,
        after: updates,
      },
      req,
    });

    return NextResponse.json({ success: true, data: updatedCoupon });
  } catch (error: any) {
    console.error('[AdminPromotion ID PATCH] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { auth, errorResponse } = await requirePermission(req, 'promotions.deactivate');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const resolvedParams = await params;
    const targetId = resolvedParams.id;

    const orQueries: any[] = [{ id: targetId }, { code: normalizeCouponCode(targetId) }];
    if (mongoose.isValidObjectId(targetId)) {
      orQueries.push({ _id: targetId });
    }

    const coupon = await CouponModel.findOne({ $or: orQueries });
    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 });
    }

    // Preserve historical integrity: Mark deactivated rather than deleting document
    coupon.status = 'deactivated';
    await coupon.save();

    await recordAuditLog({
      action: 'COUPON_DEACTIVATED',
      entityType: 'coupon',
      entityId: coupon.id,
      entityName: coupon.code,
      summary: `Deactivated coupon ${coupon.code}`,
      details: {
        previousStatus: coupon.status,
        newStatus: 'deactivated',
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Coupon '${coupon.code}' has been deactivated.`,
      data: coupon,
    });
  } catch (error: any) {
    console.error('[AdminPromotion ID DELETE] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

