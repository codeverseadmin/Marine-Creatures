import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CouponModel } from '@/models/Coupon';
import { CouponRedemptionModel } from '@/models/CouponRedemption';
import { requirePermission } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'promotions.analytics');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const now = new Date();

    const [
      totalCoupons,
      activeCoupons,
      pausedCoupons,
      expiredCoupons,
      totalRedemptions,
      redemptionsAggregate,
      topCouponsAggregate,
      recentRedemptions,
    ] = await Promise.all([
      CouponModel.countDocuments(),
      CouponModel.countDocuments({ status: 'active', expiryDate: { $gte: now } }),
      CouponModel.countDocuments({ status: 'paused' }),
      CouponModel.countDocuments({
        $or: [{ status: 'expired' }, { expiryDate: { $lt: now } }],
      }),
      CouponRedemptionModel.countDocuments({ status: 'completed' }),
      CouponRedemptionModel.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: null,
            totalDiscountGranted: { $sum: '$discountAmount' },
            grossMerchandiseValue: { $sum: '$eligibleSubtotal' },
            netOrderRevenue: { $sum: '$orderTotal' },
          },
        },
      ]),
      CouponRedemptionModel.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: '$couponCode',
            couponId: { $first: '$couponId' },
            count: { $sum: 1 },
            totalDiscount: { $sum: '$discountAmount' },
            totalRevenue: { $sum: '$orderTotal' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      CouponRedemptionModel.find({ status: 'completed' })
        .sort({ redeemedAt: -1 })
        .limit(20)
        .lean(),
    ]);

    const financialTotals = redemptionsAggregate[0] || {
      totalDiscountGranted: 0,
      grossMerchandiseValue: 0,
      netOrderRevenue: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalCoupons,
          activeCoupons,
          pausedCoupons,
          expiredCoupons,
          totalRedemptions,
          totalDiscountGranted: financialTotals.totalDiscountGranted,
          grossMerchandiseValue: financialTotals.grossMerchandiseValue,
          netOrderRevenue: financialTotals.netOrderRevenue,
        },
        topCoupons: topCouponsAggregate.map((c) => ({
          code: c._id,
          couponId: c.couponId,
          redemptionCount: c.count,
          totalDiscount: c.totalDiscount,
          totalRevenue: c.totalRevenue,
        })),
        recentRedemptions,
      },
    });
  } catch (error: any) {
    console.error('[AdminPromotionsAnalytics GET] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

