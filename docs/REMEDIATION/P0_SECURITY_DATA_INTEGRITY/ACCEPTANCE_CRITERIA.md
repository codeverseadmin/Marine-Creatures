# MARINE CREATURES — P0 REMEDIATION
## FORMAL ACCEPTANCE CRITERIA & VERIFICATION PROTOCOL

**Document ID:** `MC-REM-P0-010`  
**Date:** November 6, 2026  
**Auditor/Architect:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Domain:** Quality Assurance, Security Sign-Off & Production Readiness  
**Status:** SPECIFICATION APPROVED FOR REMEDIATION  

---

## 1. ACCEPTANCE PROTOCOL & PASS CRITERIA

Before any change can be signed off as production-ready, it must satisfy explicit, unambiguous verification criteria.
Acceptance is governed by three strict conditions:
1. **Zero Production Mocking:** All tests must pass against a real MongoDB database instance. Tests relying on hardcoded `MC-QA-*` interceptors will be rejected.
2. **Zero Functional Regressions:** All existing storefront browsing, enquiry submission, client project portfolio display, and employee authentication functions must remain 100% operational.
3. **Preservation of Baseline Modifications:** The 8 unstaged files containing the tagline *"BRINGING OCEAN AT YOUR DOORSTEP"* must remain completely unregressed.

---

## 2. P0 ITEM ACCEPTANCE CRITERIA SPECIFICATIONS

---

### P0-A: REMOVE PRODUCTION QA INTERCEPTORS

#### Item Details:
- **Source Files:**
  - `app/api/admin/orders/[id]/por-pricing/route.ts#L34-L146`
  - `app/api/admin/orders/[id]/invoice-pdf/route.ts#L63-L80`
  - `app/api/orders/track/route.ts#L30-L80`
  - `app/api/orders/[id]/route.ts#L26-L44`
  - `app/api/orders/route.ts#L265-L310`
- **Defect Status:** **CONFIRMED ACTIVE.**
- **Business Impact:** Masked critical production failures; tests passed 117/117 while live system failed.
- **Security Impact:** Backdoor attack surface; potential memory leak via growing RAM maps.
- **Proposed Correction:** Purge all synthetic interceptor blocks. Require all queries to execute against MongoDB.
- **Dependencies:** Relocate test fixtures into `scripts/` test harnesses.
- **Regression Risks:** Legacy synthetic test script `scripts/test-invoice-pdf-flow.mjs` will fail until updated to use real test DB.

#### Testable Acceptance Criteria:
- [ ] **AC-A.1:** A global code search across `app/api/**/*` yields **zero** instances of `MC-QA-ISOLATED-STANDARD`, `MC-QA-POR-FIXTURE`, `getFixture`, or `saveFixture`.
- [ ] **AC-A.2:** Sending an HTTP request with `id: MC-QA-POR-FIXTURE` to any endpoint returns HTTP 404 (or operates on real DB if seeded), with zero memory fixture interception.
- [ ] **AC-A.3:** Production route bundles in `.next/server` do not contain `invoice-test-fixtures.ts`.

---

### P0-B: REPAIR CHECKOUT DATA INTEGRITY

#### Item Details:
- **Source Files:**
  - `lib/context/OrderContext.tsx#L376-L383`
  - `components/cart/CartDrawer.tsx#L120-L135`
  - `app/api/orders/route.ts#L147-L224`
  - `models/Order.ts#L124-L180`
- **Defect Status:** **CONFIRMED ACTIVE.**
- **Business Impact:** High-value corals (₹25,000–₹60,000+) stored in MongoDB as ₹0 free orders.
- **Security Impact:** Client price tampering vulnerability.
- **Proposed Correction:** Preserve `priceOnRequest` in frontend; enforce server-side catalog lookup in `POST /api/orders`; mandate `pricingStatus: 'PENDING_POR'` and `hasUnresolvedPorItems: true`.
- **Dependencies:** Catalogue resolution helper.
- **Regression Risks:** Storefront checkout could reject items if product IDs in data files do not match.

#### Testable Acceptance Criteria:
- [ ] **AC-B.1:** When a customer checks out with `rainbow-chalice-coral` (a POR item), the persisted MongoDB document contains:
  - `items[0].price === 0`
  - `items[0].priceOnRequest === true`
  - `items[0].pricingStatus === 'PENDING_POR'`
  - `order.hasUnresolvedPorItems === true`
  - `order.pricingStatus === 'PRICE_ON_REQUEST'`
  - `order.totalAmount === 0`
- [ ] **AC-B.2:** If a malicious user intercepts the checkout POST request and changes `price: 1` on a ₹32,000 product, the server rejects the price and enforces ₹32,000.
- [ ] **AC-B.3:** An order containing unresolved POR items cannot be marked approved (`isApproved = true`) until all POR items have an agreed price.
- [ ] **AC-B.4:** Updating an agreed price on an order updates `order.items[n].agreedUnitPrice` and **NEVER** alters static catalog files or `ProductModel`.

---

### P0-C: SECURE CUSTOMER ORDER TRACKING

#### Item Details:
- **Source Files:**
  - `app/api/orders/track/route.ts#L172-L176`
- **Defect Status:** **CONFIRMED ACTIVE.**
- **Business Impact:** Data privacy violation; exposes customer names, addresses, and purchases.
- **Security Impact:** Critical PII disclosure; brute-forceable in under 10,000 requests.
- **Proposed Correction:** Remove 4-digit suffix check. Public queries return minimal stage and masked name. Authorized manifest requires verified `mct_` tracking token. Customer tracking strictly surrenders zero financial, pricing, or invoice data.
- **Dependencies:** Scoped `mct_` tracking token issuance.
- **Regression Risks:** None.

#### Testable Acceptance Criteria:
- [ ] **AC-C.1:** Requesting `/api/orders/track?id=MC-XXXXXX` without token returns Public Minimal Schema:
  - Customer name is masked (e.g., `D**** H****`).
  - Total financial amount and unit prices are completely omitted.
  - Courier flight and AWB tracking numbers are completely hidden.
  - Invoices and invoice links are completely absent.
- [ ] **AC-C.2:** Requesting `/api/orders/track?id=MC-XXXXXX&phone=3603` (matching last 4 digits) **REJECTS** detailed manifest and returns only Public Minimal Schema.
- [ ] **AC-C.3:** Requesting `/api/orders/track?id=MC-XXXXXX&token=mct_valid_token` **AUTHORIZES** detailed physical shipment telemetry:
  - Discloses carrier flight, courier name, and live AWB number.
  - Discloses cargo specimen names and quantities.
  - **Zero financial amounts, zero unit prices, zero subtotals, zero invoice tokens, and zero invoice links** are returned in the payload.
- [ ] **AC-C.4:** Rate limiting blocks any IP exceeding 5 failed tracking attempts per 15 minutes.

---

### P0-D: STRICT ADMINISTRATIVE INVOICE ACCESS & PUBLIC ROUTE DECOMMISSIONING

#### Item Details:
- **Source Files:**
  - `app/invoice/[id]/page.tsx`
  - `app/api/orders/[id]/route.ts`
  - `app/api/admin/orders/[id]/invoice-pdf/route.ts`
  - `lib/invoice-pdf-template.tsx#L587`
- **Defect Status:** **CONFIRMED ACTIVE.**
- **Business Impact:** Invoices were exposed to public customers and third parties via public URLs.
- **Security Impact:** Leaks commercial margins, business tax status, and internal dispatch manifests.
- **Proposed Correction:** Decommission public `/invoice/[id]` web route. Decommission public invoice token endpoints. Restrict all invoice viewing, generation, and PDF downloading exclusively to authenticated Admin Control OS under granular RBAC (`invoices.view`, `invoices.generate`, `invoices.download`, `invoices.revise`, `invoices.revoke`).
- **Dependencies:** Granular RBAC permissions in `lib/rbac/permissions.ts`.
- **Regression Risks:** Any third-party bookmarks to `/invoice/[id]` will return 404 or redirect.

#### Testable Acceptance Criteria (11 Mandatory Invoicing Security Tests):
- [ ] **AC-D.1 (Anonymous Access Denied):** Anonymous unauthenticated requests to `/api/admin/orders/[id]/invoice-pdf` or `/invoice/[id]` are strictly rejected (HTTP 401/404) with zero financial disclosure.
- [ ] **AC-D.2 (Tracking Token Isolation):** Presenting a valid customer tracking token (`mct_...`) to any invoice endpoint returns HTTP 403 Forbidden. Tracking tokens cannot unlock invoices.
- [ ] **AC-D.3 (Customer Generation Blocked):** Customers have zero ability to trigger invoice generation; generation is strictly gated behind authenticated admin session.
- [ ] **AC-D.4 (Customer Download Blocked):** Customers cannot download PDF invoices through any public API or storage URL.
- [ ] **AC-D.5 (RBAC invoices.view):** An employee session lacking `invoices.view` receives HTTP 403 when attempting to view invoice billing details in Control OS.
- [ ] **AC-D.6 (RBAC invoices.generate):** An employee session lacking `invoices.generate` receives HTTP 403 when attempting to issue an invoice.
- [ ] **AC-D.7 (RBAC invoices.revise):** Only the Owner (holding `invoices.revise`) can issue an invoice revision (`INV-*-R1`); unauthorized staff receive HTTP 403.
- [ ] **AC-D.8 (Direct PDF RBAC Enforcement):** Direct calls to `GET /api/admin/orders/[id]/invoice-pdf` strictly verify `invoices.download` server-side on every request.
- [ ] **AC-D.9 (Revoked Session Invalidation):** If an employee session is revoked or suspended, all invoice access immediately fails with HTTP 401.
- [ ] **AC-D.10 (Owner Unconditional Authority):** The Owner role bypasses intermediate permission gates and can access, generate, revise, and download all invoices.
- [ ] **AC-D.11 (POR Gating Enforcement):** If an order has unresolved POR items (`pricingLifecycle.allPorAgreed === false`), requesting invoice generation returns HTTP 422: `Cannot generate official invoice: Unresolved POR items exist`.
- [ ] **AC-D.12 (Statutory Header Compliance):** The generated PDF permanently renders `INVOICE & DISPATCH MANIFEST` and never renders `TAX INVOICE`. GSTIN is omitted if unconfigured.

---

### P0-E: ENFORCE GRANULAR RBAC

#### Item Details:
- **Source Files:**
  - `app/api/orders/route.ts#L244` & `L431`
  - `components/admin/ControlOsSales.tsx`
- **Defect Status:** **CONFIRMED ACTIVE.**
- **Business Impact:** Any employee with any active session cookie can edit or delete orders.
- **Security Impact:** Privilege escalation; bypass of least-privilege principles.
- **Proposed Correction:** Replace `isAdminRequest` with `requirePermission(req, '...')`. Implement UI permission gating in `ControlOsSales.tsx`.
- **Dependencies:** `lib/rbac/guard.ts`.
- **Regression Risks:** Legitimate employees lacking `orders.update_status` will be blocked from updating status (intended security behavior).

#### Testable Acceptance Criteria:
- [ ] **AC-E.1:** Sending `PATCH /api/orders` with an employee session lacking `orders.update_status` returns HTTP 403 Forbidden.
- [ ] **AC-E.2:** Sending `DELETE /api/orders` with an employee session lacking `orders.delete` returns HTTP 403 Forbidden.
- [ ] **AC-E.3:** In `ControlOsSales.tsx`, employees without `orders.por_price.set` do not see the `Set Agreed Price` button.
- [ ] **AC-E.4:** Every authorized mutation logs an audit event in `AuditLog` containing employee ID, timestamp, prior state, and action.

---

### P0-F: UNIFY ORDER STATE TRANSITIONS

#### Item Details:
- **Source Files:**
  - `app/api/orders/route.ts`
  - `app/api/admin/orders/route.ts`
  - `app/api/admin/operations/dispatch/route.ts`
- **Defect Status:** **CONFIRMED ACTIVE.**
- **Business Impact:** Marine life can be dispatched without completing quarantine.
- **Security Impact:** Inconsistent state machines create race conditions and bypasses.
- **Proposed Correction:** Build unified `lib/orders/state-machine.ts`. Enforce linear progression: `placed` -> `quarantine` -> `packed` -> `dispatched` -> `delivered`.
- **Dependencies:** Shared state machine utility.
- **Regression Risks:** Workflows attempting to jump from `placed` straight to `packed` will be rejected.

#### Testable Acceptance Criteria:
- [ ] **AC-F.1:** Updating an order from `placed` to `packed` across ANY endpoint returns HTTP 400 `Invalid state transition: Intermediate quarantine stage cannot be skipped`.
- [ ] **AC-F.2:** Updating an order from `placed` to `delivered` via `/api/admin/operations/dispatch` returns HTTP 400.
- [ ] **AC-F.3:** Orders containing `category: 'marine-life'` require quarantine notes before transitioning to `packed`.
- [ ] **AC-F.4:** Marking an order `delivered` transitions the order to terminal state; subsequent modifications are rejected unless Owner permission is provided.

---

### P0-G: DATA RECOVERY AND BACKWARD COMPATIBILITY

#### Item Details:
- **Source Files:**
  - `scripts/audit-orders-por-status.mjs`
  - `scripts/reconcile-por-metadata.mjs`
- **Defect Status:** **CONFIRMED ACTIVE.**
- **Business Impact:** Real customer orders `MC-740020EJ` and `MC-429334LH` stranded at ₹0.
- **Security Impact:** Financial discrepancies in revenue records.
- **Proposed Correction:** Run dry-run audit; execute atomic `$set` script to mark `hasUnresolvedPorItems: true`; allow concierge to input agreed prices via UI.
- **Dependencies:** Control OS POR modal integration.
- **Regression Risks:** Zero data loss; dry-run creates backup prior to execution.

#### Testable Acceptance Criteria:
- [ ] **AC-G.1:** Executing `scripts/reconcile-por-metadata.mjs` updates `MC-740020EJ` and `MC-429334LH` to `hasUnresolvedPorItems: true` without overwriting customer names, addresses, or phone numbers.
- [ ] **AC-G.2:** Neither script automatically invents or infers prices. Total remains ₹0 until concierge enters agreed prices.
- [ ] **AC-G.3:** Reconciled orders appear in Control OS Sales Queue with the Amber `POR Price Required` badge.
- [ ] **AC-G.4:** An audit log entry `SYSTEM_RECONCILIATION_FLAGGED` is created for every reconciled order.

