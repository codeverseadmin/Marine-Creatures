import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { connectToDatabase } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { BannerModel } from '@/models/Banner';
import { InquiryModel } from '@/models/Inquiry';
import { SettingModel } from '@/models/Setting';
import { SnapshotModel } from '@/models/Snapshot';
import { isAdminRequest } from '@/lib/auth';

function isAuthorized(req: NextRequest): boolean {
  if (isAdminRequest(req)) return true;

  // Support Vercel Cron / GitHub Actions Bearer Token
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin or Cron authentication required' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const snapshot = await SnapshotModel.findOne({ id }).lean();
      if (!snapshot) {
        return NextResponse.json({ success: false, error: 'Snapshot not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: snapshot });
    }

    // List recent snapshots without bulky data payload
    const snapshots = await SnapshotModel.find({}, { data: 0 })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      count: snapshots.length,
      data: snapshots,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin or Cron authentication required' }, { status: 401 });
  }

  try {
    await connectToDatabase();

    const isCron = Boolean(
      process.env.CRON_SECRET &&
      req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
    );

    const source = isCron ? 'automated_cron' : 'admin_manual';
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const snapshotId = `snapshot-${dateStr}-${Math.random().toString(36).slice(2, 6)}`;
    const label = `${isCron ? '🤖 Automated Nightly Backup' : '👤 Manual Admin Snapshot'} — ${now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    // Collect all collections from MongoDB Atlas
    const [products, orders, banners, inquiries, settings] = await Promise.all([
      ProductModel.find({}).lean(),
      OrderModel.find({}).lean(),
      BannerModel.find({}).lean(),
      InquiryModel.find({}).lean(),
      SettingModel.find({}).lean(),
    ]);

    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    const snapshotPayload = {
      products,
      orders,
      banners,
      inquiries,
      settings: settingsMap,
    };

    const serializedData = JSON.stringify(snapshotPayload);
    const checksum = createHash('sha256').update(serializedData).digest('hex');
    const sizeBytes = Buffer.byteLength(serializedData, 'utf-8');

    const counts = {
      products: products.length,
      orders: orders.length,
      banners: banners.length,
      inquiries: inquiries.length,
    };

    const newSnapshot = await SnapshotModel.create({
      id: snapshotId,
      label,
      source,
      counts,
      data: snapshotPayload,
      checksum,
      sizeBytes,
      createdAt: now,
    });

    // Retention policy: Keep only the latest 30 snapshots to keep database lean
    const excessSnapshots = await SnapshotModel.find({}, { _id: 1 })
      .sort({ createdAt: -1 })
      .skip(30)
      .lean();

    if (excessSnapshots.length > 0) {
      const idsToDelete = excessSnapshots.map((s) => s._id);
      await SnapshotModel.deleteMany({ _id: { $in: idsToDelete } });
    }

    return NextResponse.json({
      success: true,
      message: 'Cloud snapshot successfully captured and secured in MongoDB Atlas',
      snapshot: {
        id: newSnapshot.id,
        label: newSnapshot.label,
        source: newSnapshot.source,
        counts: newSnapshot.counts,
        sizeBytes: newSnapshot.sizeBytes,
        checksum: newSnapshot.checksum,
        createdAt: newSnapshot.createdAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Restore strictly requires interactive admin credentials
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges required to restore snapshots' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { snapshotId } = body;

    if (!snapshotId) {
      return NextResponse.json({ success: false, error: 'Snapshot ID is required for restoration' }, { status: 400 });
    }

    const snapshot = await SnapshotModel.findOne({ id: snapshotId });
    if (!snapshot || !snapshot.data) {
      return NextResponse.json({ success: false, error: 'Snapshot not found or corrupted' }, { status: 404 });
    }

    const { products, orders, banners, inquiries } = snapshot.data;

    // Safely re-populate collections
    if (Array.isArray(products) && products.length > 0) {
      await ProductModel.deleteMany({});
      await ProductModel.insertMany(products);
    }

    if (Array.isArray(orders) && orders.length > 0) {
      await OrderModel.deleteMany({});
      await OrderModel.insertMany(orders);
    }

    if (Array.isArray(banners) && banners.length > 0) {
      await BannerModel.deleteMany({});
      await BannerModel.insertMany(banners);
    }

    if (Array.isArray(inquiries) && inquiries.length > 0) {
      await InquiryModel.deleteMany({});
      await InquiryModel.insertMany(inquiries);
    }

    return NextResponse.json({
      success: true,
      message: `Database successfully restored from snapshot #${snapshotId}`,
      restoredCounts: {
        products: products?.length || 0,
        orders: orders?.length || 0,
        banners: banners?.length || 0,
        inquiries: inquiries?.length || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
