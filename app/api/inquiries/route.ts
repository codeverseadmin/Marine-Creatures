import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InquiryModel } from '@/models/Inquiry';
import { isAdminRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // Only authenticated admins can view customer inquiries
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, data: [], error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const inquiries = await InquiryModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';

    if (!name || !phone) {
      return NextResponse.json({ success: false, error: 'Name and Phone are required' }, { status: 400 });
    }

    if (name.length > 200 || phone.length > 25) {
      return NextResponse.json({ success: false, error: 'Name or Phone exceeds maximum allowed length' }, { status: 400 });
    }

    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : undefined;
    const rawNotes = typeof body.notes === 'string' ? body.notes : typeof body.message === 'string' ? body.message : '';
    const notes = rawNotes.trim().slice(0, 2000);

    const inquiryData = {
      id: typeof body.id === 'string' && body.id.trim() ? body.id.trim().slice(0, 50) : `INQ-${Date.now().toString().slice(-6)}`,
      type: typeof body.type === 'string' ? body.type.slice(0, 50) : 'custom_quote',
      name,
      phone,
      email,
      serviceType: typeof body.serviceType === 'string' ? body.serviceType.slice(0, 100) : undefined,
      spaceType: typeof body.spaceType === 'string' ? body.spaceType.slice(0, 100) : undefined,
      tankSize: typeof body.tankSize === 'string' ? body.tankSize.slice(0, 100) : undefined,
      location: typeof body.location === 'string' ? body.location.slice(0, 200) : undefined,
      notes,
      preferredDate: typeof body.preferredDate === 'string' ? body.preferredDate.slice(0, 100) : undefined,
      items: Array.isArray(body.items) ? body.items.slice(0, 50) : undefined,
      status: 'new' as const,
      createdAt: typeof body.createdAt === 'string' ? body.createdAt.slice(0, 100) : new Date().toLocaleString('en-IN'),
    };

    const inquiry = await InquiryModel.create(inquiryData);
    return NextResponse.json({ success: true, data: inquiry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status || typeof id !== 'string' || typeof status !== 'string') {
      return NextResponse.json({ success: false, error: 'Valid id and status required' }, { status: 400 });
    }

    const updated = await InquiryModel.findOneAndUpdate({ id }, { status }, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });
    }

    await InquiryModel.deleteOne({ id });
    return NextResponse.json({ success: true, message: `Inquiry ${id} deleted` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
