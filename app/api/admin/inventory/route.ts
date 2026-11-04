import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'inventory.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get('search') || '').trim();
    const category = searchParams.get('category') || 'all';
    const filter = searchParams.get('filter') || 'all'; // 'all', 'low_stock', 'out_of_stock', 'quarantine', 'available'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, any> = { isArchived: { $ne: true } };

    if (category !== 'all') {
      query.category = category;
    }

    if (filter === 'low_stock') {
      query.stockCount = { $gt: 0, $lte: 5 };
    } else if (filter === 'out_of_stock') {
      query.$or = [{ stockCount: { $lte: 0 } }, { inStock: false }];
    } else if (filter === 'quarantine') {
      query.availabilityStatus = 'QUARANTINE';
    } else if (filter === 'available') {
      query.inStock = true;
      query.stockCount = { $gt: 0 };
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { id: searchRegex },
        { name: searchRegex },
        { scientificName: searchRegex },
        { brand: searchRegex },
        { categoryLabel: searchRegex },
      ];
    }

    const [total, products, lowStockCount, outOfStockCount, inStockCount, quarantineCount] = await Promise.all([
      ProductModel.countDocuments(query),
      ProductModel.find(query).sort({ stockCount: 1, name: 1 }).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments({ isArchived: { $ne: true }, stockCount: { $gt: 0, $lte: 5 } }),
      ProductModel.countDocuments({ isArchived: { $ne: true }, $or: [{ stockCount: { $lte: 0 } }, { inStock: false }] }),
      ProductModel.countDocuments({ isArchived: { $ne: true }, inStock: true, stockCount: { $gt: 0 } }),
      ProductModel.countDocuments({ isArchived: { $ne: true }, availabilityStatus: 'QUARANTINED' }),
    ]);

    return NextResponse.json({
      success: true,
      total,
      limit,
      skip,
      counts: {
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        quarantine: quarantineCount,
      },
      data: products,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'inventory.update');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, stockCount, inStock, availabilityStatus, availabilityNote } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const product = await ProductModel.findOne({ id });
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const prevStock = product.stockCount;
    if (typeof stockCount === 'number') {
      product.stockCount = Math.max(0, stockCount);
      if (stockCount === 0) product.inStock = false;
      else if (stockCount > 0 && product.inStock === false && inStock === undefined) {
        product.inStock = true;
      }
    }

    if (typeof inStock === 'boolean') {
      product.inStock = inStock;
    }

    if (availabilityStatus && ['AVAILABLE', 'QUARANTINE', 'RESERVED', 'SOLD', 'UNAVAILABLE'].includes(availabilityStatus)) {
      product.availabilityStatus = availabilityStatus;
    }

    if (availabilityNote !== undefined) {
      product.availabilityNote = typeof availabilityNote === 'string' ? availabilityNote.trim() : '';
    }

    await product.save();

    await recordAuditLog({
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: product.id,
      entityName: product.name,
      summary: `Inventory updated for ${product.name}. Stock: ${product.stockCount} (was ${prevStock}), InStock: ${product.inStock}`,
      details: { prevStock, newStock: product.stockCount, inStock: product.inStock, availabilityStatus: product.availabilityStatus },
      req,
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
