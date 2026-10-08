import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { CaseStudyModel } from '@/models/CaseStudy';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const [products, caseStudies] = await Promise.all([
      ProductModel.find(
        { isArchived: { $ne: true } },
        { id: 1, name: 1, slug: 1, categoryLabel: 1, shortDesc: 1, description: 1, images: 1, seo: 1, imageStatus: 1 }
      ).lean(),
      CaseStudyModel.find(
        { status: 'published' },
        { id: 1, title: 1, slug: 1, excerpt: 1, coverImage: 1, seo: 1 }
      ).lean(),
    ]);

    let productsWithGoodTitle = 0;
    let productsWithGoodDesc = 0;
    let productsWithCanonical = 0;
    let productsWithImage = 0;

    const auditedProducts = products.map((p) => {
      const titleStr = p.seoTitle || p.name || '';
      const descStr = p.seoDescription || p.shortDesc || p.description || '';
      const hasTitle = Boolean(titleStr.length >= 10);
      const hasDesc = Boolean(descStr.length >= 30);
      const hasImage = Boolean(p.images && p.images.length > 0 && p.images[0]);
      const hasCanonical = Boolean(p.canonicalOverride || p.id);

      if (hasTitle) productsWithGoodTitle++;
      if (hasDesc) productsWithGoodDesc++;
      if (hasCanonical) productsWithCanonical++;
      if (hasImage) productsWithImage++;

      const isComplete = hasTitle && hasDesc && hasCanonical;

      return {
        id: p.id,
        name: p.name,
        type: 'product',
        slug: p.id,
        url: `/marketplace/${p.id}`,
        title: titleStr,
        description: descStr.slice(0, 150),
        hasTitle,
        hasDesc,
        hasImage,
        hasCanonical,
        isComplete,
        imageStatus: p.imageStatus,
      };
    });

    const staticPages = [
      { url: '/', title: 'Marine Creatures — Luxury Marine Marketplace & Architectural Aquaria', hasDesc: true, hasCanonical: true, isComplete: true },
      { url: '/marketplace', title: 'Marine Marketplace — Living Reef Specimens & Precision Equipment', hasDesc: true, hasCanonical: true, isComplete: true },
      { url: '/our-worlds', title: 'Our Worlds — Living Marine Sanctuaries & Architectural Installations', hasDesc: true, hasCanonical: true, isComplete: true },
      { url: '/about', title: 'About Us — Maritime Biotope Pioneers | Marine Creatures', hasDesc: true, hasCanonical: true, isComplete: true },
      { url: '/services', title: 'Bespoke Marine Architecture & Maintenance Services', hasDesc: true, hasCanonical: true, isComplete: true },
      { url: '/contact', title: 'Concierge Inquiry & Consultation — Marine Creatures', hasDesc: true, hasCanonical: true, isComplete: true },
    ];

    const totalAudited = auditedProducts.length + staticPages.length + caseStudies.length;
    const totalComplete = auditedProducts.filter((p) => p.isComplete).length + staticPages.length + caseStudies.length;
    const healthPercentage = Math.round((totalComplete / totalAudited) * 100);

    return NextResponse.json({
      success: true,
      stats: {
        totalAudited,
        totalComplete,
        healthPercentage,
        productsWithGoodTitle,
        productsWithGoodDesc,
        productsWithCanonical,
        productsWithImage,
      },
      products: auditedProducts,
      staticPages,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
