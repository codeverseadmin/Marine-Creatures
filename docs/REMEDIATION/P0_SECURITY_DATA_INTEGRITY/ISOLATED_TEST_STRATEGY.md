# MARINE CREATURES — P0 REMEDIATION
## ISOLATED TEST STRATEGY & REAL VERIFICATION SUITE SPECIFICATION

**Document ID:** `MC-REM-P0-008`  
**Date:** November 6, 2026  
**Auditor/Architect:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Domain:** Test Automation, Database Isolation, Security Verification & End-to-End Test Harness  
**Status:** SPECIFICATION APPROVED FOR REMEDIATION  

---

## 1. OBJECTIVE & TESTING REFORM MANDATE

The primary lesson from the November 6, 2026 audit is that **synthetic fixture interceptors embedded within production API routes produce an illusion of 100% test coverage while masking critical production failures**.
This specification mandates a complete reform of test automation:

1. **Zero Production Interceptors:** All `if (orderId.startsWith('MC-QA-'))` blocks must be excised from production routes (`app/api/**/*`). Production routes must execute strictly against MongoDB.
2. **Real Database Isolation:** Tests must run against an isolated MongoDB test database (e.g. `mongodb-memory-server` in CI/CD, or a dedicated staging database `marine_creatures_test` via `MONGODB_TEST_URI`).
3. **Real Model Execution:** All Mongoose schemas, pre-save hooks, validation rules, optimistic concurrency locks, and audit logging helpers must execute in real time.
4. **Zero Customer PII Pollution:** Test suites must never query, touch, or mutate real customer orders (`MC-740020EJ`, `MC-429334LH`, etc.). All test orders must use dynamically generated IDs (e.g. `MC-TEST-${Date.now()}`) and must be cleaned up after execution.

---

## 2. TEST ARCHITECTURE & PYRAMID

```
                       ┌─────────────────────────┐
                       │   E2E Browser Tests     │  (Playwright)
                       │   Cart -> Admin -> PDF  │  ~5 Scenarios
                       ├─────────────────────────┤
                       │   API Security Tests    │  (Supertest / Node Fetch)
                       │   RBAC, Tampering, Token│  ~12 Scenarios
                       ├─────────────────────────┤
                       │  Integration DB Tests   │  (Mongoose + Test DB)
                       │  POR Valuation, States  │  ~15 Scenarios
                       ├─────────────────────────┤
                       │       Unit Tests        │  (Jest / Node Test Runner)
                       │  Tokens, Tax, Formulas  │  ~20 Scenarios
                       └─────────────────────────┘
```

---

## 3. SPECIFICATION OF THE 22 REQUIRED TEST SCENARIOS

We specify all 22 required test scenarios across 5 distinct testing categories:

### Category A: Checkout & Valuation Integrity (Integration & DB)
| ID | Scenario Name | Test Steps | Expected Result |
|---|---|---|---|
| **TC-01** | Standard-Priced Checkout | Submit order with 2x Standard Equipment (e.g., ReefWave 45, ₹32,000). | Persisted with `hasUnresolvedPorItems: false`, `pricingStatus: 'STANDARD'`, `totalAmount: 64000`. |
| **TC-02** | Single POR Item Checkout | Submit order with 1x Rainbow Chalice Coral (`priceOnRequest: true`). | Persisted with `price: 0`, `hasUnresolvedPorItems: true`, `pricingStatus: 'PRICE_ON_REQUEST'`, `totalAmount: 0`. |
| **TC-03** | Multiple POR Items | Submit order with 3 distinct coral specimens. | All 3 items stored with `pricingStatus: 'PENDING_POR'`, order total = 0, `hasUnresolvedPorItems: true`. |
| **TC-04** | Mixed Standard + POR Cart | Submit order with 1x Aquarium Pump (₹12,000) and 1x Exotic Coral (POR). | Subtotal = 12,000; Total = 12,000; `hasUnresolvedPorItems: true`; Coral item price = 0; Pump item price = 12,000. |
| **TC-05** | Client Price Tampering | Attacker intercepts cart payload and submits standard ₹50,000 item with `price: 1`. | Server rejects client price, looks up catalogue, enforces ₹50,000, or returns HTTP 400. |
| **TC-06** | Invalid Product ID | Client submits order with non-existent product ID `fake-coral-999`. | Server returns HTTP 400 `Invalid product ID in order payload`. Order is not persisted. |
| **TC-07** | Zero & Negative Quantities | Client submits item with `quantity: 0` or `quantity: -5`. | Server validation rejects with HTTP 400 `Quantity must be at least 1`. |
| **TC-08** | Duplicate Order Submission | Client double-clicks submit; sends identical `id: MC-TEST-DUP` within 500ms. | Server handles idempotently; does not create duplicate entries or duplicate spend. |

### Category B: POR Pricing & Invoice Gating (Business Logic)
| ID | Scenario Name | Test Steps | Expected Result |
|---|---|---|---|
| **TC-09** | Unresolved POR Invoice Rejection | Admin requests PDF `/api/admin/orders/[id]/invoice-pdf` for order where `hasUnresolvedPorItems === true`. | Server rejects with HTTP 422 `Cannot generate official invoice: Unresolved POR items exist`. |
| **TC-10** | Correct POR Pricing | Concierge calls `POST /api/admin/orders/[id]/por-pricing` with `agreedUnitPrice: 18500`. | Item updated to `agreedUnitPrice: 18500`, `pricingStatus: 'AGREED'`; order total recalculates; `hasUnresolvedPorItems` becomes `false`. |
| **TC-11** | Concurrent Pricing Updates | Two admins load order at `pricingVersion: 1`. Admin A saves price. Admin B attempts to save with `expectedVersion: 1`. | Admin B request rejected with HTTP 409 Conflict. Current version returned; Admin B must refresh. |

### Category C: RBAC & API Authorization (Security)
| ID | Scenario Name | Test Steps | Expected Result |
|---|---|---|---|
| **TC-12** | Unauthorised Employee Request | Employee with `CONTENT_EDITOR` role attempts `PATCH /api/orders` to update status. | Server rejects with HTTP 403 Forbidden. Zero database mutation. |
| **TC-13** | Employee Privilege Escalation | Employee without `orders.delete` sends `DELETE /api/orders?id=MC-TEST`. | Server rejects with HTTP 403 Forbidden. Order remains in database. |

### Category D: Tracking Security & Token Authorization (Data Privacy)
| ID | Scenario Name | Test Steps | Expected Result |
|---|---|---|---|
| **TC-14** | Tracking Without Token or Phone | Public query `GET /api/orders/track?id=MC-TEST`. | Returns Public Minimal Schema: Masked name `R**** V****`, status, city. Zero financial amounts, zero AWBs. |
| **TC-15** | Tracking with 4-Digit Phone Suffix | Query `GET /api/orders/track?id=MC-TEST&phone=9876` (matching last 4 digits). | Server **REJECTS** detailed manifest. Returns Public Minimal Schema. Does not disclose sensitive manifest. |
| **TC-16** | Tracking with Full 10-Digit Phone | Query `GET /api/orders/track?id=MC-TEST&phone=9876543210` (exact match). | Server **AUTHORIZES** full manifest: Discloses carrier flight, AWB number, item details, and verified total. |
| **TC-17** | Cross-Order Token Reuse | Use valid token from Order A to query Order B tracking. | Server rejects token: HTTP 401 or returns minimal schema. Tokens are strictly order-scoped. |

### Category E: Lifecycle Progression & Dispatch (State Machine)
| ID | Scenario Name | Test Steps | Expected Result |
|---|---|---|---|
| **TC-18** | Missing or Invalid Invoice Token | Customer navigates to `/api/orders/[id]` without token or with random string. | Server rejects with HTTP 401 Unauthorized `Valid invoice access token required`. |
| **TC-19** | Valid Customer Invoice Access | Customer navigates to `/api/orders/[id]?token=<valid_raw_token>`. | Server authorizes request; serializes sanitized customer invoice. Zero internal admin notes leaked. |
| **TC-20** | Invalid Lifecycle Skip | Admin attempts to advance order directly from `placed` to `packed`, skipping `quarantine`. | Server rejects with HTTP 400 `Invalid state transition: Intermediate quarantine stage cannot be skipped`. |
| **TC-21** | Dispatch Bypass Attempt | Admin calls `/api/admin/operations/dispatch` (PATCH) on an order currently at `placed`. | Server rejects with HTTP 400 `Cannot dispatch order that has not completed packing`. |
| **TC-22** | Concurrent Status Changes | Two logistics clerks attempt to advance order from `packed` to `dispatched` simultaneously. | Handled via version check; second request safely rejected or idempotently acknowledged. |

---

## 4. INDEPENDENT TEST HARNESS SPECIFICATION

### Test Runner Configuration:
- **Location:** `marine-creatures/scripts/test-order-flow-real.mjs`
- **Execution Script:** `node scripts/test-order-flow-real.mjs`
- **Isolation Mechanism:**
  1. Detects `MONGODB_TEST_URI` or spins up in-memory MongoDB.
  2. Creates isolated test orders prefixed with `MC-INTEG-TEST-XXXX`.
  3. Executes HTTP requests against localhost Next.js server with real session cookies.
  4. Runs all 22 assertions.
  5. Drops test documents from MongoDB in the `finally {}` block.
  6. Outputs a human-readable verification matrix table with execution times and pass/fail statuses.

