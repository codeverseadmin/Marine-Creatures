/**
 * useInvoicePdfShare — Client-side hook for WhatsApp PDF invoice delivery.
 *
 * Flow:
 *  1. Admin clicks "Send Invoice via WhatsApp"
 *  2. Hook calls GET /api/admin/orders/[id]/invoice-pdf (admin-auth required)
 *  3a. Mobile / Web Share API available → navigator.share({ files: [pdfFile], text: message })
 *  3b. Desktop fallback → downloads PDF with correct filename (Marine-Creatures-INV-[orderId].pdf)
 *      and opens customer WhatsApp conversation with concise, professional message (no URL).
 *      Provides explicit instruction state for UI to guide the administrator to attach & send.
 *
 * States: idle → loading → sharing → done | error
 */

'use client';

import { useState, useCallback } from 'react';

export type PdfShareState = 'idle' | 'loading' | 'sharing' | 'done' | 'error';
export type DispatchMode = 'mobile-share' | 'desktop-download' | null;

export interface UsePdfShareOptions {
  /** Called on every state change */
  onStateChange?: (state: PdfShareState, message?: string, mode?: DispatchMode) => void;
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

export interface UsePdfShareReturn {
  state: PdfShareState;
  dispatchMode: DispatchMode;
  error: string | null;
  downloadedFilename: string | null;
  targetPhone: string | null;
  targetOrderId: string | null;
  share: (orderId: string, order: WhatsAppOrderPayload) => Promise<void>;
  reset: () => void;
  dismissNotice: () => void;
}

/**
 * Concise Executive WhatsApp message — strict compliance with brand guidelines:
 * No invoice URL, no delivery address, no personal phone number, no line-item finance details.
 */
function buildExecutiveWhatsAppMessage(orderId: string, customerName: string): string {
  return (
    `MARINE CREATURES\n\n` +
    `Dear ${customerName},\n\n` +
    `Your order #${orderId} has been confirmed.\n\n` +
    `Please find your invoice and dispatch details attached.\n\n` +
    `Thank you for choosing Marine Creatures.\n\n` +
    `Bringing Ocean at Your Doorstep.`
  );
}

export function useInvoicePdfShare(options?: UsePdfShareOptions): UsePdfShareReturn {
  const [state, setState] = useState<PdfShareState>('idle');
  const [dispatchMode, setDispatchMode] = useState<DispatchMode>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadedFilename, setDownloadedFilename] = useState<string | null>(null);
  const [targetPhone, setTargetPhone] = useState<string | null>(null);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  const transition = useCallback(
    (next: PdfShareState, msg?: string, mode?: DispatchMode) => {
      setState(next);
      if (mode !== undefined) setDispatchMode(mode);
      options?.onStateChange?.(next, msg, mode);
    },
    [options]
  );

  const reset = useCallback(() => {
    setState('idle');
    setDispatchMode(null);
    setError(null);
    setDownloadedFilename(null);
    setTargetPhone(null);
    setTargetOrderId(null);
  }, []);

  const dismissNotice = useCallback(() => {
    setDownloadedFilename(null);
    setDispatchMode(null);
    if (state === 'done') setState('idle');
  }, [state]);

  const share = useCallback(
    async (orderId: string, order: WhatsAppOrderPayload) => {
      if (state === 'loading' || state === 'sharing') return; // prevent repeated dispatches

      transition('loading', 'Fetching invoice PDF...', null);
      setError(null);
      setDownloadedFilename(null);
      setTargetOrderId(orderId);

      try {
        // ── 1. Fetch PDF from authenticated admin route ─────────────────────────
        const resp = await fetch(
          `/api/admin/orders/${encodeURIComponent(orderId)}/invoice-pdf`,
          { credentials: 'include' }
        );

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.error || `Unable to retrieve invoice PDF (HTTP ${resp.status})`);
        }

        const blob = await resp.blob();
        if (blob.size === 0) {
          throw new Error('Retrieved invoice PDF file is empty. Please verify order data.');
        }

        // ── 2. Standardised Filename (e.g. Marine-Creatures-INV-MC-611716YH.pdf) ──
        const rawInv = (order.invoiceNumber || `INV-${orderId}`).replace(/[^a-zA-Z0-9\-_]/g, '_');
        const cleanInv = rawInv.startsWith('INV-') ? rawInv : `INV-${rawInv}`;
        const filename = `Marine-Creatures-${cleanInv}.pdf`;
        setDownloadedFilename(filename);

        const pdfFile = new File([blob], filename, { type: 'application/pdf' });

        transition('sharing', 'Preparing dispatch...', null);

        const message = buildExecutiveWhatsAppMessage(orderId, order.customerName);
        const cleanPhone = (order.phone || '').replace(/\D/g, '');
        const phoneWithCC = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
        setTargetPhone(phoneWithCC || null);

        // ── 3a. Mobile / Web Share API (native file sharing where supported) ────
        if (
          typeof navigator !== 'undefined' &&
          'share' in navigator &&
          typeof navigator.canShare === 'function' &&
          navigator.canShare({ files: [pdfFile] })
        ) {
          await navigator.share({
            files: [pdfFile],
            title: `Marine Creatures Invoice — ${cleanInv}`,
            text:  message,
          });

          transition('done', 'Invoice shared via native share interface', 'mobile-share');
          return;
        }

        // ── 3b. Desktop Fallback (Automatic Download + Open Chat + UI Guide) ────
        // 1. Download the PDF file to administrator's local machine
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(objectUrl), 8000);

        // 2. Open WhatsApp Web / Desktop application with customer's verified number
        const waUrl = phoneWithCC
          ? `https://wa.me/${phoneWithCC}?text=${encodeURIComponent(message)}`
          : `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(waUrl, '_blank', 'noopener,noreferrer');

        // 3. Set state to 'done' with 'desktop-download' mode to prompt administrator
        transition('done', `Invoice downloaded as ${filename}. WhatsApp opened.`, 'desktop-download');
      } catch (err: any) {
        // User aborted native share sheet
        if (err?.name === 'AbortError') {
          transition('idle', 'Share cancelled by user', null);
          return;
        }
        const msg = err?.message || 'Invoice PDF dispatch failed';
        setError(msg);
        transition('error', msg, null);
      }
    },
    [state, transition]
  );

  return {
    state,
    dispatchMode,
    error,
    downloadedFilename,
    targetPhone,
    targetOrderId,
    share,
    reset,
    dismissNotice,
  };
}
