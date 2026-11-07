import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AnalyticsEventModel, AnalyticsEventType } from '@/models/AnalyticsEvent';
import { createHash } from 'crypto';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const ALLOWED_EVENTS: AnalyticsEventType[] = [
  'product_view',
  'add_to_cart',
  'wishlist_toggle',
  'checkout_start',
  'order_placed',
  'enquiry_submitted',
  'whatsapp_click',
];

const MAX_PAYLOAD_BYTES = 10 * 1024; // 10 KB limit

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. IP Rate Limiting (max 60 events/minute per IP)
    const rateLimit = await checkRateLimit(`rate:analytics:events:${ip}`, 60, 60);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfter, 'Too many analytics events. Please slow down.');
    }

    // 2. Content-Length check
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Payload size exceeds 10KB limit' },
        { status: 413 }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: 'Payload size exceeds 10KB limit' },
        { status: 413 }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
    }

    const { eventName, entityType, entityId, entityName, metadata } = body;

    if (!eventName || typeof eventName !== 'string' || !ALLOWED_EVENTS.includes(eventName as AnalyticsEventType)) {
      return NextResponse.json(
        { success: false, error: `Invalid event name. Allowed events: ${ALLOWED_EVENTS.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Metadata sanitization: primitive values only, max 10 keys, max 200 chars per value
    // Client cannot inject privileged properties like ipHash, isAdmin, employeeId
    let sanitizedMetadata: Record<string, string | number | boolean> | undefined = undefined;
    if (typeof metadata === 'object' && metadata !== null && !Array.isArray(metadata)) {
      sanitizedMetadata = {};
      const keys = Object.keys(metadata).slice(0, 10);
      for (const k of keys) {
        // Disallow dangerous or prototype-polluting keys
        if (['__proto__', 'constructor', 'prototype', 'ipHash', 'isAdmin', 'roleId'].includes(k)) continue;
        const cleanKey = k.slice(0, 50);
        const val = metadata[k];
        if (typeof val === 'string') {
          sanitizedMetadata[cleanKey] = val.slice(0, 200);
        } else if (typeof val === 'number' && Number.isFinite(val)) {
          sanitizedMetadata[cleanKey] = val;
        } else if (typeof val === 'boolean') {
          sanitizedMetadata[cleanKey] = val;
        }
      }
    }

    await connectToDatabase();

    // Anonymize IP via SHA256 slice — strictly no raw PII stored
    const ipHash = createHash('sha256')
      .update(ip + (process.env.SESSION_SECRET || 'salt'))
      .digest('hex')
      .slice(0, 16);

    const event = await AnalyticsEventModel.create({
      eventName: eventName as AnalyticsEventType,
      entityType: typeof entityType === 'string' ? entityType.slice(0, 50) : undefined,
      entityId: typeof entityId === 'string' ? entityId.slice(0, 100) : undefined,
      entityName: typeof entityName === 'string' ? entityName.slice(0, 150) : undefined,
      metadata: sanitizedMetadata,
      ipHash,
    });

    return NextResponse.json({ success: true, id: (event as any)._id }, { status: 201 });
  } catch (error: any) {
    // Fail safely for analytics tracking
    return NextResponse.json({ success: false, error: 'Analytics event logging failed' }, { status: 500 });
  }
}
