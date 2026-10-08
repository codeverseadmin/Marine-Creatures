import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { MediaModel } from '@/models/Media';
import { CaseStudyModel } from '@/models/CaseStudy';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const filter = searchParams.get('filter') || 'all'; // 'all', 'verified', 'blueprint', 'custom_uploads'
    const search = (searchParams.get('search') || '').trim();

    // 1. Gather all product media assets
    const products = await ProductModel.find(
      { isArchived: { $ne: true } },
      { id: 1, name: 1, category: 1, categoryLabel: 1, images: 1, imageStatus: 1, media: 1 }
    ).lean();

    // 2. Gather case study media assets
    const caseStudies = await CaseStudyModel.find(
      {},
      { id: 1, title: 1, coverImage: 1, gallery: 1 }
    ).lean();

    // 3. Gather database uploaded media
    const rawUploadedMedia = await MediaModel.find({}, { data: 0 })
      .sort({ createdAt: -1 })
      .limit(100)
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
    }> = [];

    products.forEach((p) => {
      const hasRealPhoto = Boolean(p.images && p.images.length > 0 && p.images[0]);
      const status = p.imageStatus === 'VERIFIED' || hasRealPhoto ? 'VERIFIED' : 'NEEDS_MEDIA_ASSET';
      const primaryUrl = hasRealPhoto ? p.images[0] : '';

      mediaList.push({
        id: `prod-${p.id}`,
        sourceType: 'product',
        parentName: p.name,
        parentId: p.id,
        url: primaryUrl,
        imageStatus: status,
        hasRealPhoto,
        format: primaryUrl ? primaryUrl.split('.').pop()?.toUpperCase() : 'SVG_BLUEPRINT',
      });
    });

    caseStudies.forEach((cs) => {
      if (cs.image) {
        mediaList.push({
          id: `cs-${cs.id}`,
          sourceType: 'case_study',
          parentName: cs.title,
          parentId: cs.id,
          url: cs.image,
          imageStatus: 'VERIFIED',
          hasRealPhoto: true,
          format: cs.image.split('.').pop()?.toUpperCase(),
        });
      }
    });

    rawUploadedMedia.forEach((um) => {
      mediaList.push({
        id: `upload-${um.id}`,
        sourceType: 'database_upload',
        parentName: um.filename,
        parentId: um.id,
        url: `/api/media/${um.id}`,
        imageStatus: 'VERIFIED',
        hasRealPhoto: true,
        format: um.contentType?.split('/')[1]?.toUpperCase() || 'IMAGE',
      });
    });

    let filtered = mediaList;
    if (filter === 'verified') {
      filtered = filtered.filter((m) => m.hasRealPhoto);
    } else if (filter === 'blueprint') {
      filtered = filtered.filter((m) => !m.hasRealPhoto);
    } else if (filter === 'custom_uploads') {
      filtered = filtered.filter((m) => m.sourceType === 'database_upload');
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
