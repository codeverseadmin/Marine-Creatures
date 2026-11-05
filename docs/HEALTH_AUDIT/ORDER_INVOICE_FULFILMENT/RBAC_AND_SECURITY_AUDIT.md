# MARINE CREATURES — END-TO-END HEALTH AUDIT
## DELIVERABLE 5: RBAC PERMISSIONS & SECURITY VULNERABILITY AUDIT

**Audit Date:** November 6, 2026  
**Auditor:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Audit Target:** Role-Based Access Control, Endpoint Authorization, Legacy API Bypasses & Data Integrity  
**Audit Status:** AUDIT COMPLETE — CRITICAL RBAC BYPASS & FRONTEND PRIVILEGE LEAK IDENTIFIED  

---

## 1. EXECUTIVE SUMMARY & VERDICT

The Marine Creatures administration infrastructure operates under a multi-tier Employee Management and Role-Based Access Control (RBAC) architecture designed to eliminate shared passwords and enforce the principle of least privilege across operational roles (e.g. `OWNER`, `STORE_MANAGER`, `SALES_ASSOCIATE`, `DISPATCH_EXECUTIVE`, `AQUATIC_SPECIALIST`, `CONTENT_EDITOR`).
Specific permissions for the order-to-dispatch workflow include:
- `orders.read`: Read order list, customer names, line items.
- `orders.update_status`: Advance fulfilment stages (`placed` -> `quarantine` -> `packed` -> `dispatched` -> `delivered`).
- `orders.approve`: Officially approve orders for quarantine conditioning.
- `orders.por_price.set`: Set agreed valuation on Price-on-Request marine specimens.
- `orders.invoice.generate`: Access and generate official PDF invoices.
- `orders.delete`: Permanently delete order records.
- `dispatch.read`: Access logistics manifests.
- `dispatch.update`: Assign courier names, flight numbers, and AWB tracking numbers.

### Audit Verdict: **FAIL (CRITICAL PRIVILEGE ESCALATION VULNERABILITY)**
1. **Legacy API Bypass:** The legacy endpoint `app/api/orders/route.ts` exposes `PATCH` and `DELETE` handlers protected only by `isAdminRequest(req)`. Because `isAdminRequest(req)` returns `true` for **any valid employee session**, any logged-in employee (such as a `CONTENT_EDITOR` or `MEDIA_MANAGER`) can update or permanently delete any customer order, bypassing all fine-grained permission checks.
2. **Missing Frontend Permission Gates:** The active sales dashboard (`ControlOsSales.tsx`) does not inspect employee permissions. It unconditionally renders action controls, status modification dropdowns, and AWB inputs regardless of the logged-in user's role.
3. **Public Enumeration Protection:** **PASS.** Unauthenticated requests to `/api/orders` (GET) are rejected with HTTP 401, preventing anonymous scraping of customer PII.
4. **Audit Trail Persistence:** **PASS.** Protected admin routes record tamper-evident audit logs via `lib/audit.ts`.

---

## 2. API ENDPOINT PERMISSION MATRIX

We audited every HTTP endpoint involved in order lifecycle, invoice creation, and dispatch:

| Endpoint | Method | Intended Required Permission | Actual Code Authorization Mechanism | Vulnerability Assessment |
|---|---|---|---|---|
| `/api/admin/orders` | GET | `orders.read` | `requirePermission(req, 'orders.read')` | **PASS.** Strict RBAC enforcement. |
| `/api/admin/orders` | PATCH | `orders.update_status` | `requirePermission(req, 'orders.update_status')` | **PASS.** Strict RBAC enforcement. |
| `/api/admin/orders/[id]/por-pricing` | POST | `orders.por_price.set` | `requirePermission(req, 'orders.por_price.set')` | **PASS.** Strict RBAC enforcement. |
| `/api/admin/orders/[id]/invoice-pdf` | GET | `orders.invoice.generate` | `requirePermission(req, 'orders.invoice.generate')` | **PASS.** Strict RBAC enforcement. |
| `/api/admin/operations/dispatch` | GET | `dispatch.read` | `requirePermission(req, 'dispatch.read')` | **PASS.** Strict RBAC enforcement. |
| `/api/admin/operations/dispatch` | PATCH | `dispatch.update` | `requirePermission(req, 'dispatch.update')` | **PASS.** Strict RBAC enforcement. |
| `/api/orders` | GET | `orders.read` | `isAdminRequest(req)` (legacy boolean check) | **MEDIUM.** Exposes bulk order dataset to any employee. |
| `/api/orders` | POST | Public (Customer) | Rate-limited by IP (20 req / 10 min) | **PASS.** Rate-limited; public creation allowed. |
| `/api/orders` | PATCH | `orders.update_status` | `isAdminRequest(req)` (legacy boolean check) | **CRITICAL BYPASS.** Any employee can mutate orders without `orders.update_status`. |
| `/api/orders` | DELETE | `orders.delete` | `isAdminRequest(req)` (legacy boolean check) | **CRITICAL BYPASS.** Any employee can delete orders without `orders.delete`. |
| `/api/orders/track` | GET | Public / Owner Phone | Checks 4-digit phone suffix | **CRITICAL PRIVACY LEAK.** Allows public PII harvesting. |

---

## 3. DEEP DIVE: THE LEGACY API RBAC BYPASS

### The Mechanism:
**Location:** [marine-creatures/lib/auth.ts#L129-L153](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/auth.ts#L129-L153)

```typescript
export function isAdminAuthenticated(req: NextRequest): boolean {
  const sessionCookie = req.cookies.get(SESSION_COOKIE);
  if (!sessionCookie || !sessionCookie.value) return false;
  // First check if it's a valid employee session token
  const employeeSession = verifyEmployeeSessionToken(sessionCookie.value);
  if (employeeSession) return true; // Returns true for ALL valid employee sessions!
  // Fall back to legacy admin session token
  return verifySessionToken(sessionCookie.value);
}

export function isAdminRequest(req: NextRequest): boolean {
  if (isAdminAuthenticated(req)) return true;
  ...
}
```

Now observe how `marine-creatures/app/api/orders/route.ts` uses this helper:

```typescript
// Line 242 of app/api/orders/route.ts:
export async function PATCH(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  // Continues to mutate order status, awb, courier...
}

// Line 429 of app/api/orders/route.ts:
export async function DELETE(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  // Permanently executes OrderModel.deleteOne({ id })!
}
```

### Security Impact:
- When the RBAC system was introduced, modern `/api/admin/*` endpoints were wrapped with `requirePermission(req, '...')`.
- The existing `/api/orders` endpoint was left active to support legacy storefront or admin hooks.
- Because `isAdminRequest(req)` returns `true` as long as any valid employee session cookie exists, **fine-grained role limitations are completely defeated**.
- A junior employee assigned the `CONTENT_EDITOR` role (intended only to edit articles or SEO metadata) can issue a simple curl or fetch request to `/api/orders?id=MC-740020EJ` with `method: 'DELETE'` and permanently erase customer orders from MongoDB.

---

## 4. FRONTEND UI PRIVILEGE LEAK IN CONTROL OS

### Inspection of `components/admin/ControlOsSales.tsx`:
- The component manages the primary order table, search filters, status dropdowns, and AWB editing inputs.
- **Audit Finding:** The component never queries employee permissions. It does not import `useEmployeeSession()`, `hasPermission()`, or check `user.permissions`.
- **User Experience Consequences:**
  1. An employee with read-only access (`orders.read`) sees the exact same interactive dropdowns and buttons as the business owner.
  2. If the employee attempts to update an order stage, the UI calls `/api/admin/orders` which rejects the request with HTTP 403. The UI catches this in a generic `catch { showToast('Error syncing orders'); }`, leaving the employee confused.
  3. Worse, if any component or legacy script dispatches to `/api/orders`, the unauthorized action unexpectedly succeeds due to the bypass described above.

---

## 5. AUDIT LOGGING & ACCOUNTABILITY FORENSICS

### Implementation Audit:
- **Location:** [marine-creatures/lib/audit.ts](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/audit.ts)
- In `/api/admin/orders/[id]/por-pricing/route.ts`:
  - Successfully logs `ORDER_POR_PRICED` or `ORDER_POR_PRICE_REVISED`.
  - Captures actor identity, previous subtotal, new agreed price, timestamp, and client IP.
- In `/api/admin/operations/dispatch/route.ts`:
  - Successfully logs `ORDER_TRACKING_UPDATED`.
- In `/api/orders/route.ts`:
  - Logs `ORDER_STATUS_CHANGED`.
- **Verdict:** **PASS.** All mutating handlers record audit events into the `AuditLog` collection.

---

## 6. REQUIRED REMEDIATION SPECIFICATION

1. **Eliminate Legacy RBAC Bypass in `app/api/orders/route.ts`:**
   - Deprecate or protect `PATCH` and `DELETE` handlers using `requirePermission(req, 'orders.update_status')` and `requirePermission(req, 'orders.delete')`.
   - Protect `GET` handler using `requirePermission(req, 'orders.read')`.
2. **Implement UI Permission Gating in `ControlOsSales.tsx`:**
   - Retrieve the current employee's permission array.
   - Conditionally render status dropdowns, AWB inputs, and pricing buttons only if `permissions.includes('orders.update_status')` or `permissions.includes('orders.por_price.set')`.
   - Provide a clean read-only badge view for unauthorized employees.

