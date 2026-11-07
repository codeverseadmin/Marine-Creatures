# Marine Creatures — Phase 3 Remediation Changelog

**Reference:** `MC-PHASE-3-SECURITY-NOV2026`  
**Classification:** Production Security Remediation Changelog  
**Milestone:** Phase 3 — Final Platform Security & Production Readiness  
**Target:** Marine Creatures Storefront + Control OS  
**Date:** 07 November 2026  

---

## 1. Authentication & Master Passcode Backdoor Retirement (P0 — SEC-RBAC-P0-02)

* **[`lib/rbac/guard.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/guard.ts):**
  * Completely eliminated the `x-admin-secret` / `x-admin-passcode` bypass that granted full `type: 'service'` / `roleId: 'owner'` authority across Control OS.
  * Restricted master passcode acceptance strictly to the initial First-Owner Bootstrap Phase (`activeOwnerCount === 0`).
  * Enforced that as soon as an active Owner exists in MongoDB Atlas, all passcode overrides fail closed with HTTP 401.
* **[`lib/auth.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/auth.ts):**
  * Removed header passcode fallback from `isAdminRequest(req)`. Administrative access now strictly requires a cryptographically signed HMAC session token.
* **[`app/api/admin/login/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/login/route.ts):**
  * Master passcode login via `POST /api/admin/login` is permanently deactivated once active Owner accounts exist (returns HTTP 403 Forbidden with audit logging).

---

## 2. Complete Granular RBAC Enforcement Across Legacy Routes (P0 — SEC-RBAC-P0-01)

* **[`app/api/products/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/products/route.ts):**
  * Migrated from broad `isAdminRequest` to granular permissions:
    * `POST`: Enforces `requirePermission(req, 'products.create')`.
    * `PUT`: Enforces `requirePermission(req, 'products.update')`.
    * `DELETE`: Enforces `requirePermission(req, 'products.delete')`.
    * `GET`: Preserved as public catalogue retrieval.
* **[`app/api/inquiries/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/inquiries/route.ts):**
  * `GET`: Enforces `requirePermission(req, 'enquiries.read')`.
  * `PATCH`: Enforces `requirePermission(req, 'enquiries.update_status')`.
  * `DELETE`: Enforces `requirePermission(req, 'enquiries.delete')`.
  * `POST`: Public customer lead creation protected with IP rate limiting and field length bounds.
* **[`app/api/banners/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/banners/route.ts):**
  * `POST`, `PUT`, `PATCH`, `DELETE`: Enforce `requirePermission(req, 'content.manage')`.
  * `GET`: Preserved as public banner retrieval.
* **[`app/api/settings/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/settings/route.ts):**
  * `POST`: Enforces `requirePermission(req, 'settings.update')`.
  * `GET`: Preserved as public business settings retrieval.
* **[`app/api/orders/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/route.ts):**
  * `GET`: Enforces `requirePermission(req, 'orders.read')`.
  * `PATCH`: Enforces `requireAnyPermission(req, ['orders.update_status', 'orders.approve', 'orders.tracking.update'])`.
  * `DELETE`: Enforces `requirePermission(req, 'orders.delete')`.
* **[`app/api/orders/[id]/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/[id]/route.ts):**
  * Administrative access requires `orders.read`. Customer access requires valid CSPRNG invoice access token.
  * Token issuance / reissuance (`POST`) enforces `requireAnyPermission(req, ['orders.invoice.generate', 'orders.update_status'])`.
* **[`app/api/orders/track/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts):**
  * Admin detailed manifest access requires `orders.read`.
* **[`app/api/worlds/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/worlds/route.ts):**
  * Draft preview mode (`?preview=true`) enforces `requirePermission(req, 'worlds.read')`.
* **[`app/api/seed/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/seed/route.ts):**
  * Permanently disabled in production (`NODE_ENV === 'production'`) with HTTP 403 Forbidden.
  * In non-production, requires `auth.isOwner` and explicit `ALLOW_SEEDING=true` environment flag.
* **[`app/api/admin/backup/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/backup/route.ts):**
  * Corrected permission string mismatch: `GET` checks `'backups.read'`, `POST` and `PUT` check `'backups.create'`.
* **[`app/api/admin/customers/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/customers/route.ts):**
  * Implemented field-level access control: callers holding only `customers.notes.create` are strictly limited to updating `internalNotes`. Modifying profile fields (`name`, `email`, `city`, `address`, `pincode`, `tags`) requires `customers.update`.

---

## 3. Employee Privilege Escalation Prevention (P0 — SEC-RBAC-P1-01)

* **[`app/api/admin/employees/[id]/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/employees/[id]/route.ts):**
  * Prevented Self-Escalation: Employees cannot alter their own `roleId`, `status`, or `customPermissions` (returns HTTP 403 Forbidden).
  * Protected Owner Accounts: Non-owners cannot modify an active Owner's profile (returns HTTP 403 Forbidden).
  * Custom Permissions Gating: Assigning or modifying `customPermissions` strictly requires `auth.isOwner` (returns HTTP 403 Forbidden for non-owners).
  * Wildcard Banned: Wildcard `'*'` permission assignment is strictly banned even for Owners (returns HTTP 400 Bad Request).
* **[`app/api/admin/employees/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/employees/route.ts):**
  * Non-owners cannot assign custom permissions during employee invitation (returns HTTP 403 Forbidden).
  * Wildcard `'*'` in invitations is banned (returns HTTP 400 Bad Request).
  * Only Owners can create or assign the `owner` role.

---

## 4. Staff Invitation Concurrency Fix (P1 — SEC-RBAC-P1-02)

* **[`app/api/auth/invitation/accept/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/auth/invitation/accept/route.ts):**
  * Replaced non-atomic `findOne` + `save` with atomic `EmployeeModel.findOneAndUpdate`.
  * Gated by: `{ invitationTokenHash: tokenHash, status: 'invited', $or: [{ invitationExpiresAt: null }, { invitationExpiresAt: { $gt: new Date() } }] }`.
  * Verified under 10 parallel concurrent requests: exactly 1 request succeeds; remaining 9 are rejected with zero duplicate accounts.

---

## 5. Non-Blocking Asynchronous Password Hashing (P1 — SEC-RBAC-P1-03)

* **[`lib/rbac/password.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/password.ts):**
  * Converted `hashPassword` and `verifyPassword` to asynchronous functions utilizing `util.promisify(crypto.scrypt)`.
  * Completely eliminated main-thread event-loop blocking during scrypt key derivation.
  * Preserved full backwards compatibility with stored `<salt_hex>:<derived_key_hex>` format and timing-safe comparison.
* Callers updated to `await verifyPassword` and `await hashPassword`:
  * `app/api/admin/login/route.ts`
  * `app/api/auth/invitation/accept/route.ts`

---

## 6. Analytics Event Endpoint Hardening (P0 — SEC-RBAC-P0-03)

* **[`app/api/admin/analytics/events/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/analytics/events/route.ts):**
  * Enforced strict IP rate limiting: max 60 events/minute per IP (`rate:analytics:events:${ip}`).
  * Added 10KB payload size cap (returns HTTP 413 Payload Too Large).
  * Enforced event name allowlist (`ALLOWED_EVENTS`).
  * Sanitized metadata: strictly allows primitive types (max 10 keys, max 200 chars), stripping dangerous properties (`__proto__`, `constructor`, `ipHash`, `isAdmin`, `roleId`).
  * Trusted IP resolution via `getClientIp(req)`.
* **[`app/api/admin/analytics/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/analytics/route.ts):**
  * Retrieval of administrative business intelligence dashboards strictly requires `analytics.read` permission.

---

## 7. QA Fixture Isolation in Production (P0)

* **[`app/api/admin/orders/[id]/invoice-pdf/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/orders/[id]/invoice-pdf/route.ts):**
* **[`app/api/admin/orders/[id]/por-pricing/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/orders/[id]/por-pricing/route.ts):**
* **[`app/api/orders/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/route.ts):**
* **[`app/api/orders/track/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts):**
* **[`app/api/orders/[id]/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/[id]/route.ts):**
  * Gated all synthetic fixture branches behind `allowFixtures = process.env.NODE_ENV !== 'production' && process.env.ALLOW_QA_FIXTURES === 'true'`.
  * In production, all requests for `MC-QA-*` query the real database and return HTTP 404 Not Found. Test activation headers (`x-reset-fixtures`) are completely ignored.

---

## 8. Customer Tracking & Invoice Privacy Hardening (P0)

* **[`app/api/orders/track/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/track/route.ts):**
  * Public unauthenticated tracking reveals strictly masked name (e.g. `R**** V****`), city, milestone step, and generic packaging item count (`"1 Marine Specimen(s) in Oxygen Thermal Packaging"`).
  * Zero raw customer phone numbers, full addresses, internal notes, or financial amounts are exposed without phone verification or valid invoice token.
* **[`app/api/orders/[id]/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/[id]/route.ts):**
  * Requires valid CSPRNG invoice token or `orders.read` employee permission. Serialized customer invoice preserves `INVOICE & DISPATCH MANIFEST` header and strips internal staff notes.

---

## 9. Non-Production Secret Governance (P1 — SEC-RBAC-P1-05)

* **[`lib/rbac/session.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rbac/session.ts):**
  * Removed static predictable fallback secret `'dev-mc-insecure-session-secret-change-in-production'`.
  * Non-production environments without `SESSION_SECRET` generate an ephemeral 32-byte cryptographic secret per process instance, preventing static token forgery while ensuring production strictly fails closed.

