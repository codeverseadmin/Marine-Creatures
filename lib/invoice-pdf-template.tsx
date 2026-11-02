/**
 * Invoice PDF Template
 * Server-side React PDF document using @react-pdf/renderer.
 * Mirrors the visual structure of /invoice/[id]/page.tsx.
 * Never imported on the client bundle — server-route only.
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

// ─── Colour palette (matches dark invoice theme → print-safe on white) ────────
const C = {
  black:      '#0a0f18',
  ink:        '#1e293b',
  border:     '#334155',
  muted:      '#64748b',
  body:       '#374151',
  heading:    '#0f172a',
  accent:     '#0891b2',   // cyan-600
  emerald:    '#059669',
  amber:      '#d97706',
  white:      '#ffffff',
  lightBg:    '#f8fafc',
  rowEven:    '#f1f5f9',
};

const styles = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    backgroundColor: C.white,
    paddingTop:      36,
    paddingBottom:   48,
    paddingHorizontal: 40,
    fontSize:        9,
    color:           C.body,
    lineHeight:      1.5,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  headerRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    borderBottom:   `1 solid ${C.border}`,
    paddingBottom:  14,
    marginBottom:   14,
  },
  companyBlock: { flex: 1 },
  companyName: {
    fontSize:    18,
    fontFamily:  'Helvetica-Bold',
    color:       C.heading,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  companyTagline: {
    fontSize:   8,
    color:      C.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  companyMeta: { fontSize: 8, color: C.muted, lineHeight: 1.6 },

  invoiceBadgeBlock: { alignItems: 'flex-end' },
  invoiceBadge: {
    fontSize:        8,
    fontFamily:      'Helvetica-Bold',
    color:           C.accent,
    textTransform:   'uppercase',
    letterSpacing:   1,
    borderRadius:    4,
    border:          `1 solid ${C.accent}`,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginBottom:    8,
  },
  invoiceMetaRow: {
    flexDirection: 'row',
    gap:            6,
    marginBottom:   2,
    justifyContent: 'flex-end',
  },
  invoiceMetaLabel: { color: C.muted, fontSize: 8 },
  invoiceMetaValue: { fontFamily: 'Helvetica-Bold', color: C.heading, fontSize: 8 },

  // ── Two-column section ─────────────────────────────────────────────────────
  twoCol: {
    flexDirection:  'row',
    gap:            10,
    marginBottom:   14,
  },
  infoBox: {
    flex:            1,
    backgroundColor: C.lightBg,
    border:          `1 solid ${C.border}`,
    borderRadius:    6,
    padding:         10,
  },
  infoBoxLabel: {
    fontSize:      7,
    fontFamily:    'Helvetica-Bold',
    color:         C.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom:  6,
  },
  infoCustomerName: {
    fontSize:    11,
    fontFamily:  'Helvetica-Bold',
    color:       C.heading,
    marginBottom: 3,
  },
  infoLine:  { fontSize: 8, color: C.body, marginBottom: 2 },
  infoGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoGridItem: { width: '45%' },
  infoGridLabel: { fontSize: 7, color: C.muted, marginBottom: 1 },
  infoGridValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.heading },

  // ── Items table ────────────────────────────────────────────────────────────
  table: {
    border:       `1 solid ${C.border}`,
    borderRadius: 6,
    marginBottom: 14,
    overflow:     'hidden',
  },
  tableHead: {
    flexDirection:   'row',
    backgroundColor: C.ink,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeadCell: {
    color:         C.white,
    fontSize:      7.5,
    fontFamily:    'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection:     'row',
    paddingVertical:   7,
    paddingHorizontal: 10,
    borderTop:         `1 solid ${C.border}`,
  },
  tableRowAlt: { backgroundColor: C.rowEven },
  tableCell:  { fontSize: 8, color: C.body },
  tableCellBold: { fontFamily: 'Helvetica-Bold', color: C.heading },

  colNo:    { width: '6%' },
  colDesc:  { width: '46%' },
  colHsn:   { width: '12%', textAlign: 'center' },
  colQty:   { width: '10%', textAlign: 'center' },
  colRate:  { width: '13%', textAlign: 'right' },
  colAmt:   { width: '13%', textAlign: 'right' },

  // ── Totals row ─────────────────────────────────────────────────────────────
  totalsSection: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    marginBottom:   14,
  },
  totalsBox: {
    width:           220,
    border:          `1 solid ${C.border}`,
    borderRadius:    6,
    overflow:        'hidden',
  },
  totalsRow: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingVertical:   5,
    paddingHorizontal: 10,
    borderBottom:      `1 solid ${C.border}`,
  },
  totalsRowFinal: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    paddingVertical:   7,
    paddingHorizontal: 10,
    backgroundColor:   C.ink,
  },
  totalsLabel:      { fontSize: 8, color: C.muted },
  totalsValue:      { fontSize: 8, color: C.body },
  totalsFinalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.white },
  totalsFinalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.white },

  // ── Terms box ──────────────────────────────────────────────────────────────
  termsBox: {
    backgroundColor: '#f0fdf4',
    border:          `1 solid ${C.emerald}`,
    borderRadius:    6,
    padding:         10,
    marginBottom:    14,
  },
  termsTitle: {
    fontSize:      8,
    fontFamily:    'Helvetica-Bold',
    color:         C.emerald,
    textTransform: 'uppercase',
    marginBottom:  4,
  },
  termsText: { fontSize: 7.5, color: C.body, lineHeight: 1.6 },

  // ── Footer / signatories ───────────────────────────────────────────────────
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-end',
    borderTop:      `1 solid ${C.border}`,
    paddingTop:     12,
    marginBottom:   10,
  },
  sealCircle: {
    width:        56,
    height:       56,
    borderRadius: 28,
    border:       `2 solid ${C.accent}`,
    alignItems:   'center',
    justifyContent: 'center',
    padding:      6,
  },
  sealText: {
    fontSize:      5.5,
    fontFamily:    'Helvetica-Bold',
    color:         C.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign:     'center',
    lineHeight:    1.4,
  },
  sealSubText: {
    fontSize:      5,
    color:         C.emerald,
    fontFamily:    'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign:     'center',
  },
  sigBlock: { alignItems: 'flex-end' },
  sigForLine: { fontSize: 7.5, color: C.muted, marginBottom: 20, textAlign: 'right' },
  sigLine: {
    borderTop:   `1 solid ${C.border}`,
    paddingTop:  4,
    width:       150,
    alignItems:  'flex-end',
  },
  sigName: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.heading, textAlign: 'right' },
  sigTitle: { fontSize: 7, color: C.muted, textAlign: 'right' },

  documentFooter: {
    textAlign:  'center',
    fontSize:   7,
    color:      C.muted,
    marginTop:  8,
    lineHeight: 1.5,
  },

  // ── Amount in words ────────────────────────────────────────────────────────
  amtWords: {
    fontSize:    7.5,
    color:       C.muted,
    marginBottom: 14,
  },
  amtWordsBold: { fontFamily: 'Helvetica-Bold', fontStyle: 'normal', color: C.body },

  // ── Status badge ───────────────────────────────────────────────────────────
  statusApproved: { color: C.emerald, fontFamily: 'Helvetica-Bold', fontSize: 8 },
  statusPending:  { color: C.amber,   fontFamily: 'Helvetica-Bold', fontSize: 8 },
});

// ─── Number-to-words helper (Indian numbering) ─────────────────────────────
function numberToWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20)   return a[num];
  if (num < 100)  return b[Math.floor(num / 10)] + (num % 10 ? ' ' + a[num % 10] : '');
  if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
  if (num < 100000)   return numberToWords(Math.floor(num / 1000))   + ' Thousand' + (num % 1000   ? ' ' + numberToWords(num % 1000) : '');
  if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh'     + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
  return `${num}`;
}

// ─── Order shape expected by the template ─────────────────────────────────
export interface InvoiceOrderData {
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
  }>;
  totalAmount: number;
  courierName?: string;
  awbNumber?: string;
  estimatedDelivery?: string;
  invoiceNumber?: string;
  isApproved?: boolean;
  approvedAt?: string;
  createdAt?: string;
}

// ─── PDF Document Component ────────────────────────────────────────────────
export function InvoicePDFDocument({ order }: { order: InvoiceOrderData }) {
  const invoiceNumber = order.invoiceNumber || `INV-${order.id}`;
  const invoiceDate   = order.approvedAt || order.createdAt || new Date().toLocaleDateString('en-IN');

  // Normalise item shape (OrdersTab uses flat fields; invoice page uses `product` wrapper)
  const items = order.items.map((item) => {
    if (item.product) {
      return {
        name:          item.product.name,
        price:         item.product.price,
        quantity:      item.quantity,
        categoryLabel: item.product.categoryLabel || '',
      };
    }
    return {
      name:          item.name,
      price:         item.price,
      quantity:      item.quantity,
      categoryLabel: item.categoryLabel || item.category || '',
    };
  });

  return (
    <Document
      title={`Tax Invoice — ${invoiceNumber}`}
      author="Marine Creatures Aquatics Pvt. Ltd."
      subject={`Invoice for Order ${order.id}`}
      creator="Marine Creatures Control OS"
      producer="@react-pdf/renderer"
    >
      <Page size="A4" style={styles.page}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>Marine Creatures</Text>
            <Text style={styles.companyTagline}>Bringing Ocean at your Doorstep</Text>
            <Text style={styles.companyMeta}>Marine Creatures Aquatics Private Limited</Text>
            <Text style={styles.companyMeta}>Registered Studio: Kolkata, West Bengal, India</Text>
            <Text style={styles.companyMeta}>Live Marine Cargo Permitted • Government Registered Aquaculture Vendor</Text>
          </View>

          <View style={styles.invoiceBadgeBlock}>
            <Text style={styles.invoiceBadge}>Tax Invoice &amp; Live Manifest</Text>

            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice No: </Text>
              <Text style={styles.invoiceMetaValue}>{invoiceNumber}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice Date: </Text>
              <Text style={styles.invoiceMetaValue}>{invoiceDate}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Order Ref: </Text>
              <Text style={styles.invoiceMetaValue}>#{order.id}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Status: </Text>
              <Text style={order.isApproved ? styles.statusApproved : styles.statusPending}>
                {order.isApproved ? '✓ APPROVED & VERIFIED' : '● PENDING APPROVAL'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Consignee + Cargo ────────────────────────────────────────── */}
        <View style={styles.twoCol}>
          {/* Billed To */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxLabel}>Billed To / Consignee</Text>
            <Text style={styles.infoCustomerName}>{order.customerName}</Text>
            <Text style={styles.infoLine}>+91 {order.phone}</Text>
            <Text style={styles.infoLine}>{order.address}</Text>
            <Text style={styles.infoLine}>City &amp; PIN: {order.city} — {order.pincode}</Text>
            {order.orderNotes ? (
              <Text style={[styles.infoLine, { color: C.amber, marginTop: 4 }]}>
                Note: {order.orderNotes}
              </Text>
            ) : null}
          </View>

          {/* Cargo Details */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxLabel}>Live Air Cargo Dispatch Details</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Carrier Partner</Text>
                <Text style={styles.infoGridValue}>{order.courierName || 'IndiGo CarGo Priority'}</Text>
              </View>
              <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Air Waybill (AWB)</Text>
                <Text style={styles.infoGridValue}>{order.awbNumber || 'EXP-AIR-PENDING'}</Text>
              </View>
              <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Est. Delivery</Text>
                <Text style={styles.infoGridValue}>{order.estimatedDelivery || '—'}</Text>
              </View>
              <View style={styles.infoGridItem}>
                <Text style={styles.infoGridLabel}>Packaging Standard</Text>
                <Text style={[styles.infoGridValue, { color: C.emerald }]}>Climate Thermal Pod</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Items Table ──────────────────────────────────────────────── */}
        <View style={styles.table}>
          {/* Head */}
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeadCell, styles.colDesc]}>Specimen / Marine Item Description</Text>
            <Text style={[styles.tableHeadCell, styles.colHsn]}>HSN/SAC</Text>
            <Text style={[styles.tableHeadCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeadCell, styles.colRate]}>Unit Rate</Text>
            <Text style={[styles.tableHeadCell, styles.colAmt]}>Total Amount</Text>
          </View>

          {/* Rows */}
          {items.map((item, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, styles.colNo, { color: C.muted }]}>{idx + 1}</Text>
              <View style={[styles.colDesc]}>
                <Text style={[styles.tableCell, styles.tableCellBold]}>{item.name}</Text>
                {item.categoryLabel ? (
                  <Text style={[styles.tableCell, { color: C.muted, fontSize: 7 }]}>
                    Category: {item.categoryLabel}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.tableCell, styles.colHsn, { textAlign: 'center', color: C.muted }]}>0301</Text>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colQty, { textAlign: 'center' }]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colRate, { textAlign: 'right' }]}>
                {'\u20B9'}{item.price.toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.tableCell, styles.tableCellBold, styles.colAmt, { textAlign: 'right', color: C.accent }]}>
                {'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Amount in words ──────────────────────────────────────────── */}
        <Text style={styles.amtWords}>
          * In Words:{' '}
          <Text style={styles.amtWordsBold}>
            {numberToWords(order.totalAmount)} Rupees Only
          </Text>
        </Text>

        {/* ── Totals ──────────────────────────────────────────────────── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Specimen Subtotal</Text>
              <Text style={styles.totalsValue}>{'\u20B9'}{order.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Applicable Taxes &amp; Packaging</Text>
              <Text style={[styles.totalsValue, { color: C.emerald }]}>Included ({'\u20B9'}0 Extra)</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Thermal Pod Packaging</Text>
              <Text style={[styles.totalsValue, { color: C.emerald }]}>FREE ({'\u20B9'}0)</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Priority Cargo Air Transit</Text>
              <Text style={[styles.totalsValue, { color: C.emerald }]}>FREE ({'\u20B9'}0)</Text>
            </View>
            <View style={styles.totalsRowFinal}>
              <Text style={styles.totalsFinalLabel}>Total Amount Payable</Text>
              <Text style={styles.totalsFinalValue}>{'\u20B9'}{order.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* ── Terms ───────────────────────────────────────────────────── */}
        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>48-Hour Live Arrival Guarantee (LAG) Active</Text>
          <Text style={styles.termsText}>
            Specimens are packed in specialized medical-grade pure oxygen bags inside multi-layer thermal
            polystyrene pods. Acclimate slowly via drip transfer method over 45 minutes upon unboxing.
            All sales final. Guarantee applies to specimens arriving DOA under standard shipping conditions.
            Ref Code: MC-DOA-AUTHENTIC
          </Text>
        </View>

        {/* ── Footer / Signatory ───────────────────────────────────────── */}
        <View style={styles.footer}>
          {/* Seal */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.sealCircle}>
              <Text style={styles.sealText}>MARINE{'\n'}CREATURES</Text>
              <Text style={{ fontSize: 10, textAlign: 'center' }}>~</Text>
              <Text style={styles.sealSubText}>VERIFIED</Text>
            </View>
            <View>
              <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.heading }}>
                Official Dispatch Accreditation
              </Text>
              <Text style={{ fontSize: 7, color: C.muted }}>Government Registered Aquaculture Vendor</Text>
              <Text style={{ fontSize: 7, color: C.muted, fontFamily: 'Helvetica' }}>
                Ref: MC-DOA-AUTHENTIC
              </Text>
            </View>
          </View>

          {/* Signature Block */}
          <View style={styles.sigBlock}>
            <Text style={styles.sigForLine}>For Marine Creatures Aquatics Pvt. Ltd.</Text>
            <View style={styles.sigLine}>
              <Text style={styles.sigName}>Authorized Signatory</Text>
              <Text style={styles.sigTitle}>Founder &amp; Master Aquarist</Text>
            </View>
          </View>
        </View>

        {/* ── Document Footer ──────────────────────────────────────────── */}
        <Text style={styles.documentFooter}>
          This is a computer-generated tax invoice and dispatch certificate requiring no physical stamp.{'\n'}
          Marine Creatures Aquatics Pvt. Ltd. • Kolkata, India • Bringing Ocean at your Doorstep
        </Text>

      </Page>
    </Document>
  );
}

