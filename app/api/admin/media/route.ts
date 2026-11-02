import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { MediaModel } from '@/models/Media';
import { CaseStudyModel } from '@/models/CaseStudy';
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

    // ── Dedicated Product Media Query Handler ──
    const productId = searchParams.get('productId');
    if (productId && productId.trim()) {
      const cleanId = productId.trim().toLowerCase();
      const product = await ProductModel.findOne({ id: cleanId }).lean();

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product "${cleanId}" not found in catalog database.` },
          { status: 404 }
        );
      }

      // Find any database-uploaded media associated with this specific product
      const uploadedMedia = await MediaModel.find(
        { productId: cleanId },
        { data: 0 }
      )
        .sort({ createdAt: -1 })
        .lean();

      const images = Array.isArray(product.images) ? product.images : [];
      const imageStatus =
        product.imageStatus || (images.length > 0 ? 'VERIFIED' : 'NEEDS_MEDIA_ASSET');

      return NextResponse.json({
        success: true,
        count: images.length,
        data: {
          productId: product.id,
          name: product.name,
          imageStatus,
          images,
          media: product.media || [],
          uploadedMedia: uploadedMedia.map((m) => ({
            id: m.id,
            filename: m.filename,
            contentType: m.contentType,
            size: m.size,
            url: `/api/media/${m.id}`,
            altText: m.altText,
            createdAt: m.createdAt,
          })),
        },
      });
    }

    // ── Global Media Library & Asset Audit Handler ──
    const filter = searchParams.get('filter') || 'all'; // 'all', 'verified', 'blueprint', 'custom_uploads', 'product', 'case_study'
    const search = (searchParams.get('search') || '').trim();

    // 1. Gather all active product media assets
    const products = await ProductModel.find(
      { isArchived: { $ne: true } },
      { id: 1, name: 1, category: 1, categoryLabel: 1, images: 1, imageStatus: 1, media: 1 }
    ).lean();

    // 2. Gather case study media assets
    const caseStudies = await CaseStudyModel.find(
      {},
      { id: 1, title: 1, coverImage: 1, gallery: 1 }
    ).lean();

    // 3. Gather database uploaded media (exclude large binary buffer)
    const rawUploadedMedia = await MediaModel.find({}, { data: 0 })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const mediaList: Array<{
      id: string;
      sourceType: 'product' | 'case_study' | 'database_upload';
      parentName: string;
      parentId: string;
      url: string;
      imageStatus: 'VERIFIED' | 'NEEDS_MEDIA_ASSET' | 'UNVERIFIED';
      hasRealPhoto: boolean;
      format?: string;
      isPrimary?: boolean;
    }> = [];

    // Map all product images (preserving multiple images per product)
    products.forEach((p) => {
      const pImages = Array.isArray(p.images) ? p.images : [];
      const hasRealPhoto = pImages.length > 0 && Boolean(pImages[0]);
      const status = p.imageStatus === 'VERIFIED' || hasRealPhoto ? 'VERIFIED' : 'NEEDS_MEDIA_ASSET';

      if (pImages.length > 0) {
        pImages.forEach((imgUrl, imgIdx) => {
          mediaList.push({
            id: `prod-${p.id}-${imgIdx}`,
            sourceType: 'product',
            parentName: p.name + (pImages.length > 1 ? ` (Asset ${imgIdx + 1})` : ''),
            parentId: p.id,
            url: imgUrl,
            imageStatus: status,
            hasRealPhoto: true,
            format: imgUrl.split('.').pop()?.toUpperCase() || 'JPEG',
            isPrimary: imgIdx === 0,
          });
        });
      } else {
        mediaList.push({
          id: `prod-${p.id}-placeholder`,
          sourceType: 'product',
          parentName: p.name,
          parentId: p.id,
          url: '',
          imageStatus: status,
          hasRealPhoto: false,
          format: 'SVG_BLUEPRINT',
          isPrimary: true,
        });
      }
    });

    // Map case studies
    caseStudies.forEach((cs: any) => {
      const cover = cs.coverImage || cs.image;
      if (cover) {
        mediaList.push({
          id: `cs-${cs.id}-cover`,
          sourceType: 'case_study',
          parentName: cs.title,
          parentId: cs.id,
          url: cover,
          imageStatus: 'VERIFIED',
          hasRealPhoto: true,
          format: cover.split('.').pop()?.toUpperCase() || 'JPEG',
          isPrimary: true,
        });
      }
    });

    // Map database uploads
    rawUploadedMedia.forEach((um) => {
      mediaList.push({
        id: `upload-${um.id}`,
        sourceType: 'database_upload',
        parentName: um.filename,
        parentId: um.productId || um.id,
        url: `/api/media/${um.id}`,
        imageStatus: 'VERIFIED',
        hasRealPhoto: true,
        format: um.contentType?.split('/')[1]?.toUpperCase() || 'IMAGE',
        isPrimary: false,
      });
    });

    let filtered = mediaList;
    if (filter === 'verified') {
      filtered = filtered.filter((m) => m.hasRealPhoto);
    } else if (filter === 'blueprint') {
      filtered = filtered.filter((m) => !m.hasRealPhoto);
    } else if (filter === 'custom_uploads') {
      filtered = filtered.filter((m) => m.sourceType === 'database_upload');
    } else if (filter === 'product') {
      filtered = filtered.filter((m) => m.sourceType === 'product');
    } else if (filter === 'case_study') {
      filtered = filtered.filter((m) => m.sourceType === 'case_study');
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.parentName.toLowerCase().includes(q) ||
          m.parentId.toLowerCase().includes(q) ||
          m.url.toLowerCase().includes(q)
      );
    }

    const verifiedCount = mediaList.filter((m) => m.hasRealPhoto).length;
    const blueprintCount = mediaList.filter((m) => !m.hasRealPhoto).length;

    return NextResponse.json({
      success: true,
      counts: {
        total: mediaList.length,
        verified: verifiedCount,
        blueprint: blueprintCount,
        customUploads: rawUploadedMedia.length,
      },
      data: filtered,
    });
  } catch (error: any) {
    console.error('[AdminMedia] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve media data' },
      { status: 500 }
    );
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
    const body = await req.json().catch(() => ({}));
    const { productId, url, isPrimary } = body;

    if (!productId || typeof productId !== 'string' || !productId.trim()) {
      return NextResponse.json({ success: false, error: 'productId parameter is required.' }, { status: 400 });
    }

    if (!url || typeof url !== 'string' || !url.trim()) {
      return NextResponse.json({ success: false, error: 'url parameter is required.' }, { status: 400 });
    }

    // Validate URL structure
    const cleanUrl = url.trim();
    const isRelative = cleanUrl.startsWith('/');
    let isValidUrl = isRelative;
    if (!isRelative) {
      try {
        const parsed = new URL(cleanUrl);
        isValidUrl = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        isValidUrl = false;
      }
    }

    if (!isValidUrl) {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format. Provide a valid HTTP/HTTPS address or relative path.' },
        { status: 400 }
      );
    }

    const cleanProdId = productId.trim().toLowerCase();
    const product = await ProductModel.findOne({ id: cleanProdId });

    if (!product) {
      return NextResponse.json(
        { success: false, error: `Product "${cleanProdId}" not found.` },
        { status: 404 }
      );
    }

    const currentImages = Array.isArray(product.images) ? [...product.images] : [];
    let updatedImages: string[];

    if (isPrimary) {
      // Put at front
      updatedImages = [cleanUrl, ...currentImages.filter((u) => u !== cleanUrl)];
    } else {
      if (!currentImages.includes(cleanUrl)) {
        updatedImages = [...currentImages, cleanUrl];
      } else {
        updatedImages = currentImages;
      }
    }

    product.images = updatedImages;
    product.imageStatus = 'VERIFIED';
    await product.save();

    await recordAuditLog({
      action: 'PRODUCT_MEDIA_UPDATED',
      entityId: cleanProdId,
      entityName: product.name,
      summary: `Attached image asset to "${product.name}" (${cleanProdId})`,
      details: { attachedUrl: cleanUrl, isPrimary: Boolean(isPrimary), totalImages: updatedImages.length },
      req,
    });

    return NextResponse.json({
      success: true,
      message: 'Media asset attached successfully.',
      data: {
        productId: cleanProdId,
        images: updatedImages,
        imageStatus: product.imageStatus,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[AdminMedia] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to attach media asset' },
      { status: 500 }
    );
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
    const body = await req.json().catch(() => ({}));
    const { id, mediaId, productId, altText, images, imageStatus, primaryIndex } = body;

    const targetMediaId = id || mediaId;

    // 1. Update uploaded Media document metadata (e.g. altText, productId association)
    if (targetMediaId) {
      const cleanMediaId = targetMediaId.replace(/^upload-/, '').replace(/\.[^/.]+$/, '');
      const mediaItem = await MediaModel.findOne({ id: cleanMediaId });
      if (!mediaItem) {
        return NextResponse.json(
          { success: false, error: `Media asset "${cleanMediaId}" not found.` },
          { status: 404 }
        );
      }

      if (typeof altText === 'string') mediaItem.altText = altText.trim();
      if (typeof productId === 'string' && productId.trim()) {
        const prod = await ProductModel.findOne({ id: productId.trim().toLowerCase() }).lean();
        if (!prod) {
          return NextResponse.json(
            { success: false, error: `Cannot associate with non-existent product "${productId}".` },
            { status: 404 }
          );
        }
        mediaItem.productId = productId.trim().toLowerCase();
      }

      await mediaItem.save();

      await recordAuditLog({
        action: 'PRODUCT_MEDIA_UPDATED',
        entityId: cleanMediaId,
        entityName: mediaItem.filename,
        summary: `Updated media metadata for asset "${mediaItem.filename}" (${cleanMediaId})`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: 'Media asset metadata updated successfully.',
        data: {
          id: mediaItem.id,
          altText: mediaItem.altText,
          productId: mediaItem.productId,
        },
      });
    }

    // 2. Update Product media attributes (images array, reordering, primary designation, imageStatus)
    if (productId && typeof productId === 'string') {
      const cleanProdId = productId.trim().toLowerCase();
      const product = await ProductModel.findOne({ id: cleanProdId });
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product "${cleanProdId}" not found.` },
          { status: 404 }
        );
      }

      let modified = false;

      if (Array.isArray(images)) {
        product.images = images;
        modified = true;
      }

      if (typeof primaryIndex === 'number' && product.images && product.images.length > primaryIndex && primaryIndex >= 0) {
        const current = [...product.images];
        const [selected] = current.splice(primaryIndex, 1);
        product.images = [selected, ...current];
        modified = true;
      }

      if (imageStatus && ['VERIFIED', 'NEEDS_LICENSE_REVIEW', 'NEEDS_MEDIA_ASSET'].includes(imageStatus)) {
        product.imageStatus = imageStatus;
        modified = true;
      }

      if (modified) {
        await product.save();
        await recordAuditLog({
          action: 'PRODUCT_MEDIA_UPDATED',
          entityId: cleanProdId,
          entityName: product.name,
          summary: `Updated media configuration for "${product.name}" (${cleanProdId})`,
          details: { imageCount: product.images?.length, imageStatus: product.imageStatus },
          req,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Product media configuration updated successfully.',
        data: {
          productId: cleanProdId,
          images: product.images,
          imageStatus: product.imageStatus,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: 'Either (id/mediaId) or productId is required for PATCH update.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[AdminMedia] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update media configuration' },
      { status: 500 }
    );
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

    let id = searchParams.get('id');
    let productId = searchParams.get('productId');
    let url = searchParams.get('url');

    // Also check JSON body if not in query params
    if (!id && !productId && !url) {
      const body = await req.json().catch(() => ({}));
      id = body.id || body.mediaId;
      productId = body.productId;
      url = body.url;
    }

    if (!id && (!productId || !url)) {
      return NextResponse.json(
        { success: false, error: 'Media id or (productId + url) is required for deletion.' },
        { status: 400 }
      );
    }

    let deletedFromDb = false;
    let removedFromProduct = false;

    // 1. If media ID provided, check and delete from MediaModel
    if (id) {
      const cleanMediaId = id.replace(/^upload-/, '').replace(/\.[^/.]+$/, '');
      const mediaItem = await MediaModel.findOne({ id: cleanMediaId }).lean();
      if (!mediaItem) {
        return NextResponse.json(
          { success: false, error: `Media asset "${cleanMediaId}" not found.` },
          { status: 404 }
        );
      }

      await MediaModel.deleteOne({ id: cleanMediaId });
      deletedFromDb = true;

      // If it was linked to a product, also clean the product reference
      if (mediaItem.productId) {
        const mediaUrlPattern = new RegExp(cleanMediaId);
        await ProductModel.updateOne(
          { id: mediaItem.productId },
          { $pull: { images: { $regex: mediaUrlPattern } } }
        );
        removedFromProduct = true;
      }

      await recordAuditLog({
        action: 'PRODUCT_MEDIA_UPDATED',
        entityId: cleanMediaId,
        entityName: mediaItem.filename,
        summary: `Deleted uploaded media asset "${mediaItem.filename}" (${cleanMediaId})`,
        req,
      });
    }

    // 2. If productId and image URL provided, strictly verify product ownership before deletion
    if (productId && url) {
      const cleanProdId = productId.trim().toLowerCase();
      const prod = await ProductModel.findOne({ id: cleanProdId });
      if (!prod) {
        return NextResponse.json(
          { success: false, error: `Product "${cleanProdId}" not found.` },
          { status: 404 }
        );
      }

      if (!prod.images || !prod.images.includes(url)) {
        return NextResponse.json(
          { success: false, error: `Asset does not belong to product "${cleanProdId}". Cannot delete unrelated asset.` },
          { status: 404 }
        );
      }

      const updatedImages = prod.images.filter((u: string) => u !== url);
      prod.images = updatedImages;
      if (updatedImages.length === 0) {
        prod.imageStatus = 'NEEDS_MEDIA_ASSET';
      }
      await prod.save();
      removedFromProduct = true;

      await recordAuditLog({
        action: 'PRODUCT_MEDIA_UPDATED',
        entityId: cleanProdId,
        entityName: prod.name,
        summary: `Removed image asset from product "${prod.name}" (${cleanProdId})`,
        details: { removedUrl: url, remainingCount: updatedImages.length },
        req,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Media asset removed successfully.',
      deletedFromDb,
      removedFromProduct,
    });
  } catch (error: any) {
    console.error('[AdminMedia] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete media asset' },
      { status: 500 }
    );
  }
}
