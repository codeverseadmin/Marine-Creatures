# MARINE CREATURES — END-TO-END ORDER, INVOICE & FULFILMENT HEALTH AUDIT
## Document 2: Order Lifecycle Architecture & Data Flow Map

**Audit Target:** Architecture Discovery, State Management, Data Persistence & Component Connectivity  
**Date:** November 6, 2026  
**Status:** COMPLETE AUDIT MAP  

---

## 1. End-to-End System Architecture Diagram

The diagram below reflects the **actual runtime architecture** of the Marine Creatures order, pricing, invoice, and fulfillment ecosystem as discovered through code forensics:

```mermaid
flowchart TD
    subgraph StorefrontClient["Storefront Client (Browser)"]
        Cart["CartDrawer.tsx\n(CartContext)"]
        CheckoutBtn["handleWhatsAppCheckout()"]
        OrderCtx["OrderContext.tsx\n(localStorage: mc_customer_orders_v2)"]
        TrackModal["OrderTrackingModal.tsx\n(Live Polling 10s)"]
        WebInvoice["app/invoice/[id]/page.tsx\n(Customer Web Invoice)"]
    end

    subgraph PublicAPIs["Public API Routes (Next.js App Router)"]
        PostOrder["POST /api/orders\n(Rate-limited: 20/10m per IP)\n❌ Does not validate prices against catalog\n❌ Strips POR status"]
        TrackApi["GET /api/orders/track\n❌ Phone suffix vulnerability\n(cleanOrderPhone.endsWith)"]
        GetCustInvoice["GET /api/orders/[id]?token=...\n(HMAC Token Verification)"]
    end

    subgraph AdminControlPanel["Admin Control OS (Browser)"]
        AdminLogin["Admin LoginPage\n(Scrypt + HMAC Session Cookie)"]
        ControlOs["app/admin/page.tsx\n(Active Module Router)"]
        SalesModule["ControlOsSales.tsx\n(ACTIVE ORDERS UI)\n❌ No POR Pricing Modal\n❌ No WhatsApp PDF Share"]
        OrphanedOrders["OrdersTab.tsx\n(ORPHANED COMPONENT)\n⚠️ Has complete POR modal & PDF share\n⚠️ Never imported or rendered"]
        OpsModule["ControlOsOperations.tsx\n(Quarantine & Dispatch)"]
    end

    subgraph AdminAPIs["Protected Admin APIs (RBAC Gated)"]
        AdminOrdersApi["GET/PATCH /api/admin/orders\n(requirePermission: orders.read/update_status)"]
        PorPricingApi["POST /api/admin/orders/[id]/por-pricing\n(requirePermission: orders.por_price.set)\n✅ Versioning, Audit Log & Snapshotting"]
        PdfGenApi["GET /api/admin/orders/[id]/invoice-pdf\n(requirePermission: orders.invoice.generate)\n✅ Pure JS @react-pdf/renderer\n⚠️ Intercepts MC-QA-* fixtures"]
        QuarantineApi["GET/PATCH /api/admin/operations/quarantine\n(requirePermission: quarantine.read/update)"]
        DispatchApi["GET/PATCH /api/admin/operations/dispatch\n(requirePermission: dispatch.read/update)"]
        LegacyPatchApi["PATCH/DELETE /api/orders\n❌ Legacy isAdminRequest bypass\n❌ Bypasses fine-grained RBAC"]
    end

    subgraph DatabaseLayer["MongoDB Atlas Database"]
        OrdersCol[("orders Collection\n(OrderModel)\n- hasUnresolvedPorItems\n- pricingVersion\n- invoiceRevisions\n- invoiceTokenHash")]
        CustomersCol[("customers Collection\n(CustomerModel)\n- totalSpend, totalOrders")]
        AuditCol[("audit_logs Collection\n(AuditLogModel)")]
    end

    subgraph ExternalChannels["External & Native Channels"]
        WhatsAppWeb["WhatsApp Web / App\n(https://wa.me/91...?text=...)"]
        NativeShare["Mobile Native Share Sheet\n(navigator.share)"]
        LocalFile["Local File System Download\n(Marine-Creatures-INV-*.pdf)"]
    end

    %% Customer Flow
    Cart -->|1. Submit Order| CheckoutBtn
    CheckoutBtn -->|2. createOrder()| OrderCtx
    OrderCtx -->|3. POST payload| PostOrder
    CheckoutBtn -->|4. Open WhatsApp| WhatsAppWeb
    PostOrder -->|5. Upsert Order| OrdersCol
    PostOrder -->|6. Sync Customer| CustomersCol
    OrderCtx -.->|7. Cache Order| OrderCtx

    %% Admin Flow
    AdminLogin -->|Sets Session Cookie| ControlOs
    ControlOs -->|Active Tab| SalesModule
    SalesModule -->|Fetch Orders| AdminOrdersApi
    AdminOrdersApi -->|Read Orders| OrdersCol
    SalesModule -->|Advance Step| AdminOrdersApi
    AdminOrdersApi -->|Update Step| OrdersCol
    AdminOrdersApi -->|Log Transition| AuditCol

    %% Disconnected / Broken Links
    SalesModule -.->|BROKEN: Missing Link| PorPricingApi
    OrphanedOrders -.->|WORKING BUT UNUSED| PorPricingApi
    PorPricingApi -->|Save Agreed Prices & Snapshot| OrdersCol
    PorPricingApi -->|Record Audit| AuditCol

    %% Invoice Flow
    SalesModule -->|Links to| WebInvoice
    WebInvoice -->|Admin Fetch| GetCustInvoice
    GetCustInvoice -->|Read Order| OrdersCol
    WebInvoice -->|Customer Click: Share PDF| PdfGenApi
    PdfGenApi -.->|FAILS: 401 for Customer| WebInvoice
    PdfGenApi -->|Generates PDF Binary| LocalFile
    PdfGenApi -->|Generates PDF Binary| NativeShare

    %% Tracking Flow
    TrackModal -->|Poll 10s| TrackApi
    TrackApi -->|Lookup Order| OrdersCol

    %% Fulfillment Flow
    ControlOs -->|Operations Tab| OpsModule
    OpsModule -->|Quarantine Actions| QuarantineApi
    OpsModule -->|Dispatch Actions| DispatchApi
    QuarantineApi -->|Update currentStep| OrdersCol
    DispatchApi -->|Update AWB/Step| OrdersCol
    DispatchApi -->|Record Audit| AuditCol

    %% Legacy Bypass
    AdminLogin -.->|Bypass RBAC| LegacyPatchApi
    LegacyPatchApi -->|Direct DB Mutation| OrdersCol
```

---

## 2. Analysis of Data Sources of Truth & Divergences

Forensic examination of data propagation across the components reveals **four conflicting sources of truth**:

### 1. Dual API Endpoints for Order Modification
* **Route A:** `/api/admin/orders` (Introduced in Control OS refactor)
  * Protected by `requirePermission(req, 'orders.update_status')`.
  * Verifies `orders.approve` permission when `isApproved` is toggled.
  * State transition validation rule: `Math.abs(nextIdx - prevIdx) > 2`.
* **Route B:** `/api/orders` (Legacy storefront endpoint)
  * Protected only by generic `isAdminRequest(req)` (checks for existence of HMAC session cookie, ignoring individual employee permissions).
  * State transition validation rule: `Math.abs(nextIdx - prevIdx) > 1`.
  * Supports `DELETE /api/orders?id=...` which is completely absent from `/api/admin/orders`.
* **Conflict Impact:** Any administrative user or script can bypass RBAC permissions and delete orders or force state transitions by targeting the legacy `/api/orders` endpoint instead of `/api/admin/orders`.

### 2. Client-Side Calculation vs. Database Reality
* **Storefront Checkout:** In `components/cart/CartDrawer.tsx`, the order total is computed in browser memory (`cartTotal`).
* When submitting via `createOrder()` in `OrderContext.tsx`:
  ```typescript
  subtotal: cartTotal,
  totalAmount: cartTotal,
  items: newOrder.items.map((it) => ({
    id: it.product.id,
    name: it.product.name,
    price: it.product.price,
    quantity: it.quantity,
    image: it.product.images?.[0] || '',
    category: it.product.category,
  }))
  ```
* **Vulnerability:** `POST /api/orders` does not look up products in the database to verify prices. It trusts `body.totalAmount` and `it.price` sent by the browser. If an attacker manipulates the client payload, an arbitrary price is persisted directly into MongoDB.

### 3. LocalStorage Synchronization Fractures
* `OrderContext.tsx` maintains a local array in `localStorage.getItem('mc_customer_orders_v2')`.
* Non-admin customer sessions receive `401 Unauthorized` when calling `GET /api/orders` (correct security design).
* **Defect:** When an administrator updates an order's status in the database (e.g. from `placed` to `quarantine`), the customer's browser `OrderContext` does not sync this update via background context. Only if the customer opens the `OrderTrackingModal.tsx` does a 10-second polling loop query `/api/orders/track`. If the customer looks at their cached context list, it remains indefinitely stale until modal interaction occurs.

### 4. POR Metadata Loss Between Frontend and Backend
* A product in the catalog with `price: 0` or `priceOnRequest: true` is treated by `CartDrawer.tsx` as a POR item for text rendering (`Price on Request`).
* However, `CartDrawer.tsx` passes the raw product to `createOrder()`, which maps items into `POST /api/orders` without including `priceOnRequest: true` or `pricingStatus: 'PENDING_POR'`.
* `POST /api/orders` saves the item into MongoDB. Because the Mongoose schema defaults `priceOnRequest: false` and `hasUnresolvedPorItems: false`, the database loses all awareness that the item was a Price on Request specimen.
* The order is stored with item price `₹0` and order total `₹0` (or the sum of non-POR items).

---

## 3. Disconnected Component Map

| Component | Intended Capability | Current Runtime Reality | Root Architectural Gap |
|:---|:---|:---|:---|
| `components/admin/tabs/OrdersTab.tsx` | Comprehensive order management, inline POR pricing modal, WhatsApp PDF dispatch. | **100% Dormant.** Zero imports across the entire application. | Orphaned after `ControlOsSales.tsx` was created. |
| `components/admin/ControlOsSales.tsx` | Active orders table in Admin Control OS. | Displays orders, but has **no pricing buttons**, **no POR modal**, and **no PDF share button**. Only links to `/invoice/${o.id}`. | Incomplete feature parity during admin refactor. |
| `lib/hooks/useInvoicePdfShare.ts` | Handles mobile native sharing and desktop PDF download + WhatsApp URL launch. | Fully functional hook, but only imported by orphaned `OrdersTab.tsx` and customer web invoice `InvoicePage`. | Missing from `ControlOsSales.tsx`. |
| `app/invoice/[id]/page.tsx` | Web invoice presentation and customer dispatch portal. | Contains a "Share PDF via WhatsApp" button that calls `/api/admin/orders/[id]/invoice-pdf`, which requires admin authentication. | Customers clicking the button get an immediate HTTP 401 error. |
| `app/api/admin/operations/dispatch/route.ts` | Dispatch operations management. | Modifies `order.currentStep` directly without enforcing prerequisite stages (`quarantine` or `packed`). | Lacks state machine validation. |

---

## 4. Architectural Summary

The application has two parallel order systems:
1. **The "Synthetic/Orphaned" System:** Consists of `OrdersTab.tsx`, `invoice-test-fixtures.ts`, and the `MC-QA-*` endpoint intercepts. This system is feature-complete, passes all automated tests, handles POR pricing, and generates invoices—but it exists purely in test mocks and unreferenced files.
2. **The "Live Production" System:** Consists of `CartDrawer.tsx`, `OrderContext.tsx`, `ControlOsSales.tsx`, and MongoDB Atlas. This system is active in production, but drops POR flags, lacks pricing UI, allows stage skipping, and contains tracking security flaws.

Remediation requires converging these two paths into a single, cohesive architecture.

