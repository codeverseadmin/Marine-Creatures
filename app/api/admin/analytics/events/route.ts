import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AnalyticsEventModel, AnalyticsEventType } from '@/models/AnalyticsEvent';
import { createHash } from 'crypto';

const ALLOWED_EVENTS: AnalyticsEventType[] = [
  'product_view',
  'add_to_cart',
  'wishlist_toggle',
  'checkout_start',
  'order_placed',
  'enquiry_submitted',
  'whatsapp_click',
];

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { eventName, entityType, entityId, entityName, metadata } = body;

    if (!eventName || !ALLOWED_EVENTS.includes(eventName)) {
      return NextResponse.json({ success: false, error: 'Invalid event name' }, { status: 400 });
    }

    // Anonymize IP via SHA256 slice — strictly no raw PII stored
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const ipHash = createHash('sha256').update(ip + (process.env.SESSION_SECRET || 'salt')).digest('hex').slice(0, 16);

    const event = await AnalyticsEventModel.create({
      eventName,
      entityType: typeof entityType === 'string' ? entityType.slice(0, 50) : undefined,
      entityId: typeof entityId === 'string' ? entityId.slice(0, 100) : undefined,
      entityName: typeof entityName === 'string' ? entityName.slice(0, 150) : undefined,
      metadata: typeof metadata === 'object' && metadata !== null ? metadata : undefined,
      ipHash,
    });

    return NextResponse.json({ success: true, id: (event as any)._id }, { status: 201 });
  } catch (error: any) {
    // Fail safely for analytics tracking
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
