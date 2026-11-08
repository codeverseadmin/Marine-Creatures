# MARINE CREATURES — INVOICE UPI QR CONFIGURATION & SETTLEMENT ENGINE V1

**Reference:** `MC-FEATURE-INVOICE-UPI-QR-V1`  
**Classification:** Production-Grade Payment Infrastructure  
**Priority:** High  
**Target:** Customer Web Invoices, Executive PDF Invoices & Admin Control OS  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. EXECUTIVE SUMMARY

The Invoice UPI QR Configuration & Settlement Engine V1 has been implemented across the Marine Creatures storefront, executive document generation pipeline, and Control OS administrative panel.

This feature enables clients to instantly settle invoices using their preferred UPI application (Google Pay, PhonePe, Paytm, CRED, BHIM) by scanning a high-contrast dynamic QR code or clicking a direct deep-link URI on web invoices.

The architecture enforces strict business rules:
- Dynamic calculation of the exact remaining balance for partial payments.
- Zero payment QR exposure on fully settled or cancelled orders.
- Dynamic configurable business UPI credentials via Control OS with verified fallback defaults.
- Zero mutation of database records or payment statuses purely upon QR generation or scanning.
- Complete data integrity preservation of historical orders, revisions, warranty snapshots, and coupon discounts.

---

## 2. VERIFIED BUSINESS PAYMENT DETAILS

The initial business payment details are configured and locked to the founder's verified specifications:

| Parameter | Configuration Value | Status |
|---|---|---|
| **Primary UPI ID** | `bithikashasmal261-3@okicici` | Configured & Default Fallback |
| **Payee Name** | `MARINE CREATURES` | Verified Display Name |
| **Currency** | `INR` (`₹`) | Standard Indian Rupee |
| **Payment Protocol** | NPCI UPI Deep Link Specification | `upi://pay?...` |
| **Supported Apps** | Google Pay (Recommended), PhonePe, Paytm, CRED, BHIM | Broad UPI Ecosystem Support |

---

## 3. CORE ARCHITECTURAL CAPABILITIES

### 3.1 NPCI-Compliant Dynamic URI Construction
Every active invoice generates a strictly compliant UPI URI conforming to NPCI specifications:
```
upi://pay?pa={UPI_ID}&pn={PAYEE_NAME}&am={AMOUNT}&cu=INR&tn={TRANSACTION_NOTE}&tr={TRANSACTION_REF}
```
- `pa`: Authorized merchant VPA (`bithikashasmal261-3@okicici`).
- `pn`: Merchant entity name (`MARINE CREATURES`).
- `am`: Exact outstanding balance formatted to 2 decimal places (`am=14999.00`).
- `cu`: Strict ISO currency code (`INR`).
- `tn`: Transaction note containing the invoice number (e.g., `Invoice INV-MC-8921`).
- `tr`: Unique reference identifier for payment tracking (`REF-MC-8921`).

### 3.2 Outstanding Balance Resolution & Partial Payments
The service resolves the exact balance state dynamically:
1. **Unpaid Orders (`amountPaid === 0`):** Full invoice total is encoded in the QR.
2. **Partially Paid Orders (`0 < amountPaid < totalAmount`):** The QR encodes ONLY the remaining balance `totalAmount - amountPaid`. A partial settlement badge is displayed indicating previously received funds.
3. **Fully Paid Orders (`amountPaid >= totalAmount` or `paymentStatus === 'paid'`):** QR code is suppressed entirely. An "Invoice Settled in Full" banner is displayed in both PDF and web invoices.
4. **Cancelled Orders (`status === 'cancelled'`):** QR code is suppressed entirely. An "Order Cancelled" banner is displayed.

### 3.3 Dynamic Administrative Control via Control OS
Administrators with operational permissions can inspect and edit the active business UPI ID and Payee Name from the **Control OS System Settings** panel (`/admin/system/settings`). Changes apply immediately to all subsequently rendered dynamic web and PDF invoices without code modification or service restart.

### 3.4 Multi-Channel Rendering Pipeline
- **Customer Web Invoice (`/invoice/[id]`):** Renders high-contrast QR code, interactive "Pay with UPI" app launcher, and a one-click "Copy UPI ID" action with visual confirmation. Fully isolated client-safe bundle (`upi-qr-common.ts`).
- **Executive PDF Invoices (`/api/admin/orders/[id]/invoice-pdf`):** Injects dynamic base64 PNG QR code into `@react-pdf/renderer` executive template alongside bank settlement instructions, formatted dates, and authorized seal.
- **Order Tracking & Invoice APIs (`/api/orders/[id]`):** Server-side serializer attaches pre-computed `upiPayment` payload to authorized customer responses without exposing internal admin metadata.

---

## 4. VERIFICATION EVIDENCE & TEST SUITE

The implementation was validated against a 73-point automated regression test suite covering NPCI compliance, mathematical balance resolution, PDF AST rendering, and database preservation:

```
===============================================================
   MARINE CREATURES — INVOICE UPI QR REGRESSION TEST SUITE
   Reference: MC-FEATURE-INVOICE-UPI-QR-V1
===============================================================

✅ Connected to MongoDB Atlas (Cluster0)
Database Baseline: 65 Products, 16 Orders

--- 1. Verified Business Payment Configuration ---
✅ PASS [Test 1]: Default UPI ID must strictly match confirmed identifier "bithikashasmal261-3@okicici"
✅ PASS [Test 2]: Default Payee Name must strictly match "MARINE CREATURES"
✅ PASS [Test 3]: Default Currency must be INR
✅ PASS [Test 4]: getUpiPaymentSettings resolves default UPI ID: bithikashasmal261-3@okicici
✅ PASS [Test 5]: getUpiPaymentSettings resolves payee: MARINE CREATURES
✅ PASS [Test 6]: getUpiPaymentSettings default upiEnabled is true

--- 2. NPCI UPI URI Generation Compliance ---
✅ PASS [Test 7]: URI must use standard upi://pay scheme
✅ PASS [Test 8]: URI must encode UPI ID in "pa" parameter
✅ PASS [Test 9]: URI must encode Payee Name in "pn" parameter
✅ PASS [Test 10]: URI must encode exact amount with 2 decimal places (am=14999.00)
✅ PASS [Test 11]: URI must specify cu=INR
✅ PASS [Test 12]: URI must specify transaction note with invoice number
✅ PASS [Test 13]: URI must include unique payment reference in "tr" parameter
✅ PASS [Test 14]: Decimal amount 2549.50 correctly formatted

--- 3. Dynamic QR Code Image Generation ---
✅ PASS [Test 15]: generateUpiQrDataUrl must return valid base64 PNG Data URL
✅ PASS [Test 16]: generateUpiQrDataUrl generated substantial image payload (4814 chars)
✅ PASS [Test 17]: generateUpiQrSvg must return valid SVG markup

--- 4. Authoritative Outstanding Balance Resolution ---
✅ PASS [Test 18]: Unpaid order total is 15000
✅ PASS [Test 19]: Unpaid order amountPaid is 0
✅ PASS [Test 20]: Unpaid order outstanding balance is 15000
✅ PASS [Test 21]: Unpaid order is eligible for payment QR
✅ PASS [Test 22]: Unpaid order is not partial
✅ PASS [Test 23]: Unpaid order is not fully paid
✅ PASS [Test 24]: Partial order total is 15000
✅ PASS [Test 25]: Partial order amountPaid is 6000
✅ PASS [Test 26]: Partial order remaining outstanding is 9000
✅ PASS [Test 27]: Partial order flag isPartial is true
✅ PASS [Test 28]: Partial order is eligible for remaining payment QR
✅ PASS [Test 29]: Order with paymentStatus="paid" is marked fully paid
✅ PASS [Test 30]: Fully paid order outstanding balance is 0
✅ PASS [Test 31]: Fully paid order must NOT be eligible for active payment QR
✅ PASS [Test 32]: Order with amountPaid >= totalAmount is marked fully paid
✅ PASS [Test 33]: Fully settled order outstanding balance is 0
✅ PASS [Test 34]: Fully settled order must NOT be eligible for active payment QR
✅ PASS [Test 35]: Overpaid order outstanding balance clamps to 0
✅ PASS [Test 36]: Overpaid order must NOT be eligible for active payment QR
✅ PASS [Test 37]: Cancelled order isCancelled is true
✅ PASS [Test 38]: Cancelled order must NOT be eligible for active payment QR

--- 5. End-to-End Invoice Payment Data Resolver ---
✅ PASS [Test 39]: Resolved payment isEligible is true
✅ PASS [Test 40]: Resolved outstanding balance is 15000 (18500 - 3500)
✅ PASS [Test 41]: Resolved isPartial is true
✅ PASS [Test 42]: Resolved UPI URI encodes exact remaining balance 15000.00
✅ PASS [Test 43]: Resolved contains valid qrDataUrl
✅ PASS [Test 44]: Fully paid invoice isEligible is false
✅ PASS [Test 45]: Fully paid invoice reason is FULLY_PAID
✅ PASS [Test 46]: Fully paid invoice must NOT include qrDataUrl
✅ PASS [Test 47]: Cancelled invoice isEligible is false
✅ PASS [Test 48]: Cancelled invoice reason is CANCELLED
✅ PASS [Test 49]: Cancelled invoice must NOT include qrDataUrl

--- 6. Control OS Payment Settings Editability ---
✅ PASS [Test 50]: Custom UPI ID correctly applied
✅ PASS [Test 51]: Custom Payee Name correctly applied
✅ PASS [Test 52]: Custom UPI ID encoded in URI

--- 7. Non-Mutation Safety on Payment Inspection ---
✅ PASS [Test 53]: Resolving payment QR does NOT alter order paymentStatus in DB
✅ PASS [Test 54]: Resolving payment QR does NOT alter order amountPaid in DB
✅ PASS [Test 55]: Authentic unpaid order remains correctly eligible for payment QR

--- 8. PDF Invoice Template UPI QR Verification ---
✅ PASS [Test 56]: PDF template defines upiPaymentBox style
✅ PASS [Test 57]: PDF template defines upiQrImage style
✅ PASS [Test 58]: PDF template renders dynamic UPI QR code image
✅ PASS [Test 59]: PDF template displays Instant UPI Settlement title
✅ PASS [Test 60]: PDF template defines settledPaymentBox for paid invoices
✅ PASS [Test 61]: PDF template defines cancelledPaymentBox for cancelled invoices

--- 9. Web Customer Invoice UPI QR Verification ---
✅ PASS [Test 62]: Web invoice presents Instant UPI Settlement section
✅ PASS [Test 63]: Web invoice provides copy UPI ID functionality
✅ PASS [Test 64]: Web invoice provides Pay with UPI link
✅ PASS [Test 65]: Web invoice includes verified fallback UPI ID reference
✅ PASS [Test 66]: Web invoice suppresses QR and displays settled banner on paid invoices
✅ PASS [Test 67]: Web invoice suppresses QR on cancelled invoices

--- 10. Database Zero-Pollution & Integrity Audit ---
✅ PASS [Test 68]: Product count unchanged: 65 -> 65
✅ PASS [Test 69]: Order count unchanged: 16 -> 16
✅ PASS [Test 70]: Authentic order MC-8921 is intact
✅ PASS [Test 71]: MC-8921 customer identity preserved
✅ PASS [Test 72]: Authentic order MC-8922 is intact
✅ PASS [Test 73]: MC-8922 customer identity preserved

===============================================================
   ALL TESTS PASSED: 73/73 (0 Failed, 0 Skipped)
   MC-FEATURE-INVOICE-UPI-QR-V1 VERIFIED READY FOR RELEASE GATE
===============================================================
```

---

## 5. PRODUCTION BUILD VERIFICATION

- **Compiler:** Next.js 16.4.1 (Turbopack)
- **TypeScript:** Strict type checking (`npx tsc --noEmit`) completed with 0 errors.
- **Production Build:** `npm run build` completed with exit code 0.
- **Static Pages:** 147/147 routes prerendered without regression.
- **Bundle Separation:** Client-side web invoice imports exclusively from pure utility module `lib/services/upi-qr-common.ts` avoiding Node.js runtime leaks into client bundles.

