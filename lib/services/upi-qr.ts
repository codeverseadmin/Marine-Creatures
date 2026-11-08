/**
 * MARINE CREATURES — INVOICE UPI QR PAYMENT SERVICE
 *
 * Reference: MC-FEATURE-INVOICE-UPI-QR-V1
 *
 * Implements server-authoritative UPI URI and dynamic QR code generation
 * for customer web invoices and official executive PDF invoices.
 *
 * Payment Rules:
 *  1. Initial Business UPI ID: bithikashasmal261-3@okicici
 *  2. Payee Name: MARINE CREATURES
 *  3. Dynamic QR codes always encode the exact outstanding balance.
 *  4. Fully paid (outstanding <= 0 or paymentStatus === 'paid') and cancelled
 *     invoices must NEVER display an active payment QR.
 *  5. Partial payments dynamically update the QR to the remaining balance.
 *  6. Scanning or opening a UPI app NEVER alters invoice payment state.
 *  7. Preserves all existing invoice revisions, coupon discounts, and warranty snapshots.
 */

import QRCode from 'qrcode';
import { connectToDatabase } from '@/lib/mongodb';
import { SettingModel } from '@/models/Setting';

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
 * Fetches authorized business UPI configuration from system settings.
 * Falls back to verified default business payment details if unconfigured.
 */
export async function getUpiPaymentSettings(): Promise<IUpiPaymentSettings> {
  try {
    await connectToDatabase();
    const doc = await SettingModel.findOne({
      key: { $in: ['operational_settings', 'payment_settings'] },
    }).lean();

    const val = (doc as any)?.value || {};
    return {
      upiId: typeof val.upiId === 'string' && val.upiId.trim().length > 0
        ? val.upiId.trim()
        : DEFAULT_BUSINESS_UPI_ID,
      payeeName: typeof val.upiPayeeName === 'string' && val.upiPayeeName.trim().length > 0
        ? val.upiPayeeName.trim()
        : DEFAULT_PAYEE_NAME,
      upiEnabled: val.upiEnabled !== false,
    };
  } catch (error) {
    console.error('Failed to load UPI payment settings, using defaults:', error);
    return {
      upiId: DEFAULT_BUSINESS_UPI_ID,
      payeeName: DEFAULT_PAYEE_NAME,
      upiEnabled: true,
    };
  }
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
  
  // Safe extraction of amount paid
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
 * Usable directly inside HTML <img> tags and @react-pdf/renderer <Image> components.
 */
export async function generateUpiQrDataUrl(upiUri: string): Promise<string> {
  return QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 256,
    color: {
      dark: '#0f172a', // Deep slate navy (executive contrast)
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

/**
 * Comprehensive resolution of payment eligibility, dynamic URI, and QR image.
 */
export async function resolveOrderInvoicePaymentData(
  order: any,
  customSettings?: Partial<IUpiPaymentSettings>
): Promise<IInvoiceUpiPaymentData> {
  const settings: IUpiPaymentSettings = {
    upiId: customSettings?.upiId || DEFAULT_BUSINESS_UPI_ID,
    payeeName: customSettings?.payeeName || customSettings?.upiPayeeName || DEFAULT_PAYEE_NAME,
    upiEnabled: customSettings?.upiEnabled !== false,
  };

  const balance = calculateOutstandingBalance(order);

  const cleanInvoiceNumber = order.invoiceNumber || `INV-${order.id}`;
  const refId = `REF-${order.id || cleanInvoiceNumber}`;

  if (!settings.upiEnabled) {
    return {
      isEligible: false,
      reason: 'UPI_DISABLED',
      outstandingBalance: balance.outstanding,
      amountPaid: balance.amountPaid,
      totalAmount: balance.total,
      isPartial: balance.isPartial,
      currency: DEFAULT_CURRENCY,
      invoiceNumber: cleanInvoiceNumber,
      orderId: order.id,
    };
  }

  if (!balance.isEligibleForPayment) {
    return {
      isEligible: false,
      reason: balance.isCancelled
        ? 'CANCELLED'
        : balance.isFullyPaid
        ? 'FULLY_PAID'
        : 'ZERO_BALANCE',
      outstandingBalance: balance.outstanding,
      amountPaid: balance.amountPaid,
      totalAmount: balance.total,
      isPartial: balance.isPartial,
      currency: DEFAULT_CURRENCY,
      invoiceNumber: cleanInvoiceNumber,
      orderId: order.id,
    };
  }

  const upiUri = buildUpiUri({
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    amount: balance.outstanding,
    invoiceNumber: cleanInvoiceNumber,
    orderId: order.id,
    currency: DEFAULT_CURRENCY,
    refId,
  });

  const qrDataUrl = await generateUpiQrDataUrl(upiUri);

  return {
    isEligible: true,
    upiId: settings.upiId,
    payeeName: settings.payeeName,
    outstandingBalance: balance.outstanding,
    amountPaid: balance.amountPaid,
    totalAmount: balance.total,
    isPartial: balance.isPartial,
    currency: DEFAULT_CURRENCY,
    invoiceNumber: cleanInvoiceNumber,
    orderId: order.id,
    refId,
    upiUri,
    qrDataUrl,
  };
}
