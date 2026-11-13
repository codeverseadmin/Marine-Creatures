# QA & RELEASE PREPARATION REPORT
## Coupon Release Commit Preparation & Verification

**Reference:** `MC-COUPON-RELEASE-PREPARATION-NOV2026`  
**Classification:** Controlled Release Preparation  
**Mode:** Controlled / Ready for Founder Commit Approval  
**Timestamp:** November 14, 2026 — 02:46 AM IST  
**Target Environment:** Local Next.js 16.4.1 (Turbopack) & MongoDB Atlas (Cluster0)  
**Production Deployment:** **NOT AUTHORISED**  
**Git Commit Action:** **STAGED — AWAITING FOUNDER APPROVAL**

---

## 1. OBJECTIVE & EXECUTIVE SUMMARY

In accordance with release preparation guidelines, the conditionally accepted coupon-assisted checkout order persistence repairs, First-Time Customer Coupon Restriction UX V2, Customer 360 synchronization, and idempotency protection have been verified, regression tested, and staged for a dedicated release commit.

All 6 target files have been staged in Git (`Changes to be committed`). Zero unstaged code modifications exist in the working tree. No commit or remote push has been executed.

### Test & Build Health Summary
- **TypeScript Static Analysis:** `npx tsc --noEmit` — **0 errors** (Exit code 0).
- **Next.js Production Build:** `npm run build` — **147/147 routes successfully compiled** in Turbopack (Exit code 0).
- **First-Order Eligibility Regression Suite:** `15 / 15 scenarios PASSED` (Exit code 0).
- **Coupon Checkout Persistence Suite:** `17 / 17 scenarios PASSED` (Exit code 0).
- **Combined Automated Verification:** **32 / 32 scenarios passed (100% Pass Rate)**.

---

## 2. THE SIX VERIFIED FILES & STAGED DIFF SUMMARY

Only the exact 6 files associated with coupon checkout, eligibility, idempotency, and order integrity are staged:

```
 app/api/orders/route.ts              |  63 +++++
 app/api/promotions/validate/route.ts |   2 +
 components/cart/CartDrawer.tsx       | 534 +++++++++++++++++++++++++++++++----
 lib/context/OrderContext.tsx         | 205 ++++++--------
 lib/services/promotion-engine.ts     |  29 +-
 models/Order.ts                      |  27 +-
 6 files changed, 663 insertions(+), 197 deletions(-)
```

### 2.1 File-by-File Change Audit

#### 1. `app/api/orders/route.ts` (+63 lines)
- **Scope & Scope Variable:** Hoisted `let idempotencyKey: string | undefined = undefined;` to function scope above `try` block.
- **Idempotency Gate (Lines 141–156):** Checks `OrderModel.findOne({ idempotencyKey })`. If an existing order is found, returns HTTP 200 with `{ success: true, data: existingOrder, idempotent: true }` immediately, bypassing duplicate writes and customer counters.
- **Payload Idempotency:** Stores `orderPayload.idempotencyKey = idempotencyKey`.
- **Concurrent Race Condition Guard (Lines 529–538 & Outer Catch):** Intercepts MongoDB unique key collision `E11000` on `idempotencyKey_1`. Waits 200ms for the winning transaction to complete and returns HTTP 200 with the existing order document.
- **Customer 360 Synchronization (Lines 604–625):** Runs `CustomerModel.findOneAndUpdate` with `$inc: { totalOrdersCount: 1, totalSpend: totalAmount }`. Handled safely with `.catch(...)` to prevent customer upsert anomalies from disrupting order delivery.

#### 2. `app/api/promotions/validate/route.ts` (+2 lines)
- **Granular Payload Propagation:** Propagates `reason` (e.g. `'first_order_ineligible'`) and `customerEligibility` in the HTTP 400 response body so client UI can trigger specific restriction popups.

#### 3. `components/cart/CartDrawer.tsx` (+534, -50 lines)
- **Coupon Lifecycle & Error Handling:** Manages coupon input, active coupon detachment, and granular error/warning banners.
- **Reactive Phone Trigger:** A `useEffect` monitors `customerPhone`. Once a valid 10-digit phone number is reached and a `first_order` coupon is active, triggers `triggerEligibilityVerification(cleanPhone)`.
- **Asynchronous Cancellation & Race-Condition Defense:** Employs `AbortController` (`activeAbortCtrlRef`) to abort in-flight HTTP requests during typing and a sequence tracker (`activeRequestSeqRef`) to discard out-of-order async responses.
- **First-Time Customer Coupon Restriction Modal:**
  - Accessible dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`).
  - Dark ocean aesthetic matching Marine Creatures brand (`bg-[rgba(5,14,22,0.98)]`, `border-cyan-500/30`, amber alert badge).
  - Copy: *"This Coupon Is Exclusively for First-Time Customers. Our records show that this phone number (+91 ...) has already placed an order with Marine Creatures. This promotional coupon cannot be applied to your order. You can remove the coupon and continue checkout at the regular price."*
  - CTAs: **"Remove Coupon & Continue"** (detaches discount, dismisses modal, keeps user in checkout at regular price with all form inputs intact) and **"Go Back to Cart"** (detaches discount, switches step to cart review).
  - Keyboard & backdrop dismissal: `Escape` key listener and backdrop click handlers.
- **Authoritative WhatsApp Checkout Dispatch:**
  - Blocks checkout if `isVerifyingEligibility` is true, if `verificationError` exists, or if `appliedCoupon.validatedForPhone !== cleanPhone`.
  - Generates unique client idempotency key (`chk_${cleanPhone}_${Date.now()}_...`).
  - Awaits `createOrder(...)`. Only upon HTTP 201 success does it construct the WhatsApp URL using `persistedOrder.id` and `persistedOrder.totalAmount`.
  - Clears cart and navigates to the success step.

#### 4. `lib/context/OrderContext.tsx` (+55, -150 lines)
- **Async Promise Interface:** Updated `createOrder` to return `Promise<{ success: boolean; data?: CustomerOrder; error?: string }>`.
- **Authoritative API Integration:** POSTs directly to `/api/orders` with `idempotencyKey` and coupon details. Awaits the server response and stores the persisted order in client state.
- **Legacy Elimination:** Removed client-side pseudo-random ID generation and synchronous offline mocks.

#### 5. `lib/services/promotion-engine.ts` (+20, -9 lines)
- **Type Integration:** Imported `CustomerEligibility` type from `@/models/Coupon`.
- **Authoritative History Query:** Normalizes phone to last 10 digits (`searchPhone = cleanPhone.slice(-10)`). For `first_order` coupons, queries `OrderModel.countDocuments({ phone: new RegExp(searchPhone, 'i'), status: { $ne: 'cancelled' } })`.
- **Ineligibility Flagging:** Returns `{ valid: false, error: '...', reason: 'first_order_ineligible', customerEligibility: 'first_order' }` if past orders exist.
- **Phone Binding:** Attaches `validatedForPhone: searchPhone` and `customerEligibility` on successful validation.

#### 6. `models/Order.ts` (+16, -11 lines)
- **Coupon Snapshot Schema:** Added `OrderCouponSchema` to store `couponId`, `code`, `discountType`, `discountValue`, `discountAmount`, `eligibleSubtotal`, `appliedAt`, `description`.
- **Idempotency Field:** Added `idempotencyKey: { type: String, index: true, sparse: true }` with a unique sparse index in MongoDB.

---

## 3. COMPREHENSIVE TEST & BUILD RESULTS

### 3.1 TypeScript Static Analysis
- **Command:** `npx tsc --noEmit`
- **Result:** **0 errors** (Exit code 0).

### 3.2 Next.js Production Build
- **Command:** `npm run build`
- **Result:** **147/147 routes successfully compiled** (Turbopack) in 2.1s compilation / 2.6s TypeScript. Zero errors.

### 3.3 First-Order Eligibility Regression Suite (`test_first_order_eligibility_ux_v2.mjs`)
- **Total Scenarios:** 15
- **Passed:** 15
- **Failed:** 0
- **Summary:**
  - Test 1 (New customer + first-order coupon): PASS
  - Test 2 (Returning customer + first-order coupon popup trigger): PASS
  - Test 3 (Returning customer cannot proceed with discount): PASS
  - Test 4 (Returning customer removes coupon -> regular price checkout): PASS
  - Test 5 (New customer removes coupon -> regular price checkout): PASS
  - Test 6 (Returning customer + general coupon accepted): PASS
  - Test 7 (Returning customer + existing customer coupon accepted): PASS
  - Test 8 (Incomplete phone number -> no premature decision): PASS
  - Test 9 (Phone number changed -> dynamic revalidation): PASS
  - Test 10 (Stale async responses discarded by sequence check): PASS
  - Test 11 (API error handling -> retry banner, no false order claim): PASS
  - Test 12 (Direct API bypass rejected with HTTP 400): PASS
  - Test 13 (Concurrent duplicate submission -> single order, identical reference): PASS
  - Test 14 (Cart & customer info intact after modal dismissal): PASS
  - Test 15 (WhatsApp opens strictly after confirmed persistence): PASS

### 3.4 Coupon Checkout Order Persistence Suite (`test_coupon_order_persistence_suite.mjs`)
- **Total Scenarios:** 17
- **Passed:** 17
- **Failed:** 0
- **Summary:**
  - Percentage & Fixed discounts, minimum spend, max discount caps, invalid/expired/exhausted codes, idempotency double-clicks, and invoice discount alignment all verified.

---

## 4. CUSTOMER 360 INVESTIGATION & FUNCTIONAL IMPACT

### 4.1 Features Relying on Materialized vs. Dynamic Counters

| Application Feature | Implementation Location | Data Source Used | Impact of Historical Zero-Counter Condition |
|---|---|---|---|
| **Customer 360 Dossier** | `app/api/admin/customers/route.ts` (lines 40–57) | **Dynamic Aggregation:** Executes `OrderModel.find({ phone })` live; calculates `orders.length` and `orders.reduce(..., totalAmount)`. | **Zero Impact.** Always displays 100% accurate historical spend and order count when an admin clicks on any customer. |
| **First-Order Coupon Eligibility** | `lib/services/promotion-engine.ts` (lines 175–190) | **Dynamic Aggregation:** Executes `OrderModel.countDocuments({ phone })` live. | **Zero Impact.** Returning customers are correctly identified and restricted regardless of `CustomerModel` fields. |
| **Storefront Checkout & Invoices** | `components/cart/CartDrawer.tsx` & `app/invoice/[id]/page.tsx` | **Direct Order Data:** Reads directly from the persisted `order` document. | **Zero Impact.** Orders, discounts, and invoices reflect exact transaction values. |
| **Admin Customer List Table** | `components/admin/ControlOsSales.tsx` (line 1018) | **Materialized Summary:** Reads `CustomerModel.totalOrdersCount` and `totalSpend`. | **Minor / Cosmetic.** Pre-November 2026 customers display "0" in the table row until clicked into. |

### 4.2 Conclusion on Customer 360
- **Customer-Facing Impact:** **None.** Zero impact on storefront checkout, pricing, or coupon eligibility.
- **Administrative Impact:** **None on Dossiers.** Clicking any customer opens their complete, accurate, dynamically calculated order history and spend.
- **Future Orders:** Every newly placed order automatically increments `totalOrdersCount: 1` and `totalSpend: totalAmount` via `$inc`.
- **Policy Compliance:** No historical data backfill has been executed.

---

## 5. GIT RELEASE STATUS & STAGED DIFF AUDIT

### 5.1 Repository State
- **Branch:** `main` (synchronized with `origin/main`).
- **HEAD Commit:** `899875c19a708d2e9cb5e01f94ea624b4c84f63e`  
  *Message:* `feat(admin): implement image & video dual-support in Media Upload (MC-ADMIN-MEDIA-IMAGE-VIDEO-V1)`
- **Remote Push Status:** Zero unpushed commits on `main`.

### 5.2 Staged Files (`Changes to be committed`)
```
modified:   app/api/orders/route.ts
modified:   app/api/promotions/validate/route.ts
modified:   components/cart/CartDrawer.tsx
modified:   lib/context/OrderContext.tsx
modified:   lib/services/promotion-engine.ts
modified:   models/Order.ts
```

### 5.3 Untracked Files (`Untracked files`)
- `docs/QA/MC-COUPON-CHECKOUT-ORDER-PERSISTENCE-INCIDENT.md`
- `docs/QA/MC-COUPON-RELEASE-READINESS-FINAL-NOV2026.md`
- `docs/QA/MC-FIRST-ORDER-COUPON-ELIGIBILITY-V2.md`
- `docs/QA/MC-COUPON-RELEASE-PREPARATION-NOV2026.md`
- Test scratch files in `scratch/`.

Zero unrelated changes (such as media upload, hero video, or environment files) are included in the staged diff.

---

## 6. PROPOSED DEDICATED RELEASE COMMIT

Once approved by the founder, the commit can be executed as follows:

```bash
git commit -m "feat(checkout): resolve coupon order persistence, implement idempotency, and add first-order restriction UX V2 (MC-COUPON-RELEASE-PREPARATION-NOV2026)"
```

---

## 7. REMAINING BLOCKERS & VERDICT

- **Release Gate:** Awaiting founder approval of the staged diff.
- **Production Push:** Halted until explicit authorization is granted.
- **Production Deployment:** NOT AUTHORISED.
- **Status:** **READY FOR FOUNDER COMMIT APPROVAL**.

