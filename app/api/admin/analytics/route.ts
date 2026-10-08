import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { InquiryModel } from '@/models/Inquiry';
import { ProductModel } from '@/models/Product';
import { ClientProjectModel } from '@/models/ClientProject';
import { MaintenanceRecordModel } from '@/models/MaintenanceRecord';
import { AnalyticsEventModel } from '@/models/AnalyticsEvent';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d'; // '7d', '30d', '90d', 'all'

    const now = new Date();
    let startDate: Date | null = null;

    if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }

    const orderQuery: Record<string, any> = {};
    const inquiryQuery: Record<string, any> = {};
    const eventQuery: Record<string, any> = {};

    if (startDate) {
      eventQuery.createdAt = { $gte: startDate };
    }

    const [
      orders,
      inquiries,
      productsCount,
      projectsCount,
      maintenanceCount,
      eventAggregates,
    ] = await Promise.all([
      OrderModel.find(orderQuery).lean(),
      InquiryModel.find(inquiryQuery).lean(),
      ProductModel.countDocuments({ isArchived: { $ne: true } }),
      ClientProjectModel.countDocuments({ isArchived: { $ne: true } }),
      MaintenanceRecordModel.countDocuments({}),
      AnalyticsEventModel.aggregate([
        { $match: eventQuery },
        { $group: { _id: '$eventName', count: { $sum: 1 } } },
      ]),
    ]);

    const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    const totalEnquiries = inquiries.length;
    const qualifiedLeads = inquiries.filter((i) => i.status === 'scheduled' || i.status === 'completed').length;
    const leadConversionRate = totalEnquiries > 0 ? Math.round((orders.length / totalEnquiries) * 100) : 0;

    // Item sales breakdown
    const productSalesMap: Record<string, { name: string; count: number; revenue: number }> = {};
    orders.forEach((o) => {
      o.items?.forEach((item) => {
        if (!productSalesMap[item.name]) {
          productSalesMap[item.name] = { name: item.name, count: 0, revenue: 0 };
        }
        productSalesMap[item.name].count += item.quantity || 1;
        productSalesMap[item.name].revenue += (item.price || 0) * (item.quantity || 1);
      });
    });

    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Event counts map
    const eventCounts: Record<string, number> = {};
    eventAggregates.forEach((e: { _id: string; count: number }) => {
      eventCounts[e._id] = e.count;
    });

    const hasSufficientData = orders.length >= 3 || inquiries.length >= 3;

    return NextResponse.json({
      success: true,
      range,
      hasSufficientData,
      notice: hasSufficientData ? undefined : 'Insufficient historical data for high-confidence trend projection.',
      metrics: {
        totalRevenue,
        ordersCount: orders.length,
        avgOrderValue,
        totalEnquiries,
        qualifiedLeads,
        leadConversionRate,
        productsCount,
        projectsCount,
        maintenanceCount,
      },
      topSellingProducts,
      eventCounts: {
        productViews: eventCounts.product_view || 0,
        addToCart: eventCounts.add_to_cart || 0,
        wishlistToggles: eventCounts.wishlist_toggle || 0,
        checkoutStarts: eventCounts.checkout_start || 0,
        ordersPlaced: eventCounts.order_placed || orders.length,
        enquiriesSubmitted: eventCounts.enquiry_submitted || inquiries.length,
        whatsappClicks: eventCounts.whatsapp_click || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
