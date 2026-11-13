import { NextRequest, NextResponse } from 'next/server';
import { validateAndCalculateCoupon } from '@/lib/services/promotion-engine';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    // Rate limit: max 20 coupon validation attempts per minute per IP to prevent code enumeration
    const rateLimit = await checkRateLimit(`promo_val:${ip}`, 20, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many coupon validation attempts. Please slow down.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, items, customerPhone } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Please enter a coupon code.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required to calculate coupon eligibility.' },
        { status: 400 }
      );
    }

    // Clean items array
    const sanitizedItems = items.map((it: any) => ({
      id: String(it.id || it.product?.id || ''),
      name: String(it.name || it.product?.name || ''),
      price: Number(it.price || it.product?.price || 0),
      quantity: Math.max(1, Number(it.quantity || 1)),
      category: it.category || it.product?.category,
      brand: it.brand || it.product?.brand,
      priceOnRequest: Boolean(it.priceOnRequest || it.product?.priceOnRequest),
    }));

    const result = await validateAndCalculateCoupon(code, sanitizedItems, customerPhone);

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: result.error || 'This coupon code could not be applied.',
          reason: result.reason,
          customerEligibility: result.customerEligibility,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      coupon: result.coupon,
    });
  } catch (error: any) {
    console.error('[API /api/promotions/validate] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate coupon code.' },
      { status: 500 }
    );
  }
}

