import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { PRODUCTS } from '@/lib/data/products';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    SITE_CONFIG.url ||
    'https://marine-creatures-krgsrl5sn-codeverse1.vercel.app'
  ).replace(/\/$/, '');

  const now = new Date();

  // 1. Core Marketing & Public Discovery Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/marketplace`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/marketplace/lighting`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/aquarium-design`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/installation`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/renovation`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/our-worlds`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/shipping-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // 2. Dynamic Marketplace Products (Hybrid: MongoDB Atlas + fallback static catalog)
  const productIds = new Set<string>(PRODUCTS.map((p) => p.id));

  // Add individual Nemo high-intent alias routes
  productIds.add('nemo-e450');
  productIds.add('nemo-e600');
  productIds.add('nemo-e900');
  productIds.add('nemo-e1200');

  try {
    await connectToDatabase();
    const dbProducts = await ProductModel.find({}, 'id updatedAt').lean();
    if (dbProducts && Array.isArray(dbProducts)) {
      dbProducts.forEach((p: any) => {
        if (p.id) productIds.add(p.id);
      });
    }
  } catch {
    // Database connection fallback to static inventory
  }

  const productRoutes: MetadataRoute.Sitemap = Array.from(productIds).map(
    (id) => ({
      url: `${baseUrl}/marketplace/${id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: id.startsWith('nemo-') ? 0.9 : 0.85,
    })
  );

  // 3. Dynamic Case Studies from Worlds CMS (Strictly published, non-archived, indexed)
  const caseStudySlugs = new Set<string>([
    'alipore-penthouse-monolith',
    'sector-v-corporate-sanctuary',
    'ballygunge-heritage-villa-reef',
  ]);

  try {
    const CaseStudyModel = (await import('@/models/CaseStudy')).default;
    const dbStudies = await CaseStudyModel.find(
      { published: true, isArchived: { $ne: true }, noIndex: { $ne: true } },
      'slug id updatedAt'
    ).lean();
    if (dbStudies && Array.isArray(dbStudies)) {
      dbStudies.forEach((cs: any) => {
        if (cs.slug || cs.id) caseStudySlugs.add(cs.slug || cs.id);
      });
    }
  } catch {
    // Database fallback
  }

  const caseStudyRoutes: MetadataRoute.Sitemap = Array.from(caseStudySlugs).map(
    (slug) => ({
      url: `${baseUrl}/our-worlds/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  );

  return [...staticRoutes, ...productRoutes, ...caseStudyRoutes];
}

