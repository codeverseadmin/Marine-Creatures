import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { FollowUpModel } from '@/models/FollowUp';
import { requirePermission } from '@/lib/rbac/guard';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'follow_ups.read');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const timeframe = searchParams.get('timeframe') || 'all';
    const status = searchParams.get('status') || 'pending';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const query: Record<string, any> = {};

    if (status !== 'all') {
      query.status = status;
    }

    if (timeframe === 'overdue') {
      query.dueDate = { $lt: startOfToday };
      query.status = 'pending';
    } else if (timeframe === 'today') {
      query.dueDate = { $gte: startOfToday, $lte: endOfToday };
      query.status = 'pending';
    } else if (timeframe === 'upcoming') {
      query.dueDate = { $gt: endOfToday };
      query.status = 'pending';
    } else if (timeframe === 'completed') {
      query.status = 'completed';
    }

    const [overdueCount, todayCount, upcomingCount, completedCount, followUps] = await Promise.all([
      FollowUpModel.countDocuments({ dueDate: { $lt: startOfToday }, status: 'pending' }),
      FollowUpModel.countDocuments({ dueDate: { $gte: startOfToday, $lte: endOfToday }, status: 'pending' }),
      FollowUpModel.countDocuments({ dueDate: { $gt: endOfToday }, status: 'pending' }),
      FollowUpModel.countDocuments({ status: 'completed' }),
      FollowUpModel.find(query).sort({ dueDate: 1 }).limit(limit).lean(),
    ]);

    return NextResponse.json({
      success: true,
      counts: {
        overdue: overdueCount,
        today: todayCount,
        upcoming: upcomingCount,
        completed: completedCount,
      },
      data: followUps,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'follow_ups.manage');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { title, targetType, targetId, customerName, customerPhone, dueDate, priority, channel, notes } = body;

    if (!title || !customerName || !customerPhone || !dueDate) {
      return NextResponse.json({ success: false, error: 'Title, Customer, Phone, and Due Date are required' }, { status: 400 });
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    const followUp = await FollowUpModel.create({
      id: `FLW-${Date.now().toString().slice(-6)}`,
      title: title.trim(),
      targetType: targetType || 'customer',
      targetId: targetId || cleanPhone,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      dueDate: new Date(dueDate),
      priority: priority || 'medium',
      channel: channel || 'whatsapp',
      notes: notes?.trim() || '',
      status: 'pending',
      assignedTo: 'Suraj',
    });

    await recordAuditLog({
      action: 'FOLLOW_UP_CREATED',
      entityType: 'follow_up',
      entityId: followUp.id,
      entityName: followUp.title,
      summary: `Created follow-up for ${followUp.customerName} due ${new Date(dueDate).toLocaleDateString('en-IN')}`,
      req,
    });

    return NextResponse.json({ success: true, data: followUp }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { auth, errorResponse } = await requirePermission(req, 'follow_ups.manage');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, status, completedNotes, dueDate, notes, priority } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Follow-up ID required' }, { status: 400 });
    }

    const followUp = await FollowUpModel.findOne({ id });
    if (!followUp) {
      return NextResponse.json({ success: false, error: 'Follow-up not found' }, { status: 404 });
    }

    if (status === 'completed' && followUp.status !== 'completed') {
      followUp.status = 'completed';
      followUp.completedAt = new Date();
      if (completedNotes) followUp.completedNotes = completedNotes;
    } else if (status) {
      followUp.status = status;
    }

    if (dueDate) followUp.dueDate = new Date(dueDate);
    if (notes !== undefined) followUp.notes = notes;
    if (priority) followUp.priority = priority;

    await followUp.save();

    await recordAuditLog({
      action: 'FOLLOW_UP_COMPLETED',
      entityType: 'follow_up',
      entityId: followUp.id,
      entityName: followUp.title,
      summary: `Follow-up ${followUp.id} updated. Status: ${followUp.status}`,
      req,
    });

    return NextResponse.json({ success: true, data: followUp });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
