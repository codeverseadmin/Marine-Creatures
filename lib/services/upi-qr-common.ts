/**
 * MARINE CREATURES — INVOICE UPI QR COMMON UTILITIES
 *
 * Client and Server safe pure functions for UPI URI construction,
 * balance calculation, and QR code generation.
 * Contains ZERO Node.js / database / Mongoose dependencies.
 */

import QRCode from 'qrcode';

export const DEFAULT_BUSINESS_UPI_ID = 'bithikashasmal261-3@okicici';
export const DEFAULT_PAYEE_NAME = 'MARINE CREATURES';
export const DEFAULT_CURRENCY = 'INR';

export interface IUpiPaymentSettings {
  upiId: string;
  payeeName: string;
  upiPayeeName?: string;
  upiEnabled: boolean;
}

export interface IOutstandingBalanceResolution {
  total: number;
  amountPaid: number;
  outstanding: number;
  isCancelled: boolean;
  isFullyPaid: boolean;
  isPartial: boolean;
  isEligibleForPayment: boolean;
}

export interface IUpiUriParams {
  upiId: string;
  payeeName: string;
  amount: number;
  invoiceNumber: string;
  orderId: string;
  currency?: string;
  refId?: string;
}

export interface IInvoiceUpiPaymentData {
  isEligible: boolean;
  reason?: 'FULLY_PAID' | 'CANCELLED' | 'ZERO_BALANCE' | 'UPI_DISABLED';
  upiId?: string;
  payeeName?: string;
  outstandingBalance: number;
  amountPaid: number;
  totalAmount: number;
  isPartial: boolean;
  currency: string;
  invoiceNumber?: string;
  orderId?: string;
  refId?: string;
  upiUri?: string;
  qrDataUrl?: string;
}

/**
 * Calculates authoritative outstanding balance and payment eligibility for an order.
 * Fully paid, zero balance, and cancelled orders are ineligible for payment QR generation.
 */
export function calculateOutstandingBalance(order: {
  totalAmount?: number;
  subtotal?: number;
  amountPaid?: number;
  paymentStatus?: string;
  status?: string;
  currentStep?: string;
}): IOutstandingBalanceResolution {
  const total = Number(order.totalAmount ?? order.subtotal ?? 0);

  let amountPaid = 0;
  if (typeof order.amountPaid === 'number' && !isNaN(order.amountPaid) && order.amountPaid > 0) {
    amountPaid = order.amountPaid;
  } else if (order.paymentStatus === 'paid' && total > 0) {
    amountPaid = total;
  }

  const outstanding = Math.max(0, Math.round((total - amountPaid) * 100) / 100);

  const isCancelled =
    order.status === 'cancelled' ||
    order.paymentStatus === 'cancelled' ||
    order.currentStep === 'cancelled';

  const isFullyPaid =
    order.paymentStatus === 'paid' ||
    (total > 0 && amountPaid >= total);

  const isPartial = !isFullyPaid && !isCancelled && amountPaid > 0 && outstanding > 0;
  const isEligibleForPayment = !isCancelled && !isFullyPaid && outstanding > 0;

  return {
    total,
    amountPaid,
    outstanding,
    isCancelled,
    isFullyPaid,
    isPartial,
    isEligibleForPayment,
  };
}

/**
 * Generates an NPCI-compliant UPI Deep Link URI.
 *
 * Format:
 * upi://pay?pa={UPI_ID}&pn={PAYEE_NAME}&am={AMOUNT}&cu=INR&tn={TRANSACTION_NOTE}&tr={TRANSACTION_REF}
 */
export function buildUpiUri(params: IUpiUriParams): string {
  const cleanUpiId = params.upiId.trim();
  const cleanPayee = params.payeeName.trim();
  const formattedAmount = params.amount.toFixed(2);
  const currency = params.currency || DEFAULT_CURRENCY;

  const note = `Invoice ${params.invoiceNumber || params.orderId}`;
  const refId = params.refId || `${params.orderId || 'ORD'}-${(params.invoiceNumber || '').replace(/[^a-zA-Z0-9]/g, '')}`;

  const queryParts = [
    `pa=${encodeURIComponent(cleanUpiId)}`,
    `pn=${encodeURIComponent(cleanPayee)}`,
    `am=${formattedAmount}`,
    `cu=${currency}`,
    `tn=${encodeURIComponent(note)}`,
    `tr=${encodeURIComponent(refId)}`,
  ];

  return `upi://pay?${queryParts.join('&')}`;
}

/**
 * Generates a high-contrast, scan-optimized PNG Data URL (base64) of the UPI QR code.
 */
export async function generateUpiQrDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

/**
 * Generates an SVG string of the UPI QR code.
 */
export async function generateUpiQrSvg(upiUri: string): Promise<string> {
  return QRCode.toString(upiUri, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

