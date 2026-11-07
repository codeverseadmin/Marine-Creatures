import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { ProductReviewModel } from '@/models/ProductReview';
import { PRODUCTS } from '@/lib/data/products';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { getClientIp } from '@/lib/rate-limit';
import { resolveAuthoritativeProduct } from '@/lib/services/product-resolution';

export async function GET() {
  try {
    await connectToDatabase();
    let products = await ProductModel.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 }).lean();

    // Auto-seed if collection is empty
    if (!products || products.length === 0) {
      console.log('🌱 Seeding initial products catalog into MongoDB Atlas...');
      try {
        await ProductModel.insertMany(PRODUCTS, { ordered: false });
        products = await ProductModel.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 }).lean();
      } catch (seedErr) {
        console.warn('Auto-seed partial insert or notice:', seedErr);
        products = await ProductModel.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 }).lean();
      }
    }

    // Query genuine approved reviews summary across all products
    const reviewStats = await ProductReviewModel.aggregate([
      { $match: { status: 'APPROVED' } },
      {
        $group: {
          _id: '$productId',
          reviewsCount: { $sum: 1 },
          averageRating: { $avg: '$rating' },
        },
      },
    ]);

    const statsByProductId = new Map<string, { reviewsCount: number; rating: number }>();
    reviewStats.forEach((stat: { _id: string; reviewsCount: number; averageRating: number }) => {
      statsByProductId.set(stat._id, {
        reviewsCount: stat.reviewsCount,
        rating: Math.round(stat.averageRating * 10) / 10,
      });
    });

    // Backfill itemType and ensure zero legacy synthetic ratings leak to public consumers
    const normalised = products.map((p: any) => {
      const genuineStats = statsByProductId.get(p.id);
      const { rating: _legacyRating, reviewsCount: _legacyCount, ...rest } = p;

      return {
        ...rest,
        itemType: (p.category === 'marine-life' || p.itemType === 'live') ? 'live' : 'dry',
        ...(genuineStats
          ? { rating: genuineStats.rating, reviewsCount: genuineStats.reviewsCount }
          : { reviewsCount: 0 }),
      };
    });

    return NextResponse.json({ success: true, count: normalised.length, data: normalised });
  } catch (error: any) {
    console.error('Failed to fetch products from MongoDB:', error.message);
    return NextResponse.json({
      success: false,
      fallback: true,
      data: PRODUCTS,
      error: error.message,
    });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'products.create');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.id || !body.name || !body.price || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required product fields (id, name, price, category)' },
        { status: 400 }
      );
    }

    const newProduct = await ProductModel.create(body);

    await recordAuditLog({
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: newProduct.id,
      entityName: newProduct.name,
      summary: `Created product [${newProduct.name}] (${newProduct.id})`,
      actor: auth!.actorEmail,
      ip: getClientIp(req),
      details: { price: newProduct.price, category: newProduct.category },
    });

    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'products.update');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product id is required' }, { status: 400 });
    }

    const existing = await resolveAuthoritativeProduct(id, { lean: true });
    if (!existing || !existing.id) {
      return NextResponse.json({ success: false, error: `Product [${id}] not found` }, { status: 404 });
    }

    const resolvedId = existing.id;
    delete (updates as any)._id;
    delete (updates as any).id;

    const updated = await ProductModel.findOneAndUpdate({ id: resolvedId }, updates, {
      new: true,
      upsert: false,
    }).lean();

    if (updated) {
      await recordAuditLog({
        action: 'PRODUCT_UPDATED',
        entityType: 'product',
        entityId: resolvedId,
        entityName: updated.name || resolvedId,
        summary: `Updated product [${updated.name || resolvedId}]`,
        actor: auth!.actorEmail,
        ip: getClientIp(req),
        details: { updatedFields: Object.keys(updates) },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'products.delete');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product id parameter is required' }, { status: 400 });
    }

    const existing = await resolveAuthoritativeProduct(id, { lean: true });
    if (!existing || !existing.id) {
      return NextResponse.json({ success: false, error: `Product [${id}] not found` }, { status: 404 });
    }

    await ProductModel.deleteOne({ id: existing.id });

    await recordAuditLog({
      action: 'PRODUCT_DELETED',
      entityType: 'product',
      entityId: existing.id,
      entityName: existing.name || existing.id,
      summary: `Deleted product [${existing.id}]`,
      actor: auth!.actorEmail,
      ip: getClientIp(req),
    });

    return NextResponse.json({ success: true, message: `Product ${existing.id} removed` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
