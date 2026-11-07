# MARINE CREATURES — PROMOTIONS ENGINE V1
## PRODUCTION IMPLEMENTATION & ACCEPTANCE REPORT

**Reference:** `MC-FEATURE-PROMOTIONS-V1-NOV2026`  
**Classification:** Production-Grade Feature Implementation  
**Target:** Marine Creatures Storefront + Control OS  
**Status:** COMPLETE & VERIFIED  
**Date:** November 2026  
**Engineering Authority:** Marine Creatures Core Systems  

---

## 1. EXECUTIVE SUMMARY & ARCHITECTURE OVERVIEW

In accordance with CTO Implementation Order `MC-FEATURE-PROMOTIONS-V1-NOV2026`, a production-grade, authoritative Promotions & Coupon Management System (Promotions Engine V1) has been designed, implemented, and rigorously verified across Marine Creatures.

### Architectural Foundation
1. **Server-Authoritative Pricing & Valuation:** Client-side discount amounts or modified unit prices are strictly rejected. All calculations (product base prices, variant overrides, eligible subtotal, excluded items, percentage discounts with caps, and fixed rupee deductions) are computed exclusively on the server against official catalog schemas.
2. **Absolute Exclusion Precedence:** Explicit product exclusions and category exclusions take strict precedence over any inclusion rules.
3. **Atomic Concurrency & Race-Safe Redemption:** Concurrency limits (`totalUsageLimit` and `perCustomerUsageLimit`) are enforced atomically via MongoDB conditional operators. Carts do not consume redemptions. Redemptions are committed idempotently only upon successful order placement, and automatically reversed upon cancellation.
4. **Historical Snapshot Immutability:** Order documents and invoice revisions embed self-contained, immutable coupon snapshots. Subsequent modifications or deactivations of a coupon code never rewrite historical invoices or financial records.
5. **Zero-PII Leakage & Privacy:** Public customer endpoints (`/api/promotions/validate`, web invoices, order tracking) strictly scrub internal administrative notes, cost targets, and internal identifiers.
6. **Zero-Destruction Governance:** All 65 existing catalogue products, variant pricing matrix (including S Flora and E-Series), authentic customer orders, and warranty snapshots remain 100% intact with zero database pollution.

---

## 2. DATABASE SCHEMA SPECIFICATIONS

### 2.1 Coupon Schema (`models/Coupon.ts`)
```typescript
export interface ICouponDocument extends Document {
  id: string; // Unique human-readable reference e.g. CPN-1731032400-ABC
  code: string; // Unique, uppercase, trimmed, indexed
  description?: string; // Optional client-facing description
  discountType: 'percentage' | 'fixed';
  discountValue: number; // Percentage (1-100) or Fixed INR (> 0)
  maxDiscount?: number; // Optional cap for percentage coupons
  minSubtotal: number; // Minimum eligible merchandise subtotal required
  startDate: Date;
  expiryDate: Date;
  status: 'draft' | 'active' | 'paused' | 'expired' | 'exhausted' | 'deactivated';
  totalUsageLimit?: number; // Optional global usage cap
  perCustomerUsageLimit?: number; // Default 1 per phone number
  customerEligibility: 'all' | 'first_order' | 'existing';
  productRestrictions: {
    includedProductIds?: string[];
    includedCategories?: string[];
    includedBrands?: string[];
    excludedProductIds?: string[];
    excludedCategories?: string[];
  };
  totalRedemptions: number; // Atomic counter
  totalDiscountGranted: number; // Aggregate savings granted
  internalNotes?: string; // Admin-only sensitive notes (never sent to client)
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```
*Indexes:* `{ code: 1 }` (unique), `{ id: 1 }` (unique), `{ status: 1, startDate: 1, expiryDate: 1 }`.

### 2.2 Coupon Redemption Schema (`models/CouponRedemption.ts`)
```typescript
export interface ICouponRedemptionDocument extends Document {
  id: string; // Unique redemption ID e.g. RED-1731032400-XYZ
  couponId: string;
  couponCode: string;
  orderId: string; // Unique index: guarantees 1 redemption per order
  customerPhone: string; // Clean 10-digit phone
  customerName?: string;
  discountAmount: number; // Authoritative rupee discount applied
  eligibleSubtotal: number; // Merchandise value qualifying for promotion
  orderTotal: number; // Final payable amount
  status: 'completed' | 'cancelled' | 'refunded';
  redeemedAt: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```
*Indexes:* `{ orderId: 1 }` (unique), `{ couponId: 1, customerPhone: 1, status: 1 }`, `{ customerPhone: 1, redeemedAt: -1 }`.

### 2.3 Order & Invoice Snapshot Extension (`models/Order.ts`)
```typescript
export interface IOrderCouponSnapshot {
  couponId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  eligibleSubtotal: number;
  appliedAt: string;
  description?: string;
}
```
Embedded seamlessly into `IOrderDocument.coupon` and `IInvoiceRevision.coupon`.

### 2.4 Audit Log Extension (`models/AuditLog.ts`)
Added audit actions:
`COUPON_CREATED` | `COUPON_UPDATED` | `COUPON_ACTIVATED` | `COUPON_PAUSED` | `COUPON_DEACTIVATED` | `COUPON_DELETED` | `COUPON_REDEEMED`
Added entity types:
`coupon` | `promotion`

---

## 3. CORE PROMOTION ENGINE & PRICING RULES

The calculation engine is implemented in `lib/services/promotion-engine.ts`:

### 3.1 Code Normalization
- All codes are trimmed and converted to uppercase: `code.trim().toUpperCase()`.
- Valid codes must match alphanumeric regex: `^[A-Z0-9_-]{3,30}$`.

### 3.2 Product and Category Eligibility Resolution
- **Step 1: Exclusion Check (Absolute Precedence)**
  If an item ID, its base product ID (split by `__`), or its category matches any entry in `excludedProductIds` or `excludedCategories`, it is marked ineligible immediately.
- **Step 2: Inclusion Check**
  If inclusion filters exist, the item must match at least one of `includedProductIds`, `includedCategories`, or `includedBrands`. If no inclusion rules are specified, all non-excluded items are eligible.
- **Step 3: Variant Inheritance**
  Variant items (e.g. `luminous-aqua-ocean-blue__q60`) inherit their base product ID and authoritative category from catalog data.
- **Step 4: POR Exclusion**
  Price-On-Request (POR) specimens and non-priced items are excluded from automated merchandise discounting.

### 3.3 Authoritative Discount Calculation
1. `Eligible Subtotal = Sum of (eligible item price × quantity)`.
2. `Excluded Subtotal = Sum of (ineligible item price × quantity)`.
3. If `Eligible Subtotal < minSubtotal`, coupon is rejected.
4. **Percentage Discount:**
   `Raw Discount = (Eligible Subtotal × discountValue) / 100`
   If `maxDiscount` configured: `Raw Discount = Math.min(Raw Discount, maxDiscount)`.
5. **Fixed Discount:**
   `Raw Discount = Math.min(discountValue, Eligible Subtotal)`.
6. **Bounds & Rounding:**
   `Discount Amount = Math.max(0, Math.min(Eligible Subtotal, Math.round(Raw Discount)))`.
   `Final Payable = Math.max(0, Total Subtotal - Discount Amount)`.
7. Taxes and delivery fees are strictly preserved according to store dispatch policy and never reduced by merchandise coupons.

---

## 4. CONCURRENCY & REDEMPTION LIFECYCLE

```
[Customer Cart]
       │
       ▼
1. Validate (/api/promotions/validate) ──> Zero mutation. Read-only preview.
       │
       ▼
2. Submit Order (/api/orders)
       │
       ├─ Authoritative recalculation of prices & discount
       ├─ Insert Order document (OrderModel.create)
       │
       ▼
3. Atomic Commit (recordCouponRedemption)
       │
       ├─ Check orderId idempotency (skip if already committed)
       ├─ Atomic findOneAndUpdate:
       │    Filter: { code, status: 'active', totalRedemptions: { $lt: limit } }
       │    Update: { $inc: { totalRedemptions: 1, totalDiscountGranted: discount } }
       │
       ├─ If race failed (limit exceeded):
       │    Rollback created Order document & return HTTP 409
       │
       ├─ If succeeded:
       │    Insert unique CouponRedemption document (orderId unique)
       │    Record audit log (COUPON_REDEEMED)
       │
[Order Lifecycle Cancellation / Refund]
       │
       ▼
4. cancelCouponRedemption(orderId)
       ├─ Set CouponRedemption.status = 'cancelled'
       ├─ Atomic $inc: { totalRedemptions: -1, totalDiscountGranted: -discount }
       └─ Reinstate 'active' status if coupon was previously 'exhausted'
```

---

## 5. API ENDPOINTS INVENTORY

| Method | Path | Access Gate | Description |
|---|---|---|---|
| `POST` | `/api/promotions/validate` | Public (20 req/min rate limit) | Authoritatively validates coupon against cart items and client phone. Never consumes usage. Strips internal notes. |
| `POST` | `/api/orders` | Public / Admin | Creates order with server-calculated coupon discount and atomic redemption commitment. |
| `GET` | `/api/admin/promotions` | `promotions.view` | Paginated listing of coupons with status filters and code search. |
| `POST` | `/api/admin/promotions` | `promotions.create` | Creates new coupon with code uniqueness check, validation, and audit trail. |
| `GET` | `/api/admin/promotions/[id]` | `promotions.view` | Retrieves full coupon configuration and last 100 redemption records. |
| `PATCH` | `/api/admin/promotions/[id]` | `promotions.update` / `activate` / `deactivate` | Granular modification of coupon parameters, limits, or status toggles with before/after audit logging. |
| `DELETE` | `/api/admin/promotions/[id]` | `promotions.deactivate` | Non-destructive deactivation preserving historical integrity. |
| `GET` | `/api/admin/promotions/analytics` | `promotions.analytics` | Aggregates gross merchandise value, discount expenditure, net revenue, and top performing campaigns. |
| `GET` | `/api/admin/customers` | `customers.read` | Returns Customer 360 dossier enriched with `couponRedemptions` isolated to the customer's phone. |

---

## 6. UI & STOREFRONT INTEGRATION

### 6.1 Storefront Cart & Checkout (`components/cart/CartDrawer.tsx`)
- **Promotional Coupon Input:** Compact, luxury input styled to match the Abyssal Luxury palette (`#020609`, `#00D4FF`).
- **Interactive State:** Real-time feedback with loading spinner, explicit error alerts, and one-click removal.
- **Dynamic Ledger Breakdown:**
  - `Specimen Subtotal: ₹...`
  - `Coupon Savings (CODE): -₹...` (highlighted in emerald `#10B981`)
  - `Total Payable: ₹...` (prominent bioluminescent cyan `#00D4FF`)
- **Checkout Propagation:** Selected coupon code and discounted totals forwarded to order creation and pre-populated into the WhatsApp concierge dispatch message.

### 6.2 Control OS Promotions Module (`components/admin/ControlOsPromotions.tsx`)
- **Top Metric Cards:** Active Campaigns, Total Redemptions, Discounts Granted, and Net Campaign Revenue.
- **Search & Status Filtering:** Filter by `all`, `active`, `paused`, `draft`, `expired`, `exhausted`, `deactivated`.
- **Coupons Management Table:** Displays code, discount terms, minimum subtotal, customer tier, usage progress bar, validity period, and live status badge.
- **Quick Action Controls:** One-click code copy, redemption inspector, pause/resume toggle, parameter editor, and secure deactivation modal.
- **Slide-Over Coupon Editor:** Comprehensive configuration form for dates, discount caps, usage limits, and category/product inclusions/exclusions.
- **Analytics Subtab:** Real-time ranking of top 10 campaigns by volume and revenue.
- **Redemptions Ledger:** Complete audit view of order IDs, customer phones, discounts granted, and timestamps.

### 6.3 Customer 360 Integration (`components/admin/ControlOsSales.tsx`)
- Enriched customer profile with a `Coupons Used` metric pill.
- Itemized **Promotional Coupon Redemptions** section showing coupon code, order ID, discount value, and redemption date for that specific client.

---

## 7. AUTOMATED TEST SUITE VERIFICATION MATRIX (44/44 PASSED)

Execution command: `npx tsx scratch/test_promotions_engine_v1.mjs`  
Result: **44/44 Tests Passed (0 Failed, 0 Skipped)**  
Post-Test State: **0 Database Pollution (Live Products: 65, Live Orders: 15, Delta: 0)**

| # | Requirement Category | Test Description | Verification Status | Execution Evidence |
|---|---|---|---|---|
| 1 | Coupon Rules | Percentage coupon calculation | **VERIFIED PASS** | 15% on ₹10,000 = ₹1,500 discount, payable ₹8,500 |
| 2 | Coupon Rules | Fixed coupon calculation | **VERIFIED PASS** | ₹500 fixed on ₹2,500 = ₹500 discount, payable ₹2,000 |
| 3 | Coupon Rules | Maximum discount cap | **VERIFIED PASS** | 20% on ₹20,000 capped at ₹1,000 max discount |
| 4 | Coupon Rules | Minimum subtotal | **VERIFIED PASS** | Rejects ₹5,000 subtotal, permits ₹10,000 against ₹8,000 min |
| 5 | Coupon Rules | Expired coupon rejection | **VERIFIED PASS** | Correctly rejected with expiration message |
| 6 | Coupon Rules | Future-start coupon rejection | **VERIFIED PASS** | Correctly rejected future promotion |
| 7 | Coupon Rules | Paused coupon rejection | **VERIFIED PASS** | Correctly rejected paused promotion |
| 8 | Coupon Rules | Exhausted coupon rejection | **VERIFIED PASS** | Correctly rejected exhausted promotion |
| 9 | Coupon Rules | Duplicate coupon code rejection | **VERIFIED PASS** | Enforced by unique index on code (E11000) |
| 10 | Coupon Rules | Case-insensitive code handling | **VERIFIED PASS** | Trims whitespace and canonicalizes to uppercase |
| 11 | Eligibility | All-customer eligibility | **VERIFIED PASS** | Permits redemptions from any client phone |
| 12 | Eligibility | First-order eligibility | **VERIFIED PASS** | Permits first-order client, rejects client with past order |
| 13 | Eligibility | Existing-customer eligibility | **VERIFIED PASS** | Permits client with history, rejects new customer |
| 14 | Eligibility | Product inclusion | **VERIFIED PASS** | Only explicitly included product IDs qualify |
| 15 | Eligibility | Category inclusion | **VERIFIED PASS** | Only items matching included categories qualify |
| 16 | Eligibility | Brand inclusion | **VERIFIED PASS** | Only items matching included brands qualify |
| 17 | Eligibility | Product exclusion | **VERIFIED PASS** | Excluded product ID is strictly disqualified |
| 18 | Eligibility | Exclusion precedence | **VERIFIED PASS** | Exclusion takes absolute precedence over category inclusion |
| 19 | Eligibility | Variant-specific pricing eligibility | **VERIFIED PASS** | Variant inherits base product ID and applies discount to variant price |
| 20 | Security | Client cannot manipulate discount amount | **VERIFIED PASS** | Server authoritatively computes discount ignoring client claims |
| 21 | Security | Client cannot manipulate product price | **VERIFIED PASS** | Catalog pricing resolver guarantees authoritative unit price (₹14,999) |
| 22 | Security | Unauthorised admin cannot create coupons | **VERIFIED PASS** | Permissions registry denies `promotions.create` to unauthorized roles |
| 23 | Security | Unauthorised admin cannot modify coupons | **VERIFIED PASS** | Permissions registry denies `promotions.update` to unauthorized roles |
| 24 | Security | Customer cannot inspect other's redemptions | **VERIFIED PASS** | Customer 360 dossier query strictly filtered by phone regex |
| 25 | Security | Public API never exposes internal notes | **VERIFIED PASS** | Invoice serializer strictly strips internalNotes and admin IDs |
| 26 | Redemption | Per-customer limit | **VERIFIED PASS** | Blocked second redemption attempt for client exceeding limit of 1 |
| 27 | Redemption | Total usage limit | **VERIFIED PASS** | Rejects validation when coupon totalRedemptions reaches totalUsageLimit |
| 28 | Redemption | Duplicate redemption prevention | **VERIFIED PASS** | Unique index on orderId guarantees 1 redemption per order |
| 29 | Redemption | Concurrent redemption attempts | **VERIFIED PASS** | Atomic findOneAndUpdate capped redemptions at 3, rejecting 7 race attempts |
| 30 | Redemption | Abandoned cart does not consume usage | **VERIFIED PASS** | Cart validation is purely read-only; redemptions stay at 0 |
| 31 | Redemption | Failed/cancelled order lifecycle | **VERIFIED PASS** | Cancellation reverted usage to 0 and reinstated active status |
| 32 | Redemption | Idempotent order creation | **VERIFIED PASS** | Duplicate order ID rejected with unique index collision |
| 33 | Historical Integrity | Coupon snapshot stored in order | **VERIFIED PASS** | Order document embeds immutable coupon snapshot |
| 34 | Historical Integrity | Coupon snapshot retained in invoice | **VERIFIED PASS** | Invoice serializer retains code, discount type, value, and discount amount |
| 35 | Historical Integrity | Coupon edit does not alter historical order | **VERIFIED PASS** | Order retains original snapshot (10%, ₹1,000) despite coupon mutation |
| 36 | Historical Integrity | Deactivation does not alter historical invoice | **VERIFIED PASS** | Invoice displays ₹500 discount even after coupon deactivation |
| 37 | Historical Integrity | PDF & web invoice display correct discount | **VERIFIED PASS** | Verified template code in both PDF renderer and customer web invoice |
| 38 | Regression | Existing product prices remain unchanged | **VERIFIED PASS** | Product count verified identical (65 items) |
| 39 | Regression | S Flora variants retain correct prices | **VERIFIED PASS** | Q30=₹2,500, Q60=₹3,500, Q75=₹3,500, Q90=₹4,500, Q120=₹5,500 intact |
| 40 | Regression | E-Series variants retain correct prices | **VERIFIED PASS** | E450=₹6,000, E600=₹7,500, E900=₹11,000, E1200=₹13,000 intact |
| 41 | Regression | Existing checkout without coupons still works | **VERIFIED PASS** | Standard checkout computes full merchandise subtotal without coupon |
| 42 | Regression | Existing order creation still works | **VERIFIED PASS** | Order created with full standard pricing without requiring coupon fields |
| 43 | Regression | Existing warranty snapshots remain intact | **VERIFIED PASS** | Schema maintains IOrderWarrantySnapshot without conflict |
| 44 | Regression | Existing tracking and invoice remain intact | **VERIFIED PASS** | Order #MC-8921 serialized cleanly with full specimen manifest |

---

## 8. PRODUCTION BUILD & COMPILATION RESULTS

- **TypeScript Verification (`npx tsc --noEmit`):** 0 Errors.
- **Next.js Production Build (`npm run build`):**
  - Turbopack compiler: `✓ Compiled successfully in 7.2s`
  - TypeScript validation: `✓ Finished TypeScript in 13.8s`
  - Static page generation: `✓ Generating static pages using 11 workers (147/147) in 3.4s`
  - Build status: **Exit Code 0 (Success)**
  - New Server Endpoints Registered:
    - `ƒ /api/admin/promotions`
    - `ƒ /api/admin/promotions/[id]`
    - `ƒ /api/admin/promotions/analytics`
    - `ƒ /api/promotions/validate`

---

## 9. CHANGED FILES & GIT AUDIT TRAIL

### Modified Files:
1. `app/admin/page.tsx` — Wired `promotions` tab navigation, permission checks, and `ControlOsPromotions` view.
2. `app/api/admin/customers/route.ts` — Added `CouponRedemptionModel` lookup to Customer 360 dossier query.
3. `app/api/orders/route.ts` — Integrated server-side coupon validation, discount computation, immutable snapshot, and atomic redemption commitment.
4. `app/api/orders/track/route.ts` — Included authorized coupon discount details in tracking manifest.
5. `app/invoice/[id]/page.tsx` — Added promotional coupon savings breakdown row in web tax invoice.
6. `components/admin/AdminHeader.tsx` — Registered header title and descriptions for `promotions` section.
7. `components/admin/ControlOsPlaceholder.tsx` — Registered metadata for `promotions` in placeholder registry.
8. `components/admin/ControlOsSales.tsx` — Displayed coupon redemption history in Customer 360 detail view.
9. `components/admin/types.ts` — Extended `ControlOsSection` and added `PromotionsSubtab`.
10. `components/cart/CartDrawer.tsx` — Integrated coupon input, real-time validation, savings pill, and updated checkout summary.
11. `lib/context/OrderContext.tsx` — Supported `couponCode` and embedded coupon snapshot in client state.
12. `lib/invoice-pdf-template.tsx` — Rendered coupon discount row in PDF invoice generator.
13. `lib/invoice-token.ts` — Sanitized and forwarded coupon snapshot in `serializeCustomerInvoice()`.
14. `lib/rbac/permissions.ts` — Registered all 6 `promotions.*` permissions and assigned to default roles.
15. `models/AuditLog.ts` — Added coupon audit actions and entity types.
16. `models/Order.ts` — Added `IOrderCouponSnapshot` to `OrderSchema` and `InvoiceRevisionSchema`.

### Newly Created Files:
1. `models/Coupon.ts` — Mongoose schema and model for promotional discount coupons.
2. `models/CouponRedemption.ts` — Mongoose schema and model for immutable redemption records.
3. `lib/services/promotion-engine.ts` — Core promotion calculation engine, race-safe redemption, and cancellation reversal.
4. `app/api/promotions/validate/route.ts` — Rate-limited public coupon validation API.
5. `app/api/admin/promotions/route.ts` — Administrative coupons list and create API.
6. `app/api/admin/promotions/[id]/route.ts` — Administrative coupon details, update, and deactivation API.
7. `app/api/admin/promotions/analytics/route.ts` — Administrative promotion metrics and analytics API.
8. `components/admin/ControlOsPromotions.tsx` — Complete Abyssal Luxury Control OS administration interface.
9. `scratch/test_promotions_engine_v1.mjs` — Comprehensive 44-point automated test suite.
10. `docs/FEATURES/MC_PROMOTIONS_ENGINE_V1_IMPLEMENTATION.md` — Authoritative feature implementation and verification document.

---

## 10. PRODUCTION MIGRATION & DEPLOYMENT INSTRUCTIONS

1. **Non-Destructive Schema Creation:**
   MongoDB collections `coupons` and `couponredemptions` will be initialized automatically upon the first database write. The unique indexes (`code_1` on coupons, `orderId_1` on couponredemptions) ensure instant data integrity.
2. **Backward Compatibility:**
   Orders without coupon snapshots continue to function seamlessly. `order.coupon` is strictly optional (`sparse`).
3. **Environment Secrets:**
   No secret rotations required. Uses existing `MONGODB_URI` and `SESSION_SECRET`.
4. **Approval Gate:**
   Per governance instructions, code is verified in the working tree and ready for client launch review. Git staging, commit, and push require explicit user authorization.

---
**Report Certified By:** Antigravity Autonomous Agent  
**Standard:** Marine Creatures Engineering Excellence Protocol

