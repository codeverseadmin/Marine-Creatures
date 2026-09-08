import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { InquiryModel } from '@/models/Inquiry';

export async function GET() {
  try {
    await connectToDatabase();
    const inquiries = await InquiryModel.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, count: inquiries.length, data: inquiries });
  } catch (error: any) {
    return NextResponse.json({ success: false, data: [], error: error.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json({ success: false, error: 'Name and Phone are required' }, { status: 400 });
    }

    const inquiryData = {
      id: body.id || `INQ-${Date.now().toString().slice(-6)}`,
      type: body.type || 'custom_quote',
      name: body.name,
      phone: body.phone,
      email: body.email,
      serviceType: body.serviceType,
      spaceType: body.spaceType,
      tankSize: body.tankSize,
      location: body.location,
      notes: body.notes || body.message,
      preferredDate: body.preferredDate,
      items: body.items,
      status: 'new' as const,
      createdAt: body.createdAt || new Date().toLocaleString('en-IN'),
    };

    const inquiry = await InquiryModel.create(inquiryData);
    return NextResponse.json({ success: true, data: inquiry }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id and status required' }, { status: 400 });
    }

    const updated = await InquiryModel.findOneAndUpdate({ id }, { status }, { new: true }).lean();
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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
