import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { BannerModel } from '@/models/Banner';
import { SettingModel } from '@/models/Setting';
import { PRODUCTS } from '@/lib/data/products';
import { DEFAULT_BANNERS } from '@/lib/data/banners';
import { isAdminRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    // 1. Seed Products
    await ProductModel.deleteMany({});
    await ProductModel.insertMany(PRODUCTS);

    // 2. Seed Banners
    await BannerModel.deleteMany({});
    const bannerDocs = DEFAULT_BANNERS.map((b, idx) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      badge: b.badge,
      badgeColor: b.badgeColor,
      ctaText: b.ctaText,
      ctaLink: b.ctaLink,
      image: b.image,
      active: b.isActive,
      order: idx,
    }));
    await BannerModel.insertMany(bannerDocs);

    // 3. Seed Owner Signature default if missing
    await SettingModel.findOneAndUpdate(
      { key: 'ownerSignature' },
      { value: null },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'MongoDB Atlas database successfully seeded with official Marine Creatures catalog & banners!',
      counts: {
        products: PRODUCTS.length,
        banners: bannerDocs.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
