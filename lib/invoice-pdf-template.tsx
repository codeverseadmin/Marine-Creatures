/**
 * MARINE CREATURES — EXECUTIVE INVOICE
 *
 * Premium, minimalist corporate invoice document.
 * Pure white background, deep navy typography, muted ocean-blue accents,
 * thin elegant dividers, subtle information panels, and clean alignment.
 *
 * Server-side React-PDF document via @react-pdf/renderer.
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';

// ─── Executive Colour Palette ────────────────────────────────────────────────
const C = {
  white:      '#ffffff',
  navy:       '#0f172a',    // Slate 900 (primary headings, invoice title, total box)
  ink:        '#1e293b',    // Slate 800 (table headers, primary body text)
  body:       '#334155',    // Slate 700 (standard text)
  muted:      '#64748b',    // Slate 500 (labels, secondary meta)
  subtle:     '#94a3b8',    // Slate 400 (captions, footer notes)
  ocean:      '#0369a1',    // Sky 700 (subtle ocean-blue brand accents)
  oceanLight: '#e0f2fe',    // Sky 100
  border:     '#e2e8f0',    // Slate 200 (thin elegant hairline dividers)
  borderLight:'#f1f5f9',    // Slate 100
  panelBg:    '#f8fafc',    // Slate 50 (subtle grey information panels)
  tableRowAlt:'#fafafa',    // Minimal alternating row tint
  emerald:    '#059669',    // Verified indicator
};

const styles = StyleSheet.create({
  page: {
    fontFamily:        'Helvetica',
    backgroundColor:   C.white,
    paddingTop:        32,
    paddingBottom:     36,
    paddingHorizontal: 36,
    fontSize:          8.5,
    color:             C.body,
    lineHeight:        1.45,
  },

  // ── Header Section ──────────────────────────────────────────────────────────
  headerRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'flex-start',
    paddingBottom:     16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom:      14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    maxWidth:      '55%',
  },
  logoImage: {
    width:        44,
    height:       44,
    objectFit:    'contain',
  },
  brandBlock: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      15,
    color:         C.navy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  brandDescriptor: {
    fontFamily:    'Helvetica',
    fontSize:      7.5,
    color:         C.ocean,
    letterSpacing: 0.8,
    marginTop:     2,
    textTransform: 'uppercase',
  },
  companySubtext: {
    fontFamily: 'Helvetica',
    fontSize:   6.8,
    color:      C.muted,
    marginTop:  3,
    lineHeight: 1.3,
  },

  headerRight: {
    alignItems: 'flex-end',
    minWidth:   '40%',
  },
  docTitleBadge: {
    fontFamily:        'Helvetica-Bold',
    fontSize:          8,
    color:             C.navy,
    textTransform:     'uppercase',
    letterSpacing:     1,
    backgroundColor:   C.panelBg,
    paddingVertical:   3,
    paddingHorizontal: 8,
    borderRadius:      3,
    borderWidth:       0.75,
    borderColor:       C.border,
    marginBottom:      6,
  },
  headerMetaTable: {
    alignItems: 'flex-end',
  },
  headerMetaRow: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    marginBottom:   2,
  },
  headerMetaLabel: {
    fontFamily: 'Helvetica',
    fontSize:   7.5,
    color:      C.muted,
    marginRight: 6,
  },
  headerMetaValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   7.8,
    color:      C.navy,
  },
  headerMetaRef: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   7.8,
    color:      C.ocean,
  },

  // ── Two-Column Information Cards ───────────────────────────────────────────
  infoGrid: {
    flexDirection: 'row',
    gap:           12,
    marginBottom:  14,
  },
  infoCard: {
    flex:            1,
    backgroundColor: C.panelBg,
    borderWidth:     0.75,
    borderColor:     C.border,
    borderRadius:    4,
    padding:         9,
  },
  cardTitle: {
    fontFamily:        'Helvetica-Bold',
    fontSize:          7,
    color:             C.navy,
    textTransform:     'uppercase',
    letterSpacing:     0.8,
    marginBottom:      5,
    paddingBottom:     3,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  customerName: {
    fontFamily:   'Helvetica-Bold',
    fontSize:     9.5,
    color:        C.navy,
    marginBottom: 2,
  },
  cardLine: {
    fontFamily:   'Helvetica',
    fontSize:     7.5,
    color:        C.body,
    marginBottom: 1.5,
    lineHeight:   1.35,
  },
  cardLineMuted: {
    fontFamily: 'Helvetica',
    fontSize:   7.2,
    color:      C.muted,
  },

  // ── Dispatch Specifications Grid ───────────────────────────────────────────
  consignmentGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
  },
  consignmentItem: {
    width:        '48%',
    marginBottom: 3,
  },
  consignmentLabel: {
    fontFamily: 'Helvetica',
    fontSize:   6.8,
    color:      C.muted,
  },
  consignmentValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   7.5,
    color:      C.ink,
  },
  orderNoteText: {
    fontFamily: 'Helvetica',
    fontSize:   7,
    color:      C.ocean,
    marginTop:  4,
  },

  // ── Itemised Table ─────────────────────────────────────────────────────────
  table: {
    borderWidth:       0.75,
    borderColor:       C.border,
    borderRadius:      4,
    marginBottom:      12,
    overflow:          'hidden',
  },
  tableHeader: {
    flexDirection:     'row',
    backgroundColor:   C.panelBg,
    borderBottomWidth: 0.75,
    borderBottomColor: C.border,
    paddingVertical:   6,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      7,
    color:         C.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection:     'row',
    paddingVertical:   5.5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
    alignItems:        'center',
  },
  tableRowAlt: {
    backgroundColor: C.tableRowAlt,
  },
  tableCell: {
    fontFamily: 'Helvetica',
    fontSize:   7.5,
    color:      C.body,
  },
  tableCellBold: {
    fontFamily: 'Helvetica-Bold',
    color:      C.ink,
  },
  tableCellSub: {
    fontFamily: 'Helvetica',
    fontSize:   6.5,
    color:      C.muted,
    marginTop:  1,
  },

  colNo:    { width: '6%',  textAlign: 'center' },
  colDesc:  { width: '46%' },
  colHsn:   { width: '12%', textAlign: 'center' },
  colQty:   { width: '8%',  textAlign: 'center' },
  colRate:  { width: '14%', textAlign: 'right' },
  colAmt:   { width: '14%', textAlign: 'right' },

  // ── Settlement Summary ─────────────────────────────────────────────────────
  summarySection: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    marginBottom:   12,
    gap:            16,
  },
  summaryLeft: {
    flex:     1,
    maxWidth: '56%',
  },
  amountWordsBox: {
    backgroundColor: C.panelBg,
    borderWidth:     0.75,
    borderColor:     C.border,
    borderRadius:    4,
    padding:         8,
    marginBottom:    8,
  },
  amountWordsLabel: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      6.8,
    color:         C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom:  2,
  },
  amountWordsText: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   7.5,
    color:      C.ink,
  },
  upiPaymentBox: {
    backgroundColor: C.panelBg,
    borderWidth:     0.75,
    borderColor:     C.border,
    borderRadius:    4,
    padding:         6,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             8,
    marginBottom:    8,
  },
  upiQrWrapper: {
    backgroundColor: C.white,
    padding:         3,
    borderRadius:    3,
    borderWidth:     0.5,
    borderColor:     C.border,
  },
  upiQrImage: {
    width:  52,
    height: 52,
  },
  upiTextWrapper: {
    flex: 1,
  },
  upiHeaderTitle: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      7.5,
    color:         C.navy,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom:  2,
  },
  upiDetailLine: {
    fontFamily:   'Helvetica',
    fontSize:     6.8,
    color:        C.body,
    marginBottom: 1,
  },
  upiBoldLabel: {
    fontFamily: 'Helvetica-Bold',
    color:      C.navy,
  },
  upiAmountLine: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   7.5,
    color:      C.ocean,
    marginTop:  1,
  },
  upiSubNotice: {
    fontFamily: 'Helvetica',
    fontSize:   5.8,
    color:      C.muted,
    marginTop:  1.5,
  },
  settledPaymentBox: {
    backgroundColor: '#ecfdf5',
    borderWidth:     0.75,
    borderColor:     '#a7f3d0',
    borderRadius:    4,
    padding:         6,
    marginBottom:    8,
  },
  settledTitle: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      7.2,
    color:         C.emerald,
    letterSpacing: 0.6,
    marginBottom:  1,
  },
  settledSubtext: {
    fontFamily: 'Helvetica',
    fontSize:   6.2,
    color:      '#065f46',
  },
  cancelledPaymentBox: {
    backgroundColor: '#fff1f2',
    borderWidth:     0.75,
    borderColor:     '#fecdd3',
    borderRadius:    4,
    padding:         6,
    marginBottom:    8,
  },
  cancelledTitle: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      7.2,
    color:         '#e11d48',
    letterSpacing: 0.6,
    marginBottom:  1,
  },
  protocolNotice: {
    fontSize:   6.8,
    color:      C.muted,
    lineHeight: 1.4,
  },

  summaryRight: {
    width:        210,
    borderWidth:  0.75,
    borderColor:  C.border,
    borderRadius: 4,
    overflow:     'hidden',
  },
  summaryRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingVertical:   4,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.borderLight,
  },
  summaryLabel: {
    fontFamily: 'Helvetica',
    fontSize:   7.5,
    color:      C.muted,
  },
  summaryVal: {
    fontFamily: 'Helvetica',
    fontSize:   7.5,
    color:      C.ink,
  },
  summaryValFree: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   7,
    color:      C.emerald,
  },
  totalBox: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingVertical:   6.5,
    paddingHorizontal: 8,
    backgroundColor:   C.navy,
  },
  totalLabel: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      8,
    color:         C.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalAmountVal: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   10,
    color:      C.white,
  },
  summaryValDiscount: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      8.5,
    color:         '#059669',
    letterSpacing: 0.2,
  },

  // ── Footer & Signatory ─────────────────────────────────────────────────────
  footerSection: {
    borderTopWidth: 0.75,
    borderTopColor: C.border,
    paddingTop:     10,
    marginTop:      'auto',
  },
  footerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    marginBottom:   8,
  },
  footerCompanyDetails: {
    maxWidth: '65%',
  },
  footerCompanyName: {
    fontFamily:    'Helvetica-Bold',
    fontSize:      7.5,
    color:         C.navy,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footerCompanyText: {
    fontFamily: 'Helvetica',
    fontSize:   6.8,
    color:      C.muted,
    lineHeight: 1.4,
    marginTop:  1,
  },

  signatoryBlock: {
    alignItems: 'flex-end',
    width:      140,
  },
  signatoryImage: {
    maxHeight: 28,
    maxWidth:  100,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signatoryRule: {
    width:             '100%',
    borderTopWidth:    0.75,
    borderTopColor:    C.border,
    paddingTop:        2,
    alignItems:        'flex-end',
  },
  signatoryTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize:   7,
    color:      C.navy,
  },
  signatoryRole: {
    fontFamily: 'Helvetica',
    fontSize:   6.5,
    color:      C.muted,
  },

  brandBaseline: {
    position:          'absolute',
    bottom:            12,
    left:              36,
    right:             36,
    textAlign:         'center',
    fontFamily:        'Helvetica',
    fontSize:          6.5,
    color:             C.subtle,
    letterSpacing:     0.5,
    paddingTop:        4,
    borderTopWidth:    0.5,
    borderTopColor:    C.borderLight,
  },
});

// ─── Indian Currency Number-to-Words Helper ──────────────────────────────────
export function numberToWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';

  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  return convert(Math.round(num)) + ' Rupees Only';
}

// ─── Executive Date Formatter (e.g. 07 October 2026) ─────────────────────────
export function formatExecutiveDate(input?: string | Date | null): string {
  if (!input) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')} ${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;
  }

  // If already in "D Month YYYY" or "DD Month YYYY" format
  const match = String(input).match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (match) {
    const [, d, mStr, y] = match;
    const testDate = new Date(`${mStr} 1, 2000`);
    const fullMonth = !isNaN(testDate.getTime()) ? testDate.toLocaleString('en-US', { month: 'long' }) : mStr;
    return `${d.padStart(2, '0')} ${fullMonth} ${y}`;
  }

  const d = new Date(input);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'long' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  }

  return String(input);
}

// ─── Input Data Interface ────────────────────────────────────────────────────
export interface TaxAccountingParticulars {
  verifiedSupplierGstin: string;
  verifiedSupplierPan?: string;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  taxableValue?: number;
  placeOfSupply?: string;
}

export interface ExecutiveInvoiceOrderData {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  orderNotes?: string;
  items: Array<{
    id?: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    categoryLabel?: string;
    product?: { name: string; price: number; quantity?: number; categoryLabel?: string };
    priceOnRequest?: boolean;
    agreedUnitPrice?: number;
    pricingStatus?: string;
    pricedAt?: string;
    pricedBy?: string;
    warranty?: {
      hasWarranty: boolean;
      provider?: string;
      durationValue?: number;
      durationUnit?: string;
      terms?: string;
    };
  }>;
  totalAmount: number;
  subtotal?: number;
  coupon?: {
    code: string;
    discountType?: string;
    discountValue?: number;
    discountAmount: number;
    eligibleSubtotal?: number;
    description?: string;
  };
  courierName?: string;
  awbNumber?: string;
  estimatedDelivery?: string;
  invoiceNumber?: string;
  isApproved?: boolean;
  approvedAt?: string;
  createdAt?: string;
  currentStep?: string;
  statusHistory?: any[];
  history?: any[];
  hasUnresolvedPorItems?: boolean;
  porPricingResolvedAt?: string;
  porPricingResolvedBy?: string;
  pricingVersion?: number;
  originalInvoiceNumber?: string;
  invoiceRevisions?: any[];
  gstin?: string;
  taxAccounting?: TaxAccountingParticulars;
  isTaxInvoiceCompliant?: boolean;
  logoPath?: string;
  signaturePath?: string;
  upiPayment?: {
    isEligible: boolean;
    reason?: string;
    upiId?: string;
    payeeName?: string;
    outstandingBalance?: number;
    amountPaid?: number;
    totalAmount?: number;
    isPartial?: boolean;
    qrDataUrl?: string;
    upiUri?: string;
  };
}

// ─── Executive PDF Document ──────────────────────────────────────────────────
export function InvoicePDFDocument({ order }: { order: ExecutiveInvoiceOrderData }) {
  const invoiceNumber = order.invoiceNumber || `INV-${order.id}`;
  const formattedDate = formatExecutiveDate(order.approvedAt || order.createdAt);

  // Normalise product rows
  const items = (order.items || []).map((item) => {
    if (item.product) {
      return {
        name:          item.product.name,
        price:         item.product.price,
        quantity:      item.quantity || 1,
        categoryLabel: item.product.categoryLabel || '',
        warranty:      item.warranty || (item.product as any)?.warranty,
      };
    }
    return {
      name:          item.name,
      price:         item.price,
      quantity:      item.quantity || 1,
      categoryLabel: item.categoryLabel || item.category || '',
      warranty:      item.warranty,
    };
  });

  // Calculate Subtotal safely
  const computedSubtotal = items.reduce((acc, it) => acc + (it.price * it.quantity), 0);
  const displaySubtotal = order.subtotal || computedSubtotal || order.totalAmount;

  // Filter out placeholder AWB numbers like 'EXP-AIR-PENDING'
  const validAwb = order.awbNumber && !order.awbNumber.includes('PENDING') && order.awbNumber.trim().length > 0
    ? order.awbNumber.trim()
    : null;

  // Filter out unverified estimated delivery placeholders
  const validEstDelivery = order.estimatedDelivery && !order.estimatedDelivery.includes('PENDING') && order.estimatedDelivery.trim().length > 0
    ? order.estimatedDelivery.trim()
    : null;

  // Permanent Invoice Classification:
  // Marine Creatures operates without a GSTIN registration.
  // Under statutory compliance and owner directive, this document heading is
  // PERMANENTLY fixed as 'INVOICE & DISPATCH MANIFEST'.
  // Automatic or conditional switching to 'TAX INVOICE' is strictly disallowed
  // without explicit business owner authorization.
  const docTitle = 'INVOICE & DISPATCH MANIFEST';

  return (
    <Document
      title={`Marine Creatures Invoice — ${invoiceNumber}`}
      author="Marine Creatures Aquatics Private Limited"
      subject={`Invoice for Order #${order.id}`}
      creator="Marine Creatures Executive Billing Engine"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page}>

        {/* ── A. Header ────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {order.logoPath ? (
              <Image src={order.logoPath} style={styles.logoImage} />
            ) : null}
            <View style={styles.brandBlock}>
              <Text style={styles.brandTitle}>Marine Creatures</Text>
              <Text style={styles.brandDescriptor}>Bringing Ocean at Your Doorstep</Text>
              <Text style={styles.companySubtext}>Marine Creatures Aquatics Private Limited</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.docTitleBadge}>{docTitle}</Text>
            <View style={styles.headerMetaTable}>
              <View style={styles.headerMetaRow}>
                <Text style={styles.headerMetaLabel}>Invoice No:</Text>
                <Text style={styles.headerMetaValue}>{invoiceNumber}</Text>
              </View>
              <View style={styles.headerMetaRow}>
                <Text style={styles.headerMetaLabel}>Date:</Text>
                <Text style={styles.headerMetaValue}>{formattedDate}</Text>
              </View>
              <View style={styles.headerMetaRow}>
                <Text style={styles.headerMetaLabel}>Order Ref:</Text>
                <Text style={styles.headerMetaRef}>#{order.id}</Text>
              </View>
              {order.gstin ? (
                <View style={styles.headerMetaRow}>
                  <Text style={styles.headerMetaLabel}>GSTIN:</Text>
                  <Text style={styles.headerMetaValue}>{order.gstin}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* ── B, C, D. Information Panels (Two Columns) ────────────────── */}
        <View style={styles.infoGrid}>
          {/* Left Panel: Issuer & Bill To */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Bill To / Consignee</Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.cardLine}>+91 {order.phone}</Text>
            <Text style={styles.cardLine}>{order.address}</Text>
            <Text style={styles.cardLine}>{order.city} — {order.pincode}</Text>
            {order.orderNotes ? (
              <Text style={styles.orderNoteText}>Note: &ldquo;{order.orderNotes}&rdquo;</Text>
            ) : null}
          </View>

          {/* Right Panel: Consignment & Dispatch Specifications */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Consignment Specifications</Text>
            <View style={styles.consignmentGrid}>
              <View style={styles.consignmentItem}>
                <Text style={styles.consignmentLabel}>Carrier Partner</Text>
                <Text style={styles.consignmentValue}>{order.courierName || 'Priority Air Cargo'}</Text>
              </View>
              <View style={styles.consignmentItem}>
                <Text style={styles.consignmentLabel}>Air Waybill (AWB)</Text>
                <Text style={styles.consignmentValue}>{validAwb || 'Assigned at Dispatch'}</Text>
              </View>
              <View style={styles.consignmentItem}>
                <Text style={styles.consignmentLabel}>Est. Delivery</Text>
                <Text style={styles.consignmentValue}>{validEstDelivery || 'Standard Express'}</Text>
              </View>
              <View style={styles.consignmentItem}>
                <Text style={styles.consignmentLabel}>Packaging Standard</Text>
                <Text style={[styles.consignmentValue, { color: C.emerald }]}>Climate Thermal Pod</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── E. Itemised Product Table ─────────────────────────────────── */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>No.</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Product Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colHsn]}>HSN/SAC</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmt]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
              wrap={false}
            >
              <Text style={[styles.tableCell, styles.colNo, { color: C.muted }]}>{idx + 1}</Text>
              <View style={styles.colDesc}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{item.name}</Text>
                {item.categoryLabel ? (
                  <Text style={styles.tableCellSub}>{item.categoryLabel}</Text>
                ) : null}
                {item.warranty?.hasWarranty ? (
                  <Text style={[styles.tableCellSub, { color: C.ocean }]}>
                    Warranty: {item.warranty.durationValue} {item.warranty.durationUnit} ({item.warranty.provider === 'manufacturer' ? 'Manufacturer' : 'Seller'})
                  </Text>
                ) : (
                  <Text style={[styles.tableCellSub, { color: C.muted }]}>
                    Warranty: No Warranty
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.colHsn, { color: C.muted }]}>0301</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colRate]}>
                {'\u20B9'}{item.price.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colAmt]}>
                {'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>

        {/* ── F. Payment Summary & Amount in Words ──────────────────────── */}
        <View style={styles.summarySection} wrap={false}>
          <View style={styles.summaryLeft}>
            <View style={styles.amountWordsBox}>
              <Text style={styles.amountWordsLabel}>Amount in Words</Text>
              <Text style={styles.amountWordsText}>{numberToWords(order.totalAmount)}</Text>
            </View>

            {/* UPI QR Payment Block or Settlement State */}
            {order.upiPayment && order.upiPayment.isEligible && order.upiPayment.qrDataUrl ? (
              <View style={styles.upiPaymentBox}>
                <View style={styles.upiQrWrapper}>
                  <Image src={order.upiPayment.qrDataUrl} style={styles.upiQrImage} />
                </View>
                <View style={styles.upiTextWrapper}>
                  <Text style={styles.upiHeaderTitle}>Instant UPI Settlement</Text>
                  <Text style={styles.upiDetailLine}>
                    <Text style={styles.upiBoldLabel}>UPI ID: </Text>
                    {order.upiPayment.upiId}
                  </Text>
                  <Text style={styles.upiDetailLine}>
                    <Text style={styles.upiBoldLabel}>Payee: </Text>
                    {order.upiPayment.payeeName}
                  </Text>
                  <Text style={styles.upiAmountLine}>
                    Payable: {'\u20B9'}{(order.upiPayment.outstandingBalance ?? order.totalAmount).toLocaleString('en-IN')}
                  </Text>
                  {order.upiPayment.isPartial && typeof order.upiPayment.amountPaid === 'number' && order.upiPayment.amountPaid > 0 ? (
                    <Text style={styles.upiSubNotice}>
                      Partially Paid: {'\u20B9'}{order.upiPayment.amountPaid.toLocaleString('en-IN')} (Remaining balance above)
                    </Text>
                  ) : (
                    <Text style={styles.upiSubNotice}>
                      Scan with Google Pay, PhonePe, Paytm or any UPI app
                    </Text>
                  )}
                </View>
              </View>
            ) : order.upiPayment && !order.upiPayment.isEligible && order.upiPayment.reason === 'FULLY_PAID' ? (
              <View style={styles.settledPaymentBox}>
                <Text style={styles.settledTitle}>[ PAYMENT COMPLETED &amp; RECONCILED ]</Text>
                <Text style={styles.settledSubtext}>
                  This invoice has been settled in full. No balance is outstanding.
                </Text>
              </View>
            ) : order.upiPayment && !order.upiPayment.isEligible && order.upiPayment.reason === 'CANCELLED' ? (
              <View style={styles.cancelledPaymentBox}>
                <Text style={styles.cancelledTitle}>[ INVOICE VOID &amp; CANCELLED ]</Text>
                <Text style={styles.settledSubtext}>
                  This order was cancelled. Payment requests are deactivated.
                </Text>
              </View>
            ) : null}

            <Text style={styles.protocolNotice}>
              Live marine cargo certified. Specimens are conditioned in dedicated quarantine facilities
              and packaged in multi-stage oxygenated thermal enclosures.
            </Text>
          </View>

          <View style={styles.summaryRight}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryVal}>{'\u20B9'}{displaySubtotal.toLocaleString('en-IN')}</Text>
            </View>
            {order.coupon && order.coupon.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Coupon ({order.coupon.code})</Text>
                <Text style={styles.summaryValDiscount}>-{'\u20B9'}{order.coupon.discountAmount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Thermal Pod Packaging</Text>
              <Text style={styles.summaryValFree}>Complimentary</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Priority Cargo Transit</Text>
              <Text style={styles.summaryValFree}>Complimentary</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalAmountVal}>{'\u20B9'}{order.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* ── G. Footer & Signatory ────────────────────────────────────── */}
        <View style={styles.footerSection} wrap={false}>
          <View style={styles.footerRow}>
            <View style={styles.footerCompanyDetails}>
              <Text style={styles.footerCompanyName}>Marine Creatures Aquatics Private Limited</Text>
              <Text style={styles.footerCompanyText}>
                Registered Studio: Kolkata, West Bengal, India{'\n'}
                Contact: +91 93304 36603 • concierge@marinecreatures.com
              </Text>
            </View>

            <View style={styles.signatoryBlock}>
              {order.signaturePath ? (
                <Image src={order.signaturePath} style={styles.signatoryImage} />
              ) : null}
              <View style={styles.signatoryRule}>
                <Text style={styles.signatoryTitle}>Authorized Signatory</Text>
                <Text style={styles.signatoryRole}>Founder &amp; Master Aquarist</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Dynamic Page Numbering & Baseline (Fixed on all pages) ──── */}
        <Text
          style={styles.brandBaseline}
          render={({ pageNumber, totalPages }) =>
            `Marine Creatures — Bringing Ocean at Your Doorstep • Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />

      </Page>
    </Document>
  );
}
