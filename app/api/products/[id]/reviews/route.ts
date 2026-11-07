import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductReviewModel } from '@/models/ProductReview';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const cleanId = id.trim().toLowerCase();

    // Query exclusively APPROVED reviews for this product
    const approvedReviews = await ProductReviewModel.find({
      productId: cleanId,
      status: 'APPROVED',
    })
      .sort({ submittedAt: -1 })
      .lean();

    const count = approvedReviews.length;
    let averageRating: number | null = null;

    if (count > 0) {
      const sum = approvedReviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      averageRating = Math.round((sum / count) * 10) / 10;
    }

    // Sanitize reviews for public customer-facing presentation
    const publicReviews = approvedReviews.map((rev) => ({
      id: rev.id,
      productId: rev.productId,
      productName: rev.productName,
      customerDisplayName: rev.customerDisplayName,
      customerLocation: rev.customerLocation || null,
      rating: rev.rating,
      title: rev.title,
      comment: rev.comment,
      images: (rev.images || [])
        .filter((img) => img.isApproved !== false)
        .map((img) => ({
          id: img.id,
          url: img.url,
        })),
      verifiedPurchase: rev.verifiedPurchase === true,
      submittedAt: rev.submittedAt,
    }));

    return NextResponse.json({
      success: true,
      productId: cleanId,
      count,
      averageRating,
      reviews: publicReviews,
    });
  } catch (error: any) {
    console.error('Failed to retrieve product reviews:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve reviews' },
      { status: 500 }
    );
  }
}

