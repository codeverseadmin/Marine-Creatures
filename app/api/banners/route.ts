import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BannerModel } from '@/models/Banner';
import { DEFAULT_BANNERS } from '@/lib/data/banners';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    let banners = await BannerModel.find({}).sort({ order: 1, priority: 1 }).lean();

    // Validate banner images: if any image points to missing local '/images/banners/' path or outdated asset, upgrade to approved DEFAULT_BANNERS
    const hasOutdatedPaths = banners && banners.some((b: any) => typeof b.image === 'string' && (b.image.startsWith('/images/banners/') || b.image.includes('photo-1559827260-dc66d52bef19') || b.image.includes('photo-1584308666744-24d5c474f2ae')));

    if (!banners || banners.length === 0 || hasOutdatedPaths) {
      console.log('🌱 Seeding approved promo banners into MongoDB Atlas...');
      try {
        if (hasOutdatedPaths) {
          await BannerModel.deleteMany({});
        }
        const mapped = DEFAULT_BANNERS.map((b, idx) => ({
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
        await BannerModel.insertMany(mapped, { ordered: false });
        banners = await BannerModel.find({}).sort({ order: 1 }).lean();
      } catch (err) {
        console.warn('Banners seed notice:', err);
        banners = await BannerModel.find({}).sort({ order: 1 }).lean();
      }
    }

    return NextResponse.json({ success: true, count: banners.length, data: banners });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      fallback: true,
      data: DEFAULT_BANNERS,
      error: error.message,
    });
  }
}

/**
 * PATCH /api/banners
 * Removes any banners whose title or subtitle contains known test/placeholder
 * strings. If all banners are removed, re-seeds from DEFAULT_BANNERS.
 * Requires admin authentication.
 */
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();

    // Known invalid patterns (case-insensitive)
    const invalidPatterns = ['jni na', 'hi bro'];
    const regexParts = invalidPatterns.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const invalidRegex = new RegExp(regexParts, 'i');

    const deleted = await BannerModel.deleteMany({
      $or: [
        { title: { $regex: invalidRegex } },
        { subtitle: { $regex: invalidRegex } },
      ],
    });

    // If no valid banners remain, re-seed from DEFAULT_BANNERS
    const remaining = await BannerModel.countDocuments();
    let seeded = 0;
    if (remaining === 0) {
      const mapped = DEFAULT_BANNERS.map((b, idx) => ({
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
      await BannerModel.insertMany(mapped, { ordered: false });
      seeded = mapped.length;
    }

    return NextResponse.json({
      success: true,
      removed: deleted.deletedCount,
      seeded,
      message: `Removed ${deleted.deletedCount} invalid banner(s).${
        seeded > 0 ? ` Re-seeded ${seeded} default banners.` : ''
      }`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const body = await req.json();
    if (!body.id || !body.title) {
      return NextResponse.json({ success: false, error: 'id and title required' }, { status: 400 });
    }
    const banner = await BannerModel.create(body);
    return NextResponse.json({ success: true, data: banner }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }
    const updated = await BannerModel.findOneAndUpdate({ id }, updates, { new: true, upsert: false }).lean();
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }
    await BannerModel.deleteOne({ id });
    return NextResponse.json({ success: true, message: `Banner ${id} removed` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
