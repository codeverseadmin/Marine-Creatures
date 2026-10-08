import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MaintenanceRecordModel } from '@/models/MaintenanceRecord';
import { CustomerModel } from '@/models/Customer';
import { isAdminRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const timeframe = searchParams.get('timeframe') || 'all'; // 'all', 'today', 'upcoming', 'overdue', 'completed'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const query: Record<string, any> = {};

    if (timeframe === 'today') {
      query.serviceDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (timeframe === 'upcoming') {
      query.serviceDate = { $gt: endOfToday };
      query.status = { $ne: 'completed' };
    } else if (timeframe === 'overdue') {
      query.serviceDate = { $lt: startOfToday };
      query.status = { $in: ['scheduled', 'in_progress', 'overdue'] };
    } else if (timeframe === 'completed') {
      query.status = 'completed';
    }

    const [todayCount, upcomingCount, overdueCount, completedCount, records] = await Promise.all([
      MaintenanceRecordModel.countDocuments({ serviceDate: { $gte: startOfToday, $lte: endOfToday } }),
      MaintenanceRecordModel.countDocuments({ serviceDate: { $gt: endOfToday }, status: { $ne: 'completed' } }),
      MaintenanceRecordModel.countDocuments({ serviceDate: { $lt: startOfToday }, status: { $in: ['scheduled', 'in_progress', 'overdue'] } }),
      MaintenanceRecordModel.countDocuments({ status: 'completed' }),
      MaintenanceRecordModel.find(query).sort({ serviceDate: 1 }).limit(limit).lean(),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        today: todayCount,
        upcoming: upcomingCount,
        overdue: overdueCount,
        completed: completedCount,
      },
      data: records,
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
    const {
      customerName,
      customerPhone,
      projectName,
      aquariumVolume,
      aquariumType,
      serviceDate,
      nextServiceDate,
      serviceType,
      technicianName,
      notes,
    } = body;

    if (!customerName || !customerPhone || !serviceDate) {
      return NextResponse.json(
        { success: false, error: 'Customer Name, Phone, and Service Date are required' },
        { status: 400 }
      );
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    const serviceDateTime = new Date(serviceDate);
    const nextDateTime = nextServiceDate ? new Date(nextServiceDate) : new Date(serviceDateTime.getTime() + 14 * 24 * 60 * 60 * 1000);

    const record = await MaintenanceRecordModel.create({
      id: `MAINT-${Date.now().toString().slice(-6)}`,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      projectName: projectName?.trim() || 'Residential Reef Display',
      aquariumVolume: aquariumVolume?.trim() || '450 L',
      aquariumType: aquariumType?.trim() || 'SPS / LPS Mixed Reef',
      serviceDate: serviceDateTime,
      nextServiceDate: nextDateTime,
      serviceType: serviceType || 'routine_biweekly',
      status: 'scheduled',
      technicianName: technicianName?.trim() || 'Suraj / Marine Lead Tech',
      notes: notes?.trim() || '',
      checklistCompleted: [],
      photos: [],
    });

    // Sync Customer last active date & maintenance count
    await CustomerModel.findOneAndUpdate(
      { phone: cleanPhone },
      {
        $setOnInsert: { id: `CUST-${cleanPhone}`, firstContactDate: new Date() },
        $set: { name: customerName.trim(), lastActiveDate: new Date() },
      },
      { upsert: true }
    );

    await recordAuditLog({
      action: 'MAINTENANCE_CREATED',
      entityType: 'maintenance',
      entityId: record.id,
      entityName: `${record.customerName} Service`,
      summary: `Scheduled ${record.serviceType} maintenance for ${record.customerName} on ${record.serviceDate.toLocaleDateString('en-IN')}`,
      req,
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
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
    const { id, status, waterParameters, dosingAndMedia, livestockCondition, notes, checklistCompleted } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 });
    }

    const record = await MaintenanceRecordModel.findOne({ id });
    if (!record) {
      return NextResponse.json({ success: false, error: 'Maintenance record not found' }, { status: 404 });
    }

    if (status && ['scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'].includes(status)) {
      record.status = status;
    }

    if (waterParameters && typeof waterParameters === 'object') {
      record.waterParameters = { ...record.waterParameters, ...waterParameters };
    }

    if (dosingAndMedia !== undefined) record.dosingAndMedia = dosingAndMedia;
    if (livestockCondition !== undefined) record.livestockCondition = livestockCondition;
    if (notes !== undefined) record.notes = notes;
    if (Array.isArray(checklistCompleted)) record.checklistCompleted = checklistCompleted;

    await record.save();

    await recordAuditLog({
      action: 'MAINTENANCE_UPDATED',
      entityType: 'maintenance',
      entityId: record.id,
      entityName: `${record.customerName} Service`,
      summary: `Maintenance record ${record.id} updated. Status: ${record.status}`,
      req,
    });

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
