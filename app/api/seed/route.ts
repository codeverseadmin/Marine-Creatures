import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { BannerModel } from '@/models/Banner';
import { SettingModel } from '@/models/Setting';
import { PRODUCTS } from '@/lib/data/products';
import { DEFAULT_BANNERS } from '@/lib/data/banners';
import { requireAuthenticatedEmployee, recordAuditLog } from '@/lib/rbac/guard';
import { getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // SEC-RBAC-P0-01 Remediation: Permanent protection against catastrophic catalog data wipes
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Database seeding is permanently disabled in production environments' },
      { status: 403 }
    );
  }

  // Non-production seeding strictly requires an explicit environment flag
  if (process.env.ALLOW_SEEDING !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Database seeding is disabled. Set ALLOW_SEEDING=true in local development to enable.' },
      { status: 403 }
    );
  }

  // Must be authenticated Owner
  const { auth, errorResponse } = await requireAuthenticatedEmployee(req);
  if (errorResponse) return errorResponse;

  if (!auth!.isOwner) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: Only an Owner may trigger development database seeding' },
      { status: 403 }
    );
  }

  try {
    const ip = getClientIp(req);
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

    await recordAuditLog({
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'setting',
      entityId: 'seed',
      entityName: 'Database Seeder',
      summary: 'Executed development database seeding for products and banners',
      actor: auth!.actorEmail,
      ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Development database successfully seeded with official Marine Creatures catalog & banners!',
      counts: {
        products: PRODUCTS.length,
        banners: bannerDocs.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
