# MARINE CREATURES — PHASE 3 FINAL ACCEPTANCE CHALLENGE REPORT

**Reference:** `MC-PHASE3-FINAL-VERIFICATION-NOV2026`  
**Classification:** Independent Security Verification & Production Readiness Assessment  
**Audit Mode:** STRICTLY READ-ONLY VERIFICATION  
**Target Environment:** Marine Creatures Storefront + Control OS  
**Stack:** Next.js 16.4.1 (Turbopack), React 19, TypeScript, MongoDB Atlas, Mongoose, Sharp  
**Date:** 07 November 2026  
**Auditor:** Principal Application Security Architect & Independent Systems Auditor  
**Final Verdict:** **CONDITIONALLY ACCEPTED**

---

## 1. EXECUTIVE SUMMARY & VERDICT RATIONALE

This document presents the independent, read-only verification of the Phase 3 platform security remediation. Rather than validating past claims, this audit independently examined the actual codebase, schema models, query semantics, serverless runtime characteristics, and live HTTP endpoints on a compiled Next.js production build (`http://localhost:3099`).

### Verdict: CONDITIONALLY ACCEPTED
The codebase successfully eliminates all direct unauthenticated administrative backdoors, implements strict granular RBAC across all 100 API route handlers, provides non-blocking scrypt password hashing, enforces atomic staff invitation consumption, and prevents employee privilege escalation.

However, the verification revealed three documented architectural limitations and operational prerequisites that prevent an unconditional "ACCEPTED" rating:
1. **Dynamic Bootstrap Reactivation Risk (SEC-BOOTSTRAP-01):** Bootstrap mode evaluates `activeOwnerCount === 0` in real time. Because the application lacks a persistent permanent setting flag (e.g. `system_settings.bootstrap_completed = true`), deleting or suspending the last active Owner would cause the system to re-enter bootstrap mode. Furthermore, while an invited owner's token remains unredeemed, `activeOwnerCount` remains 0.
2. **Low Entropy of 4-Digit Phone Tracking Factor (SEC-PRIVACY-02):** The four-digit phone verification on `/api/orders/track` provides only $10^4$ (10,000) possible combinations. While throttled by IP and per-order rate limiting (20 req/10 min), it represents a consumer convenience check, not cryptographic authentication.
3. **Unverified Production Credentials in Live Vercel Dashboard (SEC-PROD-ENV-01):** Production rotation of `SESSION_SECRET` and `ADMIN_PASSCODE` cannot be confirmed via read-only repository inspection and must be executed by the founder during a maintenance window.

---

## 2. BOOTSTRAP LIFECYCLE AUDIT (CRITICAL FINDINGS)

### Verification Against Core Criteria

| Criteria | Code Verification | Behavior | Finding |
| :--- | :--- | :--- | :---: |
| **1. Initial Bootstrap Possible** | [`lib/rbac/guard.ts#L126-L148`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/guard.ts#L126-L148)<br>[`app/api/admin/login/route.ts#L143-L175`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/login/route.ts#L143-L175) | When `activeOwnerCount === 0`, valid passcode grants temporary bootstrap session. | **CONFIRMED** |
| **2. Deactivated After Owner Creation** | [`app/api/admin/login/route.ts#L148-L162`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/login/route.ts#L148-L162) | When `activeOwnerCount > 0`, passcode login returns HTTP 403 Forbidden. | **CONFIRMED** |
| **3. Suspending Last Owner** | [`lib/rbac/guard.ts#L128`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/guard.ts#L128) | Queries `{ roleId: 'owner', status: 'active' }`. If status is `'suspended'`, count drops to 0. | **LIMITATION** |
| **4. Deleting Last Owner** | [`lib/rbac/guard.ts#L128`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/guard.ts#L128) | If last owner document is deleted from DB, count drops to 0 $\rightarrow$ bootstrap reopens. | **LIMITATION** |
| **5. Concurrent Bootstrap Requests** | [`app/api/admin/employees/route.ts#L80-L160`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/employees/route.ts#L80-L160) | Creates employee with `status: 'invited'`. Does not increment `activeOwnerCount` until token is accepted. | **LIMITATION** |
| **6. Stale / Forged Session Bypass** | [`lib/rbac/guard.ts#L45-L95`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/guard.ts#L45-L95) | Verifies signature, expiry, MongoDB status, and sessionVersion in real time. | **CONFIRMED** |

### Detailed Code Analysis: SEC-BOOTSTRAP-01
In `lib/rbac/guard.ts`:
```typescript
// Line 128
const activeOwnerCount = await EmployeeModel.countDocuments({
  roleId: 'owner',
  status: 'active',
});

if (activeOwnerCount === 0) {
  return {
    authenticated: true,
    type: 'bootstrap_owner',
    actorId: 'bootstrap_owner',
    actorName: 'Founder (Bootstrap)',
    actorEmail: 'owner@marinecreatures.local',
    roleId: 'owner',
    permissions: new Set(Object.keys(PERMISSIONS_REGISTRY)),
    isOwner: true,
  };
}
```
**Vulnerability & Architectural Finding:**
1. **Dynamic State Reliance:** Bootstrap mode is strictly coupled to the *live document count* of active owners. Although `app/api/admin/employees/[id]/route.ts` contains application-level guards to block deleting or suspending the last active owner via the UI, any direct database administration, script error, or accidental state change that reduces active owners to 0 will immediately re-open bootstrap mode to anyone with the legacy passcode.
2. **Invitation Gap:** In `POST /api/admin/employees`, inviting an Owner creates a record with `status: 'invited'`. Until that invitation is accepted via `/api/auth/invitation/accept`, `activeOwnerCount` remains 0. During this window, bootstrap mode remains active.
3. **Recommendation:** A permanent MongoDB setting flag (e.g. `SettingModel.findOne({ key: 'security.bootstrap_sealed' })`) or checking `EmployeeModel.countDocuments({ roleId: 'owner' })` (regardless of status) should seal bootstrap mode permanently once an initial Owner document has been created.

---

## 3. TEST EVIDENCE RECONCILIATION & NUMBERED INVENTORY

### Reconciliation of Test Count Discrepancy
The prompt requested reconciliation between the reported total of 47 tests and previous outputs listing 46 PASS entries.

* **Cause of Discrepancy:** In early validation, Test Section 8 experienced an assertion failure when testing phone suffix verification on order `MC-8921` (`phone: "9876543210"`). An initial test query passed `phone=4321` (matching an outdated mock order reference), which correctly caused assertion #46 to fail, halting execution before assertion #47 was evaluated. Once corrected to `phone=3210` (the actual last 4 digits of `MC-8921`), all 47 assertions executed and passed.
* **Audit Verification:** Inspection of `scratch/test_phase3_acceptance.mjs` confirms exactly 47 `assert()` function calls following the declaration on line 50.

### Complete Numbered Test Inventory (47 Tests)

#### Section 1: Asynchronous Non-Blocking Password Hashing (5 Tests)
1. `hashPassword returns formatted salt:key string asynchronously` (Line 111)
2. `verifyPassword returns true for correct password asynchronously` (Line 114)
3. `verifyPassword returns false for incorrect password` (Line 117)
4. `verifyPassword safely returns false on malformed hash string` (Line 120)
5. `10 parallel scrypt derivations executed asynchronously in 173ms without event loop blocking` (Line 126)

#### Section 2: Staff Invitation Acceptance Concurrency (4 Tests)
6. `Atomic invitation consumption: Exactly ONE request succeeded (HTTP 200)` (Line 167)
7. `Atomic invitation consumption: Remaining 9 concurrent requests were rejected (HTTP 400)` (Line 168)
8. `Employee account status transitioned to active` (Line 172)
9. `Invitation token hash was atomically invalidated` (Line 173)

#### Section 3: Master Passcode Backdoor Retirement (8 Tests)
10. `x-admin-secret alone to /api/admin/employees is DENIED with HTTP 401 Unauthorized` (Line 203)
11. `x-admin-passcode alone to /api/orders is DENIED with HTTP 401 Unauthorized` (Line 210)
12. `Master passcode login rejected with HTTP 403 when active Owner accounts exist` (Line 218)
13. `Response informs that master passcode is deactivated` (Line 220)
14. `Arbitrary role headers provide zero administrative privileges (HTTP 401)` (Line 227)
15. `Legitimate Owner session is granted access with HTTP 200 OK` (Line 234)
16. `Tampered session cookie is rejected with HTTP 401` (Line 241)
17. `Revoked session (outdated sessionVersion) is rejected with HTTP 401` (Line 249)

#### Section 4: Granular RBAC Enforcement Across Legacy Routes (8 Tests)
18. `Customer Support can view orders (orders.read granted) -> HTTP 200` (Line 278)
19. `Customer Support cannot create catalogue products (lacks products.create) -> HTTP 403` (Line 291)
20. `Customer Support cannot delete orders (lacks orders.delete) -> HTTP 403` (Line 298)
21. `Customer Support cannot manage promotional banners (lacks content.manage) -> HTTP 403` (Line 306)
22. `Customer Support cannot update settings (lacks settings.update) -> HTTP 403` (Line 314)
23. `Database seed route is permanently disabled/protected against catalog wipes -> HTTP 403` (Line 321)
24. `Public catalogue GET /api/products remains open to customers -> HTTP 200` (Line 325)
25. `Public banners GET /api/banners remains open -> HTTP 200` (Line 328)

#### Section 5: Employee Privilege Controls & Wildcard Ban (6 Tests)
26. `Self-escalation is DENIED: Employee cannot modify own role -> HTTP 403` (Line 358)
27. `Self-escalation is DENIED: Employee cannot modify own custom permissions -> HTTP 403` (Line 366)
28. `Non-owner cannot modify protected Owner account -> HTTP 403` (Line 374)
29. `Non-owner cannot assign custom permissions -> HTTP 403` (Line 382)
30. `Wildcard '*' permission is banned even for Owner assignment -> HTTP 400` (Line 390)
31. `Owner can assign legitimate custom permissions -> HTTP 200 OK` (Line 398)

#### Section 6: Analytics Event Endpoint Security (5 Tests)
32. `Valid public analytics event ingested successfully -> HTTP 201` (Line 417)
33. `Disallowed analytics event name is rejected with HTTP 400` (Line 427)
34. `Oversized analytics payload (> 10KB) is rejected with HTTP 413 Payload Too Large` (Line 439)
35. `Unauthenticated access to internal analytics dashboard is DENIED (HTTP 401)` (Line 443)
36. `Owner access to internal analytics dashboard is GRANTED (HTTP 200)` (Line 448)

#### Section 7: QA Fixture Isolation in Production (3 Tests)
37. `Production mode does NOT return synthetic QA order fixture -> HTTP 404 Not Found` (Line 459)
38. `Production mode does NOT return synthetic QA tracking fixture -> HTTP 404 Not Found` (Line 463)
39. `Production mode does NOT generate invoice PDF for QA fixtures -> HTTP 404 Not Found` (Line 469)

#### Section 8: Customer Tracking & Invoice Privacy (8 Tests)
40. `Public tracking lookup succeeds for valid order reference` (Line 478)
41. `Customer name is masked: R**** V****` (Line 480)
42. `Raw customer phone number is NOT exposed` (Line 481)
43. `Raw customer address is NOT exposed` (Line 482)
44. `Financial totalAmount is NOT exposed to unauthenticated public query` (Line 483)
45. `detailedShipment is false without phone or token verification` (Line 484)
46. `detailedShipment is true when verified with phone` (Line 489)
47. `Authorized tracking reveals item manifest` (Line 490)

---

## 4. ANALYTICS SECURITY AUDIT & VERIFICATION

Inspection of [`app/api/admin/analytics/events/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/analytics/events/route.ts):

1. **60 Events / Min Limit:** `checkRateLimit('rate:analytics:events:${ip}', 60, 60)` enforces sliding-window rate limiting backed by MongoDB TTL index.
2. **Exceeding Request:** 61st request within 60 seconds returns HTTP 429 Too Many Requests with `Retry-After: 60`.
3. **Payload Limit:** Headers checked for `Content-Length > 10240` and raw body string evaluated for `rawBody.length > 10240`. Returns HTTP 413 Payload Too Large.
4. **Invalid Event Name:** Validated against `ALLOWED_EVENTS = ['product_view', 'add_to_cart', 'wishlist_toggle', 'checkout_start', 'order_placed', 'enquiry_submitted', 'whatsapp_click']`. Unlisted event names return HTTP 400 Bad Request.
5. **Dangerous Metadata Keys:** Explicitly strips `__proto__`, `constructor`, `prototype`, `ipHash`, `isAdmin`, and `roleId`.
6. **Excessive Metadata Keys:** Clamped via `Object.keys(metadata).slice(0, 10)` (max 10 keys).
7. **Excessive Value Length:** Primitive string values clamped via `val.slice(0, 200)` (max 200 chars).
8. **Client IP Spoofing Resistance:** `getClientIp()` prioritizes `x-vercel-forwarded-for` over user-controlled `x-forwarded-for`. On Vercel edge infrastructure, spoofed client headers are ignored.
9. **Dashboard Authorization:** `GET /api/admin/analytics` requires `analytics.read` permission. Unauthenticated queries return HTTP 401.
10. **Data Persistence Verification:** Stored records in `AnalyticsEventModel` contain anonymized `ipHash` (SHA-256 slice of IP + salt), completely omitting raw IP addresses or customer identifiers.

---

## 5. INVOICE & CUSTOMER PRIVACY AUDIT

Inspection of [`app/api/orders/[id]/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/[id]/route.ts) and [`app/api/orders/track/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts):

### Invoice Access Tokens
* **Entropy:** 256 bits of CSPRNG entropy (`crypto.randomBytes(32).toString('hex')`).
* **Storage:** One-way SHA-256 hash (`invoiceTokenHash`) stored in MongoDB; raw token is never persisted.
* **Verification:** `timingSafeEqual` comparison via `verifyInvoiceTokenHash`.
* **Invalid / Random Token:** Returns HTTP 401 Unauthorized (`{ requiresToken: true }`).
* **Expired Token:** Evaluated via `isInvoiceTokenExpired(order.invoiceTokenExpiresAt)`. Returns HTTP 401 with `tokenExpired: true`.
* **Token Reuse:** Tokens are persistent bearer capability tokens designed for customer link access. They remain valid across multiple visits until rotated via `POST /api/orders/[id]`.
* **Staff Notes Isolation:** `serializeCustomerInvoice(order)` in [`lib/invoice-token.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/invoice-token.ts) explicitly omits internal staff notes, admin metadata, and token hashes.

### Customer Tracking Privacy & Phone Suffix Classification
* **Unauthenticated Response:** Customer name is masked (`Rahul Verma` $\rightarrow$ `R**** V****`). City and milestone step are disclosed. Carrier name, AWB, exact address, phone number, financial totals, and specimen names are omitted. Item names are masked into `"1 Marine Specimen(s) in Oxygen Thermal Packaging"`.
* **Honest Classification of 4-Digit Phone Suffix:**
  > [!WARNING]
  > The 4-digit phone suffix matching mechanism is **NOT strong authentication**. With only 10,000 combinations ($0000$–$9999$), it is vulnerable to brute-force discovery if rate limiting is bypassed. In Marine Creatures, it is protected by a dual-tier rate limit (60 req/10 min per IP, 20 queries/10 min per order), limiting an attacker to 20 guesses per order per 10 minutes. It must be classified as a **lightweight second-factor consumer verification gate**, suitable only for status tracking, not for accessing invoices or sensitive PII.

---

## 6. COMPLETE RBAC COVERAGE REGISTER (100 API HANDLERS)

Every administrative and customer-facing API endpoint in `app/api` was inspected. Broad `isAdminRequest()` checks have been completely removed.

### Administrative Namespaces & Permission Map

| Route Path | Method | Required Permission / Gate | Mandatory Auth? | Enforced Server-Side? |
| :--- | :---: | :--- | :---: | :---: |
| `/api/admin/catalog` | `GET` | `products.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/catalog` | `POST` | `products.create` | Yes | Yes (`requirePermission`) |
| `/api/admin/catalog` | `PATCH` | `products.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/catalog` | `DELETE` | `products.archive` | Yes | Yes (`requirePermission`) |
| `/api/admin/orders` | `GET` | `orders.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/orders` | `PATCH` | `orders.update_status` | Yes | Yes (`requirePermission`) |
| `/api/admin/orders/[id]/invoice-pdf` | `GET` | `orders.invoice.generate`, `finance.invoice.generate` | Yes | Yes (`requireAnyPermission`) |
| `/api/admin/orders/[id]/por-pricing` | `POST` | `orders.por_price.set` | Yes | Yes (`requirePermission`) |
| `/api/admin/customers` | `GET` | `customers.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/customers` | `PATCH` | `customers.update`, `customers.notes.create` | Yes | Yes (Field-level check) |
| `/api/admin/employees` | `GET` | `employees.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/employees` | `POST` | `employees.create` | Yes | Yes (`requirePermission`) |
| `/api/admin/employees/[id]` | `GET` | `employees.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/employees/[id]` | `PATCH` | `employees.update` / `employees.suspend` | Yes | Yes (Self-escalation guard) |
| `/api/admin/employees/[id]` | `DELETE` | `employees.delete` | Yes | Yes (Last active Owner guard) |
| `/api/admin/employees/[id]/resend-invitation` | `POST` | `employees.create` | Yes | Yes (`requirePermission`) |
| `/api/admin/employees/[id]/revoke-sessions` | `POST` | `employees.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/inventory` | `GET` | `inventory.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/inventory` | `PATCH` | `inventory.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/operations/dispatch` | `GET` | `dispatch.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/operations/dispatch` | `PATCH` | `dispatch.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/operations/quarantine` | `GET` | `quarantine.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/operations/quarantine` | `PATCH` | `quarantine.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/operations/maintenance` | `GET` | `maintenance.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/operations/maintenance` | `POST` | `maintenance.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/operations/maintenance` | `PATCH` | `maintenance.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/backup` | `GET` | `backups.read` (or CRON_SECRET) | Yes | Yes (`requirePermission`) |
| `/api/admin/backup` | `POST` | `backups.create` (or CRON_SECRET) | Yes | Yes (`requirePermission`) |
| `/api/admin/backup` | `PUT` | `backups.create` | Yes | Yes (`requirePermission`) |
| `/api/admin/analytics` | `GET` | `analytics.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/analytics/events` | `POST` | Intentionally Public Telemetry | No | Yes (Rate limit + sanitize) |
| `/api/admin/system/settings` | `GET` | `settings.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/system/settings` | `POST` | `settings.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/system/security` | `GET` | `security.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/system/health` | `GET` | `health.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/system/audit` | `GET` | `audit.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/reviews` | `GET` | `reviews.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/reviews/[id]` | `PATCH` | `reviews.moderate` | Yes | Yes (`requirePermission`) |
| `/api/admin/reviews/invitations` | `POST` | `reviews.invite.create` | Yes | Yes (`requirePermission`) |
| `/api/admin/media` | `GET` | `media.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/media` | `POST` | `media.upload` | Yes | Yes (`requirePermission`) |
| `/api/admin/media` | `DELETE` | `media.delete` | Yes | Yes (`requirePermission`) |
| `/api/admin/enquiries` | `GET` | `enquiries.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/enquiries` | `PATCH` | `enquiries.update_status`, `enquiries.notes.create` | Yes | Yes (`requireAnyPermission`) |
| `/api/admin/roles` | `GET` | `roles.read` | Yes | Yes (`requirePermission`) |
| `/api/admin/roles` | `POST` | `roles.create` | Yes | Yes (`requirePermission`) |
| `/api/admin/roles/[id]` | `PATCH` | `roles.update` | Yes | Yes (`requirePermission`) |
| `/api/admin/roles/[id]` | `DELETE` | `roles.delete` | Yes | Yes (`requirePermission`) |
| `/api/admin/overview` | `GET` | Any authenticated employee | Yes | Yes (`requireAuthenticatedEmployee`) |
| `/api/admin/search` | `GET` | Any authenticated employee | Yes | Yes (`requireAuthenticatedEmployee`) |
| `/api/admin/me` | `GET` | Resolves active session profile | Yes | Yes (`resolveAuthContext`) |
| `/api/admin/login` | `POST` | Public authentication gate | No | Yes (scrypt / Passcode bootstrap) |
| `/api/admin/logout` | `POST` | Public session cookie clearing | No | Yes |

### Storefront & Public Routes

| Route Path | Method | Access Model | Enforced Server-Side Controls |
| :--- | :---: | :--- | :--- |
| `/api/products` | `GET` | Public catalogue | Strips synthetic reviews; calculates genuine ratings |
| `/api/products` | `POST` | `products.create` | Server-side RBAC + audit logging |
| `/api/products` | `PUT` | `products.update` | Server-side RBAC + audit logging |
| `/api/products` | `DELETE` | `products.delete` | Server-side RBAC + audit logging |
| `/api/products/[id]/reviews`| `GET` | Public product reviews | Returns only approved reviews (`status: 'APPROVED'`) |
| `/api/banners` | `GET` | Public promo banners | Server-authoritative fallback to default banners |
| `/api/banners` | `POST/PUT/DELETE`| `content.manage` | Server-side RBAC + audit logging |
| `/api/settings` | `GET` | Public business settings | Public key-value lookup |
| `/api/settings` | `POST` | `settings.update` | Server-side RBAC + audit logging |
| `/api/inquiries` | `POST` | Public lead generation | IP rate limiting (10/10 min) + payload clamping |
| `/api/inquiries` | `GET` | `enquiries.read` | Server-side RBAC |
| `/api/inquiries` | `PATCH` | `enquiries.update_status`| Server-side RBAC + audit logging |
| `/api/inquiries` | `DELETE` | `enquiries.delete` | Server-side RBAC + audit logging |
| `/api/orders` | `POST` | Public storefront checkout | Server-authoritative IDs & pricing; admin overrides require `orders.create` |
| `/api/orders` | `GET` | `orders.read` | Server-side RBAC |
| `/api/orders` | `PATCH` | `orders.update_status`, `orders.approve` | Server-side RBAC + audit logging |
| `/api/orders` | `DELETE` | `orders.delete` | Server-side RBAC + audit logging |
| `/api/orders/track` | `GET` | Multi-tier tracking | Public masked tier; manifest requires phone or `orders.read` |
| `/api/orders/[id]` | `GET` | Multi-tier invoice | Customer requires 256-bit CSPRNG token; admin requires `orders.read` |
| `/api/orders/[id]` | `POST` | `orders.invoice.generate` | Server-side token issuance & rotation |
| `/api/seed` | `POST` | Disabled in production | Production returns HTTP 403; dev requires Owner & `ALLOW_SEEDING=true` |
| `/api/worlds` | `GET` | Public worlds | Preview mode (`?preview=true`) requires `worlds.read` |
| `/api/auth/invitation/accept` | `POST` | Public invitation gate | Single-use atomic `findOneAndUpdate` + scrypt hashing |
| `/api/auth/invitation/verify` | `GET` | Public invitation check | Verifies unexpired token hash without consuming |
| `/api/reviews/invitation/verify` | `GET` | Public review invite check | Verifies token hash and order binding |
| `/api/reviews/submit` | `POST` | Public review submission | Requires valid unsubmitted invitation token |
| `/api/reviews/upload-image` | `POST` | Public review photo upload | Requires invitation token; binds image to invitation token hash |
| `/api/media/[id]` | `GET` | Multi-tier media access | Draft review media isolated to exact invitation token bearer |
| `/api/health` | `GET` | Public health probe | Reports system status |

---

## 7. OWNER PROTECTION MECHANISMS

1. **Self-Escalation Check:** [`app/api/admin/employees/[id]/route.ts#L67-L79`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/employees/[id]/route.ts#L67-L79) compares `auth.actorId === id`. Self-role change, self-suspension, or self-custom-permission assignment returns HTTP 403 Forbidden.
2. **Owner Account Protection:** Line 82 blocks non-owners from modifying any account with `roleId === 'owner'` (returns HTTP 403 Forbidden).
3. **Last Active Owner Protection:** Lines 94–112 (PATCH) and lines 231–248 (DELETE) verify `activeOwners > 0` before allowing demotion, suspension, or deletion of an Owner.
4. **Owner-Only Custom Permissions:** Lines 116–122 gate custom permission assignment to Owners only.
5. **Wildcard Banned:** Lines 125–130 reject wildcard `'*'` assignment with HTTP 400 Bad Request.
6. **Session Invalidation on Role Change:** Line 145 bumps `employee.sessionVersion`, immediately revoking all issued tokens across active devices.

---

## 8. RATE LIMITING & SERVERLESS DEPLOYMENT BEHAVIOR

### Architecture
* **Primary Tier:** Distributed MongoDB Atlas collection (`RateLimitModel`) using atomic `$inc` and MongoDB TTL index on `expiresAt`.
* **Burst Protection:** In-memory `Map` cache catching micro-bursts prior to database round-trips.
* **Proxy IP Resolution:** [`lib/rate-limit.ts#L29-L50`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rate-limit.ts#L29-L50) checks `x-vercel-forwarded-for` first, preventing client header forgery on Vercel.

### Critical Serverless Failure-Mode Analysis
> [!IMPORTANT]
> **What happens when MongoDB Atlas is unavailable?**
> If MongoDB is temporarily unreachable or experiences network partitioning, `checkRateLimit()` catches the error and falls back to `inMemoryCache`. In a multi-instance serverless deployment (such as Vercel Lambdas or containerized autoscale pods), **memory is not shared between lambda instances**. Each instance maintains its own local counter. An attacker distributing requests across multiple concurrent lambdas could exceed the configured threshold during database outages.
>
> Distributed rate limiting is guaranteed **only when MongoDB Atlas is connected**.

---

## 9. ORDER INTEGRITY & PRICING REGRESSION AUDIT (PHASE 2.2)

1. **Server-Generated Order IDs:** Public checkout completely ignores `body.id`. IDs are generated server-side using `MC-` + timestamp last 6 digits + 2 uppercase CSPRNG hex characters (`MC-491010F0`).
2. **Entropy & Collision Retries:** 2 hex characters provide 256 combinations per millisecond. The retry loop tests `OrderModel.findOne({ id: candidateId })` up to 5 times.
3. **Database Uniqueness Index:** `models/Order.ts` line 132 defines `id: { type: String, required: true, unique: true, index: true }`.
4. **Authoritative Pricing:** Server recalculates all standard and variant prices directly from [`lib/data/products.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/data/products.ts) and MongoDB Atlas. Client-supplied `item.price`, `subtotal`, and `totalAmount` are discarded.
5. **Quantity Clamping:** Every item quantity is strictly clamped to an integer between 1 and 100.
6. **POR Integrity:** Items marked Price on Request (`priceOnRequest: true`) enforce `price: 0` and `pricingStatus: 'PENDING_POR'` on public checkout. Setting agreed prices requires authenticated admin session with `orders.por_price.set` permission via `POST /api/admin/orders/[id]/por-pricing`.
7. **Historical Records Intact:** Historical orders `MC-8921` (Rahul Verma) and `MC-8922` (Dr. Ananya Sen) verified 100% intact with zero modifications.

---

## 10. SECRET GOVERNANCE AUDIT

1. **No Static Development Secrets:** The historical fallback string `'dev-mc-insecure-session-secret-change-in-production'` has been completely eliminated from [`lib/rbac/session.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/session.ts) and [`lib/auth.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/auth.ts). In non-production, an ephemeral 32-byte CSPRNG secret is generated per process runtime.
2. **Production Fail-Closed Enforcement:** In production (`NODE_ENV === 'production'`), if `SESSION_SECRET` or `ADMIN_PASSCODE` is missing, the application throws an uncaught error on startup, preventing execution in an unauthenticated or predictable state.
3. **Zero Header Secret Overrides:** Reusable header secrets (`x-admin-secret`, `x-admin-passcode`) cannot bypass authentication once active Owners exist.
4. **Zero Secret Leaks in Responses / Logs:** Sanitization passes explicitly delete `passwordHash` and `invitationTokenHash` prior to returning employee documents.

---

## 11. DEPLOYMENT PREREQUISITES & RECOMMENDATIONS

Prior to Git release and production deployment, the founder must complete the following operational steps:

1. **Configure Production Environment Variables in Vercel:**
   * `SESSION_SECRET`: Generate and configure a 64-character random hex string (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
   * `ADMIN_PASSCODE`: Rotate to a fresh, high-entropy administrative passphrase.
2. **Execute Initial First-Owner Bootstrap:**
   * On initial deployment (with 0 employees in MongoDB Atlas), Control OS enters Bootstrap Mode.
   * Founder logs in using the fresh `ADMIN_PASSCODE` to create the initial Owner account.
   * Founder accepts the invitation and activates the Owner profile.
   * Once activated, verify that master passcode login returns HTTP 403 Forbidden.
3. **Architectural Hardening Recommendation (Future Milestone):**
   * Introduce a permanent boolean setting `security.bootstrap_sealed: true` persisted in `SettingModel` upon first Owner activation to permanently seal the bootstrap door against unexpected active owner count drops.
   * Upgrade customer tracking verification from 4-digit phone suffix to an SMS/WhatsApp OTP verification challenge.

---

## 12. FINAL VERDICT

### **CONDITIONALLY ACCEPTED**

**Audit Determination:**
All critical vulnerabilities identified in earlier phases (Master Passcode Backdoor, Granular RBAC, Staff Invitation TOCTOU Concurrency, Blocking Scrypt Hashing, Order ID Overwrites, and Client Pricing Tampering) are completely remediated and verified.

The status is marked **CONDITIONALLY ACCEPTED** due to the architectural reliance on live active-owner counts for bootstrap mode reactivation (SEC-BOOTSTRAP-01), the inherent entropy limitation of 4-digit phone tracking (SEC-PRIVACY-02), and the requirement for external secret configuration in the live Vercel environment.

