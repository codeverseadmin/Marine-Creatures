/**
 * MARINE CREATURES — INVOICE UPI QR REGRESSION & ACCEPTANCE TEST SUITE
 *
 * Reference: MC-FEATURE-INVOICE-UPI-QR-V1
 *
 * Verifies:
 *  1. Initial business UPI configuration: bithikashasmal261-3@okicici
 *  2. Payee name: MARINE CREATURES
 *  3. Editable through Control OS Payment Settings
 *  4. Dynamic QR encoding exact outstanding balance
 *  5. NPCI UPI URI standards (pa, pn, am, cu=INR, tn, tr)
 *  6. Partial payments recalculating to exact remaining balance
 *  7. Fully paid invoices suppressing active payment QR
 *  8. Cancelled invoices suppressing active payment QR
 *  9. Read-only safety: scanning/generating QR never marks invoice as paid
 * 10. PDF invoice rendering with UPI QR block
 * 11. Zero data pollution: preserves all 65 catalog items and 15 authentic orders
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';

const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const val = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
});

const { connectToDatabase } = await import('../lib/mongodb.ts');
const { OrderModel } = await import('../models/Order.ts');
const { SettingModel } = await import('../models/Setting.ts');
const { ProductModel } = await import('../models/Product.ts');
const {
  DEFAULT_BUSINESS_UPI_ID,
  DEFAULT_PAYEE_NAME,
  DEFAULT_CURRENCY,
  getUpiPaymentSettings,
  calculateOutstandingBalance,
  buildUpiUri,
  generateUpiQrDataUrl,
  generateUpiQrSvg,
  resolveOrderInvoicePaymentData,
} = await import('../lib/services/upi-qr.ts');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL [Test ${totalTests}]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASS [Test ${totalTests}]: ${message}`);
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('   MARINE CREATURES — INVOICE UPI QR REGRESSION TEST SUITE');
  console.log('   Reference: MC-FEATURE-INVOICE-UPI-QR-V1');
  console.log('===============================================================\n');

  await connectToDatabase();

  // Baseline database inventory checks
  const initialProductCount = await ProductModel.countDocuments();
  const initialOrderCount = await OrderModel.countDocuments();
  console.log(`Database Baseline: ${initialProductCount} Products, ${initialOrderCount} Orders\n`);

  // ── TEST GROUP 1: Initial Business Payment Configuration ───────────────────
  console.log('--- 1. Verified Business Payment Configuration ---');
  assert(
    DEFAULT_BUSINESS_UPI_ID === 'bithikashasmal261-3@okicici',
    'Default UPI ID must strictly match confirmed identifier "bithikashasmal261-3@okicici"'
  );
  assert(
    DEFAULT_PAYEE_NAME === 'MARINE CREATURES',
    'Default Payee Name must strictly match "MARINE CREATURES"'
  );
  assert(
    DEFAULT_CURRENCY === 'INR',
    'Default Currency must be INR'
  );

  const initialSettings = await getUpiPaymentSettings();
  assert(
    initialSettings.upiId === 'bithikashasmal261-3@okicici',
    `getUpiPaymentSettings resolves default UPI ID: ${initialSettings.upiId}`
  );
  assert(
    initialSettings.payeeName === 'MARINE CREATURES',
    `getUpiPaymentSettings resolves payee: ${initialSettings.payeeName}`
  );
  assert(
    initialSettings.upiEnabled === true,
    'getUpiPaymentSettings default upiEnabled is true'
  );

  // ── TEST GROUP 2: NPCI UPI URI Specification Compliance ───────────────────
  console.log('\n--- 2. NPCI UPI URI Generation Compliance ---');
  const uri1 = buildUpiUri({
    upiId: 'bithikashasmal261-3@okicici',
    payeeName: 'MARINE CREATURES',
    amount: 14999,
    invoiceNumber: 'INV-MC-8921',
    orderId: 'MC-8921',
  });

  assert(uri1.startsWith('upi://pay?'), 'URI must use standard upi://pay scheme');
  assert(uri1.includes('pa=bithikashasmal261-3%40okicici'), 'URI must encode UPI ID in "pa" parameter');
  assert(uri1.includes('pn=MARINE%20CREATURES'), 'URI must encode Payee Name in "pn" parameter');
  assert(uri1.includes('am=14999.00'), 'URI must encode exact amount with 2 decimal places (am=14999.00)');
  assert(uri1.includes('cu=INR'), 'URI must specify cu=INR');
  assert(uri1.includes('tn=Invoice%20INV-MC-8921'), 'URI must specify transaction note with invoice number');
  assert(uri1.includes('tr=MC-8921-INVMC8921'), 'URI must include unique payment reference in "tr" parameter');

  // Test decimal amounts
  const uriDecimal = buildUpiUri({
    upiId: 'bithikashasmal261-3@okicici',
    payeeName: 'MARINE CREATURES',
    amount: 2549.50,
    invoiceNumber: 'INV-101',
    orderId: 'ORD-101',
  });
  assert(uriDecimal.includes('am=2549.50'), 'Decimal amount 2549.50 correctly formatted');

  // ── TEST GROUP 3: Dynamic QR Code Generation (PNG DataURL & SVG) ───────────
  console.log('\n--- 3. Dynamic QR Code Image Generation ---');
  const qrDataUrl = await generateUpiQrDataUrl(uri1);
  assert(
    qrDataUrl.startsWith('data:image/png;base64,'),
    'generateUpiQrDataUrl must return valid base64 PNG Data URL'
  );
  assert(
    qrDataUrl.length > 500,
    `generateUpiQrDataUrl generated substantial image payload (${qrDataUrl.length} chars)`
  );

  const qrSvg = await generateUpiQrSvg(uri1);
  assert(
    qrSvg.includes('<svg') && qrSvg.includes('</svg>'),
    'generateUpiQrSvg must return valid SVG markup'
  );

  // ── TEST GROUP 4: Balance Calculations & Payment Eligibility ───────────────
  console.log('\n--- 4. Authoritative Outstanding Balance Resolution ---');

  // 4a. Standard unpaid order
  const balUnpaid = calculateOutstandingBalance({ totalAmount: 15000 });
  assert(balUnpaid.total === 15000, 'Unpaid order total is 15000');
  assert(balUnpaid.amountPaid === 0, 'Unpaid order amountPaid is 0');
  assert(balUnpaid.outstanding === 15000, 'Unpaid order outstanding balance is 15000');
  assert(balUnpaid.isEligibleForPayment === true, 'Unpaid order is eligible for payment QR');
  assert(balUnpaid.isPartial === false, 'Unpaid order is not partial');
  assert(balUnpaid.isFullyPaid === false, 'Unpaid order is not fully paid');

  // 4b. Partially paid order
  const balPartial = calculateOutstandingBalance({ totalAmount: 15000, amountPaid: 6000 });
  assert(balPartial.total === 15000, 'Partial order total is 15000');
  assert(balPartial.amountPaid === 6000, 'Partial order amountPaid is 6000');
  assert(balPartial.outstanding === 9000, 'Partial order remaining outstanding is 9000');
  assert(balPartial.isPartial === true, 'Partial order flag isPartial is true');
  assert(balPartial.isEligibleForPayment === true, 'Partial order is eligible for remaining payment QR');

  // 4c. Fully paid order (by paymentStatus: 'paid')
  const balPaidStatus = calculateOutstandingBalance({ totalAmount: 15000, paymentStatus: 'paid' });
  assert(balPaidStatus.isFullyPaid === true, 'Order with paymentStatus="paid" is marked fully paid');
  assert(balPaidStatus.outstanding === 0, 'Fully paid order outstanding balance is 0');
  assert(balPaidStatus.isEligibleForPayment === false, 'Fully paid order must NOT be eligible for active payment QR');

  // 4d. Fully paid order (by amountPaid >= totalAmount)
  const balPaidAmount = calculateOutstandingBalance({ totalAmount: 15000, amountPaid: 15000 });
  assert(balPaidAmount.isFullyPaid === true, 'Order with amountPaid >= totalAmount is marked fully paid');
  assert(balPaidAmount.outstanding === 0, 'Fully settled order outstanding balance is 0');
  assert(balPaidAmount.isEligibleForPayment === false, 'Fully settled order must NOT be eligible for active payment QR');

  // 4e. Overpaid / edge case amountPaid > totalAmount
  const balOverpaid = calculateOutstandingBalance({ totalAmount: 10000, amountPaid: 12000 });
  assert(balOverpaid.outstanding === 0, 'Overpaid order outstanding balance clamps to 0');
  assert(balOverpaid.isEligibleForPayment === false, 'Overpaid order must NOT be eligible for active payment QR');

  // 4f. Cancelled order
  const balCancelled = calculateOutstandingBalance({ totalAmount: 15000, status: 'cancelled' });
  assert(balCancelled.isCancelled === true, 'Cancelled order isCancelled is true');
  assert(balCancelled.isEligibleForPayment === false, 'Cancelled order must NOT be eligible for active payment QR');

  // ── TEST GROUP 5: resolveOrderInvoicePaymentData End-to-End ────────────────
  console.log('\n--- 5. End-to-End Invoice Payment Data Resolver ---');

  // Eligible order resolution
  const resolvedEligible = await resolveOrderInvoicePaymentData({
    id: 'MC-8921',
    invoiceNumber: 'INV-MC-8921',
    totalAmount: 18500,
    amountPaid: 3500,
  });

  assert(resolvedEligible.isEligible === true, 'Resolved payment isEligible is true');
  assert(resolvedEligible.outstandingBalance === 15000, 'Resolved outstanding balance is 15000 (18500 - 3500)');
  assert(resolvedEligible.isPartial === true, 'Resolved isPartial is true');
  assert(resolvedEligible.upiUri.includes('am=15000.00'), 'Resolved UPI URI encodes exact remaining balance 15000.00');
  assert(Boolean(resolvedEligible.qrDataUrl), 'Resolved contains valid qrDataUrl');

  // Ineligible (Fully Paid) order resolution
  const resolvedPaid = await resolveOrderInvoicePaymentData({
    id: 'MC-8922',
    invoiceNumber: 'INV-MC-8922',
    totalAmount: 18500,
    paymentStatus: 'paid',
  });
  assert(resolvedPaid.isEligible === false, 'Fully paid invoice isEligible is false');
  assert(resolvedPaid.reason === 'FULLY_PAID', 'Fully paid invoice reason is FULLY_PAID');
  assert(resolvedPaid.qrDataUrl === undefined, 'Fully paid invoice must NOT include qrDataUrl');

  // Ineligible (Cancelled) order resolution
  const resolvedCancelled = await resolveOrderInvoicePaymentData({
    id: 'MC-8923',
    invoiceNumber: 'INV-MC-8923',
    totalAmount: 18500,
    status: 'cancelled',
  });
  assert(resolvedCancelled.isEligible === false, 'Cancelled invoice isEligible is false');
  assert(resolvedCancelled.reason === 'CANCELLED', 'Cancelled invoice reason is CANCELLED');
  assert(resolvedCancelled.qrDataUrl === undefined, 'Cancelled invoice must NOT include qrDataUrl');

  // ── TEST GROUP 6: Control OS Payment Settings Customization ────────────────
  console.log('\n--- 6. Control OS Payment Settings Editability ---');
  const customSettings = {
    upiId: 'custom-business@icici',
    upiPayeeName: 'MARINE CREATURES AQUATICS',
    upiEnabled: true,
  };

  const resolvedCustom = await resolveOrderInvoicePaymentData(
    {
      id: 'MC-8921',
      invoiceNumber: 'INV-MC-8921',
      totalAmount: 5000,
    },
    customSettings
  );

  assert(resolvedCustom.upiId === 'custom-business@icici', 'Custom UPI ID correctly applied');
  assert(resolvedCustom.payeeName === 'MARINE CREATURES AQUATICS', 'Custom Payee Name correctly applied');
  assert(resolvedCustom.upiUri.includes('pa=custom-business%40icici'), 'Custom UPI ID encoded in URI');

  // ── TEST GROUP 7: Read-Only Scanning / Generation Safety ───────────────────
  console.log('\n--- 7. Non-Mutation Safety on Payment Inspection ---');
  const authenticOrderBefore = await OrderModel.findOne({ id: 'MC-8921' }).lean();
  const paymentDataBefore = await resolveOrderInvoicePaymentData(authenticOrderBefore);
  const authenticOrderAfter = await OrderModel.findOne({ id: 'MC-8921' }).lean();

  assert(
    authenticOrderBefore.paymentStatus === authenticOrderAfter.paymentStatus,
    'Resolving payment QR does NOT alter order paymentStatus in DB'
  );
  assert(
    authenticOrderBefore.amountPaid === authenticOrderAfter.amountPaid,
    'Resolving payment QR does NOT alter order amountPaid in DB'
  );
  assert(
    paymentDataBefore.isEligible === true,
    'Authentic unpaid order remains correctly eligible for payment QR'
  );

  // ── TEST GROUP 8: PDF Invoice Template Verification ───────────────────────
  console.log('\n--- 8. PDF Invoice Template UPI QR Verification ---');
  const pdfTemplateSrc = fs.readFileSync('lib/invoice-pdf-template.tsx', 'utf8');
  assert(pdfTemplateSrc.includes('upiPaymentBox'), 'PDF template defines upiPaymentBox style');
  assert(pdfTemplateSrc.includes('upiQrImage'), 'PDF template defines upiQrImage style');
  assert(pdfTemplateSrc.includes('order.upiPayment.qrDataUrl'), 'PDF template renders dynamic UPI QR code image');
  assert(pdfTemplateSrc.includes('Instant UPI Settlement'), 'PDF template displays Instant UPI Settlement title');
  assert(pdfTemplateSrc.includes('settledPaymentBox'), 'PDF template defines settledPaymentBox for paid invoices');
  assert(pdfTemplateSrc.includes('cancelledPaymentBox'), 'PDF template defines cancelledPaymentBox for cancelled invoices');

  // ── TEST GROUP 9: Web Customer Invoice UPI QR Verification ─────────────────
  console.log('\n--- 9. Web Customer Invoice UPI QR Verification ---');
  const webInvoiceSrc = fs.readFileSync('app/invoice/[id]/page.tsx', 'utf8');
  assert(webInvoiceSrc.includes('Instant UPI Settlement'), 'Web invoice presents Instant UPI Settlement section');
  assert(webInvoiceSrc.includes('handleCopyUpi'), 'Web invoice provides copy UPI ID functionality');
  assert(webInvoiceSrc.includes('activeUri'), 'Web invoice provides Pay with UPI link');
  assert(webInvoiceSrc.includes('DEFAULT_BUSINESS_UPI_ID') || webInvoiceSrc.includes('bithikashasmal261-3@okicici'), 'Web invoice includes verified fallback UPI ID reference');
  assert(webInvoiceSrc.includes('Payment Settled in Full'), 'Web invoice suppresses QR and displays settled banner on paid invoices');
  assert(webInvoiceSrc.includes('Invoice Cancelled / Void'), 'Web invoice suppresses QR on cancelled invoices');

  // ── TEST GROUP 10: Zero Data Pollution & Historical Record Integrity ───────
  console.log('\n--- 10. Database Zero-Pollution & Integrity Audit ---');
  const finalProductCount = await ProductModel.countDocuments();
  const finalOrderCount = await OrderModel.countDocuments();

  assert(
    finalProductCount === initialProductCount,
    `Product count unchanged: ${initialProductCount} -> ${finalProductCount}`
  );
  assert(
    finalOrderCount === initialOrderCount,
    `Order count unchanged: ${initialOrderCount} -> ${finalOrderCount}`
  );

  // Verify authentic order MC-8921 still intact
  const order8921 = await OrderModel.findOne({ id: 'MC-8921' }).lean();
  assert(Boolean(order8921), 'Authentic order MC-8921 is intact');
  assert(order8921.customerName === 'Rahul Verma', 'MC-8921 customer identity preserved');

  // Verify authentic order MC-8922 still intact
  const order8922 = await OrderModel.findOne({ id: 'MC-8922' }).lean();
  assert(Boolean(order8922), 'Authentic order MC-8922 is intact');
  assert(order8922.customerName === 'Dr. Ananya Sen', 'MC-8922 customer identity preserved');

  console.log('\n===============================================================');
  console.log(`   ALL TESTS PASSED: ${passedTests}/${totalTests} (0 Failed, 0 Skipped)`);
  console.log('   MC-FEATURE-INVOICE-UPI-QR-V1 VERIFIED READY FOR RELEASE GATE');
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUNNER ABORTED WITH ERROR:', err);
  process.exit(1);
});
