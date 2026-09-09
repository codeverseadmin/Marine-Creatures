import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { BannerModel } from '@/models/Banner';
import { DEFAULT_BANNERS } from '@/lib/data/banners';
import { isAdminRequest } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();
    let banners = await BannerModel.find({}).sort({ order: 1, priority: 1 }).lean();

    if (!banners || banners.length === 0) {
      console.log('🌱 Seeding initial promo banners into MongoDB Atlas...');
      try {
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
