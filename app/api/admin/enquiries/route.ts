import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InquiryModel } from '@/models/Inquiry';
import { CustomerModel } from '@/models/Customer';
import { FollowUpModel } from '@/models/FollowUp';
import { isAdminRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const VALID_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost', 'scheduled', 'completed', 'archived'] as const;

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const search = (searchParams.get('search') || '').trim();
    const status = searchParams.get('status') || 'all';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const query: Record<string, any> = {};

    if (status !== 'all') {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { id: searchRegex },
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { location: searchRegex },
        { serviceType: searchRegex },
      ];
    }

    const [total, enquiries, statusCounts] = await Promise.all([
      InquiryModel.countDocuments(query),
      InquiryModel.find(query).sort({ _id: -1 }).skip(skip).limit(limit).lean(),
      InquiryModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const pipelineCounts: Record<string, number> = {
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      won: 0,
      lost: 0,
    };
    statusCounts.forEach((c: { _id: string; count: number }) => {
      if (c._id && pipelineCounts[c._id] !== undefined) {
        pipelineCounts[c._id] = c.count;
      }
    });

    return NextResponse.json({
      success: true,
      total,
      limit,
      skip,
      pipelineCounts,
      data: enquiries,
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
    const { id, status, notes, followUpDate, followUpNote } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Enquiry ID is required' }, { status: 400 });
    }

    const enquiry = await InquiryModel.findOne({ id });
    if (!enquiry) {
      return NextResponse.json({ success: false, error: 'Enquiry not found' }, { status: 404 });
    }

    const previousStatus = enquiry.status;

    if (status && status !== enquiry.status) {
      if (!VALID_STAGES.includes(status as any)) {
        return NextResponse.json({ success: false, error: `Invalid enquiry status: ${status}` }, { status: 400 });
      }
      enquiry.status = status;
    }

    if (notes !== undefined) {
      enquiry.notes = typeof notes === 'string' ? notes.trim() : enquiry.notes;
    }

    await enquiry.save();

    // If follow-up date was provided, create/update follow-up task
    if (followUpDate) {
      const cleanPhone = enquiry.phone.replace(/\D/g, '');
      await FollowUpModel.create({
        id: `FLW-${Date.now().toString().slice(-6)}`,
        title: `Follow up: ${enquiry.name} (${enquiry.serviceType || 'Consultation'})`,
        targetType: 'enquiry',
        targetId: enquiry.id,
        customerName: enquiry.name,
        customerPhone: cleanPhone,
        dueDate: new Date(followUpDate),
        priority: status === 'qualified' ? 'high' : 'medium',
        channel: 'whatsapp',
        notes: followUpNote || `Follow up on enquiry ${enquiry.id}`,
        status: 'pending',
        assignedTo: 'Suraj',
      });
    }

    // Sync Customer record
    if (enquiry.phone) {
      const cleanPhone = enquiry.phone.replace(/\D/g, '');
      await CustomerModel.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $setOnInsert: {
            id: `CUST-${cleanPhone}`,
            firstContactDate: new Date(),
          },
          $set: {
            name: enquiry.name,
            email: enquiry.email || undefined,
            city: enquiry.location || undefined,
            lastActiveDate: new Date(),
          },
          $inc: {
            enquiriesCount: 1,
          },
        },
        { upsert: true }
      );
    }

    await recordAuditLog({
      action: 'ENQUIRY_STATUS_CHANGED',
      entityType: 'enquiry',
      entityId: enquiry.id,
      entityName: `Enquiry from ${enquiry.name}`,
      summary: `Enquiry ${enquiry.id} transitioned from ${previousStatus} to ${enquiry.status}`,
      details: { previousStatus, newStatus: enquiry.status },
      req,
    });

    return NextResponse.json({ success: true, data: enquiry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
