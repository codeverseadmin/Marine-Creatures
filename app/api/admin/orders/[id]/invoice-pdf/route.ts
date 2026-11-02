/**
 * GET /api/admin/orders/[id]/invoice-pdf
 *
 * Generates and returns the official Marine Creatures tax invoice as a PDF binary.
 *
 * Security:
 *  - Requires a valid admin session cookie (isAdminRequest).
 *  - Returns 401 for unauthenticated requests.
 *  - Returns 404 for unrecognised order IDs.
 *  - The PDF is served with Content-Disposition: attachment — never inline with a public URL.
 *  - No raw storage URL is exposed to the client.
 *
 * PDF is generated server-side via @react-pdf/renderer (pure JS, no headless browser).
 * Compatible with Vercel Edge/Serverless without additional binaries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { isAdminRequest } from '@/lib/auth';
import { InvoicePDFDocument } from '@/lib/invoice-pdf-template';

// Force Node.js runtime — @react-pdf/renderer requires Node (canvas/fs APIs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  // ── 1. Authentication gate ────────────────────────────────────────────────
  if (!isAdminRequest(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin session required to generate invoice PDF' },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const rawId   = (resolvedParams.id || '').trim();
    const orderId = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;

    // ── 2. Fetch order ────────────────────────────────────────────────────────
    const order = await OrderModel.findOne({
      $or: [
        { id: orderId },
        { id: rawId },
        { invoiceNumber: rawId },
        { invoiceNumber: `INV-${rawId}` },
      ],
    }).lean();

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // ── 3. Normalise items to InvoiceOrderData shape ──────────────────────────
    // OrderModel stores items as flat {id, name, price, quantity, category}
    // The PDF template also supports the {product: {name, price}} shape from OrderContext.
    // Normalise here so the template always gets the flat shape.
    const normalisedOrder = {
      id:                order.id,
      customerName:      order.customerName,
      phone:             order.phone,
      address:           order.address,
      city:              order.city,
      pincode:           order.pincode,
      orderNotes:        order.orderNotes || '',
      items:             order.items.map((item: any) => ({
        name:          item.name,
        price:         item.price,
        quantity:      item.quantity,
        categoryLabel: item.category || '',
      })),
      totalAmount:       order.totalAmount,
      courierName:       order.courierName || '',
      awbNumber:         order.awbNumber || '',
      estimatedDelivery: order.estimatedDelivery || '',
      invoiceNumber:     order.invoiceNumber || `INV-${order.id}`,
      isApproved:        order.isApproved,
      approvedAt:        order.approvedAt || '',
      createdAt:         order.createdAt || '',
    };

    // ── 4. Render PDF ─────────────────────────────────────────────────────────
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDFDocument, { order: normalisedOrder }) as any
    );

    const invoiceNumber = normalisedOrder.invoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename      = `Marine-Creatures-Invoice-${invoiceNumber}.pdf`;

    // ── 5. Return PDF with secure headers ────────────────────────────────────
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status:  200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBuffer.byteLength),
        // Never cache invoice PDFs in public CDN layers
        'Cache-Control':       'no-store, no-cache, must-revalidate, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    console.error('[invoice-pdf] PDF generation error:', error?.message ?? error);
    return NextResponse.json(
      { success: false, error: 'PDF generation failed. Please try again.' },
      { status: 500 }
    );
  }
}

