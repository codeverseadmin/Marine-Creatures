import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import CaseStudyModel from '@/models/CaseStudy';
import { serializePublicCaseStudy, serializePreviewCaseStudy } from '@/lib/worlds/serializer';
import { isAdminRequest } from '@/lib/auth';
import { ensureWorldsSeeded } from '@/lib/data/worlds';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    await ensureWorldsSeeded();

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug')?.trim();
    const isPreview = searchParams.get('preview') === 'true';

    // 1. Single Case Study Request
    if (slug) {
      // If preview mode requested, strictly require valid admin session
      if (isPreview) {
        if (!isAdminRequest(req)) {
          return NextResponse.json({ success: false, error: 'Case Study not found.' }, { status: 404 });
        }

        const draftDoc = await CaseStudyModel.findOne({
          $or: [{ id: slug }, { slug }],
        }).lean();

        if (!draftDoc) {
          return NextResponse.json({ success: false, error: 'Case Study not found.' }, { status: 404 });
        }

        const previewData = serializePreviewCaseStudy(draftDoc);
        if (!previewData) {
          return NextResponse.json({ success: false, error: 'Unable to preview case study.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: previewData, isPreview: true });
      }

      // Public Query: STRICTLY published and non-archived
      const publicDoc = await CaseStudyModel.findOne({
        $or: [{ id: slug }, { slug }],
        published: true,
        isArchived: { $ne: true },
      }).lean();

      if (!publicDoc) {
        return NextResponse.json({ success: false, error: 'Case Study not found.' }, { status: 404 });
      }

      const publicData = serializePublicCaseStudy(publicDoc);
      if (!publicData) {
        return NextResponse.json({ success: false, error: 'Case Study not found.' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: publicData });
    }

    // 2. Portfolio Collection Request: STRICTLY published, non-archived
    const caseStudies = await CaseStudyModel.find({
      published: true,
      isArchived: { $ne: true },
    })
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .lean();

    const serializedList = caseStudies
      .map((cs) => serializePublicCaseStudy(cs))
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      success: true,
      count: serializedList.length,
      data: serializedList,
    });
  } catch (err: any) {
    console.error('[PublicWorlds] GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
