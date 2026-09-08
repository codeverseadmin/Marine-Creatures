import { NextResponse } from 'next/server';
import { connectToDatabase, isDatabaseConfigured } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { InquiryModel } from '@/models/Inquiry';
import { BannerModel } from '@/models/Banner';

export async function GET() {
  const configured = isDatabaseConfigured();
  if (!configured) {
    return NextResponse.json({
      connected: false,
      status: 'unconfigured',
      message: 'MONGODB_URI is not configured in environment variables.',
      timestamp: new Date().toISOString(),
    });
  }

  const start = Date.now();
  try {
    await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database handle is undefined');
    }

    // Ping admin
    await db.admin().ping();
    const latency = Date.now() - start;

    const [productsCount, ordersCount, inquiriesCount, bannersCount] = await Promise.all([
      ProductModel.countDocuments().catch(() => 0),
      OrderModel.countDocuments().catch(() => 0),
      InquiryModel.countDocuments().catch(() => 0),
      BannerModel.countDocuments().catch(() => 0),
    ]);

    return NextResponse.json({
      connected: true,
      status: 'healthy',
      cluster: 'Cluster0',
      database: db.databaseName,
      latencyMs: latency,
      counts: {
        products: productsCount,
        orders: ordersCount,
        inquiries: inquiriesCount,
        banners: bannersCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      status: 'disconnected',
      error: error.message || 'Connection failed',
      notice: 'If access times out, please add your IP or 0.0.0.0/0 (Allow Anywhere) in MongoDB Atlas Network Access.',
      timestamp: new Date().toISOString(),
    });
  }
}
