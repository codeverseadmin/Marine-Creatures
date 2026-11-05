# MARINE CREATURES — END-TO-END ORDER, INVOICE & FULFILMENT HEALTH AUDIT
## Document 1: Executive Health Report

**Audit Type:** Independent Technical & Functional Health Audit  
**Target:** Order Placement, POR Quotation Pricing, Invoice PDF Generation, WhatsApp Dispatch & Fulfilment Workflow  
**Auditor:** Principal Software Architect, Application Security Engineer & Systems Auditor  
**Date:** November 6, 2026  
**Status:** COMPLETE — READ-ONLY AUDIT (ZERO CODE OR DATABASE MUTATIONS)  
**HEAD Commit:** `ffd220da7586e557c1a176448afdc2c691486265` on branch `main`

---

## 1. Executive Summary & Core Verdict

A rigorous, line-by-line inspection of the Marine Creatures codebase, production database collections, API handlers, client-side React contexts, and admin control panels reveals a critical systemic dichotomy:

> **Core Verdict:** The backend libraries for PDF rendering (`@react-pdf/renderer`), token hashing, and POR revision data structures are technically sound, but **the end-to-end order-to-invoice workflow in the live application is severely disconnected**. 
> Automated tests reported 100% pass rates (117/117) because test suites exercised hardcoded in-memory synthetic interceptors (`MC-QA-*`), while the actual user-facing code paths (`CartDrawer`, `OrderContext`, and `ControlOsSales`) bypass these mechanisms, strip required data, or lack user interface controls entirely.

As a direct consequence, the founder's observations during application testing are **100% confirmed and technically validated**. In the actual live storefront and admin dashboard:
1. Customers can order ₹0 Price on Request (POR) specimens; however, the storefront client **strips the `priceOnRequest` flag** and saves the order in MongoDB with `hasUnresolvedPorItems: false`, `pricingStatus: "STANDARD"`, and `price: 0`.
2. The active Admin Dashboard (`ControlOsSales.tsx`) **contains zero UI elements, modals, or buttons for POR pricing**. The comprehensive POR modal implementation in `components/admin/tabs/OrdersTab.tsx` is **completely orphaned and never imported or rendered anywhere in the application**.
3. Attempting to generate an invoice PDF for unpriced orders from the web invoice viewer fails with an unhandled `400 Bad Request` or renders a `₹0` document, leaving the founder with no administrative mechanism to price the order or generate a valid invoice.
4. The public tracking API contains a **critical security vulnerability**: providing any 4 digits matching the end of a customer's phone number unlocks the full shipment manifest, carrier AWB, line items, and financial totals.
5. Legacy API routes (`/api/orders`) bypass the newly deployed RBAC permission system, permitting any authenticated admin session (regardless of employee role) to delete orders or advance steps.

---

## 2. Health Rating by Operational Subsystem

| Subsystem | Health Status | Critical Findings | Production Impact |
|:---|:---:|:---|:---|
| **Customer Checkout** | ⚠️ **PARTIAL** | Client computes totals without server-side recalculation; strips `priceOnRequest` flag on submission. | Orders save in DB with ₹0 items marked as standard products. |
| **POR Pricing Engine (API)** | ✅ **PASS** | `POST /api/admin/orders/[id]/por-pricing` has concurrency locking, validation, and audit logging. | Sound backend API; blocked only by lack of UI integration. |
| **POR Pricing Interface (UI)** | ❌ **FAIL** | Active admin route renders `ControlOsSales.tsx`, which has **zero** POR inputs. `OrdersTab.tsx` is completely orphaned. | Founder cannot price orders through the dashboard. |
| **Invoice PDF Generation** | ⚠️ **PARTIAL** | Backend `@react-pdf/renderer` engine is pixel-perfect and compliant (`INVOICE & DISPATCH MANIFEST`), but customer view fails with 401 when attempting to share PDF. | Admin can view web HTML, but customer share triggers 401 Unauthorized. |
| **WhatsApp PDF Sharing** | ⚠️ **PARTIAL** | Mobile relies on OS `navigator.share` (cannot prefill recipient chat); desktop downloads PDF and opens chat (requires manual file attachment). | Works within browser sandbox constraints; cannot auto-attach on desktop. |
| **Quarantine & Fulfilment** | ⚠️ **PARTIAL** | State transitions allow skipping intermediate stages (e.g. `placed` directly to `packed` or `dispatched`). No validation on `/api/admin/operations/dispatch`. | Orders can bypass mandatory biological quarantine. |
| **Customer Order Tracking** | ❌ **FAIL (SECURITY)** | Endpoint `/api/orders/track` accepts arbitrary 4-digit phone suffixes to unlock complete manifest and financials. | Direct customer PII and shipment data exposure vulnerability. |
| **Employee RBAC Enforcement** | ⚠️ **PARTIAL** | Fine-grained checks exist on `/api/admin/*`, but `/api/orders` retains legacy `isAdminRequest` bypass. Frontend UI has zero role gating. | Employees can bypass role barriers via legacy routes. |
| **Automated Test Quality** | ❌ **FAIL (DECEPTIVE)** | 117 tests pass against hardcoded mock branches (`MC-QA-*`), never touching MongoDB or the React UI. | False confidence masking broken production workflows. |

---

## 3. Top 5 Critical Defects Demanding Immediate Remediation

### Defect 1: Orphaned OrdersTab Component & Missing POR UI (P0)
* **Evidence:** [app/admin/page.tsx](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/admin/page.tsx#L641-L646) imports and renders `<ControlOsSales />`. In contrast, [components/admin/tabs/OrdersTab.tsx](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/admin/tabs/OrdersTab.tsx#L25) (which contains the complete modal for entering agreed POR prices, recalculating totals, and sharing PDFs) is not imported anywhere in the repository.
* **Root Cause:** A refactor to "Control OS" created `ControlOsSales.tsx` with a simplified table that omitted the POR modal, status badges, and PDF dispatch workflow, leaving the working implementation stranded in an unrendered file.
* **Impact:** The administrator cannot input agreed prices for Price on Request specimens from the dashboard.

### Defect 2: Storefront Cart Strips POR Metadata on Submission (P0)
* **Evidence:** [lib/context/OrderContext.tsx](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/context/OrderContext.tsx#L376-L383) maps cart items to `{ id, name, price, quantity, image, category }` when calling `POST /api/orders`. The fields `priceOnRequest` and `pricingStatus` are omitted. In MongoDB, [models/Order.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/models/Order.ts#L141) defaults `hasUnresolvedPorItems: false` and `pricingStatus: 'STANDARD'`.
* **Root Cause:** Live database inspection of real orders (e.g., `MC-740020EJ`) proved that items like `Cinnamon Tomato Clownfish` are stored with `price: 0`, `priceOnRequest: false`, and `hasUnresolvedPorItems: false`.
* **Impact:** POR specimens are recorded as free items (₹0) and appear on web invoices without requiring pricing approval.

### Defect 3: Public Tracking API Information Disclosure via 4-Digit Phone Suffix (P0 Security)
* **Evidence:** [app/api/orders/track/route.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts#L172-L176) grants full authorized access (`isAuthorizedForManifest = true`) if `providedPhone.length >= 4 && cleanOrderPhone.endsWith(providedPhone)`.
* **Root Cause:** Insecure phone suffix authentication permits anyone who knows or guesses the last 4 digits of a customer's phone number to view exact specimen names, quantities, unit prices, subtotal, total spend, carrier name, and sensitive air cargo AWB tracking numbers.
* **Impact:** Direct breach of customer privacy and commercial consignment security.

### Defect 4: Test Suite Relies on Synthetic Interceptors That Bypass MongoDB (P1)
* **Evidence:** [app/api/admin/orders/[id]/invoice-pdf/route.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/orders/%5Bid%5D/invoice-pdf/route.ts#L64-L115), [app/api/admin/orders/[id]/por-pricing/route.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/orders/%5Bid%5D/por-pricing/route.ts#L35-L146), and [app/api/orders/track/route.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts#L31-L119) all contain explicit `if (orderId === 'MC-QA-*')` intercepts returning static in-memory fixtures.
* **Root Cause:** The test script [scripts/test-invoice-pdf-flow.mjs](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/scripts/test-invoice-pdf-flow.mjs#L1-L14) only targets `MC-QA-*` fixtures. It never tested saving an order to MongoDB, retrieving it, pricing it in the database, or rendering an invoice from real database state.
* **Impact:** 117 tests reported green while production code was broken.

### Defect 5: Legacy API Routes Bypass RBAC and State Machine Guards (P1)
* **Evidence:** [app/api/orders/route.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/route.ts#L244) uses legacy `isAdminRequest(req)` for `PATCH` and `DELETE`. It does not check fine-grained employee permissions (`orders.update_status`, `orders.approve`, or `orders.delete`). Furthermore, its transition check allows skipping steps differently than `/api/admin/orders`.
* **Root Cause:** Parallel API routes exist: `/api/orders` (legacy customer/storefront) and `/api/admin/orders` (RBAC). Both accept PATCH requests, creating conflicting validation rules and security loopholes.
* **Impact:** Suspended employees or staff without approval permissions can manipulate orders via legacy endpoints.

---

## 4. What Genuinely Works in the Application

Despite the integration fractures, several foundational modules have been implemented with exceptional craftsmanship:
1. **Invoice PDF Renderer:** The React-PDF template in [lib/invoice-pdf-template.tsx](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/invoice-pdf-template.tsx) produces clean, professional A4 PDF documents with correct typography, table pagination, and dynamic headers. The document title is strictly fixed to `INVOICE & DISPATCH MANIFEST` and never outputs `TAX INVOICE`.
2. **Backend POR Pricing Handler:** The endpoint [app/api/admin/orders/[id]/por-pricing/route.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/orders/%5Bid%5D/por-pricing/route.ts#L149-L334) correctly validates positive amounts, enforces two-decimal precision, increments `pricingVersion`, snapshots previous invoices into `invoiceRevisions`, and records immutable audit log entries.
3. **Database Schema Architecture:** The Mongoose schema in [models/Order.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/models/Order.ts) contains all required fields for multi-stage tracking, POR status, agreed pricing, and invoice revision archiving.
4. **Token Security Model:** Public invoice viewing utilizes HMAC-SHA256 tokens (`invoiceTokenHash`) preventing unauthenticated URL enumeration when tokens are properly passed.

---

## 5. Business & Commercial Risk Assessment

* **Financial Risk:** Customers ordering POR items receive an order confirmation and WhatsApp message stating `Price on Request (Quarantine/Specimen Confirmation)`, but the database records ₹0. If fulfilled without manual intervention, specimens could be dispatched without payment capture.
* **Operational Gridlock:** Because the admin dashboard lacks pricing controls, the founder must either manually execute raw API calls or modify database records to unblock invoice generation.
* **Legal & Statutory Risk:** No false GSTIN numbers are generated (verified). Invoices accurately state `INVOICE & DISPATCH MANIFEST`. However, displaying ₹0 items on customer invoices presents severe commercial dispute risks.
* **Brand Reputation:** If customers attempt to download or share the PDF from their web invoice link, the interface displays an error banner (`Unable to retrieve invoice PDF (HTTP 401)`), undermining brand trust.

---

## 6. Audit Conclusion & Next Steps

The system does not require a redesign or architectural rewrite. All required backend capabilities, schemas, and PDF generators already exist in the codebase. The immediate priority is **unification and wiring**:
1. Bridge the orphaned POR pricing modal and WhatsApp PDF hook into `ControlOsSales.tsx`.
2. Fix storefront checkout so that POR flags and `hasUnresolvedPorItems` are computed and persisted server-side.
3. Close the phone-suffix tracking security vulnerability.
4. Eliminate legacy duplicate API endpoints.
5. Replace synthetic test interceptors with genuine database integration tests.

Detailed forensic audits and verification matrices follow in Documents 2 through 9.

