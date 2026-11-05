# MARINE CREATURES — END-TO-END HEALTH AUDIT
## DELIVERABLE 4: FULFILMENT LIFECYCLE & CUSTOMER TRACKING AUDIT

**Audit Date:** November 6, 2026  
**Auditor:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Audit Target:** Order State Machine, Quarantine Integration, Tracking Verification & AWB Synchronization  
**Audit Status:** AUDIT COMPLETE — CRITICAL PRIVACY VULNERABILITY & INCONSISTENT STATE MACHINES DETECTED  

---

## 1. EXECUTIVE SUMMARY & VERDICT

The fulfilment and tracking pipeline governs the transition of delicate marine specimens and high-end aquarium equipment from initial order placement through quarantine inspection, oxygen-thermal packing, priority air-cargo dispatch, and doorstep live delivery.
The required business guarantees are:
1. **Strict Linear State Machine:** Progression must be strictly linear (`placed` -> `quarantine` -> `packed` -> `dispatched` -> `delivered`) to prevent unconditioned marine life from being packed or dispatched prematurely.
2. **Quarantine Integration:** Marine life specimens must have confirmed quarantine inspection notes prior to packing.
3. **Customer Privacy Protection:** Tracking manifests, recipient addresses, and flight AWB numbers must be protected against unauthorised public harvesting.
4. **Live Logistics Synchronization:** Real flight numbers (e.g. IndiGo 6E-442, Air India Cargo) and AWB numbers must sync seamlessly to the customer tracking page.

### Audit Verdict: **FAIL (CRITICAL PRIVACY LEAK & SPLIT-BRAIN STATE MACHINE)**
1. **Critical Privacy Vulnerability in Order Tracking:** [app/api/orders/track/route.ts#L172-L176](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts#L172-L176) permits **any 4 digits matching the suffix of a customer's phone number** to unlock the full order manifest, line items, total financials, and courier tracking numbers.
2. **Three Conflicting State Machine Implementations:** Three different endpoints implement mutually contradictory state transition rules. One enforces strict single-step transitions (`Math.abs(diff) <= 1`), another allows skipping up to two steps (`Math.abs(diff) <= 2`), and the third has zero state validation, allowing an order to jump directly from `placed` to `delivered`.
3. **Quarantine is purely nominal:** There is zero system validation checking whether marine life specimens have completed quarantine or feeding protocols before advancing to `packed`.

---

## 2. THE THREE CONFLICTING STATE MACHINE IMPLEMENTATIONS

We audited all three API handlers responsible for updating order progression:

```mermaid
flowchart LR
    A["placed"] --> B["quarantine"]
    B --> C["packed"]
    C --> D["dispatched"]
    D --> E["delivered"]

    classDef step fill:#0f172a,stroke:#0369a1,color:#e0f2fe;
    class A,B,C,D,E step;
```

### Route 1: `app/api/orders/route.ts` (PATCH)
- **State Validation:** Lines 331–337:
  ```typescript
  // Only allow forward progression or direct previous rollback (no skipping intermediate stages)
  if (Math.abs(nextIdx - prevIdx) > 1) {
    return NextResponse.json({
      success: false,
      error: `Invalid state transition from ${order.currentStep} to ${currentStep}. State progression must be linear without skipping intermediate stages.`
    }, { status: 400 });
  }
  ```
- **Rule:** Strictly single-step linear progression (`abs <= 1`). Cannot jump `placed` -> `packed`.

### Route 2: `app/api/admin/orders/route.ts` (PATCH)
- **State Validation:** Lines 109–115:
  ```typescript
  // Only allow forward progression or direct previous rollback for administrative correction
  if (Math.abs(nextIdx - prevIdx) > 2) {
    return NextResponse.json({
      success: false,
      error: `Invalid state transition from ${order.currentStep} to ${currentStep}. State progression must be linear.`
    }, { status: 400 });
  }
  ```
- **Rule:** Permissive progression (`abs <= 2`). **Allows skipping quarantine entirely** (from `placed` index 0 to `packed` index 2, because `abs(2 - 0) = 2`, which is NOT `> 2`).

### Route 3: `app/api/admin/operations/dispatch/route.ts` (PATCH)
- **State Validation:** Lines 64–79:
  ```typescript
  if (currentStep && ['packed', 'dispatched', 'delivered'].includes(currentStep)) {
    order.currentStep = currentStep;
    ...
  }
  ```
- **Rule:** **Zero progression validation.** An order currently at `placed` can be directly updated to `delivered` in a single PATCH request, bypassing all quarantine, packaging, and air cargo flight logging.

### Verdict on State Machine:
**FAIL (SYSTEMIC INCONSISTENCY).** Different administrative UI screens or third-party webhooks hitting different endpoints experience completely contradictory validation rules.

---

## 3. SECURITY FORENSICS: 4-DIGIT PHONE SUFFIX TRACKING VULNERABILITY

### The Vulnerability:
**Location:** [marine-creatures/app/api/orders/track/route.ts#L172-L176](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts#L172-L176)

```typescript
// Line 172-176 of app/api/orders/track/route.ts:
const hasValidPhone = Boolean(
  providedPhone.length >= 4 &&
  cleanOrderPhone.length >= 4 &&
  cleanOrderPhone.endsWith(providedPhone)
);

// Line 179:
const isAuthorizedForManifest = isAdmin || hasValidToken || hasValidPhone;
```

### Attack Scenario & Impact:
1. Marine Creatures order IDs follow a predictable pattern (`MC-XXXXXX` e.g., `MC-740020EJ`).
2. When tracking an order via `/api/orders/track?id=MC-740020EJ&phone=9876`:
   - If `9876` matches the last 4 digits of the customer's phone number, `hasValidPhone` evaluates to `true`.
   - The API immediately discloses:
     - Full item manifest (exact species and quantities purchased).
     - Full financial subtotal and total amounts.
     - Live courier name, flight number, and cargo AWB tracking number.
     - Full order status history with internal operational notes.
3. **Exploitation Cost:** There are only 10,000 possible 4-digit combinations (`0000` to `9999`). An unauthenticated attacker can enumerate all combinations in under two minutes without encountering account lockouts.
4. **Severity:** **CRITICAL (GDPR / Indian DPDP Act Non-Compliance).**

---

## 4. QUARANTINE INTEGRATION FORENSICS

### Intended Behaviour:
Exotic marine specimens (corals, angelfish, tangs, invertebrates) require dedicated quarantine conditioning:
- Proactive freshwater and salinity dips.
- Parasite screening (*Cryptocaryon irritans*, *Amyloodinium*).
- Active feeding verification on commercial marine diets.
- Documented health clearance before release for packing.

### Actual Code Behaviour:
- In `marine-creatures/models/Order.ts`, `quarantine` is merely one of five enum string values for `currentStep` and `OrderHistory.step`.
- There is no quarantine health checklist, no specimen clearance flag, and no veterinarian/biologist sign-off field.
- In `app/api/admin/orders/route.ts`, an administrator can bypass quarantine directly because `abs(packed - placed) = 2 <= 2`.
- In `app/api/admin/operations/dispatch/route.ts`, quarantine is never checked.
- **Verdict:** **PARTIAL (DOCUMENTARY ONLY / NO SYSTEMIC ENFORCEMENT).**

---

## 5. CARRIER AWB & AIR CARGO TRACKING AUDIT

### Implementation Verification:
- **Order Model:** [marine-creatures/models/Order.ts#L147-L149](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/models/Order.ts#L147-L149)
  Stores `awbNumber`, `courierName`, and `estimatedDelivery`.
- **Tracking Response:** [marine-creatures/app/api/orders/track/route.ts#L208-L235](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts#L208-L235)
  When `isAuthorizedForManifest` is true:
  ```typescript
  courier: {
    name: order.courierName || 'Priority Air Cargo Express',
    trackingNumber: order.awbNumber || null,
    isLiveCargoCertified: true,
  }
  ```
- **Real Database Audit:**
  In real MongoDB orders (`MC-740020EJ`), `awbNumber` is initially `undefined`. When dispatch updates occur, the field is correctly populated.
- **Verdict:** **PASS.** The carrier data structure and tracking payload are sound.

---

## 6. REQUIRED REMEDIATION SPECIFICATION

1. **Fix Tracking Verification Vulnerability (`app/api/orders/track/route.ts`):**
   - Eliminate the 4-digit suffix check.
   - Require the customer to provide their **exact 10-digit registered phone number** (`providedPhone === cleanOrderPhone`).
   - Implement IP-based and order-based rate limiting on tracking verification attempts (max 5 failed attempts per hour per order ID).
2. **Unify State Machine Logic Across All Three Routes:**
   - Consolidate state validation into a single shared helper function (`lib/orders/state-machine.ts`).
   - Enforce strictly linear progression: `placed` -> `quarantine` -> `packed` -> `dispatched` -> `delivered`.
   - Prevent any order with `category: 'marine-life'` from skipping `quarantine`.
3. **Mandate Quarantine Health Sign-Off:**
   - Before an order containing live marine life can transition to `packed`, require a non-empty `quarantineNotes` string or inspection confirmation.

