import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { isAdminRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get('search') || '').trim();
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';
    const stockState = searchParams.get('stockState') || 'all';
    const imageStatus = searchParams.get('imageStatus') || 'all';
    const priceMode = searchParams.get('priceMode') || 'all';

    // 1. Calculate Authoritative Real Database Metrics (across all catalog records)
    const [
      totalCount,
      activeCount,
      archivedCount,
      lowStockCount,
      outOfStockCount,
      needsReviewCount,
      missingImageCount,
      categoryCounts,
    ] = await Promise.all([
      ProductModel.countDocuments({}),
      ProductModel.countDocuments({ isArchived: { $ne: true } }),
      ProductModel.countDocuments({ isArchived: true }),
      ProductModel.countDocuments({
        isArchived: { $ne: true },
        stockCount: { $gt: 0, $lte: 5 },
      }),
      ProductModel.countDocuments({
        isArchived: { $ne: true },
        $or: [{ stockCount: { $lte: 0 } }, { inStock: false }],
      }),
      ProductModel.countDocuments({
        isArchived: { $ne: true },
        $or: [
          { researchStatus: 'NEEDS_REVIEW' },
          { imageStatus: 'NEEDS_MEDIA_ASSET' },
          { imageStatus: 'NEEDS_LICENSE_REVIEW' },
        ],
      }),
      ProductModel.countDocuments({
        isArchived: { $ne: true },
        $or: [{ images: { $size: 0 } }, { imageStatus: 'NEEDS_MEDIA_ASSET' }],
      }),
      ProductModel.aggregate([
        { $match: { isArchived: { $ne: true } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    // 2. Build Query Filters
    const query: any = {};

    // Search filter across name, scientificName, sku, id, brand, category
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { scientificName: searchRegex },
        { id: searchRegex },
        { sku: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Status filter
    if (status === 'active') {
      query.isArchived = { $ne: true };
    } else if (status === 'archived') {
      query.isArchived = true;
    } else if (status === 'needs_review') {
      query.isArchived = { $ne: true };
      query.$or = [
        { researchStatus: 'NEEDS_REVIEW' },
        { imageStatus: 'NEEDS_MEDIA_ASSET' },
        { imageStatus: 'NEEDS_LICENSE_REVIEW' },
      ];
    }

    // Stock state filter
    if (stockState === 'in_stock') {
      query.inStock = true;
      query.stockCount = { $gt: 5 };
    } else if (stockState === 'low_stock') {
      query.stockCount = { $gt: 0, $lte: 5 };
    } else if (stockState === 'out_of_stock') {
      query.$or = [{ stockCount: { $lte: 0 } }, { inStock: false }];
    }

    // Image status filter
    if (imageStatus === 'verified') {
      query.imageStatus = 'VERIFIED';
    } else if (imageStatus === 'fallback') {
      query.imageStatus = 'NEEDS_LICENSE_REVIEW';
    } else if (imageStatus === 'missing') {
      query.$or = [{ images: { $size: 0 } }, { imageStatus: 'NEEDS_MEDIA_ASSET' }];
    } else if (imageStatus === 'needs_review') {
      query.imageStatus = { $in: ['NEEDS_MEDIA_ASSET', 'NEEDS_LICENSE_REVIEW'] };
    }

    // Price mode filter
    if (priceMode === 'fixed') {
      query.priceOnRequest = { $ne: true };
    } else if (priceMode === 'on_request') {
      query.priceOnRequest = true;
    }

    const products = await ProductModel.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean();

    const metrics = {
      totalProducts: totalCount,
      activeProducts: activeCount,
      archived: archivedCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      needsReview: needsReviewCount,
      missingImage: missingImageCount,
      categories: categoryCounts.reduce((acc: any, c: any) => {
        acc[c._id] = c.count;
        return acc;
      }, {}),
    };

    return NextResponse.json({
      success: true,
      count: products.length,
      metrics,
      data: products,
    });
  } catch (error: any) {
    console.error('[AdminCatalog] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const body = await req.json();

    // Validation
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Product name is required.' }, { status: 400 });
    }

    const cleanName = body.name.trim();

    // Generate or validate slug
    let slug = (body.id || body.slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Verify slug uniqueness
    const existingSlug = await ProductModel.findOne({ id: slug }).lean();
    if (existingSlug) {
      return NextResponse.json(
        { success: false, error: `Slug "${slug}" is already in use by product "${existingSlug.name}". Please specify a unique slug.` },
        { status: 409 }
      );
    }

    // Verify SKU uniqueness if provided
    if (body.sku && typeof body.sku === 'string' && body.sku.trim()) {
      const cleanSku = body.sku.trim().toUpperCase();
      const existingSku = await ProductModel.findOne({ sku: cleanSku }).lean();
      if (existingSku) {
        return NextResponse.json(
          { success: false, error: `SKU "${cleanSku}" is already assigned to "${existingSku.name}". SKU must be unique.` },
          { status: 409 }
        );
      }
      body.sku = cleanSku;
    }

    // Verify category
    const validCategories = ['marine-life', 'lighting-tech', 'rock-sand', 'salt-chemistry', 'hardware'];
    if (!body.category || !validCategories.includes(body.category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate pricing
    const isPOR = Boolean(body.priceOnRequest);
    let price = Number(body.price);
    if (!isPOR && (isNaN(price) || price < 0)) {
      return NextResponse.json(
        { success: false, error: 'Price must be a valid non-negative number for fixed-price items.' },
        { status: 400 }
      );
    }
    if (isPOR) {
      price = 0; // Standardize POR price representation
    }

    const itemType = body.itemType || (body.category === 'marine-life' ? 'live' : 'dry');

    const productPayload = {
      ...body,
      id: slug,
      name: cleanName,
      price,
      priceOnRequest: isPOR,
      itemType,
      category: body.category,
      categoryLabel: body.categoryLabel || body.category,
      inStock: body.inStock !== undefined ? Boolean(body.inStock) : true,
      stockCount: typeof body.stockCount === 'number' ? body.stockCount : 10,
      images: Array.isArray(body.images) ? body.images : [],
      videos: Array.isArray(body.videos) ? body.videos : [],
      media: Array.isArray(body.media) ? body.media : [],
      imageStatus: body.imageStatus || 'NEEDS_MEDIA_ASSET',
      researchStatus: body.researchStatus || 'READY',
      isArchived: Boolean(body.isArchived ?? false),
    };

    const created = await ProductModel.create(productPayload);

    await recordAuditLog({
      action: 'PRODUCT_CREATED',
      entityId: slug,
      entityName: cleanName,
      summary: `Created new catalog product "${cleanName}" (${slug}) in category "${body.category}"`,
      details: {
        category: body.category,
        itemType,
        price,
        isPOR,
        sku: body.sku || 'N/A',
      },
      req,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: any) {
    console.error('[AdminCatalog] POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, action, ...updates } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Product id is required.' }, { status: 400 });
    }

    const existing = await ProductModel.findOne({ id }).lean();
    if (!existing) {
      return NextResponse.json({ success: false, error: `Product "${id}" not found.` }, { status: 404 });
    }

    // ── Action: ARCHIVE ──────────────────────────────────────────────────────────
    if (action === 'archive') {
      const updated = await ProductModel.findOneAndUpdate(
        { id },
        { isArchived: true, archivedAt: new Date() },
        { new: true }
      ).lean();

      await recordAuditLog({
        action: 'PRODUCT_ARCHIVED',
        entityId: id,
        entityName: existing.name,
        summary: `Archived catalog product "${existing.name}" (${id})`,
        req,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ── Action: UNARCHIVE ────────────────────────────────────────────────────────
    if (action === 'unarchive') {
      const updated = await ProductModel.findOneAndUpdate(
        { id },
        { isArchived: false, archivedAt: null },
        { new: true }
      ).lean();

      await recordAuditLog({
        action: 'PRODUCT_UNARCHIVED',
        entityId: id,
        entityName: existing.name,
        summary: `Restored archived product "${existing.name}" (${id}) to active catalog`,
        req,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ── Action: DUPLICATE ────────────────────────────────────────────────────────
    if (action === 'duplicate') {
      const nonce = Math.random().toString(36).slice(2, 6);
      const newSlug = `${existing.id}-copy-${nonce}`;
      const newName = `${existing.name} (Copy)`;

      const duplicatePayload = {
        ...existing,
        _id: undefined,
        id: newSlug,
        name: newName,
        sku: undefined, // Clear SKU to prevent collision
        isArchived: false,
        archivedAt: undefined,
        createdAt: undefined,
        updatedAt: undefined,
      };

      const duplicated = await ProductModel.create(duplicatePayload);

      await recordAuditLog({
        action: 'PRODUCT_DUPLICATED',
        entityId: newSlug,
        entityName: newName,
        summary: `Duplicated product "${existing.name}" into new draft "${newName}" (${newSlug})`,
        details: { originalId: id },
        req,
      });

      return NextResponse.json({ success: true, data: duplicated }, { status: 201 });
    }

    // ── Action: Standard Updates ─────────────────────────────────────────────────
    // Check SKU uniqueness if changing SKU
    if (updates.sku && updates.sku !== existing.sku) {
      const cleanSku = updates.sku.trim().toUpperCase();
      const skuConflict = await ProductModel.findOne({ sku: cleanSku, id: { $ne: id } }).lean();
      if (skuConflict) {
        return NextResponse.json(
          { success: false, error: `SKU "${cleanSku}" is already assigned to "${skuConflict.name}".` },
          { status: 409 }
        );
      }
      updates.sku = cleanSku;
    }

    // Standardize POR price representation
    if (updates.priceOnRequest === true) {
      updates.price = 0;
    }

    const updated = await ProductModel.findOneAndUpdate({ id }, updates, { new: true }).lean();

    await recordAuditLog({
      action: 'PRODUCT_UPDATED',
      entityId: id,
      entityName: updated?.name || existing.name,
      summary: `Updated product attributes for "${updated?.name || existing.name}" (${id})`,
      details: {
        updatedFields: Object.keys(updates),
      },
      req,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[AdminCatalog] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const confirm = searchParams.get('confirm');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product id parameter is required.' }, { status: 400 });
    }

    if (confirm !== 'true') {
      return NextResponse.json(
        { success: false, error: 'Explicit secondary confirmation parameter (confirm=true) is required for deletion.' },
        { status: 400 }
      );
    }

    const existing = await ProductModel.findOne({ id }).lean();
    if (!existing) {
      return NextResponse.json({ success: false, error: `Product "${id}" not found.` }, { status: 404 });
    }

    await ProductModel.deleteOne({ id });

    await recordAuditLog({
      action: 'PRODUCT_DELETED',
      entityId: id,
      entityName: existing.name,
      summary: `Permanently deleted product "${existing.name}" (${id}) from catalog`,
      req,
    });

    return NextResponse.json({ success: true, message: `Product ${id} deleted successfully.` });
  } catch (error: any) {
    console.error('[AdminCatalog] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
