import mongoose from 'mongoose';
import { CouponModel, ICouponDocument, IProductRestrictions, DiscountType } from '@/models/Coupon';
import { CouponRedemptionModel } from '@/models/CouponRedemption';
import { OrderModel } from '@/models/Order';
import { ProductModel } from '@/models/Product';
import { connectToDatabase } from '@/lib/mongodb';
import { resolveAuthoritativeProduct } from './product-resolution';

export interface ValidatedCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  brand?: string;
  priceOnRequest?: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    description?: string;
    discountType: DiscountType;
    discountValue: number;
    maxDiscount?: number;
    minSubtotal: number;
    discountAmount: number;
    eligibleSubtotal: number;
    excludedSubtotal: number;
    finalPayable: number;
    eligibleItemIds: string[];
  };
}

/**
 * Normalizes a coupon code: trims whitespace and converts to uppercase.
 */
export function normalizeCouponCode(code: string | null | undefined): string {
  if (!code || typeof code !== 'string') return '';
  return code.trim().toUpperCase();
}

/**
 * Evaluates whether a specific cart line item qualifies for discounts under product restrictions.
 * Exclusions ALWAYS take precedence over inclusions.
 */
export function evaluateItemEligibility(
  item: ValidatedCartItem,
  restrictions?: IProductRestrictions
): boolean {
  if (!restrictions) return true;

  const [baseProductId] = (item.id || '').split('__');
  const category = (item.category || '').toLowerCase();
  const brand = (item.brand || '').toLowerCase();

  // 1. Exclusions take precedence over inclusions
  if (
    restrictions.excludedProductIds &&
    restrictions.excludedProductIds.length > 0 &&
    (restrictions.excludedProductIds.includes(item.id) ||
      restrictions.excludedProductIds.includes(baseProductId))
  ) {
    return false;
  }

  if (
    restrictions.excludedCategories &&
    restrictions.excludedCategories.length > 0 &&
    restrictions.excludedCategories.some((c) => c.toLowerCase() === category)
  ) {
    return false;
  }

  // 2. Inclusions
  const hasInclusions =
    (restrictions.includedProductIds && restrictions.includedProductIds.length > 0) ||
    (restrictions.includedCategories && restrictions.includedCategories.length > 0) ||
    (restrictions.includedBrands && restrictions.includedBrands.length > 0);

  if (!hasInclusions) {
    // If no inclusion rules specified, all non-excluded items are eligible
    return true;
  }

  const matchesIncludedProduct = Boolean(
    restrictions.includedProductIds?.includes(item.id) ||
      restrictions.includedProductIds?.includes(baseProductId)
  );

  const matchesIncludedCategory = Boolean(
    restrictions.includedCategories?.some((c) => c.toLowerCase() === category)
  );

  const matchesIncludedBrand = Boolean(
    brand && restrictions.includedBrands?.some((b) => b.toLowerCase() === brand)
  );

  return matchesIncludedProduct || matchesIncludedCategory || matchesIncludedBrand;
}

/**
 * Authoritatively validates and calculates coupon discount for a given cart and customer.
 * Strict deny-by-default logic; never trusts client-supplied discounts or pricing.
 */
export async function validateAndCalculateCoupon(
  rawCode: string,
  items: ValidatedCartItem[],
  customerPhone?: string
): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(rawCode);
  if (!code) {
    return { valid: false, error: 'Coupon code is required' };
  }

  if (!items || items.length === 0) {
    return { valid: false, error: 'Cart cannot be empty when applying a coupon' };
  }

  await connectToDatabase();

  const coupon = await CouponModel.findOne({ code }).lean();
  if (!coupon) {
    return { valid: false, error: 'Invalid coupon code. Please check and try again.' };
  }

  const now = new Date();

  // 1. Lifecycle & Status Checks
  if (coupon.status === 'paused') {
    return { valid: false, error: 'This coupon is temporarily paused and cannot be applied.' };
  }

  if (coupon.status === 'deactivated') {
    return { valid: false, error: 'This coupon has been deactivated.' };
  }

  if (coupon.status === 'draft') {
    return { valid: false, error: 'This coupon is not yet active.' };
  }

  if (now < new Date(coupon.startDate)) {
    return { valid: false, error: 'This promotion has not yet started.' };
  }

  if (now > new Date(coupon.expiryDate) || coupon.status === 'expired') {
    return { valid: false, error: 'This coupon has expired.' };
  }

  if (
    coupon.status === 'exhausted' ||
    (typeof coupon.totalUsageLimit === 'number' && coupon.totalRedemptions >= coupon.totalUsageLimit)
  ) {
    return { valid: false, error: 'This coupon has reached its maximum redemption limit.' };
  }

  const cleanPhone = (customerPhone || '').replace(/\D/g, '');

  // 2. Customer Eligibility Checks
  if (coupon.customerEligibility === 'first_order') {
    if (cleanPhone && cleanPhone.length >= 10) {
      const pastOrdersCount = await OrderModel.countDocuments({
        phone: new RegExp(cleanPhone, 'i'),
        status: { $ne: 'cancelled' },
      });
      if (pastOrdersCount > 0) {
        return {
          valid: false,
          error: 'This coupon is exclusively reserved for your first order.',
        };
      }
    }
  } else if (coupon.customerEligibility === 'existing') {
    if (cleanPhone && cleanPhone.length >= 10) {
      const pastOrdersCount = await OrderModel.countDocuments({
        phone: new RegExp(cleanPhone, 'i'),
        status: { $ne: 'cancelled' },
      });
      if (pastOrdersCount === 0) {
        return {
          valid: false,
          error: 'This coupon is valid only for existing clients with a previous order.',
        };
      }
    }
  }

  // 3. Per-Customer Usage Limit Check
  if (coupon.perCustomerUsageLimit && cleanPhone && cleanPhone.length >= 10) {
    const customerRedemptions = await CouponRedemptionModel.countDocuments({
      couponId: (coupon as any)._id.toString(),
      customerPhone: cleanPhone,
      status: { $ne: 'cancelled' },
    });

    if (customerRedemptions >= coupon.perCustomerUsageLimit) {
      return {
        valid: false,
        error: `You have already redeemed this coupon the maximum allowed number of times (${coupon.perCustomerUsageLimit}).`,
      };
    }
  }

  // 4. Enrich Items with Brand & Category from Authoritative Catalog if missing
  const enrichedItems: ValidatedCartItem[] = [];
  for (const it of items) {
    let category = it.category;
    let brand = it.brand;

    if (!category || !brand) {
      const [baseId] = it.id.split('__');
      const prod = await resolveAuthoritativeProduct(baseId, { lean: true });
      if (prod) {
        category = category || prod.category;
        brand = brand || (prod as any).brand;
      }
    }

    enrichedItems.push({
      ...it,
      category,
      brand,
    });
  }

  // 5. Merchandise Eligibility Separation
  const eligibleItems: ValidatedCartItem[] = [];
  const excludedItems: ValidatedCartItem[] = [];

  for (const it of enrichedItems) {
    // POR items are not eligible for automated merchandise coupons
    if (it.priceOnRequest || it.price <= 0) {
      excludedItems.push(it);
      continue;
    }

    const isEligible = evaluateItemEligibility(it, coupon.productRestrictions);
    if (isEligible) {
      eligibleItems.push(it);
    } else {
      excludedItems.push(it);
    }
  }

  const eligibleSubtotal = eligibleItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const excludedSubtotal = excludedItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const totalSubtotal = eligibleSubtotal + excludedSubtotal;

  if (eligibleItems.length === 0 || eligibleSubtotal <= 0) {
    return {
      valid: false,
      error: 'None of the items in your cart are eligible for this promotional coupon.',
    };
  }

  // 6. Minimum Merchandise Subtotal Check
  if (coupon.minSubtotal && eligibleSubtotal < coupon.minSubtotal) {
    return {
      valid: false,
      error: `Minimum eligible purchase of ₹${coupon.minSubtotal.toLocaleString(
        'en-IN'
      )} required for this coupon (current eligible subtotal: ₹${eligibleSubtotal.toLocaleString(
        'en-IN'
      )}).`,
    };
  }

  // 7. Authoritative Discount Calculation
  let rawDiscount = 0;
  if (coupon.discountType === 'percentage') {
    rawDiscount = (eligibleSubtotal * coupon.discountValue) / 100;
    if (typeof coupon.maxDiscount === 'number' && coupon.maxDiscount > 0) {
      rawDiscount = Math.min(rawDiscount, coupon.maxDiscount);
    }
  } else if (coupon.discountType === 'fixed') {
    rawDiscount = Math.min(coupon.discountValue, eligibleSubtotal);
  }

  // Cap discount strictly at eligibleSubtotal and round to whole rupees
  const discountAmount = Math.max(0, Math.min(eligibleSubtotal, Math.round(rawDiscount)));
  const finalPayable = Math.max(0, totalSubtotal - discountAmount);

  return {
    valid: true,
    coupon: {
      id: (coupon as any)._id.toString(),
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      minSubtotal: coupon.minSubtotal || 0,
      discountAmount,
      eligibleSubtotal,
      excludedSubtotal,
      finalPayable,
      eligibleItemIds: eligibleItems.map((i) => i.id),
    },
  };
}

/**
 * Atomically consumes and records a coupon redemption during order placement.
 * Guaranteed race-safe via atomic findOneAndUpdate with totalUsageLimit condition.
 */
export async function recordCouponRedemption(params: {
  couponId: string;
  couponCode: string;
  orderId: string;
  customerPhone: string;
  customerName?: string;
  discountAmount: number;
  eligibleSubtotal: number;
  orderTotal: number;
}): Promise<{ success: boolean; error?: string }> {
  await connectToDatabase();

  // 0. Idempotency check: if this order already has a redemption recorded, return success immediately
  if (params.orderId) {
    const existing = await CouponRedemptionModel.findOne({ orderId: params.orderId });
    if (existing) {
      return { success: true };
    }
  }

  const code = normalizeCouponCode(params.couponCode);

  // 1. Atomic usage increment & limit enforcement
  const orConditions: any[] = [{ id: params.couponId }, { code }];
  if (mongoose.isValidObjectId(params.couponId)) {
    orConditions.push({ _id: params.couponId });
  }

  const query: any = {
    $or: orConditions,
    status: 'active',
  };

  // Find document first to check limits
  const coupon = await CouponModel.findOne(query);
  if (!coupon) {
    return { success: false, error: 'Coupon is no longer active' };
  }

  const cleanPhone = (params.customerPhone || '').replace(/\D/g, '');
  if (coupon.perCustomerUsageLimit && cleanPhone && cleanPhone.length >= 10) {
    const existingCount = await CouponRedemptionModel.countDocuments({
      couponId: (coupon as any)._id.toString(),
      customerPhone: cleanPhone,
      status: { $ne: 'cancelled' },
    });
    if (existingCount >= coupon.perCustomerUsageLimit) {
      return {
        success: false,
        error: `You have reached the redemption limit (${coupon.perCustomerUsageLimit}) for this coupon.`,
      };
    }
  }

  if (coupon.totalUsageLimit) {
    query.totalRedemptions = { $lt: coupon.totalUsageLimit };
  }

  const updated = await CouponModel.findOneAndUpdate(
    query,
    {
      $inc: {
        totalRedemptions: 1,
        totalDiscountGranted: params.discountAmount,
      },
    },
    { returnDocument: 'after' }
  );

  if (!updated) {
    return {
      success: false,
      error: 'Coupon usage limit was reached during checkout.',
    };
  }

  // Auto-mark as exhausted if totalUsageLimit reached
  if (updated.totalUsageLimit && updated.totalRedemptions >= updated.totalUsageLimit) {
    await CouponModel.findByIdAndUpdate(updated._id, { $set: { status: 'exhausted' } });
  }

  // 2. Record redemption document with unique orderId
  try {
    await CouponRedemptionModel.create({
      id: `RED-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      couponId: updated._id.toString(),
      couponCode: updated.code,
      orderId: params.orderId,
      customerPhone: params.customerPhone.replace(/\D/g, ''),
      customerName: params.customerName || '',
      discountAmount: params.discountAmount,
      eligibleSubtotal: params.eligibleSubtotal,
      orderTotal: params.orderTotal,
      status: 'completed',
      redeemedAt: new Date(),
    });
    return { success: true };
  } catch (err: any) {
    if (err?.code === 11000) {
      // Duplicate redemption for this order already recorded
      return { success: true };
    }
    console.error('[PromotionsEngine] Failed to record coupon redemption:', err);
    return { success: false, error: 'Failed to record coupon redemption record' };
  }
}

/**
 * Handles order cancellation or refund by reverting coupon usage.
 */
export async function cancelCouponRedemption(
  orderId: string,
  reason: string = 'Order cancelled'
): Promise<{ success: boolean }> {
  await connectToDatabase();

  const redemption = await CouponRedemptionModel.findOne({
    orderId,
    status: 'completed',
  });

  if (!redemption) {
    return { success: true };
  }

  redemption.status = 'cancelled';
  redemption.cancelledAt = new Date();
  redemption.cancelReason = reason;
  await redemption.save();

  // Atomically decrement usage on coupon
  const coupon = await CouponModel.findByIdAndUpdate(
    redemption.couponId,
    {
      $inc: {
        totalRedemptions: -1,
        totalDiscountGranted: -redemption.discountAmount,
      },
    },
    { returnDocument: 'after' }
  );

  // Re-activate if was exhausted and now has headroom
  if (
    coupon &&
    coupon.status === 'exhausted' &&
    coupon.totalUsageLimit &&
    coupon.totalRedemptions < coupon.totalUsageLimit
  ) {
    await CouponModel.findByIdAndUpdate(coupon._id, { $set: { status: 'active' } });
  }

  return { success: true };
}
