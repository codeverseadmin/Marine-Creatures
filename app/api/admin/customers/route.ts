import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { CustomerModel } from '@/models/Customer';
import { OrderModel } from '@/models/Order';
import { InquiryModel } from '@/models/Inquiry';
import { ClientProjectModel } from '@/models/ClientProject';
import { MaintenanceRecordModel } from '@/models/MaintenanceRecord';
import { FollowUpModel } from '@/models/FollowUp';
import { isAdminRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const id = searchParams.get('id');
    const phone = searchParams.get('phone');
    const search = (searchParams.get('search') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    // If fetching a single Customer 360 dossier:
    if (id || phone) {
      const matchQuery = id ? { id } : { phone: phone?.replace(/\D/g, '') };
      const customer = await CustomerModel.findOne(matchQuery).lean();

      if (!customer) {
        return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
      }

      const cleanPhone = customer.phone.replace(/\D/g, '');
      const phoneRegex = new RegExp(cleanPhone, 'i');

      // Aggregate all customer activities across business modules
      const [orders, enquiries, projects, maintenance, followUps] = await Promise.all([
        OrderModel.find({ phone: phoneRegex }).sort({ _id: -1 }).lean(),
        InquiryModel.find({ phone: phoneRegex }).sort({ _id: -1 }).lean(),
        ClientProjectModel.find({ clientPhone: phoneRegex, isArchived: { $ne: true } }).sort({ _id: -1 }).lean(),
        MaintenanceRecordModel.find({ customerPhone: phoneRegex }).sort({ serviceDate: -1 }).lean(),
        FollowUpModel.find({ customerPhone: phoneRegex }).sort({ dueDate: 1 }).lean(),
      ]);

      // Calculate total actual spend and order count
      const totalSpend = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      return NextResponse.json({
        success: true,
        data: {
          ...customer,
          totalSpend,
          totalOrdersCount: orders.length,
          enquiriesCount: enquiries.length,
          projectsCount: projects.length,
          maintenanceCount: maintenance.length,
          orders,
          enquiries,
          projects,
          maintenance,
          followUps,
        },
      });
    }

    // List customers with filtering
    const query: Record<string, any> = {};
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { city: searchRegex },
        { id: searchRegex },
        { tags: searchRegex },
      ];
    }

    const [total, customers] = await Promise.all([
      CustomerModel.countDocuments(query),
      CustomerModel.find(query).sort({ lastActiveDate: -1 }).skip(skip).limit(limit).lean(),
    ]);

    return NextResponse.json({
      success: true,
      total,
      limit,
      skip,
      data: customers,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, tags, internalNotes, city, address, pincode, email, name } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await CustomerModel.findOne({ id });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    if (Array.isArray(tags)) customer.tags = tags.filter((t) => typeof t === 'string');
    if (typeof internalNotes === 'string') customer.internalNotes = internalNotes;
    if (typeof city === 'string') customer.city = city.trim();
    if (typeof address === 'string') customer.address = address.trim();
    if (typeof pincode === 'string') customer.pincode = pincode.trim();
    if (typeof email === 'string') customer.email = email.trim();
    if (typeof name === 'string' && name.trim()) customer.name = name.trim();

    customer.lastActiveDate = new Date();
    await customer.save();

    await recordAuditLog({
      action: 'CUSTOMER_UPDATED',
      entityType: 'customer',
      entityId: customer.id,
      entityName: customer.name,
      summary: `Customer ${customer.name} profile & tags updated`,
      details: { tags: customer.tags, city: customer.city },
      req,
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
