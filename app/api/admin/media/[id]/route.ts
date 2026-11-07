import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { MediaModel } from '@/models/Media';
import { requirePermission, requireAuthenticatedEmployee } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';
import { resolveAuthoritativeProduct } from '@/lib/services/product-resolution';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await requirePermission(req, 'media.read');
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Asset ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const cleanId = id.trim();

    // 1. Check if ID matches a catalog product
    const product = await resolveAuthoritativeProduct(cleanId, { lean: true });
    if (product && product.id) {
      const uploadedMedia = await MediaModel.find({ productId: product.id }, { data: 0 })
        .sort({ createdAt: -1 })
        .lean();

      const images = Array.isArray(product.images) ? product.images : [];
      return NextResponse.json({
        success: true,
        type: 'product',
        data: {
          productId: product.id,
          name: product.name,
          imageStatus: product.imageStatus || (images.length > 0 ? 'VERIFIED' : 'NEEDS_MEDIA_ASSET'),
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

    // 2. Check if ID matches an uploaded media document in MediaModel
    const cleanMediaId = id.replace(/^upload-/, '').replace(/\.[^/.]+$/, '');
    const mediaItem = await MediaModel.findOne({ id: cleanMediaId }, { data: 0 }).lean();
    if (mediaItem) {
      return NextResponse.json({
        success: true,
        type: 'uploaded_media',
        data: {
          id: mediaItem.id,
          productId: mediaItem.productId,
          altText: mediaItem.altText,
          filename: mediaItem.filename,
          contentType: mediaItem.contentType,
          size: mediaItem.size,
          type: mediaItem.type,
          url: `/api/media/${mediaItem.id}`,
          createdAt: mediaItem.createdAt,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: `Media record or product "${id}" not found.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[AdminMediaId] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve media record' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await requirePermission(req, 'media.upload');
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Asset ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const cleanId = id.trim().toLowerCase();
    const body = await req.json().catch(() => ({}));
    const { altText, productId, images, imageStatus, primaryIndex } = body;

    // Check if ID is a product
    const product = await ProductModel.findOne({ id: cleanId });
    if (product) {
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
          entityId: cleanId,
          entityName: product.name,
          summary: `Updated media settings for product "${product.name}" (${cleanId})`,
          details: { imageCount: product.images?.length, imageStatus: product.imageStatus },
          req,
        });
      }

      return NextResponse.json({
        success: true,
        message: `Media configuration for product "${cleanId}" updated.`,
        data: {
          productId: cleanId,
          images: product.images,
          imageStatus: product.imageStatus,
        },
      });
    }

    // Check if ID is an uploaded media item
    const cleanMediaId = id.replace(/^upload-/, '').replace(/\.[^/.]+$/, '');
    const mediaItem = await MediaModel.findOne({ id: cleanMediaId });
    if (mediaItem) {
      if (typeof altText === 'string') mediaItem.altText = altText.trim();
      if (typeof productId === 'string' && productId.trim()) {
        const prod = await ProductModel.findOne({ id: productId.trim().toLowerCase() }).lean();
        if (!prod) {
          return NextResponse.json(
            { success: false, error: `Product "${productId}" does not exist.` },
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
        summary: `Updated metadata for media asset "${mediaItem.filename}" (${cleanMediaId})`,
        req,
      });

      return NextResponse.json({
        success: true,
        message: `Metadata for media asset "${cleanMediaId}" updated.`,
        data: {
          id: mediaItem.id,
          altText: mediaItem.altText,
          productId: mediaItem.productId,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: `Media record or product "${id}" not found.` },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[AdminMediaId] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update media record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { auth, errorResponse } = await requirePermission(req, 'media.delete');
  if (errorResponse) return errorResponse;

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Asset ID required' }, { status: 400 });
    }

    await connectToDatabase();
    const cleanMediaId = id.replace(/^upload-/, '').replace(/\.[^/.]+$/, '');

    const mediaItem = await MediaModel.findOne({ id: cleanMediaId }).lean();
    if (!mediaItem) {
      return NextResponse.json(
        { success: false, error: `Media asset "${id}" not found.` },
        { status: 404 }
      );
    }

    await MediaModel.deleteOne({ id: cleanMediaId });

    if (mediaItem.productId) {
      const mediaUrlPattern = new RegExp(cleanMediaId);
      await ProductModel.updateOne(
        { id: mediaItem.productId },
        { $pull: { images: { $regex: mediaUrlPattern } } }
      );
    }

    await recordAuditLog({
      action: 'PRODUCT_MEDIA_UPDATED',
      entityId: cleanMediaId,
      entityName: mediaItem.filename,
      summary: `Deleted uploaded media asset "${mediaItem.filename}" (${cleanMediaId})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Media asset "${mediaItem.filename}" deleted successfully.`,
    });
  } catch (error: any) {
    console.error('[AdminMediaId] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete media asset' },
      { status: 500 }
    );
  }
}
