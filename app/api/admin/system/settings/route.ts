import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { SettingModel } from '@/models/Setting';
import { isAdminRequest } from '@/lib/auth';
import { recordAuditLog } from '@/lib/audit';

const DEFAULT_SETTINGS = {
  businessName: 'Marine Creatures',
  conciergePhone: '+91 93304 36603',
  supportEmail: 'concierge@marinecreatures.com',
  defaultPackaging: 'Oxygenated Insulated Thermal Pod (Medical-Grade O2)',
  freeShippingThreshold: 15000,
  defaultCarrier: 'IndiGo CarGo Priority Express',
  orderAlertsEnabled: true,
  defaultCatalogPagination: 25,
};

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const settingDoc = await SettingModel.findOne({ key: 'operational_settings' }).lean();

    return NextResponse.json({
      success: true,
      data: settingDoc?.value || DEFAULT_SETTINGS,
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

    // Whitelist only safe non-secret operational parameters
    const safeUpdates: Partial<typeof DEFAULT_SETTINGS> = {};
    if (typeof body.businessName === 'string') safeUpdates.businessName = body.businessName.trim();
    if (typeof body.conciergePhone === 'string') safeUpdates.conciergePhone = body.conciergePhone.trim();
    if (typeof body.supportEmail === 'string') safeUpdates.supportEmail = body.supportEmail.trim();
    if (typeof body.defaultPackaging === 'string') safeUpdates.defaultPackaging = body.defaultPackaging.trim();
    if (typeof body.freeShippingThreshold === 'number') safeUpdates.freeShippingThreshold = body.freeShippingThreshold;
    if (typeof body.defaultCarrier === 'string') safeUpdates.defaultCarrier = body.defaultCarrier.trim();
    if (typeof body.orderAlertsEnabled === 'boolean') safeUpdates.orderAlertsEnabled = body.orderAlertsEnabled;
    if (typeof body.defaultCatalogPagination === 'number') safeUpdates.defaultCatalogPagination = body.defaultCatalogPagination;

    const existing = await SettingModel.findOne({ key: 'operational_settings' });
    const merged = { ...(existing?.value || DEFAULT_SETTINGS), ...safeUpdates };

    await SettingModel.findOneAndUpdate(
      { key: 'operational_settings' },
      { key: 'operational_settings', value: merged },
      { upsert: true, new: true }
    );

    await recordAuditLog({
      action: 'SYSTEM_SETTINGS_UPDATED',
      entityType: 'setting',
      entityId: 'operational_settings',
      entityName: 'Operational Settings',
      summary: 'Administrative operational preferences updated',
      details: safeUpdates,
      req,
    });

    return NextResponse.json({ success: true, data: merged });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
