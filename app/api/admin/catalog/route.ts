import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';
import { resolveAuthoritativeProduct, validateSlugAvailability, sanitizeSlug } from '@/lib/services/product-resolution';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'products.read');
  if (errorResponse) return errorResponse;

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
  const { auth, errorResponse } = await requirePermission(req, 'products.create');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();

    // Validation
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Product name is required.' }, { status: 400 });
    }

    const cleanName = body.name.trim();

    // Generate or validate slug
    let slug = sanitizeSlug(body.id || body.slug || '');
    if (!slug) {
      slug = sanitizeSlug(cleanName);
    }

    // Verify slug uniqueness
    const slugCheck = await validateSlugAvailability(slug);
    if (!slugCheck.available) {
      return NextResponse.json(
        { success: false, error: slugCheck.reason || `Slug "${slug}" is already in use.` },
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

    // Default warranty status for new products: DISABLED until explicitly configured (MC-FEATURE-PRODUCT-WARRANTY-V1)
    const defaultWarranty = {
      enabled: false,
      provider: 'manufacturer' as const,
      durationValue: 1,
      durationUnit: 'years' as const,
      terms: '',
      internalNotes: '',
    };

    let validatedWarranty = defaultWarranty;
    if (body.warranty && typeof body.warranty === 'object') {
      validatedWarranty = {
        enabled: Boolean(body.warranty.enabled),
        provider: ['manufacturer', 'seller'].includes(body.warranty.provider) ? body.warranty.provider : 'manufacturer',
        durationValue: typeof body.warranty.durationValue === 'number' && body.warranty.durationValue > 0 ? body.warranty.durationValue : 1,
        durationUnit: ['days', 'months', 'years'].includes(body.warranty.durationUnit) ? body.warranty.durationUnit : 'years',
        terms: typeof body.warranty.terms === 'string' ? body.warranty.terms.slice(0, 5000) : '',
        internalNotes: typeof body.warranty.internalNotes === 'string' ? body.warranty.internalNotes.slice(0, 5000) : '',
      };
    }

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
      warranty: validatedWarranty,
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
  const { auth, errorResponse } = await requirePermission(req, 'products.update');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, canonicalId, _id, action, ...updates } = body;

    const targetIdentifier = canonicalId || _id || id;
    if (!targetIdentifier || typeof targetIdentifier !== 'string') {
      return NextResponse.json({ success: false, error: 'Product id is required.' }, { status: 400 });
    }

    const existing = await resolveAuthoritativeProduct(targetIdentifier, { lean: true });
    if (!existing || !existing.id) {
      return NextResponse.json({ success: false, error: `Product "${targetIdentifier}" not found.` }, { status: 404 });
    }

    const resolvedCanonicalId = existing.id;

    // ── Action: ARCHIVE ──────────────────────────────────────────────────────────
    if (action === 'archive') {
      const updated = await ProductModel.findOneAndUpdate(
        { id: resolvedCanonicalId },
        { isArchived: true, archivedAt: new Date() },
        { new: true }
      ).lean();

      await recordAuditLog({
        action: 'PRODUCT_ARCHIVED',
        entityId: resolvedCanonicalId,
        entityName: existing.name,
        summary: `Archived catalog product "${existing.name}" (${resolvedCanonicalId})`,
        req,
      });

      return NextResponse.json({ success: true, data: updated });
    }

    // ── Action: UNARCHIVE ────────────────────────────────────────────────────────
    if (action === 'unarchive') {
      const updated = await ProductModel.findOneAndUpdate(
        { id: resolvedCanonicalId },
        { isArchived: false, archivedAt: null },
        { new: true }
      ).lean();

      await recordAuditLog({
        action: 'PRODUCT_UNARCHIVED',
        entityId: resolvedCanonicalId,
        entityName: existing.name,
        summary: `Restored archived product "${existing.name}" (${resolvedCanonicalId}) to active catalog`,
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
        slug: newSlug,
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
        details: { originalId: resolvedCanonicalId },
        req,
      });

      return NextResponse.json({ success: true, data: duplicated }, { status: 201 });
    }

    // ── Action: Standard Updates ─────────────────────────────────────────────────
    // Prevent client mutation of primary database keys
    delete (updates as any)._id;
    delete (updates as any).id;
    delete (updates as any).canonicalId;

    // Handle public marketplace slug update
    if (typeof updates.slug === 'string') {
      const cleanSlug = sanitizeSlug(updates.slug);
      if (!cleanSlug) {
        delete updates.slug;
      } else {
        updates.slug = cleanSlug;
        if (cleanSlug !== existing.slug && cleanSlug !== resolvedCanonicalId) {
          const availability = await validateSlugAvailability(cleanSlug, resolvedCanonicalId, existing._id?.toString());
          if (!availability.available) {
            return NextResponse.json(
              { success: false, error: availability.reason || `Slug "${cleanSlug}" is already in use.` },
              { status: 409 }
            );
          }
        }
      }
    }

    // Check SKU uniqueness if changing SKU
    if (updates.sku && updates.sku !== existing.sku) {
      const cleanSku = updates.sku.trim().toUpperCase();
      const skuConflict = await ProductModel.findOne({ sku: cleanSku, id: { $ne: resolvedCanonicalId } }).lean();
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

    // Warranty payload validation & normalization (MC-FEATURE-PRODUCT-WARRANTY-V1)
    if (updates.warranty !== undefined) {
      if (typeof updates.warranty !== 'object' || updates.warranty === null) {
        return NextResponse.json(
          { success: false, error: 'Invalid warranty payload. Must be an object.' },
          { status: 400 }
        );
      }

      const enabled = Boolean(updates.warranty.enabled);
      const provider = ['manufacturer', 'seller'].includes(updates.warranty.provider)
        ? updates.warranty.provider
        : 'manufacturer';
      const durationValue =
        typeof updates.warranty.durationValue === 'number' && updates.warranty.durationValue > 0
          ? updates.warranty.durationValue
          : 1;
      const durationUnit = ['days', 'months', 'years'].includes(updates.warranty.durationUnit)
        ? updates.warranty.durationUnit
        : 'years';
      const terms = typeof updates.warranty.terms === 'string' ? updates.warranty.terms.slice(0, 5000) : '';
      const internalNotes = typeof updates.warranty.internalNotes === 'string' ? updates.warranty.internalNotes.slice(0, 5000) : '';

      updates.warranty = {
        enabled,
        provider,
        durationValue,
        durationUnit,
        terms,
        internalNotes,
      };
    }

    const updated = await ProductModel.findOneAndUpdate({ id: resolvedCanonicalId }, updates, { new: true }).lean();

    await recordAuditLog({
      action: 'PRODUCT_UPDATED',
      entityId: resolvedCanonicalId,
      entityName: updated?.name || existing.name,
      summary: `Updated product attributes for "${updated?.name || existing.name}" (${resolvedCanonicalId})`,
      details: {
        updatedFields: Object.keys(updates),
      },
      req,
    });

    // Granular Audit Log for Warranty Configuration Changes (MC-FEATURE-PRODUCT-WARRANTY-V1)
    if (updates.warranty !== undefined) {
      const previousWarranty = existing.warranty || {
        enabled: false,
        provider: 'manufacturer',
        durationValue: 1,
        durationUnit: 'years',
        terms: '',
        internalNotes: '',
      };

      const statusLabel = updates.warranty.enabled ? 'ENABLED' : 'DISABLED';
      await recordAuditLog({
        action: 'PRODUCT_WARRANTY_UPDATED',
        entityType: 'product',
        entityId: resolvedCanonicalId,
        entityName: updated?.name || existing.name,
        summary: `Updated warranty configuration for "${updated?.name || existing.name}" (${resolvedCanonicalId}): ${statusLabel}`,
        details: {
          previousWarranty,
          newWarranty: updates.warranty,
          actor: auth.actorEmail || 'mc_admin_session',
          changedAt: new Date().toISOString(),
        },
        req,
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[AdminCatalog] PATCH error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'products.archive');
  if (errorResponse) return errorResponse;

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

    const existing = await resolveAuthoritativeProduct(id, { lean: true });
    if (!existing || !existing.id) {
      return NextResponse.json({ success: false, error: `Product "${id}" not found.` }, { status: 404 });
    }

    await ProductModel.deleteOne({ id: existing.id });

    await recordAuditLog({
      action: 'PRODUCT_DELETED',
      entityId: existing.id,
      entityName: existing.name,
      summary: `Permanently deleted product "${existing.name}" (${existing.id}) from catalog`,
      req,
    });

    return NextResponse.json({ success: true, message: `Product ${existing.id} deleted successfully.` });
  } catch (error: any) {
    console.error('[AdminCatalog] DELETE error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
