# MARINE CREATURES — P0 REMEDIATION
## STEP-BY-STEP IMPLEMENTATION & EXECUTION SEQUENCE

**Document ID:** `MC-REM-P0-009`  
**Date:** November 6, 2026  
**Auditor/Architect:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Scope:** Phased Execution Protocol, Dependency Order, Rollback Checkpoints & Verification Gates  
**Status:** SPECIFICATION APPROVED FOR REMEDIATION  

---

## 1. EXECUTION PHILOSOPHY & CONTROLS

To guarantee zero regression of existing features and ensure continuous system stability, remediation is structured into five sequential phases:

```
  Phase 0: Safety & Baseline Lock
     │
     ▼
  Phase 1: P0 Security & Data Integrity (Stop the bleeding)
     │
     ▼
  Phase 2: P1 Business Workflow Restoration (Make the dashboard functional)
     │
     ▼
  Phase 3: P2 State Machine & Quarantine Unification (Guarantee linear progression)
     │
     ▼
  Phase 4: P3 Synthetic QA Purge & Real Database Verification (Validate everything)
```

Each phase contains:
- Strict **Pre-requisites**.
- Ordered **File Modification List**.
- Automated **Verification Gate**.
- Documented **Rollback Plan**.

---

## 2. PHASE-BY-PHASE IMPLEMENTATION BLUEPRINT

### PHASE 0: Pre-Flight Safety & Baseline Verification
- **Goal:** Lock the clean baseline, verify environment configurations, and guarantee preservation of uncommitted work.
- **Actions:**
  1. Record Git status: Verify exact 8 modified files are untouched.
  2. Create temporary branch or stash checkpoint (without modifying working tree).
  3. Verify MongoDB Atlas connectivity (`npm run test:db` or equivalent read-only probe).
- **Verification Gate:** `git status --short` matches baseline exactly.

---

### PHASE 1: P0 Security & Data Integrity Fixes (Duration: ~2.0 Hours)
- **Goal:** Stop new ₹0 coral orders, close the public tracking vulnerability, and eliminate legacy API privilege escalation.
- **Step 1.1: Storefront Order Creation Data Integrity**
  - **Files to Modify:**
    1. `marine-creatures/lib/context/OrderContext.tsx`
    2. `marine-creatures/components/cart/CartDrawer.tsx`
    3. `marine-creatures/app/api/orders/route.ts`
  - **Execution:**
    - Update `OrderContext.tsx` mapping to preserve `priceOnRequest` and `pricingStatus`.
    - Update `CartDrawer.tsx` to pass `hasUnresolvedPorItems: true` when corals are in cart.
    - Update `POST /api/orders` to look up catalogue prices on the server; reject client price tampering; mark POR items as `PENDING_POR` with `price = 0` and `hasUnresolvedPorItems = true`.
  - **Verification Gate:** Test submitting a simulated coral order via curl/fetch; verify persisted document in MongoDB has `hasUnresolvedPorItems: true` and `pricingStatus: 'PRICE_ON_REQUEST'`.

- **Step 1.2: Order Tracking Authentication Fix**
  - **Files to Modify:**
    1. `marine-creatures/app/api/orders/track/route.ts`
  - **Execution:**
    - Remove `cleanOrderPhone.endsWith(providedPhone)` with length >= 4.
    - Require exact 10-digit phone match (`providedPhone.slice(-10) === cleanOrderPhone.slice(-10)`).
    - Implement IP rate limiting (max 5 failed attempts per 15 min).
  - **Verification Gate:** Verify that 4-digit phone suffixes return the Public Minimal Schema and do NOT disclose AWB or financial manifests.

- **Step 1.3: Eliminate Legacy API RBAC Bypasses**
  - **Files to Modify:**
    1. `marine-creatures/app/api/orders/route.ts`
  - **Execution:**
    - Replace `isAdminRequest(req)` in `PATCH` with `requirePermission(req, 'orders.update_status')`.
    - Replace `isAdminRequest(req)` in `DELETE` with `requirePermission(req, 'orders.delete')`.
    - Replace `isAdminRequest(req)` in `GET` with `requirePermission(req, 'orders.read')`.
  - **Verification Gate:** Test sending `PATCH` and `DELETE` requests with a session cookie of an employee lacking these permissions; verify HTTP 403 Forbidden is returned.

---

### PHASE 2: P1 Business Workflow Restoration (Duration: ~3.0 Hours)
- **Goal:** Reconnect the orphaned admin UI, restore agreed POR pricing, enable WhatsApp PDF dispatch, and fix customer invoice access.
- **Step 2.1: Mount POR Pricing Modal in Control OS**
  - **Files to Modify:**
    1. `marine-creatures/components/admin/ControlOsSales.tsx`
  - **Execution:**
    - Port `handleSavePorPricing` and the interactive modal from `components/admin/tabs/OrdersTab.tsx` into `ControlOsSales.tsx`.
    - Render an Amber `Set Agreed Price` button when `order.hasUnresolvedPorItems === true`.
    - Implement live recalculation preview and optimistic concurrency version checking.
  - **Verification Gate:** Open Admin Sales tab; click `Set Agreed Price`; enter ₹25,000; verify order total updates in UI and persists in MongoDB.

- **Step 2.2: Mount WhatsApp PDF Sharing in Control OS**
  - **Files to Modify:**
    1. `marine-creatures/components/admin/ControlOsSales.tsx`
  - **Execution:**
    - Import and initialize `useInvoicePdfShare` inside `ControlOsSales.tsx`.
    - Add `Share WhatsApp Invoice` action in order rows and details drawer.
    - Handle mobile share sheet and desktop download + `wa.me` fallback.
  - **Verification Gate:** Click `Share WhatsApp Invoice` on desktop; verify PDF downloads with filename `Marine-Creatures-INV-MC-XXXX.pdf` and WhatsApp Web opens with pre-filled message.

- **Step 2.3: Remove Customer Invoice 64-Character Token Barrier**
  - **Files to Modify:**
    1. `marine-creatures/app/invoice/[id]/page.tsx`
  - **Execution:**
    - Permit instant access if valid `?token=` is present in URL.
    - Provide friendly 10-digit phone verification fallback if customer visits without token.
    - Grant automatic bypass for authenticated employees with `orders.read` or `orders.invoice.generate`.
  - **Verification Gate:** Open `/invoice/[id]?token=...` in incognito browser; verify invoice renders cleanly without prompting for manual token entry.

- **Step 2.4: Historical MongoDB Data Reconciliation**
  - **Files to Create & Execute:**
    1. `marine-creatures/scripts/reconcile-por-metadata.mjs`
  - **Execution:**
    - Flag `hasUnresolvedPorItems: true` on orders `MC-740020EJ`, `MC-429334LH`, etc.
    - Backfill missing CSPRNG token hashes.
  - **Verification Gate:** Refresh Control OS Sales tab; verify orders `MC-740020EJ` and `MC-429334LH` appear in the queue awaiting price negotiation.

---

### PHASE 3: P2 State Machine & Quarantine Enforcement (Duration: ~1.5 Hours)
- **Goal:** Unify linear state progression across all routes and require quarantine inspection before packing live specimens.
- **Step 3.1: Create Unified State Machine Service**
  - **Files to Create & Modify:**
    1. `marine-creatures/lib/orders/state-machine.ts` (New shared service)
    2. `marine-creatures/app/api/orders/route.ts`
    3. `marine-creatures/app/api/admin/orders/route.ts`
    4. `marine-creatures/app/api/admin/operations/dispatch/route.ts`
  - **Execution:**
    - Implement `validateOrderStateTransition(order, targetStep, actor, reason)`.
    - Enforce linear sequence: `placed` -> `quarantine` -> `packed` -> `dispatched` -> `delivered`.
    - Reject skipping steps (e.g. `placed` -> `packed` or `placed` -> `delivered`).
  - **Verification Gate:** Test attempting to update an order from `placed` directly to `packed`; verify HTTP 400 rejection.

- **Step 3.2: Mandate Quarantine Health Clearance**
  - **Files to Modify:**
    1. `marine-creatures/models/Order.ts`
    2. `marine-creatures/app/api/admin/operations/quarantine/route.ts`
  - **Execution:**
    - Add `quarantineNotes` and `quarantineClearedAt` to `OrderSchema`.
    - Require non-empty quarantine clearance before transitioning marine livestock to `packed`.
  - **Verification Gate:** Attempt to pack live specimens without quarantine notes; verify rejection.

- **Step 3.3: Fix Premature Invoice Revision Numbering**
  - **Files to Modify:**
    1. `marine-creatures/app/api/admin/orders/[id]/por-pricing/route.ts`
  - **Execution:**
    - Adjust line 250 so that `-R1` is only appended if an invoice was already issued. Initial POR pricing establishes the baseline invoice `INV-MC-XXXX`.
  - **Verification Gate:** Price a new POR order; verify invoice number is `INV-MC-XXXX` (not `INV-MC-XXXX-R1`).

---

### PHASE 4: P3 Synthetic QA Purge & Real Database Verification (Duration: ~2.0 Hours)
- **Goal:** Cleanse production route handlers of test mocks and validate the system with real integration tests.
- **Step 4.1: Purge Hardcoded QA Interceptors from Production**
  - **Files to Modify:**
    1. `marine-creatures/app/api/admin/orders/[id]/por-pricing/route.ts` (Remove lines 34–146)
    2. `marine-creatures/app/api/admin/orders/[id]/invoice-pdf/route.ts` (Remove lines 63–80)
    3. `marine-creatures/app/api/orders/track/route.ts` (Remove lines 30–80)
    4. `marine-creatures/app/api/orders/[id]/route.ts` (Remove lines 26–44)
    5. `marine-creatures/app/api/orders/route.ts` (Remove lines 265–310)
  - **Execution:**
    - Remove all `if (orderId.startsWith('MC-QA-'))` blocks.
    - Ensure routes interact strictly with MongoDB.
  - **Verification Gate:** Run codebase scan; assert 0 occurrences of `MC-QA-` in `app/api`.

- **Step 4.2: Author & Execute Real MongoDB Integration Suite**
  - **Files to Create:**
    1. `marine-creatures/scripts/test-order-flow-real.mjs`
  - **Execution:**
    - Execute all 22 test scenarios specified in `ISOLATED_TEST_STRATEGY.md`.
  - **Verification Gate:** 22 out of 22 scenarios pass against real database documents with 0 failures.

---

## 3. ROLLBACK CONTROLS & CONTINGENCY PROCEDURES

In the event that an unexpected runtime failure occurs during any phase:
1. **Targeted File Reversion:** Since all changes are isolated to specific files, individual files can be reverted cleanly using Git without affecting other components.
2. **Database Rollback:** The metadata reconciliation script creates a JSON snapshot backup before applying changes, allowing instantaneous restoration of original document states.
3. **Preservation of Uncommitted Taglines:** Because the 8 preserved files are never touched, brand styling and copy remain 100% stable throughout remediation.

