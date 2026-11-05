# MARINE CREATURES — END-TO-END HEALTH AUDIT
## DELIVERABLE 6: TEST SUITE & VERIFICATION QUALITY REPORT

**Audit Date:** November 6, 2026  
**Auditor:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Audit Target:** Verification Harnesses, Synthetic Fixture Interceptors, Test Isolation & Production Divergence  
**Audit Status:** AUDIT COMPLETE — ROOT CAUSE OF "100% PASSING TESTS VS BROKEN PRODUCTION" IDENTIFIED  

---

## 1. EXECUTIVE SUMMARY & VERDICT

A primary objective of this audit was to resolve the paradox confronting leadership:  
*How could an automated verification suite report 117 out of 117 passing tests across invoice generation, POR pricing, multi-page layout, and WhatsApp delivery, while the business owner discovered during live manual testing that POR pricing and invoice workflows were completely dysfunctional in production?*

### Audit Verdict: **CRITICAL QUALITY DEFECT (SYNTHETIC FIXTURE DECEPTION)**
The test suite (`scripts/test-invoice-pdf-flow.mjs`) achieved a 100% pass rate because **production API routes were modified to include hardcoded synthetic interceptors that short-circuit and bypass MongoDB and real application data models entirely**.
- Over **300 lines of production API code** across 4 critical endpoints exist solely to intercept requests starting with `MC-QA-*` and return static in-memory data structures from `lib/invoice-test-fixtures.ts`.
- The tests verified that synthetic in-memory objects could be transformed into PDFs and updated in RAM.
- **Zero tests executed the storefront cart checkout.**
- **Zero tests queried or saved documents to MongoDB.**
- **Zero tests verified that the Admin UI mounted the required components.**
As a direct consequence, every defect identified in this audit—storefront attribute stripping, orphaned admin modals, 4-digit phone suffix data leaks, and legacy RBAC bypasses—sailed through CI/CD completely undetected.

---

## 2. FORENSIC DISSECTION OF THE SYNTHETIC INTERCEPTOR ARCHITECTURE

We uncovered hardcoded interceptor blocks across four production Next.js API routes:

### Interceptor 1: `/api/admin/orders/[id]/por-pricing/route.ts`
- **Lines 34–146 (112 lines of production code!):**
  ```typescript
  // ── Synthetic QA Fixture Interceptor (Zero DB Mutation) ──────────────────
  if (
    orderId === 'MC-QA-ISOLATED-STANDARD' ||
    orderId === 'MC-QA-ISOLATED-MULTIPAGE' ||
    orderId === 'MC-QA-POR-FIXTURE' ||
    orderId === 'MC-QA-FINANCIAL-RECON'
  ) {
    const { getFixture, saveFixture, resetAllFixtures } = await import('@/lib/invoice-test-fixtures');
    ...
    // Updates fixture in JavaScript Map in RAM
    saveFixture(orderId, updatedFixture);
    return NextResponse.json({ success: true, data: updatedFixture });
  }
  // Real MongoDB code only runs below line 148!
  ```

### Interceptor 2: `/api/admin/orders/[id]/invoice-pdf/route.ts`
- **Lines 22–58:**
  ```typescript
  if (
    orderId === 'MC-QA-ISOLATED-STANDARD' ||
    orderId === 'MC-QA-ISOLATED-MULTIPAGE' ||
    orderId === 'MC-QA-POR-FIXTURE' ||
    orderId === 'MC-QA-FINANCIAL-RECON'
  ) {
    const { getFixture } = await import('@/lib/invoice-test-fixtures');
    const fixture = getFixture(orderId);
    // Directly renders PDF from RAM fixture without touching MongoDB!
    const buffer = await renderToBuffer(<InvoicePdfDocument order={fixture} />);
    return new NextResponse(buffer, { headers: { 'Content-Type': 'application/pdf' } });
  }
  ```

### Interceptor 3: `/api/orders/track/route.ts`
- **Lines 41–75:**
  ```typescript
  if (orderId.startsWith('MC-QA-')) {
    const { getFixture } = await import('@/lib/invoice-test-fixtures');
    const fixture = getFixture(orderId);
    // Returns synthetic tracking without querying MongoDB
  }
  ```

### Interceptor 4: `/api/orders/route.ts` (PATCH)
- **Lines 265–310:**
  ```typescript
  if (orderId.startsWith('MC-QA-')) {
    // Updates RAM fixture directly
  }
  ```

---

## 3. WHY AUTOMATED TESTS PASSED WHILE PRODUCTION FAILED

The following table contrasts what the test suite validated versus what occurs in the live application:

| Dimension | What Automated Test Suite (`test-invoice-pdf-flow.mjs`) Tested | What Actually Happens in Live Production Application |
|---|---|---|
| **Data Persistence** | JavaScript `Map<string, any>` in Node.js process memory (`lib/invoice-test-fixtures.ts`). | MongoDB Atlas `orders` collection via Mongoose ODM. |
| **POR Flagging** | Synthetic fixture was manually hardcoded with `priceOnRequest: true`, `hasUnresolvedPorItems: true`, `pricingStatus: 'PENDING_POR'`. | Storefront checkout completely drops `priceOnRequest`, saving real orders as `price: 0`, `hasUnresolvedPorItems: false`, `pricingStatus: 'STANDARD'`. |
| **Admin UI Interaction** | Never tested. Raw HTTP POST requests were sent via Node.js `http.request`. | Active dashboard (`ControlOsSales.tsx`) has no UI controls; component with controls (`OrdersTab.tsx`) is completely orphaned. |
| **Customer Token Verification** | Tested synthetic token verification against in-memory fixture. | Real customer is given an invoice URL without a token and blocked by a 64-character token gate. |
| **Concurrency Validation** | Tested optimistic concurrency on in-memory object properties. | Real orders in MongoDB never experienced concurrency because the UI to submit prices did not exist. |
| **PDF Formatting & Layout** | Validated PDF binary streams and layout bounds on synthetic data. | PDF engine works, but real orders render with ₹0 totals because real POR prices were never captured. |

---

## 4. RISKS OF "MOCKED-IN-PRODUCTION" ARCHITECTURE

Polluting production API route handlers with synthetic test interceptors creates severe operational risks:

1. **Dead Weight & Complexity:** Hundreds of lines of dead code executing branching checks on every customer request in production.
2. **False Safety Signals:** Engineering and management were assured that the system had "100% test coverage" and "complete resilience," delaying discovery of critical bugs until owner acceptance testing.
3. **Security Vulnerability Surface:** If an attacker discovers that an ID like `MC-QA-*` triggers hardcoded RAM fixtures, they can probe and abuse the system without leaving MongoDB audit traces.
4. **Maintenance Nightmare:** Any schema change to `models/Order.ts` requires updating both the Mongoose schema AND the parallel synthetic fixture engine in `lib/invoice-test-fixtures.ts`.

---

## 5. REQUIRED TESTING TRANSFORMATION ROADMAP

To transition from synthetic mocks to enterprise-grade verification:

1. **Purge Production Interceptors:**
   - Completely remove `if (orderId.startsWith('MC-QA-'))` blocks from all production API handlers (`app/api/**/*`).
   - Production routes must only interact with MongoDB.
2. **Implement Isolated Test Database Harness:**
   - Configure a dedicated MongoDB test database or `mongodb-memory-server` for test scripts.
   - Tests must create real Mongoose documents, execute real pre-save middleware, and trigger real validation errors.
3. **End-to-End Storefront Integration Tests:**
   - Author Playwright or Puppeteer E2E tests simulating real user actions:
     - User visits `/product/rainbow-chalice-coral` (a POR item).
     - User clicks "Add to Cart".
     - User checks out in `CartDrawer.tsx`.
     - Test queries MongoDB to assert `order.hasUnresolvedPorItems === true`.
     - Admin logs in, opens Sales Queue, enters agreed price ₹25,000, and verifies recalculated total and PDF generation.

