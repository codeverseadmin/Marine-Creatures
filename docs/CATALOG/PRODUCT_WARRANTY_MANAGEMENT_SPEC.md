# MARINE CREATURES — PRODUCT-LEVEL WARRANTY MANAGEMENT SPECIFICATION (V1)

**Reference:** `MC-FEATURE-PRODUCT-WARRANTY-V1`  
**Classification:** Product Lifecycle & Commercial Governance  
**Status:** Implemented & Verified (17/17 Acceptance Tests Passed)  
**Target:** Marine Creatures Storefront, Control OS, Order Snapshotting & Invoicing  

---

## 1. Executive Summary

This specification establishes an authoritative, configurable product-level warranty management subsystem for Marine Creatures. The implementation provides:
1. Granular admin control over warranty eligibility, provider, duration, customer-facing terms, and internal administrative notes.
2. Full support for variant-level warranty overrides (inheriting base product settings unless explicitly overridden).
3. Authoritative order-line warranty snapshots captured at checkout time and permanently immutabilized across database records, customer tracking views, and generated executive invoice PDFs.
4. Robust customer privacy guarantees: internal admin notes are strictly excluded from public APIs and customer storefronts.
5. Strict RBAC enforcement and audit trail generation (`PRODUCT_WARRANTY_UPDATED`) recording actors, timestamps, and before/after states.

---

## 2. Architecture & Data Model

### 2.1 Product Schema (`models/Product.ts`)

```typescript
export interface IProductWarranty {
  enabled: boolean;
  provider?: 'manufacturer' | 'seller';
  durationValue?: number;
  durationUnit?: 'days' | 'months' | 'years';
  terms?: string;
  internalNotes?: string;
}
```

- **Default State on Creation:**
  New products created via the Control OS or Admin API default to:
  ```json
  {
    "enabled": false,
    "provider": "manufacturer",
    "durationValue": 1,
    "durationUnit": "years",
    "terms": "",
    "internalNotes": ""
  }
  ```
  Warranty is never automatically enabled.
- **Variant Overrides:**
  The `variants` subdocument array supports an optional `warranty` sub-schema without defaults, allowing individual variants (e.g. Deluxe vs. Standard) to provide custom terms while unconfigured variants cleanly inherit base product warranty settings.

### 2.2 Order Snapshot Schema (`models/Order.ts`)

```typescript
export interface IOrderWarrantySnapshot {
  hasWarranty: boolean;
  provider?: 'manufacturer' | 'seller';
  durationValue?: number;
  durationUnit?: 'days' | 'months' | 'years';
  terms?: string;
}
```

- **Checkout Capture (`app/api/orders/route.ts`):**
  At checkout, the server authoritatively resolves the item warranty from MongoDB:
  - If a variant is selected and defines an explicit `warranty.enabled` boolean, the variant snapshot is applied.
  - Otherwise, the parent product's warranty is inherited.
  - If neither has warranty enabled, `{ hasWarranty: false }` is recorded.
- **Historical Immutability:**
  Historical order items preserve their exact snapshot even if the product or variant warranty is later modified or disabled in the catalog.

---

## 3. Administrative Control & Control OS

### 3.1 Edit Catalog Product Interface (`components/admin/ControlOsCatalog.tsx`)
Located in **Step 4: Specs & Warranty**:
- **Warranty Status Toggle:** Enabled / Disabled.
- **Provider Selector:** `Manufacturer` vs. `Seller`.
- **Duration Configuration:** Numeric value + Unit (`days`, `months`, `years`).
- **Customer Terms Field:** Rich textarea for customer-facing terms and warranty claim instructions.
- **Internal Notes Field:** Restricted administrative notes (e.g. supplier RMA contacts, distributor contract numbers).
- **Step 7 Pre-Save Summary:** Clear badge rendering the active warranty policy prior to saving.

### 3.2 Audit Logging (`models/AuditLog.ts` & `app/api/admin/catalog/route.ts`)
Modifications to product warranty generate a dedicated audit entry:
- **Action:** `PRODUCT_WARRANTY_UPDATED`
- **Details:** Includes `previousWarranty`, `newWarranty`, `actor` (employee ID and email), and `changedAt`.

---

## 4. Customer Storefront & Invoicing

### 4.1 Storefront Product Detail (`components/marketplace/ProductDetailView.tsx`)
- **When Warranty is Enabled:**
  - Displays a highlighted badge (e.g., `🛡️ 2 years Manufacturer Warranty`).
  - Summarizes coverage duration and authorized provider.
  - Features an expandable/collapsible disclosure for full warranty terms.
  - Dynamically updates upon selecting different product variants.
  - Automatically incorporates Schema.org `WarrantyPromise` structured data in JSON-LD.
- **When Warranty is Disabled:**
  - Distinctly renders `No Warranty`.
  - Zero misleading badges or false warranty promises.

### 4.2 Invoices and Order Tracking
- **Executive Invoice PDF (`lib/invoice-pdf-template.tsx`):**
  Renders line-item warranty statements:
  `• Warranty: 2 years (Manufacturer Warranty)` or `• Warranty: None`.
- **Order Tracking Modal (`components/orders/OrderTrackingModal.tsx`):**
  Displays badge and coverage terms on each purchased line item.
- **Control OS Sales Order Modal (`components/admin/ControlOsSales.tsx`):**
  Displays the captured warranty snapshot to fulfillment staff.

---

## 5. Verification & Test Evidence

The implementation was validated against a comprehensive automated test suite (`scratch/test_product_warranty.mjs`) executing against compiled production Next.js endpoints:
- **Group 1:** RBAC & Authorization Governance (401/403 checks).
- **Group 2:** New Product Default State (`enabled: false` across DB and Storefront).
- **Group 3:** Admin Warranty Configuration & Storefront Presentation.
- **Group 4:** Variant-Level Warranty Overrides.
- **Group 5:** Order Snapshot Capture & Historical Immutability.
- **Group 6:** Disabling Warranty & Clean Removal from Storefront.
- **Group 7:** Executive Invoice PDF Generation.
- **Group 8:** Existing Catalog Integrity Preservation (65 products, 17 orders).
- **Result:** **17 Passed, 0 Failed (100% Pass Rate)**.
