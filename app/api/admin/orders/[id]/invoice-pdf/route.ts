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
import path from 'path';
import fs from 'fs';
import { connectToDatabase } from '@/lib/mongodb';
import { OrderModel } from '@/models/Order';
import { requireAnyPermission } from '@/lib/rbac/guard';
import { InvoicePDFDocument, ExecutiveInvoiceOrderData } from '@/lib/invoice-pdf-template';

// Force Node.js runtime — @react-pdf/renderer requires Node (canvas/fs APIs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function resolveAssetPath(fileName: string): string | undefined {
  const filePath = path.join(process.cwd(), 'public', fileName);
  try {
    if (fs.existsSync(filePath)) return filePath;
  } catch {
    // Ignore error
  }
  return undefined;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  // ── 1. Authentication & Permission gate ───────────────────────────────────
  const { auth, errorResponse } = await requireAnyPermission(req, [
    'orders.invoice.generate',
    'finance.invoice.generate',
  ]);
  if (errorResponse) return errorResponse;

  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const rawId   = (resolvedParams.id || '').trim();
    const orderId = rawId.startsWith('MC-') ? rawId : `MC-${rawId}`;

    const logoPath = resolveAssetPath('logo.png');
    const signaturePath = resolveAssetPath('signature.png');

    // ── 2a. Isolated Synthetic Test Fixtures (Development only, strictly isolated from production) ─
    const allowFixtures = process.env.NODE_ENV !== 'production' && process.env.ALLOW_QA_FIXTURES === 'true';
    if (
      allowFixtures &&
      (orderId === 'MC-QA-ISOLATED-STANDARD' ||
        orderId === 'MC-QA-ISOLATED-MULTIPAGE' ||
        orderId === 'MC-QA-POR-FIXTURE' ||
        orderId === 'MC-QA-POR-RESOLVED-FIXTURE' ||
        orderId === 'MC-QA-FINANCIAL-RECON' ||
        orderId === 'MC-QA-FINANCIAL-RECON-RESOLVED')
    ) {
      const { getFixture, resetAllFixtures } = await import('@/lib/invoice-test-fixtures');
      if (req.headers.get('x-reset-fixtures') === 'true') {
        resetAllFixtures();
      }
      const baseFixture = getFixture(orderId);
      if (!baseFixture) {
        return NextResponse.json({ success: false, error: 'Test fixture not found' }, { status: 404 });
      }

      const fixtureOrder = { ...baseFixture, logoPath, signaturePath };

      // Mandatory POR Pricing Check on synthetic fixture
      const hasUnresolvedPor = fixtureOrder.hasUnresolvedPorItems || (fixtureOrder.items && fixtureOrder.items.some((it: any) =>
        (it.priceOnRequest || it.price === 0) && (!it.agreedUnitPrice || it.agreedUnitPrice <= 0)
      ));

      if (hasUnresolvedPor) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot generate invoice: Order contains specimens with unresolved Price on Request (POR). Please set agreed pricing before releasing invoice.',
            requiresPorPricing: true,
            orderId: fixtureOrder.id,
          },
          { status: 400 }
        );
      }

      const pdfBuffer = await renderToBuffer(
        React.createElement(InvoicePDFDocument, { order: fixtureOrder }) as any
      );
      const filename = `Marine-Creatures-${fixtureOrder.invoiceNumber}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status:  200,
        headers: {
          'Content-Type':        'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length':      String(pdfBuffer.byteLength),
          'Cache-Control':       'no-store, no-cache, must-revalidate, private',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // ── 2b. Fetch verified order from database ────────────────────────────────
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

    // ── 2c. Mandatory POR Pricing Check ───────────────────────────────────────
    // Under business rules, an Executive Invoice CANNOT be generated while any
    // line item has an unresolved Price on Request (POR) status.
    const unresolvedPor = (order.items || []).filter(
      (it: any) => (it.priceOnRequest === true || it.pricingStatus === 'PENDING_POR' || (it.price === 0 && (!it.agreedUnitPrice || it.agreedUnitPrice <= 0)))
    );

    if (unresolvedPor.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot generate invoice: Order contains ${unresolvedPor.length} unresolved Price on Request (POR) specimen(s). Please agree on order-specific pricing before issuing an invoice.`,
          requiresPorPricing: true,
          unresolvedItems: unresolvedPor.map((it: any) => ({ id: it.id, name: it.name, quantity: it.quantity })),
        },
        { status: 400 }
      );
    }

    // ── 3. Normalise items to InvoiceOrderData shape ──────────────────────────

    const rawInvoiceNumber = order.invoiceNumber || `INV-${order.id}`;
    const cleanInvoiceNumber = rawInvoiceNumber.startsWith('INV-')
      ? rawInvoiceNumber
      : `INV-${rawInvoiceNumber}`;

    const normalisedOrder: ExecutiveInvoiceOrderData = {
      id:                order.id,
      customerName:      order.customerName,
      phone:             order.phone,
      address:           order.address,
      city:              order.city,
      pincode:           order.pincode,
      orderNotes:        order.orderNotes || '',
      items:             order.items.map((item: any) => {
        const unitPrice = typeof item.agreedUnitPrice === 'number' && item.agreedUnitPrice > 0
          ? item.agreedUnitPrice
          : (item.price || 0);
        return {
          name:          item.name,
          price:         unitPrice,
          quantity:      item.quantity || 1,
          categoryLabel: item.category || '',
        };
      }),
      totalAmount:       order.totalAmount,
      subtotal:          order.subtotal || order.totalAmount,
      courierName:       order.courierName || '',
      awbNumber:         order.awbNumber || '',
      estimatedDelivery: order.estimatedDelivery || '',
      invoiceNumber:     cleanInvoiceNumber,
      isApproved:        order.isApproved,
      approvedAt:        order.approvedAt || '',
      createdAt:         order.createdAt || '',
      gstin:             (order as any).gstin || undefined,
      logoPath,
      signaturePath,
    };

    // ── 4. Render PDF ─────────────────────────────────────────────────────────
    const pdfBuffer = await renderToBuffer(
      React.createElement(InvoicePDFDocument, { order: normalisedOrder }) as any
    );

    const filenameSafe = cleanInvoiceNumber.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const filename     = `Marine-Creatures-${filenameSafe}.pdf`;

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

