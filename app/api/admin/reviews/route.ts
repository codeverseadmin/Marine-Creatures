import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductReviewModel, ReviewStatus } from '@/models/ProductReview';
import { requirePermission } from '@/lib/rbac/guard';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'reviews.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') || 'all';
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, any> = {};

    if (status !== 'all' && ['PENDING', 'APPROVED', 'REJECTED', 'REPORTED'].includes(status)) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { productName: searchRegex },
        { customerDisplayName: searchRegex },
        { orderId: searchRegex },
        { title: searchRegex },
        { comment: searchRegex },
      ];
    }

    const [total, reviews, statusGroups] = await Promise.all([
      ProductReviewModel.countDocuments(query),
      ProductReviewModel.find(query).sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
      ProductReviewModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const counts: Record<string, number> = {
      all: 0,
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      REPORTED: 0,
    };

    let totalAll = 0;
    statusGroups.forEach((g: { _id: string; count: number }) => {
      counts[g._id] = g.count;
      totalAll += g.count;
    });
    counts.all = totalAll;

    return NextResponse.json({
      success: true,
      total,
      counts,
      data: reviews,
    });
  } catch (error: any) {
    console.error('Failed to list reviews for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve review list.' },
      { status: 500 }
    );
  }
}

