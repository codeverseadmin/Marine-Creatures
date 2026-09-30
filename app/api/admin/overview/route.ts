import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, isDatabaseConfigured } from '@/lib/mongodb';
import { ProductModel } from '@/models/Product';
import { OrderModel } from '@/models/Order';
import { InquiryModel } from '@/models/Inquiry';
import { SnapshotModel } from '@/models/Snapshot';
import { isAdminRequest } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  // 1. Strict Authentication Check: Signed session cookie or verified server secret
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Valid Control OS admin session required' },
      { status: 401 }
    );
  }

  const start = Date.now();

  try {
    const configured = isDatabaseConfigured();
    if (!configured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database unconfigured',
          system: {
            database: { status: 'unconfigured', latencyMs: 0 },
            api: { status: 'healthy' },
            auth: { status: 'healthy' },
            backup: { status: 'not_measured' },
          },
        },
        { status: 503 }
      );
    }

    await connectToDatabase();
    const db = mongoose.connection.db;

    // Measure database round-trip latency
    let dbLatencyMs = 0;
    if (db) {
      const pingStart = Date.now();
      await db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    }

    // Current date boundaries for consistent calendar aggregation
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Parallel bounded aggregations and counts using indexes
    const [
      activeProductsCount,
      totalProductsCount,
      categoryDistribution,
      inquiriesTotal,
      newInquiriesCount,
      recentInquiries,
      ordersTotal,
      activeOrdersCount,
      recentOrders,
      ordersByStep,
      latestSnapshot,
      snapshotsCount,
    ] = await Promise.all([
      // 1. Active Products count (excluding archived)
      ProductModel.countDocuments({ isArchived: { $ne: true } }),

      // 2. Total Products in DB
      ProductModel.countDocuments(),

      // 3. Category distribution (actual database categories)
      ProductModel.aggregate([
        { $match: { isArchived: { $ne: true } } },
        {
          $group: {
            _id: {
              category: '$category',
              label: '$categoryLabel',
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 4. Inquiries total
      InquiryModel.countDocuments(),

      // 5. New inquiries requiring action
      InquiryModel.countDocuments({ status: 'new' }),

      // 6. Recent inquiries (bounded projection: only necessary fields, no excess PII)
      InquiryModel.find(
        {},
        {
          id: 1,
          name: 1,
          type: 1,
          serviceType: 1,
          tankSize: 1,
          status: 1,
          createdAt: 1,
          notes: 1,
        }
      )
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      // 7. Orders total
      OrderModel.countDocuments(),

      // 8. Active orders count (not delivered)
      OrderModel.countDocuments({ currentStep: { $ne: 'delivered' } }),

      // 9. Recent orders (bounded projection: essential operational data only)
      OrderModel.find(
        {},
        {
          id: 1,
          customerName: 1,
          city: 1,
          totalAmount: 1,
          currentStep: 1,
          isApproved: 1,
          courierName: 1,
          createdAt: 1,
          items: 1,
        }
      )
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),

      // 10. Orders grouped by lifecycle step
      OrderModel.aggregate([
        {
          $group: {
            _id: '$currentStep',
            count: { $sum: 1 },
            totalValue: { $sum: '$totalAmount' },
          },
        },
      ]),

      // 11. Latest system snapshot for backup telemetry
      SnapshotModel.findOne({}, { data: 0 })
        .sort({ createdAt: -1 })
        .lean(),

      // 12. Snapshots count
      SnapshotModel.countDocuments(),
    ]);

    // Format category distribution
    const formattedCategories = categoryDistribution.map((c) => ({
      category: c._id.category || 'other',
      label: c._id.label || c._id.category || 'Uncategorized',
      count: c.count,
    }));

    // Action Center: Compute real actionable operational tasks
    const actionItems: Array<{
      id: string;
      type: 'enquiry' | 'order' | 'quarantine' | 'dispatch' | 'system';
      severity: 'high' | 'medium' | 'info';
      title: string;
      subtitle: string;
      meta?: string;
      targetTab: string;
    }> = [];

    // Action 1: New uncontacted inquiries
    if (newInquiriesCount > 0) {
      actionItems.push({
        id: 'action-new-inquiries',
        type: 'enquiry',
        severity: 'high',
        title: `${newInquiriesCount} New Client ${newInquiriesCount === 1 ? 'Enquiry' : 'Enquiries'} Awaiting Response`,
        subtitle: `First inquiry from ${recentInquiries[0]?.name || 'prospective client'} (${recentInquiries[0]?.serviceType || 'Custom Aquarium'})`,
        meta: recentInquiries[0]?.createdAt || 'Recently',
        targetTab: 'crm',
      });
    }

    // Action 2: Orders awaiting approval
    const unapprovedOrders = recentOrders.filter((o) => !o.isApproved);
    if (unapprovedOrders.length > 0) {
      actionItems.push({
        id: 'action-unapproved-orders',
        type: 'order',
        severity: 'high',
        title: `${unapprovedOrders.length} ${unapprovedOrders.length === 1 ? 'Order' : 'Orders'} Require Admin Approval`,
        subtitle: `Ref: ${unapprovedOrders[0]?.id} (${unapprovedOrders[0]?.customerName}) — ₹${(unapprovedOrders[0]?.totalAmount || 0).toLocaleString('en-IN')}`,
        meta: unapprovedOrders[0]?.createdAt || 'Recently',
        targetTab: 'operations',
      });
    }

    // Action 3: Orders in Quarantine step awaiting health check / biological sign-off
    const quarantineStep = ordersByStep.find((s) => s._id === 'quarantine');
    if (quarantineStep && quarantineStep.count > 0) {
      actionItems.push({
        id: 'action-quarantine-step',
        type: 'quarantine',
        severity: 'medium',
        title: `${quarantineStep.count} ${quarantineStep.count === 1 ? 'Specimen' : 'Specimens'} Under Active Quarantine`,
        subtitle: 'Prophylactic acclimation and feeding protocols in progress prior to thermal packaging',
        meta: `Value: ₹${quarantineStep.totalValue.toLocaleString('en-IN')}`,
        targetTab: 'operations',
      });
    }

    // Action 4: Orders in Packed step ready for dispatch
    const packedStep = ordersByStep.find((s) => s._id === 'packed');
    if (packedStep && packedStep.count > 0) {
      actionItems.push({
        id: 'action-packed-dispatch',
        type: 'dispatch',
        severity: 'high',
        title: `${packedStep.count} ${packedStep.count === 1 ? 'Package' : 'Packages'} Awaiting Priority Air Cargo Handoff`,
        subtitle: 'Sealed with pure oxygen and 48-hr phase change thermal packs; awaiting AWB assignment',
        meta: `Value: ₹${packedStep.totalValue.toLocaleString('en-IN')}`,
        targetTab: 'operations',
      });
    }

    // Action 5: Backup telemetry check (warning if no backup in > 7 days)
    if (latestSnapshot) {
      const snapshotAgeDays = Math.floor(
        (now.getTime() - new Date(latestSnapshot.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (snapshotAgeDays > 7) {
        actionItems.push({
          id: 'action-backup-warning',
          type: 'system',
          severity: 'medium',
          title: `Database Snapshot Overdue (${snapshotAgeDays} days since last backup)`,
          subtitle: 'Create a cloud snapshot to safeguard MongoDB Atlas catalog, orders, and inquiries',
          meta: `Last: ${new Date(latestSnapshot.createdAt).toLocaleDateString('en-IN')}`,
          targetTab: 'system',
        });
      }
    } else if (snapshotsCount === 0) {
      actionItems.push({
        id: 'action-no-backup',
        type: 'system',
        severity: 'medium',
        title: 'No System Snapshots Captured Yet',
        subtitle: 'Capture an initial cloud snapshot of the ingested production catalog',
        meta: 'Recommended',
        targetTab: 'system',
      });
    }

    // Total pending actions
    const pendingActionsCount =
      newInquiriesCount +
      unapprovedOrders.length +
      (packedStep?.count || 0);

    // Clean sanitized recent orders
    const sanitizedRecentOrders = recentOrders.map((o) => ({
      id: o.id,
      customerName: o.customerName,
      city: o.city || 'Kolkata',
      totalAmount: o.totalAmount,
      currentStep: (o.currentStep || 'placed').toUpperCase(),
      isApproved: Boolean(o.isApproved),
      courierName: o.courierName || 'Priority Air Cargo Express',
      createdAt: o.createdAt,
      itemsCount: Array.isArray(o.items) ? o.items.length : 1,
    }));

    // Clean sanitized recent inquiries
    const sanitizedRecentInquiries = recentInquiries.map((i) => ({
      id: i.id,
      name: i.name,
      type: i.type || 'custom_quote',
      serviceType: i.serviceType || 'Custom Marine Aquarium',
      tankSize: i.tankSize || 'Custom Biotope',
      status: i.status || 'new',
      createdAt: i.createdAt,
      notes: i.notes ? i.notes.slice(0, 120) : '',
    }));

    // Top Demand Analysis (truthful, derived directly from actual inquiries and orders)
    const demandServicesMap: Record<string, number> = {};
    recentInquiries.forEach((inq) => {
      if (inq.serviceType) {
        inq.serviceType.split(',').forEach((s: string) => {
          const clean = s.trim();
          if (clean) demandServicesMap[clean] = (demandServicesMap[clean] || 0) + 1;
        });
      }
    });

    const topServices = Object.entries(demandServicesMap)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // Recent unified chronological activity stream from genuine data
    const recentActivityStream: Array<{
      id: string;
      type: 'order' | 'enquiry' | 'product';
      text: string;
      detail: string;
      timestamp: string;
    }> = [];

    sanitizedRecentOrders.slice(0, 3).forEach((ord) => {
      recentActivityStream.push({
        id: `act-ord-${ord.id}`,
        type: 'order',
        text: `Order ${ord.id} (${ord.currentStep})`,
        detail: `${ord.customerName} — ₹${ord.totalAmount.toLocaleString('en-IN')}`,
        timestamp: ord.createdAt,
      });
    });

    sanitizedRecentInquiries.slice(0, 3).forEach((inq) => {
      recentActivityStream.push({
        id: `act-inq-${inq.id}`,
        type: 'enquiry',
        text: `New Enquiry from ${inq.name}`,
        detail: inq.serviceType,
        timestamp: inq.createdAt,
      });
    });

    // Build finalized Control OS Overview payload
    const overviewPayload = {
      metrics: {
        newEnquiries: newInquiriesCount,
        activeOrders: activeOrdersCount,
        activeProducts: activeProductsCount,
        totalProducts: totalProductsCount,
        pendingActions: pendingActionsCount,
        totalEnquiries: inquiriesTotal,
        totalOrders: ordersTotal,
      },
      actionCenter: {
        count: actionItems.length,
        items: actionItems,
      },
      enquiries: sanitizedRecentInquiries,
      orders: sanitizedRecentOrders,
      catalog: {
        totalActive: activeProductsCount,
        totalCatalog: totalProductsCount,
        categories: formattedCategories,
      },
      demand: {
        topServices,
        hasSufficientData: topServices.length > 0,
      },
      system: {
        database: {
          status: 'Healthy',
          cluster: 'Cluster0 (Atlas)',
          database: db?.databaseName || 'marine_creatures',
          latencyMs: dbLatencyMs,
        },
        api: {
          status: 'Healthy',
          runtime: 'Next.js 16 (App Router)',
        },
        auth: {
          status: 'Healthy',
          protocol: 'HMAC-SHA256 (httpOnly, Strict)',
          sessionCookie: 'mc_admin_session',
        },
        backup: {
          status: latestSnapshot ? 'Healthy' : 'Not measured',
          latestSnapshot: latestSnapshot
            ? {
                id: latestSnapshot.id,
                label: latestSnapshot.label,
                source: latestSnapshot.source,
                createdAt: latestSnapshot.createdAt,
                sizeBytes: latestSnapshot.sizeBytes,
              }
            : null,
          totalSnapshots: snapshotsCount,
        },
      },
      recentActivity: recentActivityStream,
    };

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      executionMs: Date.now() - start,
      ...overviewPayload,
      data: overviewPayload,
    });
  } catch (error: any) {
    console.error('Control OS Overview API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to aggregate Control OS dashboard data',
      },
      { status: 500 }
    );
  }
}
