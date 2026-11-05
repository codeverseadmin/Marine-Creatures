# MARINE CREATURES — END-TO-END HEALTH AUDIT
## DELIVERABLE 2: PRICE-ON-REQUEST (POR) WORKFLOW & PRICING HEALTH AUDIT

**Audit Date:** November 6, 2026  
**Auditor:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Audit Target:** Storefront-to-Admin POR Lifecycle, Database Models, API Handlers & UI Interactivity  
**Audit Status:** AUDIT COMPLETE — CRITICAL DEFECTS IDENTIFIED & VERIFIED  

---

## 1. EXECUTIVE SUMMARY & VERDICT

The Price-on-Request (POR) workflow is a central commercial mechanism for Marine Creatures. Because exotic corals and high-tier marine specimens fluctuate in acquisition cost, quarantine conditioning, and quarantine mortality risk, they cannot be sold at static retail prices. The intended business workflow requires:
1. Customers discover and place an order/inquiry for POR specimens at ₹0 upfront.
2. The order enters the Admin Sales Queue clearly flagged with `hasUnresolvedPorItems: true` and `pricingStatus: "PRICE_ON_REQUEST"`.
3. The Admin Concierge consults quarantine records, discusses the acquisition with the client via WhatsApp, and inputs an agreed price directly into the order.
4. Downstream financial totals, line items, and invoice manifests update immediately to the agreed price without corrupting the master catalog.
5. Invoices and tracking manifests reflect the agreed valuation before packing and air-cargo dispatch.

### Audit Verdict: **FAIL (SYSTEMIC DISCONNECT)**
While the standalone API handler (`/api/admin/orders/[id]/por-pricing/route.ts`) contains sophisticated optimistic concurrency, audit logging, and price validation logic, **the feature is completely broken in production due to three architectural disconnects**:
1. **Storefront Stripping (Cart & Context):** The cart and storefront checkout layer completely strip the `priceOnRequest` flag and price attributes before sending the payload to `POST /api/orders`.
2. **Missing Backend Valuation Logic:** `POST /api/orders` does not check the master catalog. If the incoming payload has no `priceOnRequest` flag, it saves the order with `hasUnresolvedPorItems: false`, `pricingStatus: "STANDARD"`, and `price: 0`. Real customer orders for ₹50,000+ specimens are permanently stored in MongoDB as free ₹0 items.
3. **Orphaned Admin UI:** The interactive UI component (`OrdersTab.tsx`) containing the POR pricing modal is completely orphaned. The active admin interface (`ControlOsSales.tsx`) has zero UI controls, modals, or buttons for entering agreed prices.
4. **False Test Confidence:** The automated test suite (`scripts/test-invoice-pdf-flow.mjs`) achieved a 100% pass rate solely by testing hardcoded synthetic IDs (`MC-QA-POR-FIXTURE`) that trigger in-memory interceptors in the API route, bypassing MongoDB and real application code completely.

---

## 2. THE 12-STEP POR LIFECYCLE FORENSICS

We audited all 12 sequential stages of the Price-on-Request workflow against actual production code:

| Step | Stage | Intended Workflow | Actual Application Behaviour | Defect Severity |
|---|---|---|---|---|
| **1** | Catalogue Definition | Products marked `priceOnRequest: true` and `price: 0`. | Verified in `lib/data/products.ts` and `lib/data/marine-life.ts`. Corals properly defined with `priceOnRequest: true`. | PASS |
| **2** | Storefront Display | `ProductCard` & `ProductDetails` display "Price on Request" pill instead of ₹0. | Verified. UI shows "Price on Request" and suppresses the ₹0 display cleanly. | PASS |
| **3** | Cart Addition | Cart preserves `priceOnRequest: true` in `useCart` state. | Verified. `CartItem.product.priceOnRequest` is retained in memory during browsing. | PASS |
| **4** | Checkout Submission | Checkout sends `priceOnRequest: true` to `POST /api/orders`. | **FAILED.** `OrderContext.tsx` (lines 376–383) maps items to `{ id, name, price, quantity, image, category }`, dropping `priceOnRequest`. | **CRITICAL** |
| **5** | Database Persistence | Order stored in MongoDB with `hasUnresolvedPorItems: true`. | **FAILED.** Because flags were stripped, MongoDB orders (`MC-740020EJ`, `MC-429334LH`, `MC-990152L4`) store `hasUnresolvedPorItems: false` and `totalAmount: 0`. | **CRITICAL** |
| **6** | Admin Sales Queue | Admin sees prominent "POR Pending" badge in Sales Queue. | **FAILED.** `ControlOsSales.tsx` reads `order.hasUnresolvedPorItems`. Since it is `false`, order appears as standard ₹0 order. | **CRITICAL** |
| **7** | Client Negotiation | Concierge communicates with customer via WhatsApp. | Works via manual WhatsApp link, but customer order is registered as ₹0. | PARTIAL |
| **8** | Admin Price Entry UI | Admin clicks "Set Agreed Price" button to open modal. | **FAILED.** `ControlOsSales.tsx` has NO modal, button, or input field. `OrdersTab.tsx` has the modal but is orphaned and never rendered. | **CRITICAL** |
| **9** | API Price Execution | `POST /api/admin/orders/[id]/por-pricing` receives agreed price. | Handler works for MongoDB when invoked directly via API, but unreachable from active Admin UI. | PARTIAL |
| **10** | Validation & Totals | Validates price > 0, recalculates subtotal and totalAmount. | Verified lines 205–215 of handler. Correctly rejects negative and zero values and calculates totals. | PASS (API only) |
| **11** | Audit & History | Records audit log and increments `pricingVersion`. | Verified lines 285–320 of handler. Successfully logs audit entries when handler executes. | PASS (API only) |
| **12** | Invoice & Dispatch | Regenerates invoice and syncs with tracking. | PDF reflects updated prices if set, but cannot be triggered via admin UI. | PARTIAL |

---

## 3. ROOT CAUSE ANALYSIS & CODE FORENSICS

### Defect 1: The Storefront Stripping Bug
**Location:** [marine-creatures/lib/context/OrderContext.tsx#L376-L383](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/context/OrderContext.tsx#L376-L383)

In `OrderContext.tsx`, when `createOrder` dispatches the background `fetch('/api/orders', { method: 'POST' })`, it manually projects the item attributes:
```typescript
// Line 376-383 of lib/context/OrderContext.tsx:
items: newOrder.items.map((it) => ({
  id: it.product.id,
  name: it.product.name,
  price: it.product.price, // Evaluates to 0 for POR items!
  quantity: it.quantity,
  image: it.product.images?.[0] || '',
  category: it.product.category,
  // CRITICAL DEFECT: priceOnRequest and pricingStatus are OMITTED!
})),
```
Because `priceOnRequest` is omitted from this object mapping:
- The server receives an item with `price: 0`.
- The server does not receive `priceOnRequest: true`.
- Downstream database documents have no record that the item was a POR specimen.

### Defect 2: Missing Backend Catalog Integrity Check
**Location:** [marine-creatures/app/api/orders/route.ts#L147-L217](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/route.ts#L147-L217)

The backend handler `POST /api/orders` blindly trusts the incoming JSON payload:
```typescript
// Line 147-148 of app/api/orders/route.ts:
const subtotal = Math.max(0, Number(body.subtotal ?? body.totalAmount ?? 0));
const totalAmount = Math.max(0, Number(body.totalAmount ?? subtotal ?? 0));
...
// Line 200 of app/api/orders/route.ts:
const orderPayload: any = {
  ...body,
  id,
  customerName,
  phone,
  ...
};
```
The handler never inspects `body.items` against the database or product catalog to verify if an item is a live marine specimen or marked as `priceOnRequest`. Because the client sent `subtotal: 0` and omitted `hasUnresolvedPorItems`, the order is written to MongoDB as:
```json
{
  "id": "MC-740020EJ",
  "customerName": "Debabrata Halder",
  "items": [
    {
      "id": "rainbow-chalice-coral",
      "name": "Rainbow Chalice Coral (Ultra Grade)",
      "price": 0,
      "quantity": 1
    }
  ],
  "subtotal": 0,
  "totalAmount": 0,
  "pricingStatus": "STANDARD",
  "hasUnresolvedPorItems": false
}
```
**Impact:** The founder or sales team looking at this order sees an approved/placed standard order for ₹0.

### Defect 3: The Orphaned Component Architecture
**Location:** [marine-creatures/app/admin/page.tsx](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/admin/page.tsx) vs [marine-creatures/components/admin/tabs/OrdersTab.tsx](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/admin/tabs/OrdersTab.tsx)

During earlier iterations, a developer built a comprehensive POR pricing modal inside `components/admin/tabs/OrdersTab.tsx`:
- Contains `handleSavePorPricing` calling `/api/admin/orders/${selectedOrder.id}/por-pricing`.
- Contains input fields for `agreedUnitPrice`, live recalculated totals, and optimistic concurrency version tracking.
- Contains the WhatsApp PDF sharing hook `useInvoicePdfShare`.

However, when the admin layout was upgraded to the "Control OS" workspace design:
- `app/admin/page.tsx` was wired exclusively to `components/admin/ControlOsSales.tsx` for the "sales" tab.
- `OrdersTab.tsx` was **never imported, mounted, or referenced** anywhere in `app/admin/page.tsx`.
- In `ControlOsSales.tsx` (lines 240–310), the table only renders:
  ```tsx
  <a href={`/invoice/${o.id}`} target="_blank" className="text-cyan-400 hover:underline">
    Invoice ↗
  </a>
  ```
  It has **zero buttons, zero dialogs, and zero forms** to set agreed POR prices.

---

## 4. EDGE CASE FORENSICS & VULNERABILITY ANALYSIS

We analyzed how the POR pricing system behaves across critical operational edge cases:

### A. Zero Price Submissions
- **At Storefront Checkout:** Accepted without restriction. Results in ₹0 order total.
- **At POR Pricing API (`/api/admin/orders/[id]/por-pricing`):** Correctly rejected. Line 210:
  ```typescript
  if (numPrice <= 0) {
    return NextResponse.json({ success: false, error: 'Price must be greater than zero. Free or negative prices are prohibited.' }, { status: 400 });
  }
  ```
  *Verdict:* API layer is secure; Storefront checkout layer lacks validation.

### B. Negative Price Submissions
- **At POR Pricing API:** Correctly rejected by line 210 (`numPrice <= 0`).

### C. Decimal Precision (Paise Rounding)
- **At POR Pricing API:** Line 215 executes `Math.round(numPrice * 100) / 100`.
- Line 293 recalculates order total: `Math.round(calculatedSubtotal * 100) / 100`.
- Prevents JavaScript floating-point errors (e.g., `1999.9999999999998`).
  *Verdict:* PASS at API layer.

### D. Optimistic Concurrency & Simultaneous Admin Updates
- `Order` schema contains `pricingVersion: { type: Number, default: 1 }`.
- API endpoint lines 163–177 check `expectedVersion`:
  ```typescript
  if (expectedVersion !== undefined && Number(expectedVersion) !== currentVersion) {
    return NextResponse.json({ success: false, error: 'Conflict: This order was updated by another administrator...' }, { status: 409 });
  }
  ```
  *Verdict:* Well-designed API concurrency gate; however, because the UI is missing, this gate is currently unusable by administrators.

### E. Master Catalog Immutability
- We verified whether updating an agreed price on an order mutates the master product document in the catalog.
- Line 228 only mutates `targetItem` within the `order.items` subdocument array.
- Neither `ProductModel` nor static files in `lib/data/` are touched.
  *Verdict:* Master catalog remains strictly immutable.

---

## 5. REAL MONGODB PRODUCTION DATA EVIDENCE

An inspection of the live MongoDB Atlas database confirmed real-world manifestation of these bugs:

### Order Evidence 1: Order `MC-740020EJ`
- **Customer:** Debabrata Halder (Kolkata)
- **Specimens:** `rainbow-chalice-coral` (Qty: 1), `acropora-tenuis-ultra` (Qty: 1)
- **Expected State:** `hasUnresolvedPorItems: true`, `pricingStatus: "PRICE_ON_REQUEST"`, `totalAmount: 0` (awaiting quote).
- **Actual Persisted State in MongoDB:**
  - `hasUnresolvedPorItems: false`
  - `pricingStatus: "STANDARD"`
  - `subtotal: 0`
  - `totalAmount: 0`
  - `isApproved: false`
- **Impact:** System treated this high-value coral order as a completed ₹0 standard order.

### Order Evidence 2: Order `MC-429334LH`
- **Customer:** Subhashis Mukherjee (Salt Lake)
- **Specimens:** `japanese-deepwater-zoanthids` (Qty: 2)
- **Actual Persisted State in MongoDB:**
  - `hasUnresolvedPorItems: false`
  - `pricingStatus: "STANDARD"`
  - `items[0].price: 0`
  - `totalAmount: 0`

---

## 6. REQUIRED REMEDIATION SPECIFICATION

To resolve the POR pricing breakdown without destabilising the rest of the application, the following changes must be implemented in the remediation phase:

1. **`lib/context/OrderContext.tsx`**:
   - Update `items.map` in `createOrder` to preserve `priceOnRequest: Boolean(it.product.priceOnRequest)`, `pricingStatus: it.product.priceOnRequest ? 'PRICE_ON_REQUEST' : 'STANDARD'`, and `category: it.product.category`.
2. **`components/cart/CartDrawer.tsx`**:
   - Explicitly pass `hasUnresolvedPorItems: cart.some(i => i.product.priceOnRequest || i.product.price === 0)` when constructing the initial order object.
3. **`app/api/orders/route.ts`**:
   - Add backend catalog verification: If any item in `body.items` matches a known POR specimen or has `price === 0`, enforce `hasUnresolvedPorItems = true` and `pricingStatus = 'PRICE_ON_REQUEST'` regardless of what client payload provided.
4. **`components/admin/ControlOsSales.tsx`**:
   - Port the POR Pricing Modal and actions from `OrdersTab.tsx` into `ControlOsSales.tsx`.
   - Render a prominent Amber "Set Agreed Price" button whenever `order.hasUnresolvedPorItems === true` or any item has `pricingStatus === 'PRICE_ON_REQUEST'`.
   - Provide an instant recalculation preview and optimistic concurrency version passing.
5. **Database Migration / Remediation Script**:
   - Run a one-time migration on existing MongoDB orders that contain ₹0 items, recalculating and setting `hasUnresolvedPorItems: true` and `pricingStatus: 'PRICE_ON_REQUEST'` where items have zero price and no agreed price recorded.

