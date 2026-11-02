/**
 * useInvoicePdfShare — Client-side hook for WhatsApp PDF invoice delivery.
 *
 * Flow:
 *  1. Admin clicks "Share PDF via WhatsApp"
 *  2. Hook calls GET /api/admin/orders/[id]/invoice-pdf (admin-auth required)
 *  3a. Mobile / Web Share API available → navigator.share({ files: [pdfFile] })
 *  3b. Desktop fallback → download PDF + open WhatsApp with professional text (no URL)
 *
 * States: idle → loading → sharing → done | error
 */

'use client';

import { useState, useCallback } from 'react';

export type PdfShareState = 'idle' | 'loading' | 'sharing' | 'done' | 'error';

export interface UsePdfShareOptions {
  /** Called on every state change */
  onStateChange?: (state: PdfShareState, message?: string) => void;
}

export interface UsePdfShareReturn {
  state: PdfShareState;
  error: string | null;
  share: (orderId: string, order: WhatsAppOrderPayload) => Promise<void>;
  reset: () => void;
}

export interface WhatsAppOrderPayload {
  customerName: string;
  phone: string;
  invoiceNumber?: string;
  totalAmount: number;
  courierName?: string;
  awbNumber?: string;
  approvedAt?: string;
  createdAt?: string;
}

/**
 * Professional WhatsApp message template — no invoice URL included.
 */
function buildWhatsAppMessage(orderId: string, order: WhatsAppOrderPayload): string {
  const invoiceNo  = order.invoiceNumber || `INV-${orderId}`;
  const date       = order.approvedAt    || order.createdAt || new Date().toLocaleDateString('en-IN');
  const carrier    = order.courierName   || 'Priority Air Cargo Express';
  const awb        = order.awbNumber     ? `\nAWB No: ${order.awbNumber}` : '';
  const amount     = `\u20B9${order.totalAmount.toLocaleString('en-IN')}`;

  return (
    `🌊 *MARINE CREATURES*\n` +
    `_Bringing the Ocean to your Doorstep_\n\n` +
    `Dear *${order.customerName}*,\n\n` +
    `Your order *#${orderId}* has been verified and approved.\n` +
    `Please find your official Tax Invoice and Dispatch Manifest attached as a PDF document.\n\n` +
    `*Invoice No:* ${invoiceNo}\n` +
    `*Date:* ${date}\n` +
    `*Total Amount:* ${amount} (All-inclusive)\n` +
    `*Carrier:* ${carrier}${awb}\n\n` +
    `Your specimens are being prepared with our Climate Thermal Pod packaging. ` +
    `Please follow the acclimation guide included in the package upon delivery.\n\n` +
    `Thank you for choosing Marine Creatures.\n` +
    `_BRINGING THE OCEAN TO YOUR DOORSTEP_ 🐠`
  );
}

export function useInvoicePdfShare(options?: UsePdfShareOptions): UsePdfShareReturn {
  const [state, setState] = useState<PdfShareState>('idle');
  const [error, setError] = useState<string | null>(null);

  const transition = useCallback(
    (next: PdfShareState, msg?: string) => {
      setState(next);
      options?.onStateChange?.(next, msg);
    },
    [options]
  );

  const reset = useCallback(() => {
    setState('idle');
    setError(null);
  }, []);

  const share = useCallback(
    async (orderId: string, order: WhatsAppOrderPayload) => {
      if (state === 'loading' || state === 'sharing') return; // prevent double-tap

      transition('loading');
      setError(null);

      try {
        // ── Step 1: fetch PDF from admin API ──────────────────────────────────
        const resp = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/invoice-pdf`,
          { credentials: 'include' }
        );

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.error || `PDF generation failed (HTTP ${resp.status})`);
        }

        const blob = await resp.blob();
        if (blob.size === 0) throw new Error('PDF generation returned an empty file');

        const invoiceNo = order.invoiceNumber || `INV-${orderId}`;
        const filename  = `Marine-Creatures-Invoice-${invoiceNo.replace(/[^a-zA-Z0-9\-_]/g, '_')}.pdf`;
        const pdfFile   = new File([blob], filename, { type: 'application/pdf' });

        transition('sharing');

        const message   = buildWhatsAppMessage(orderId, order);
        const cleanPhone = order.phone.replace(/\D/g, '');
        const phoneWithCC = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        // ── Step 2a: Web Share API (mobile — attaches actual PDF) ─────────────
        if (
          typeof navigator !== 'undefined' &&
          'share' in navigator &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [pdfFile] })
        ) {
          await navigator.share({
            files: [pdfFile],
            title: `Marine Creatures Invoice — ${invoiceNo}`,
            text:  message,
          });

          transition('done');
          return;
        }

        // ── Step 2b: Desktop fallback ─────────────────────────────────────────
        // Download the PDF so the admin has it, then open WhatsApp with message.
        const objectUrl  = URL.createObjectURL(blob);
        const anchor     = document.createElement('a');
        anchor.href      = objectUrl;
        anchor.download  = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);

        // Open WhatsApp (web or app) with pre-filled professional message.
        // Message intentionally contains NO invoice URL.
        const waUrl = phoneWithCC
          ? `https://wa.me/${phoneWithCC}?text=${encodeURIComponent(message)}`
          : `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');

        transition('done');
      } catch (err: any) {
        // navigator.share() AbortError means user cancelled — treat as idle, not error
        if (err?.name === 'AbortError') {
          transition('idle');
          return;
        }
        const msg = err?.message || 'Unknown error during PDF share';
        setError(msg);
        transition('error', msg);
      }
    },
    [state, transition]
  );

  return { state, error, share, reset };
}

