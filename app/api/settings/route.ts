import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SettingModel } from '@/models/Setting';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await SettingModel.findOne({ key }).lean();
      return NextResponse.json({ success: true, data: setting ? setting.value : null });
    }

    const all = await SettingModel.find({}).lean();
    const map = all.reduce((acc: any, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: map });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: 'Setting key is required' }, { status: 400 });
    }

    const updated = await SettingModel.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
