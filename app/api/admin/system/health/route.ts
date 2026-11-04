import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, isDatabaseConfigured } from '@/lib/mongodb';
import { SnapshotModel } from '@/models/Snapshot';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { requirePermission, requireAuthenticatedEmployee } from '@/lib/rbac/guard';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'health.read');
  if (errorResponse) return errorResponse;

  const startTime = Date.now();

  try {
    const configured = isDatabaseConfigured();
    if (!configured) {
      return NextResponse.json({
        success: false,
        status: 'DEGRADED',
        database: { status: 'UNCONFIGURED', latencyMs: 0 },
        api: { status: 'HEALTHY' },
      });
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    let dbLatencyMs = 0;
    if (db) {
      const pingStart = Date.now();
      await db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    }

    const [productsCount, ordersCount, snapshotsCount] = await Promise.all([
      ProductModel.countDocuments(),
      OrderModel.countDocuments(),
      SnapshotModel.countDocuments(),
    ]);

    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.round(process.uptime());

    const isHealthy = dbLatencyMs < 2000;

    return NextResponse.json({
      success: true,
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startTime,
      database: {
        status: 'CONNECTED',
        cluster: 'MongoDB Atlas (Cluster0)',
        name: mongoose.connection.name || 'marine_creatures',
        latencyMs: dbLatencyMs,
        readyState: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds,
        memoryRssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      },
      counts: {
        products: productsCount,
        orders: ordersCount,
        snapshots: snapshotsCount,
      },
      auth: {
        status: 'ACTIVE',
        sessionCookie: 'mc_admin_session',
        algorithm: 'HMAC-SHA256',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'ERROR',
        error: error.message,
        database: { status: 'ERROR', message: error.message },
      },
      { status: 500 }
    );
  }
}
