# MARINE CREATURES — COUPON CHECKOUT ORDER PERSISTENCE INCIDENT REPORT
**Reference:** `MC-P0-COUPON-ORDER-PERSISTENCE-NOV2026`  
**Classification:** P0 — Checkout & Order Integrity  
**Status:** Remediated & Verified (17/17 Regression Scenarios Passing)  
**Date:** 14 November 2026  
**Target Systems:** `CartDrawer.tsx`, `OrderContext.tsx`, `models/Order.ts`, `/api/orders`, Control OS Admin Orders

---

## 1. EXECUTIVE SUMMARY

During testing on 13 November 2026, a customer applied coupon `WELCOME100` and placed an order via the storefront checkout drawer. The WhatsApp order message was formatted and launched successfully, but the order failed to appear in the Control OS Admin Orders panel.

An evidence-led forensic investigation identified the root cause:
1. **Unawaited Speculative Client WhatsApp Launch:** In `CartDrawer.tsx`, `window.open(whatsappUrl)` was triggered synchronously on button click **prior to receiving confirmation of server persistence** from `POST /api/orders`.
2. **First-Order Eligibility Rejection:** The coupon `WELCOME100` was configured with `customerEligibility: "first_order"`. In Step 1 ('cart') of the checkout drawer, the phone number was empty, so `/api/promotions/validate` reported the coupon as valid. When the customer entered their phone number (`9330555589`) in Step 2, the coupon was never re-validated against their order history.
3. **Server-Side Rejection & Persistence Failure:** The phone `9330555589` already had 2 recorded orders in MongoDB (`MC-1794581162176-B323D190` and `MC-1794581839870-EF03FA04`). Upon checkout submission, `validateAndCalculateCoupon` rejected the order with **HTTP 400: *"This coupon is exclusively reserved for your first order."***
4. **Silent Drop:** Because `POST /api/orders` returned HTTP 400, the order was never inserted into MongoDB. Meanwhile, the customer had already been dispatched to WhatsApp with a client-generated speculative order ID (`MC-XXXXXX`). Control OS Admin Orders panel correctly reflected MongoDB state—the order had never existed in the database.

### Core Remediation Architecture:
- **Server Persistence Gate:** Storefront checkout strictly awaits authoritative MongoDB persistence before dispatching to WhatsApp.
- **Error Interception & Retention:** If an order fails server persistence, WhatsApp dispatch is strictly aborted, the cart is preserved, and an actionable error banner with a 1-click *"Remove Ineligible Coupon & Continue"* button is displayed.
- **Dynamic Phone Re-validation:** As soon as a customer enters a 10-digit WhatsApp number in Step 2, coupon eligibility is automatically re-checked against customer order history.
- **Idempotency & Concurrency Gate:** Added `idempotencyKey` with unique sparse indexing and concurrent collision handling to guarantee duplicate submissions return the existing order without duplicate records or double-redemptions.
- **WhatsApp Fallback CTA:** Added a dedicated *"Open in WhatsApp"* fallback button on the success screen in case browser popup blockers interrupt asynchronous tab creation.
- **Customer 360 Sync:** Direct `CustomerModel` upsert on order creation guarantees real-time synchronisation of customer spend and order count.

---

## 2. DETAILED FORENSIC AUDIT & ROOT CAUSE ANALYSIS

### 2.1 The Sequence of Events (Pre-Fix Failure Trace)
```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant CartUI as CartDrawer.tsx
    participant ValidateAPI as /api/promotions/validate
    participant OrderContext as OrderContext.tsx
    participant OrdersAPI as /api/orders
    participant DB as MongoDB Atlas
    actor Suraj as WhatsApp (Suraj)

    Customer->>CartUI: 1. Adds items to cart, applies WELCOME100
    CartUI->>ValidateAPI: 2. Validate WELCOME100 (phone: undefined)
    ValidateAPI-->>CartUI: 3. HTTP 200 Valid (Skipped first_order check)
    Customer->>CartUI: 4. Proceeds to Step 2, enters phone 9330555589
    Note over CartUI: No re-validation against entered phone
    Customer->>CartUI: 5. Clicks "Place Order via WhatsApp"
    rect rgb(255, 230, 230)
    Note over CartUI,Suraj: FLUSH HAZARD: Speculative WhatsApp dispatch
    CartUI->>Suraj: 6. window.open(whatsappUrl) IMMEDIATELY
    CartUI->>CartUI: 7. Clears cart & transitions to success screen
    end
    CartUI->>OrderContext: 8. createOrder() [async background fetch]
    OrderContext->>OrdersAPI: 9. POST /api/orders (phone: 9330555589, coupon: WELCOME100)
    OrdersAPI->>DB: 10. Count prior orders for 9330555589
    DB-->>OrdersAPI: 11. Found 2 existing orders
    OrdersAPI-->>OrderContext: 12. HTTP 400 Bad Request ("Reserved for first order")
    Note over DB: ZERO RECORDS SAVED. Order is permanently dropped.
```

### 2.2 Reconciled Order Records
A read-only audit of MongoDB Atlas confirmed the integrity of all authentic orders:
- **15 Baseline Orders:** Historical authentic orders reconciled during previous platform audits.
- **2 Orders for `9330555589`:**
  - `MC-1794581162176-B323D190` placed 13 Nov 2026 15:46:02 UTC
  - `MC-1794581839870-EF03FA04` placed 13 Nov 2026 15:57:19 UTC
- **1 Owner Test Order:**
  - `MC-1794582806877-2B9611D3` placed 13 Nov 2026 16:13:26 UTC
- **Total Authentic Orders in Database:** 18 authentic records. Zero order records were deleted or corrupted.

---

## 3. IMPLEMENTED REMEDIATIONS

### 3.1 `components/cart/CartDrawer.tsx`
- **Asynchronous Order Flow:** `handleWhatsAppCheckout` is now `async`. When clicked, it sets `isSubmittingOrder(true)` to lock the UI and show a loading spinner.
- **Persistence Verification:** It awaits `createOrder(...)`. If `createOrder` returns `{ success: false, error }`, it:
  - Halts execution immediately.
  - Does NOT open WhatsApp.
  - Does NOT clear the shopping cart.
  - Displays the exact error banner with a 1-click *"Remove Ineligible Coupon & Continue"* button.
- **Authoritative WhatsApp Data:** Once `createOrder` succeeds, WhatsApp text is populated with the authoritative server-generated `orderId` (`MC-<timestamp>-<hex>`) and verified `totalAmount`, eliminating ID and pricing discrepancies between WhatsApp and the database.
- **Phone Re-Validation Effect:** An `AbortController`-enabled effect watches `customerPhone`. As soon as 10 digits are entered, any active coupon is validated in the background. If the customer is ineligible, a warning is displayed and the coupon is cleanly detached before checkout.
- **Popup Blocker Resiliency:** An *"Open in WhatsApp"* CTA link is rendered on the success screen as a fail-safe fallback.

### 3.2 `lib/context/OrderContext.tsx`
- **Synchronous Persistence Contract:** `createOrder` signature updated to return `Promise<{ success: boolean; data?: CustomerOrder; error?: string }>`.
- **Authoritative Server Sync:** Awaits `POST /api/orders` HTTP response. Only upon HTTP 200/201 confirmation does it normalize and commit the order to local React state and `localStorage`.

### 3.3 `models/Order.ts`
- **Unique Sparse Idempotency Key:** Added `idempotencyKey: { type: String, unique: true, sparse: true, index: true }`.
- **Clean Coupon Schema:** Configured `OrderCouponSchema` with `{ _id: false }` and `default: undefined`, preventing non-coupon orders from containing empty dummy coupon structures.

### 3.4 `app/api/orders/route.ts`
- **Idempotency Gate:** Checks for incoming `idempotencyKey`. If an order with that key already exists, returns HTTP 200 with the existing order document immediately.
- **Concurrent Race Protection:** In `OrderModel.create` retry block, MongoDB error code 11000 on `idempotencyKey` retrieves and returns the existing order safely.
- **Customer 360 Direct Sync:** Upserts `CustomerModel` on order creation with `$inc: { totalOrdersCount: 1, totalSpend: totalAmount }`, ensuring Customer 360 dossiers update in real-time.

---

## 4. REGRESSION VERIFICATION RESULTS (17/17 SCENARIOS)

An automated 17-scenario regression test suite was executed against the running Next.js server and live MongoDB Atlas database (`scratch/test_coupon_order_persistence_suite.mjs`). All test fixtures were isolated and cleaned up upon suite completion.

```
================================================================
   MARINE CREATURES — COUPON CHECKOUT PERSISTENCE SUITE         
================================================================

[Scenario  1] ✅ PASS — Normal order without coupon
    └─ Total: ₹2,800, Coupon: undefined
[Scenario  2] ✅ PASS — Percentage coupon order (10% off ₹2,800)
    └─ Total: ₹2,520, Discount: ₹280
[Scenario  3] ✅ PASS — Fixed coupon order (₹150 off ₹2,800)
    └─ Total: ₹2,650, Discount: ₹150
[Scenario  4] ✅ PASS — Minimum order subtotal rejection
    └─ HTTP 400: Minimum eligible purchase of ₹5,000 required for this coupon (current eligible subtotal: ₹2,800).
[Scenario  5] ✅ PASS — Maximum discount cap enforcement (₹200 cap)
    └─ Discount: ₹200, Total: ₹2,600
[Scenario  6] ✅ PASS — First-order coupon for fresh customer
    └─ Order created: MC-1794600453788-81256141C1E71B471F5315A3ECB2477F, Discount: ₹100
[Scenario  7] ✅ PASS — First-order coupon rejection for returning customer
    └─ HTTP 400: This coupon is exclusively reserved for your first order.
[Scenario  8] ✅ PASS — Customer-specific eligibility (Existing vs New)
    └─ New customer rejected: true, Existing customer accepted: true
[Scenario  9] ✅ PASS — Invalid coupon code rejection
    └─ HTTP 400: Invalid coupon code. Please check and try again.
[Scenario 10] ✅ PASS — Expired coupon rejection
    └─ HTTP 400: This coupon has expired.
[Scenario 11] ✅ PASS — Usage-limited coupon exhausted rejection
    └─ HTTP 400: This coupon has reached its maximum redemption limit.
[Scenario 12] ✅ PASS — Checkout persistence failure safely rejected
    └─ HTTP 400: Missing required order fields (customerName, phone, address)
[Scenario 13] ✅ PASS — Rapid double-submission idempotency gate
    └─ Orders returned: MC-1794600456678-... == MC-1794600456678-..., DB docs: 1
[Scenario 14] ✅ PASS — Persistence precedes WhatsApp announcement
    └─ Authoritative Order ID generated: MC-1794600457360-A191FD4B89DDC0246AF5CEF1AFB00121
[Scenario 15] ✅ PASS — Order visibility in Control OS Admin Orders
    └─ Searched for MC-1794600450782-... among 28 orders: Found = true
[Scenario 16] ✅ PASS — Customer 360 profile & order sync
    └─ Customer phone 9876541251: totalOrdersCount=1, totalSpend=₹2,800
[Scenario 17] ✅ PASS — Invoiced amount matches discounted amount and snapshot preserved
    └─ Subtotal: ₹2,800, Discount: -₹280, Total: ₹2,520, SnapCode: TESTPERC_1794600451052

================================================================
   CLEANUP: Removing isolated test fixtures                    
================================================================
Cleaned up 8 test order(s) & redemptions.
Cleaned up 8 test coupon fixture(s).
Cleaned up 9 test customer fixture(s).

Database connection closed. Zero production data modified.

================================================================
   REGRESSION SUITE RESULTS SUMMARY                             
================================================================
Total Scenarios: 17 / 17
Passed: 17
Failed: 0
Status: ALL SCENARIOS PASSED (17/17)
================================================================
```

---

## 5. SEPARATE INVESTIGATION: ADMIN VIDEO UPLOAD STATUS

### Findings:
- In `MC-ADMIN-MEDIA-IMAGE-VIDEO-V1`, commit `899875c` updated `components/admin/ControlOsCatalog.tsx` (lines 1961 and 3265) to accept video MIME types (`accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"`), expanded `/api/admin/upload` with video chunking up to 100MB, binary file signatures, and video thumbnailing.
- **Root Cause of Image-Only Display:** The implementation changes are committed to the `main` branch, but production deployment was held pending founder release approval. The un-deployed production site was still running the pre-`899875c` client bundle where `accept="image/*"` remained active.
- **Protocol Adherence:** In accordance with explicit founder instructions, final video upload verification is held pending receipt of founder error/screenshot evidence.

---

## 6. PRODUCTION BUILD VERIFICATION

A full Next.js production build was executed and verified:
- `npx tsc --noEmit`: **0 errors**
- `npm run build`: **Compiled successfully**
- Generated: **147 static/dynamic routes**

---

## 7. GIT STATUS & RELEASE GATE

- **Current Branch:** `main`
- **Head Commit:** `899875c`
- **Working Tree Changes:**
  - `modified: app/api/orders/route.ts`
  - `modified: components/cart/CartDrawer.tsx`
  - `modified: lib/context/OrderContext.tsx`
  - `modified: models/Order.ts`
- **Release Gate:** In strict adherence to policy, no code has been committed or pushed to `origin/main`, and no deployment has been initiated. All changes await explicit founder review and approval.

