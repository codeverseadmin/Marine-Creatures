import { MetadataRoute } from 'next';
import { SITE_CONFIG } from '@/lib/config';
import { PRODUCTS } from '@/lib/data/products';
import { SPECIES } from '@/lib/data/species';
import { PROJECTS } from '@/lib/data/projects';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.url || 'https://marinecreatures.com').replace(/\/$/, '');
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
      url: `${baseUrl}/marine-life`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/aquarium-design`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/installation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/renovation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/our-worlds`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/materials`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
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
  ];

  // 2. Dynamic Marketplace Products (Hybrid: MongoDB Atlas + fallback static catalog)
  const productIds = new Set<string>(PRODUCTS.map((p) => p.id));
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

  const productRoutes: MetadataRoute.Sitemap = Array.from(productIds).map((id) => ({
    url: `${baseUrl}/marketplace/${id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  // 3. Dynamic Marine Life Species Encyclopedia
  const speciesRoutes: MetadataRoute.Sitemap = SPECIES.map((s) => ({
    url: `${baseUrl}/marine-life/${s.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // 4. Dynamic Portfolio Living Worlds & Architectural Commissions
  const projectRoutes: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: `${baseUrl}/our-worlds/${p.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  return [...staticRoutes, ...productRoutes, ...speciesRoutes, ...projectRoutes];
}
