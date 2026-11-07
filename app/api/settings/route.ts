import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SettingModel } from '@/models/Setting';
import { requirePermission, recordAuditLog } from '@/lib/rbac/guard';
import { getClientIp } from '@/lib/rate-limit';

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
  const { auth, errorResponse } = await requirePermission(req, 'settings.update');
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();
    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof key !== 'string' || key.trim().length === 0 || key.length > 100) {
      return NextResponse.json({ success: false, error: 'Valid setting key is required (max 100 characters)' }, { status: 400 });
    }

    const updated = await SettingModel.findOneAndUpdate(
      { key: key.trim() },
      { value },
      { new: true, upsert: true }
    ).lean();

    await recordAuditLog({
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'setting',
      entityId: key.trim(),
      entityName: key.trim(),
      summary: `Updated system setting [${key.trim()}]`,
      actor: auth!.actorEmail,
      ip: getClientIp(req),
      details: { key: key.trim() },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
