# MARINE CREATURES — P0 REMEDIATION
## CURRENT STATE INSPECTION & DEFECT VERIFICATION FINDINGS

**Document ID:** `MC-REM-P0-002`  
**Date of Inspection:** November 6, 2026 (01:17 IST)  
**Inspector:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Investigation Mode:** READ-ONLY SOURCE CODE & DATABASE RECONNAISSANCE  
**Target Repository:** `c:\Users\User\OneDrive\Desktop\Marine Creatures\marine-creatures`  

---

## 1. BASELINE REPOSITORY & GIT FORENSICS

Prior to preparing any specifications or architectural blueprints, an independent inspection of the Git working tree, commit log, and local filesystem was performed.

### 1.1 Git Working Tree State
- **Active Branch:** `main`
- **Current HEAD Commit:** `ffd220da7586e557c1a176448afdc2c691486265`
- **Staged Files:** **NONE** (0 files staged)
- **Unstaged Modified Files (8 Files Preserved):**
  1. `components/home/FinalCTA.tsx`
  2. `components/home/ServicesBookingSection.tsx`
  3. `components/layout/Footer.tsx`
  4. `components/layout/Navbar.tsx`
  5. `components/our-worlds/FoundersVision.tsx`
  6. `components/services/BookingForm.tsx`
  7. `lib/config.ts`
  8. `lib/data/services.ts`
- **Untracked Directories:**
  1. `docs/HEALTH_AUDIT/` (Contains the 9 health audit deliverables produced earlier today)
  2. `docs/REMEDIATION/` (Directory initialized for this specification stage)

> [!IMPORTANT]
> **Preservation Guarantee:** None of the 8 unstaged modified files relate to the order, invoice, or fulfilment architecture. They contain brand refinements (the official tagline *"BRINGING OCEAN AT YOUR DOORSTEP"* and Founders' Vision presentations). These files are strictly preserved and must not be stashed, checked out, reset, or modified during remediation.

---

## 2. DEFECT VERIFICATION MATRIX: CONFIRMED VS FIXED VS UNVERIFIED

Every vulnerability, defect, and architectural flaw reported in the initial audit was re-inspected against the actual source code:

| Defect ID | Architectural Area | Primary Source Location | Initial Audit Finding | Status on Current Codebase | Severity |
|---|---|---|---|---|---|
| **DEF-01** | Production Test Interceptors | `app/api/admin/orders/[id]/por-pricing/route.ts#L34-L146` | Synthetic order IDs (`MC-QA-*`) short-circuit handlers and return in-memory mocks from `lib/invoice-test-fixtures.ts`. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-02** | Production Test Interceptors | `app/api/admin/orders/[id]/invoice-pdf/route.ts#L65-L70` | Intercepts `MC-QA-*` IDs to render PDFs directly from RAM fixture without touching MongoDB. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-03** | Production Test Interceptors | `app/api/orders/track/route.ts#L32-L37` | Intercepts `MC-QA-*` IDs and returns synthetic tracking payload. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-04** | Production Test Interceptors | `app/api/orders/[id]/route.ts#L27-L44` | Intercepts `MC-QA-ISOLATED-STANDARD` and `MC-QA-ISOLATED-MULTIPAGE` to return `QA_STANDARD_FIXTURE`. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-05** | Production Test Interceptors | `app/api/orders/route.ts#L267-L310` | Intercepts `MC-QA-*` IDs in `PATCH` method to update fixtures in RAM. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-06** | Storefront Checkout | `lib/context/OrderContext.tsx#L376-L383` | `createOrder` strips `priceOnRequest` and `pricingStatus` when mapping items for `POST /api/orders`. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-07** | Order Persistence | `app/api/orders/route.ts#L147-L224` | `POST /api/orders` trusts client price/total, fails to inspect catalog, saving live corals as ₹0 free standard items. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-08** | Order Tracking Security | `app/api/orders/track/route.ts#L172-L176` | `cleanOrderPhone.endsWith(providedPhone)` with length >= 4 unlocks full customer PII, carrier AWB, and line items. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-09** | Legacy API RBAC Bypass | `app/api/orders/route.ts#L244` & `L431` | `PATCH` and `DELETE` use `isAdminRequest(req)`, allowing any logged-in employee to mutate or delete orders. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-10** | Admin Dashboard Mounting | `app/admin/page.tsx#L641-L646` | Active dashboard mounts `ControlOsSales.tsx`. Interactive component `OrdersTab.tsx` is completely orphaned. | **CONFIRMED (ACTIVE)** | **CRITICAL** |
| **DEF-11** | Customer Invoice Access | `app/invoice/[id]/page.tsx#L135-L148` | Imposes hostile 64-character token prompt without delivering tokens in WhatsApp or tracking links. | **CONFIRMED (ACTIVE)** | **HIGH** |
| **DEF-12** | State Machine Discrepancy | `app/api/orders/route.ts` vs `app/api/admin/orders/route.ts` vs `dispatch/route.ts` | Conflicting progression logic: one allows skipping 0 steps, one allows skipping 2 steps, one has no check. | **CONFIRMED (ACTIVE)** | **HIGH** |
| **DEF-13** | Premature Revision Numbering | `app/api/admin/orders/[id]/por-pricing/route.ts#L250` | Appends `-R1` to invoice numbers upon initial POR resolution instead of establishing the baseline. | **CONFIRMED (ACTIVE)** | **MEDIUM** |
| **DEF-14** | Master Catalog Immutability | `app/api/admin/orders/[id]/por-pricing/route.ts#L228` | Checks whether order price updates mutate `ProductModel` or catalog files. | **CONFIRMED SECURE (PASS)** | **INFO** |
| **DEF-15** | Invoice Legal Heading | `lib/invoice-pdf-template.tsx#L587` | Checks whether document heading is permanently `INVOICE & DISPATCH MANIFEST` without `TAX INVOICE` fallback. | **CONFIRMED SECURE (PASS)** | **INFO** |

---

## 3. ACTIVE DASHBOARD COMPONENT MOUNT ANALYSIS

A detailed AST and JSX inspection of [`app/admin/page.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/admin/page.tsx) confirms which components are live in production versus which are unreferenced dead code:

### 3.1 Actively Mounted Components in `app/admin/page.tsx`
```tsx
// Lines 638-700 of app/admin/page.tsx:
{activeTab === 'overview' && <ControlOsOverview ... />}
{(activeTab === 'sales' || activeTab === 'crm') && <ControlOsSales ... />}
{activeTab === 'catalog' && <ControlOsCatalog ... />}
{activeTab === 'worlds' && <ControlOsWorlds />}
{activeTab === 'operations' && <ControlOsOperations ... />}
{activeTab === 'content' && <ControlOsContent ... />}
{activeTab === 'analytics' && <ControlOsAnalytics ... />}
{activeTab === 'employees' && <ControlOsEmployees ... />}
{activeTab === 'system' && <ControlOsSystem ... />}
```

### 3.2 Orphaned Components in `components/admin/tabs/`
- **`components/admin/tabs/OrdersTab.tsx` (1,061 lines):**
  Contains:
  - Full POR agreed pricing modal (`handleSavePorPricing`).
  - Validation for `agreedUnitPrice > 0`.
  - Live recalculation preview.
  - Integration with `useInvoicePdfShare` for native mobile WhatsApp PDF delivery.
  - **Mount Status:** **100% UNREFERENCED**. Not imported anywhere in `app/admin/page.tsx` or any other active route.
- **`components/admin/ControlOsSales.tsx` (1,229 lines):**
  Mounted for the `sales` and `crm` tabs.
  - Displays orders table, enquiry pipeline, and customer 360 dossiers.
  - Table row action for orders:
    ```tsx
    // Line 265 of ControlOsSales.tsx:
    <a href={`/invoice/${o.id}`} target="_blank" className="text-cyan-400 hover:underline">
      Invoice ↗
    </a>
    ```
  - **Mount Status:** **LIVE IN PRODUCTION**.
  - **Defect:** Has zero input controls, buttons, or modals for POR pricing, and zero WhatsApp PDF sharing hooks.

---

## 4. INVENTORY OF SYNTHETIC QA TEST INTERCEPTORS

Five production API route handlers contain hardcoded branching logic for synthetic test IDs (`MC-QA-*`):

### 4.1 Route: `app/api/admin/orders/[id]/por-pricing/route.ts`
- **Lines 34–146:** 112 lines of code executing against `lib/invoice-test-fixtures.ts`.
- **Target IDs:** `MC-QA-ISOLATED-STANDARD`, `MC-QA-ISOLATED-MULTIPAGE`, `MC-QA-POR-FIXTURE`, `MC-QA-FINANCIAL-RECON`.
- **Mechanism:** Updates fixture in Node.js heap memory (`saveFixture(orderId, updatedFixture)`). Does not touch Mongoose or MongoDB.

### 4.2 Route: `app/api/admin/orders/[id]/invoice-pdf/route.ts`
- **Lines 63–80:** Checks if `orderId` starts with `MC-QA-` or matches the 6 synthetic test fixtures.
- **Mechanism:** Imports fixture from `lib/invoice-test-fixtures.ts` and renders PDF directly using `renderToBuffer(<InvoicePdfDocument order={fixture} />)`. Zero database queries.

### 4.3 Route: `app/api/orders/track/route.ts`
- **Lines 30–80:** Checks if `normalizedId` matches any of the 6 synthetic fixture IDs.
- **Mechanism:** Returns synthetic order status history and manifest without validating against MongoDB.

### 4.4 Route: `app/api/orders/[id]/route.ts`
- **Lines 26–44:** Checks if `orderId` is `MC-QA-ISOLATED-STANDARD` or `MC-QA-ISOLATED-MULTIPAGE`.
- **Mechanism:** Returns `QA_STANDARD_FIXTURE` directly from RAM.

### 4.5 Route: `app/api/orders/route.ts` (PATCH)
- **Lines 265–310:** Checks if `orderId` matches `MC-QA-*`.
- **Mechanism:** Updates `currentStep`, `awbNumber`, and `courierName` inside `lib/invoice-test-fixtures.ts`.

---

## 5. LIVE MONGODB ATLAS PRODUCTION DATA AUDIT

A read-only inspection of the production database confirms real-world customer impact:

### Order `MC-740020EJ`
- **Customer:** Debabrata Halder (Kolkata)
- **Items:** `rainbow-chalice-coral` (Ultra Grade, Qty: 1), `acropora-tenuis-ultra` (Qty: 1)
- **Storefront Catalogue Specification:** Both products are marked `priceOnRequest: true` in `lib/data/marine-life.ts`.
- **Actual Document in MongoDB Atlas `orders` Collection:**
  ```json
  {
    "id": "MC-740020EJ",
    "customerName": "Debabrata Halder",
    "phone": "98300XXXXX",
    "subtotal": 0,
    "totalAmount": 0,
    "hasUnresolvedPorItems": false,
    "pricingStatus": "STANDARD",
    "currentStep": "placed",
    "items": [
      {
        "id": "rainbow-chalice-coral",
        "name": "Rainbow Chalice Coral (Ultra Grade)",
        "price": 0,
        "quantity": 1
      }
    ]
  }
  ```
- **Finding:** System treated this order as an ordinary standard order with a total price of ₹0.

### Order `MC-429334LH`
- **Customer:** Subhashis Mukherjee (Salt Lake)
- **Items:** `japanese-deepwater-zoanthids` (Qty: 2)
- **Actual Document in MongoDB:** `hasUnresolvedPorItems: false`, `pricingStatus: "STANDARD"`, `totalAmount: 0`.

---

## 6. CONCLUSION & SPECIFICATION READINESS

All reported P0 vulnerabilities and architectural defects are **100% CONFIRMED ACTIVE** in the codebase.
No fixes have been applied. The application is in an unstable state regarding order financial integrity, public tracking privacy, and legacy API authorization.

We are ready to formulate the technical specifications across deliverables P0-A through P0-G.

