# QA AUDIT & VERIFICATION REPORT: PRICE ON REQUEST (POR) INVOICE GATING & ADMIN SETTLEMENT FIX

**Document Reference:** `MC-P0-POR-INVOICE-GATING-NOV2026`
**Classification:** Financial Integrity & Order-to-Invoice Workflow
**Priority:** P0 — Critical
**Mode:** Investigate → Implement → Test → Report
**Date:** November 14, 2026
**Auditor / Agent:** Antigravity (Google DeepMind)
**Status:** **READY FOR FOUNDER REVIEW & STAGING (PASS — 23/23 SCENARIOS)**

---

## 1. EXECUTIVE SUMMARY & ACCEPTANCE VERDICT

During order and invoice workflow operations, it was observed that customer orders containing **Price on Request (POR)** marine specimens or equipment allowed premature invoice generation before store administrators had negotiated and recorded agreed prices. Unsettled POR line items subsequently rendered with ₹0 unit prices and ₹0 line totals, compromising financial integrity and violating the core Marine Creatures business model:

> **Mandatory Business Rule:**
> *An order may exist without an invoice. An invoice must NEVER exist with unresolved Price on Request items.*

This engagement executed an end-to-end investigation across the data layer, order intake, token authorization, PDF generation engine, web invoice page, and administrative settlement routes. Strict server-side gating was implemented to block all invoice generation pathways with **HTTP 409 Conflict** (`code: 'POR_PRICING_PENDING'`) whenever an order contains unresolved POR items. An authenticated, RBAC-protected, concurrency-safe admin settlement workflow was established at `/api/admin/orders/[id]/por-pricing`, which recalculates totals, preserves coupon discounts and warranty snapshots, syncs Customer 360 spend, and issues invoices only after 100% of line items reach the `AGREED` state.

### Final Acceptance Condition Verification
> **ACCEPTANCE CONDITION:** *An invoice containing even one unresolved `PENDING_POR` item must be impossible to create or retrieve through every supported invoice-generation pathway.*
> **VERDICT: VERIFIED & SATISFIED (PASS 23/23 SCENARIOS).**

---

## 2. ACTUAL ROOT CAUSE ANALYSIS

A comprehensive audit of the code paths uncovered six distinct defects across the order lifecycle:

1. **Unconditional Premature Invoice Number & Token Assignment at Checkout (`app/api/orders/route.ts`):**
   During initial storefront order creation (POST), the route executed `const invoiceNumber = orderPayload.invoiceNumber || generateInvoiceNumber(orderId)` and generated a secure invoice token hash regardless of whether `hasUnresolvedPorItems` was `true`. This assigned an invoice number (`INV-MC-...`) and an invoice access token to orders containing `PENDING_POR` items at the moment of order placement.
2. **Missing POR Gating in Customer/Web Invoice Route (`app/api/orders/[id]/route.ts`):**
   The customer invoice data retrieval endpoint (GET `/api/orders/[id]`) verified token hash validity and phone number authentication, but completely omitted checking whether `order.hasUnresolvedPorItems === true` or whether any line item had `pricingStatus === 'PENDING_POR'` or `agreedUnitPrice <= 0`. It returned the order payload, enabling the web page to render a ₹0 line item. Furthermore, administrative token reissuance (POST) did not check POR status.
3. **Improper Status Code & Boolean Precedence Bug in PDF Generation (`app/api/admin/orders/[id]/invoice-pdf/route.ts`):**
   The PDF generator returned HTTP 400 Bad Request instead of the contractually required HTTP 409 Conflict. Additionally, a boolean evaluation bug existed: `it.priceOnRequest === true || it.pricingStatus === 'PENDING_POR' || ...` evaluated `priceOnRequest === true` as unresolved even after an item was successfully settled (`pricingStatus: 'AGREED'`).
4. **Coupon Discount Erasure in Admin Settlement Route (`app/api/admin/orders/[id]/por-pricing/route.ts`):**
   When calculating the new order total following POR settlement, the route previously set `order.totalAmount = calculatedSubtotal`, inadvertently erasing any promotional coupon discount (`order.coupon.discountAmount`) and inflating the customer's payable total.
5. **Client & PDF Template Fallback to Catalog Price (`app/invoice/[id]/page.tsx` & `lib/invoice-pdf-template.tsx`):**
   The invoice rendering components checked `item.price ?? item.product?.price ?? 0`, ignoring `item.agreedUnitPrice`. Because POR catalog products have `price: 0`, the line items rendered as ₹0 instead of the admin-negotiated amount.
6. **Order Approval Bypass (`app/api/admin/orders/route.ts` & `app/api/orders/route.ts`):**
   Administrative order approval (`isApproved: true` via PATCH) automatically generated `invoiceNumber` if one was missing, bypassing POR resolution status.

---

## 3. EXACT SOURCE FILES MODIFIED

The following 7 files in `marine-creatures/` were surgically updated:

| File Path | Description of Changes |
|---|---|
| `app/api/orders/route.ts` | **POST & PATCH Gating:** Identified `hasUnresolvedPorItems`. Strictly suppressed `invoiceNumber`, `issuedToken`, and `tokenHashToSave` during order intake if unresolved. Returned `invoiceToken: null`, `invoiceUrl: null`, `requiresPorPricing: true`. Suppressed invoice issuance during PATCH approval for unresolved orders. |
| `app/api/orders/[id]/route.ts` | **GET & POST Invoice Gating:** Added authoritative check for `hasUnresolvedPorItems` and pending line items. Returns HTTP 409 Conflict (`code: 'POR_PRICING_PENDING'`, `requiresPorPricing: true`) with exact standard error message. Guarded administrative token rotation (POST) with identical 409 check. |
| `app/api/admin/orders/[id]/invoice-pdf/route.ts` | **PDF Route Gating:** Replaced HTTP 400 with HTTP 409 Conflict. Corrected operator precedence to ensure settled POR items (`pricingStatus === 'AGREED'` and `agreedUnitPrice > 0`) are recognized as resolved. |
| `app/api/admin/orders/[id]/por-pricing/route.ts` | **Settlement Engine:** Validated positive numeric prices (`> 0`). Corrected pending check. When all items reach `AGREED`, assigned baseline `invoiceNumber` and generated `invoiceTokenHash`. Deducted `order.coupon?.discountAmount` to preserve promotions. Calculated total spend delta and updated `CustomerModel` (Customer 360). |
| `app/api/admin/orders/route.ts` | **Admin Orders PATCH Gating:** Prevented premature `invoiceNumber` generation upon order approval when unresolved POR items exist. |
| `lib/invoice-pdf-template.tsx` | **PDF Price Resolution:** Prioritized `item.agreedUnitPrice` over catalog price `item.product?.price` and `item.price`. |
| `app/invoice/[id]/page.tsx` | **Web UI Gating & Price Resolution:** Intercepted HTTP 409 responses. Displayed dedicated Concierge "Price on Request Settlement Pending" card blocking invoice rendering. Updated line item calculations to use `agreedUnitPrice`. |

---

## 4. DATABASE SCHEMA & STATE-TRANSITION FINDINGS

The implementation strictly reuses the existing data model in `models/Order.ts`:

### Line Item Pricing States
```
STANDARD   ──────► Automatically eligible for invoice calculation
PENDING_POR ─────► Invoice generation strictly BLOCKED (HTTP 409)
AGREED     ──────► Eligible for invoice calculation ONLY IF agreedUnitPrice > 0
```

### State Machine Transition Table
| Event / Action | Initial Line Item State | Target Line Item State | `hasUnresolvedPorItems` | Invoice Generation Status |
|---|---|---|---|---|
| **Order Placement (POR item)** | Unset / Catalog POR | `PENDING_POR`, `agreedUnitPrice: undefined` | `true` | **BLOCKED (HTTP 409)** — No invoiceNumber or token generated |
| **Admin Enters Invalid Price** | `PENDING_POR` | `PENDING_POR` (Rejected with HTTP 400) | `true` | **BLOCKED (HTTP 409)** |
| **Admin Settles Item 1 of 2** | `PENDING_POR` | `AGREED`, `agreedUnitPrice: ₹X` | `true` | **BLOCKED (HTTP 409)** — Partial settlement keeps order blocked |
| **Admin Settles Last POR Item** | `PENDING_POR` | `AGREED`, `agreedUnitPrice: ₹Y` | `false` | **UNBLOCKED (HTTP 200)** — `invoiceNumber` issued, token generated |

---

## 5. ALL INVOICE-GENERATION PATHWAYS PROTECTED

Every pathway that creates, renders, or serves an invoice is protected at the server boundary:

1. **Storefront Order Creation (`POST /api/orders`):**
   Does not generate `invoiceNumber`, `issuedToken`, or `tokenHashToSave` if `hasUnresolvedPorItems === true`.
2. **Web Customer Invoice Page (`GET /api/orders/[id]`):**
   Rejects access with **HTTP 409 Conflict**, `code: 'POR_PRICING_PENDING'`, and body:
   `"Invoice generation is blocked because one or more Price on Request items still require admin price settlement."`
3. **Invoice Token Generation / Rotation (`POST /api/orders/[id]`):**
   Rejects administrative token reissuance for unresolved POR orders with **HTTP 409 Conflict**.
4. **Admin PDF Invoice Download (`GET /api/admin/orders/[id]/invoice-pdf`):**
   Rejects PDF rendering with **HTTP 409 Conflict** and exact standard payload.
5. **Admin Order Approval (`PATCH /api/admin/orders` & `PATCH /api/orders`):**
   Approves order status but explicitly suppresses `invoiceNumber` generation until all POR items are resolved.
6. **Customer Concierge Web UI (`/invoice/[id]`):**
   Catches HTTP 409 and renders a non-invoice Concierge notification informing the customer that an administrator is preparing their custom quotation.

---

## 6. TEST RESULTS WITH SCENARIO-LEVEL EVIDENCE

An automated 23-scenario regression suite (`scratch/test_por_invoice_gating.mjs`) was executed against the running development server and MongoDB Atlas. **All 23 scenarios passed (100% success rate):**

```
========================================================================
 MARINE CREATURES — P0 POR INVOICE GATING & SETTLEMENT REGRESSION SUITE
 Reference: MC-P0-POR-INVOICE-GATING-NOV2026
 Scope: 23 Gating, Pricing, Financial Integrity & RBAC Scenarios
========================================================================

✅ PASS [Scenario 01] Standard Order (non-POR) enables invoice generation (200 & PDF)
   Evidence: Invoice INV-MC-1794607580981-8CF7CEB0DB4A9D86E52C54186AF7AB81 issued, Token: true, CustStatus: 200, PdfStatus: 200
✅ PASS [Scenario 02] Single PENDING_POR item blocks invoice generation (409 POR_PRICING_PENDING)
   Evidence: hasUnresolvedPorItems: true, invoiceNumber: NONE, Cust: 409 (POR_PRICING_PENDING), PDF: 409 (POR_PRICING_PENDING)
✅ PASS [Scenario 03] Multiple PENDING_POR items block invoice generation (409 POR_PRICING_PENDING)
   Evidence: Items: 2, allPending: true, CustStatus: 409
✅ PASS [Scenario 04] Mixed order (standard + PENDING_POR) blocks invoice generation (409 POR_PRICING_PENDING)
   Evidence: Subtotal: ₹680, hasUnresolved: true, PdfStatus: 409
✅ PASS [Scenario 05] Direct access to customer invoice page (/invoice/[id]) blocks invoice generation & returns 409 POR_PRICING_PENDING
   Evidence: HTTP Status: 200, invoiceBlocked: true, apiGated: true (409 POR_PRICING_PENDING)
✅ PASS [Scenario 06] GET /api/orders/[id] for unresolved POR order returns HTTP 409 Conflict with exact error & code
   Evidence: Status: 409, code: POR_PRICING_PENDING, error: "Invoice generation is blocked because one or more Price on Request items still require admin price settlement."
✅ PASS [Scenario 07] GET /api/admin/orders/[id]/invoice-pdf for unresolved POR returns HTTP 409 Conflict
   Evidence: Status: 409, code: POR_PRICING_PENDING, error: "Invoice generation is blocked because one or more Price on Request items still require admin price settlement."
✅ PASS [Scenario 08] Admin token issuance POST /api/orders/[id] for unresolved POR returns HTTP 409 Conflict
   Evidence: Status: 409, code: POR_PRICING_PENDING
✅ PASS [Scenario 09] Order approval PATCH for unresolved POR order approves order but DOES NOT generate invoiceNumber
   Evidence: isApproved: true, invoiceNumber: NONE
✅ PASS [Scenario 10] Admin POR settlement endpoint rejects missing price with HTTP 400
   Evidence: Status: 400, error: "Price cannot be empty"
✅ PASS [Scenario 11] Admin POR settlement endpoint rejects zero (0) price with HTTP 400
   Evidence: Status: 400, error: "Price must be greater than zero. Free or negative prices are prohibited."
✅ PASS [Scenario 12] Admin POR settlement endpoint rejects negative price with HTTP 400
   Evidence: Status: 400, error: "Price must be greater than zero. Free or negative prices are prohibited."
✅ PASS [Scenario 13] Admin POR settlement endpoint rejects NaN/string price with HTTP 400
   Evidence: Status: 400, error: "Price must be a valid number"
✅ PASS [Scenario 14] Admin POR settlement endpoint rejects non-existent line item with HTTP 404
   Evidence: Status: 404, error: "Item non-existent-sku-id-999 not found in this order"
✅ PASS [Scenario 15] Admin POR settlement succeeds with valid price (> 0), sets pricingStatus: AGREED
   Evidence: Status: 200, agreedUnitPrice: 3200, pricingStatus: AGREED
✅ PASS [Scenario 16] Partial POR settlement (1 of 2 settled) STILL blocks invoice generation (409 POR_PRICING_PENDING)
   Evidence: hasUnresolvedPorItems: true, pdfStatus: 409 (POR_PRICING_PENDING)
✅ PASS [Scenario 17] Full POR settlement enables invoice generation (hasUnresolved: false, invoiceNumber assigned, PDF 200)
   Evidence: hasUnresolved: false, invoiceNumber: INV-MC-1794607583150-3083142C18F70A0A3063003A87E19B61, PDF status: 200
✅ PASS [Scenario 18] Invoice line totals calculation uses agreedUnitPrice * quantity (NOT ₹0)
   Evidence: Item 1: ₹2,500 (qty 1 x ₹2,500), Item 2: ₹7,500 (qty 1 x ₹7,500)
✅ PASS [Scenario 19] Order subtotal and totalAmount reflect agreed unit prices and quantities (₹10,000)
   Evidence: Persisted subtotal: ₹10,000, totalAmount: ₹10,000
✅ PASS [Scenario 20] Coupon discount preserved after POR settlement (₹500 deducted from new ₹4,680 subtotal -> ₹4,180 total)
   Evidence: Subtotal: ₹4,680, TotalAmount: ₹4,180, Coupon: PORREBATE500 (-₹500)
✅ PASS [Scenario 21] Line item warranty snapshots remain intact after POR price settlement
   Evidence: All line items retained original warranty snapshots: true
✅ PASS [Scenario 22] Optimistic concurrency check rejects mismatched expectedVersion with HTTP 409 Conflict
   Evidence: Status: 409, error: "Conflict: This order was updated by another administrator (version 3 vs expected 9999). Please refresh."
✅ PASS [Scenario 23] RBAC protection: Employee lacking [orders.por_price.set] receives HTTP 403 Forbidden
   Evidence: Status: 403, error: "Forbidden: Lacking required permission [orders.por_price.set]"

--- Commencing Zero-Pollution Cleanup ---
✓ Cleaned up 5 temporary test orders
✓ Cleaned up 1 temporary test coupons
✓ Cleaned up 5 temporary test customer profiles

========================================================================
 FINAL VERDICT: ALL 23 SCENARIOS PASSED ✅ (23 / 23)
========================================================================
```

### Full Regression Suite Verification
- **First-Time Customer Coupon Restriction Suite (`scratch/test_first_order_eligibility_ux_v2.mjs`):**
  **15 / 15 Tests Passed (100% clean)**
- **Coupon Checkout Order Persistence Suite (`scratch/test_coupon_order_persistence_suite.mjs`):**
  **17 / 17 Scenarios Passed (100% clean)**
- **TypeScript Static Verification (`npx tsc --noEmit`):**
  **Code 0 (0 compilation errors)**
- **Next.js Production Build (`npm run build`):**
  **Compiled successfully in 6.0s (147 static & dynamic routes valid)**

---

## 7. HISTORICAL AFFECTED-ORDER & INVOICE FINDINGS (READ-ONLY AUDIT)

A read-only audit of all 21 orders in MongoDB Atlas was performed via `scratch/investigate_por_orders.mjs`.

### Audit Summary
- **Total Orders in Database:** 21
- **Orders Identified with POR or Zero-Priced Items:** 5

### Identified Order Records (Customer PII Masked)
1. **Order ID:** `MC-1794605280161-F4EDAA6780A7D5ACCC8A23954BDAE749`
   - **Premature Invoice Number:** `INV-MC-1794605280161-F4EDAA6780A7D5ACCC8A23954BDAE749`
   - **Order Step:** `packed` | **Approved:** `false` | **hasUnresolvedPorItems:** `true`
   - **Subtotal:** ₹680 | **Customer Phone:** `******3926`
   - **Items (2):**
     - `red-carpet-anemone`: `price: 0`, `POR: true`, `status: PENDING_POR`, `agreedUnitPrice: undefined`
     - `elixe-c-carbon`: `price: 680`, `POR: false`, `status: STANDARD`
   - **Current Status under Gating Fix:** **STRICTLY BLOCKED (HTTP 409)**. Despite having an existing `invoiceNumber` string in MongoDB, attempts to retrieve or download an invoice return `POR_PRICING_PENDING`.
2. **Order ID:** `MC-1794115273144-C85146E50E4D559024E75CED87753213`
   - **Premature Invoice Number:** `INV-MC-1794115273144-C85146E50E4D559024E75CED87753213`
   - **Order Step:** `placed` | **Approved:** `false` | **hasUnresolvedPorItems:** `true`
   - **Subtotal:** ₹0 | **Customer Phone:** `******7010`
   - **Items (1):**
     - `banggai-cardinal`: `price: 0`, `POR: true`, `status: PENDING_POR`, `agreedUnitPrice: undefined`
   - **Current Status under Gating Fix:** **STRICTLY BLOCKED (HTTP 409)**.
3. **Orders `MC-740020EJ`, `MC-429334LH`, `MC-990152L4`:**
   - Baseline developer test fixtures created on November 7, 2026.
   - Items were created before the POR pricing status architecture was introduced (`pricingStatus: 'NONE'`).
   - Unaffected by live customer traffic.

### Strict Data-Preservation Confirmation
- **ZERO historical orders, invoices, or customer profiles were modified, deleted, or backfilled.**
- The database remained strictly read-only throughout the investigation.
- Historical orders #1 and #2 require founder/admin settlement via the Control OS interface before invoices can be issued.

---

## 8. GIT BRANCH, HEAD COMMIT & WORKING TREE STATUS

### Repository Metadata
- **Branch:** `main` (up to date with `origin/main`)
- **HEAD Commit:** `7935b80` (`feat(checkout): resolve coupon order persistence, add first-order restriction UX V2, and enforce idempotency`)

### Working Tree Status (`git status --short`)
```text
Changes not staged for commit:
  modified:   app/api/admin/orders/[id]/invoice-pdf/route.ts
  modified:   app/api/admin/orders/[id]/por-pricing/route.ts
  modified:   app/api/admin/orders/route.ts
  modified:   app/api/orders/[id]/route.ts
  modified:   app/api/orders/route.ts
  modified:   app/invoice/[id]/page.tsx
  modified:   lib/invoice-pdf-template.tsx

Untracked files:
  scratch/investigate_por_orders.mjs
  scratch/test_por_invoice_gating.mjs
```

---

## 9. REMAINING RISKS & OPERATIONAL CONSIDERATIONS

1. **Historical Orders Awaiting Settlement:**
   The two real historical orders (`MC-1794605280161-...` and `MC-1794115273144-...`) have premature `invoiceNumber` strings saved in MongoDB. While they are now 100% blocked from generating or viewing invoices via API and UI, an administrator must open them in Control OS, enter the agreed prices via `/api/admin/orders/[id]/por-pricing`, and resolve them before invoices can be issued to those customers.
2. **WhatsApp Notification Template Alignment:**
   When a POR order is placed, the initial WhatsApp order placement message notifies the administrator of the order. Staff should confirm the quote with the customer and settle the price in Control OS before sending the invoice link.

---

## 10. CONCLUSION & FOUNDER SIGN-OFF GATE

The Price on Request (POR) invoice gating and admin settlement engine has been thoroughly fixed, defensively secured, and verified across 23 regression scenarios and all existing checkout test suites.

- **Zero Data Loss / Zero Historical Mutation:** Confirmed.
- **Strict Server-Side Gating:** Confirmed (HTTP 409 `POR_PRICING_PENDING`).
- **Financial Calculation Integrity:** Confirmed (Agreed prices x quantity, coupon discounts deducted, Customer 360 synced).
- **TypeScript & Build:** 100% clean.

**Recommendation:** **APPROVED FOR FOUNDER RELEASE COMMIT & STAGING**.
