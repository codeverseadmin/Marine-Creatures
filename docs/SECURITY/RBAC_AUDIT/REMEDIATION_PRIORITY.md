# Marine Creatures — Control OS: RBAC Remediation Priority Plan

**Document Version:** 1.0.0  
**Target Environment:** Production Admin (`Control OS`)  
**Audit Date:** November 2026  
**Auditor:** Principal Software Architect & Application Security Engineer  
**Classification:** Confidential / Actionable Security Plan  

---

## 1. Remediation Priority Summary

| Priority | Finding ID | Vulnerability Title | Affected File / Function | Exploitability | Business Impact |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **P0** | **SEC-RBAC-P0-01** | Legacy Route RBAC Bypass (`/api/*`) | `app/api/{orders,products,inquiries,seed,settings}/route.ts` | High | Any employee or passcode bearer can wipe products, delete orders, or harvest PII |
| **P0** | **SEC-RBAC-P0-02** | Persistent Master Passcode Backdoor | `lib/rbac/guard.ts` (`isSecretHeaderValid`) | High | Historical credentials grant unrevocable super-admin rights bypassing RBAC |
| **P0** | **SEC-RBAC-P0-03** | Unauthenticated Public Admin Event Spammer | `app/api/admin/analytics/events/route.ts` | High | Unauthenticated actors can flood MongoDB Atlas with arbitrary event objects |
| **P1** | **SEC-RBAC-P1-01** | Privilege Escalation via Custom Permissions | `app/api/admin/employees/[id]/route.ts` | Medium | Non-owner with `employees.update` can inject `['*']` to gain full Owner authority |
| **P1** | **SEC-RBAC-P1-02** | TOCTOU Race Condition in Invitation Acceptance | `app/api/auth/invitation/accept/route.ts` | Medium | Concurrent acceptance allows password overwrite due to non-atomic query |
| **P1** | **SEC-RBAC-P1-03** | Synchronous Scrypt Event Loop Starvation | `lib/rbac/password.ts` (`scryptSync`) | Medium | Concurrent login requests freeze the single-threaded Node.js event loop |
| **P1** | **SEC-RBAC-P1-04** | Missing Account-Level Rate Limiting | `app/api/admin/login/route.ts` | Medium | Distributed IP brute force against specific employee emails without lockout |
| **P1** | **SEC-RBAC-P1-05** | Hardcoded Session Secret Fallback in Non-Prod | `lib/rbac/session.ts` (`getSigningSecret`) | Low | Session forgery in staging / development environments |
| **P2** | **SEC-RBAC-P2-01** | Field-Level Overprivilege in Customer Updates | `app/api/admin/customers/route.ts` | Low | Support staff with `notes.create` can overwrite customer name and address |
| **P2** | **SEC-RBAC-P2-02** | Permission String Mismatch in Backup Route | `app/api/admin/backup/route.ts` | Low | Checks `'backup.manage'` instead of `'backups.read'` / `'backups.create'` |
| **P2** | **SEC-RBAC-P2-03** | Inconsistent Audit Logger Usage | `app/api/admin/{system/settings,orders,customers}` | Low | Actions logged as generic `mc_admin_session` instead of employee email |
| **P2** | **SEC-RBAC-P2-04** | Absence of Explicit CSRF Origin Verification | `proxy.ts` / Middleware | Low | Defense-in-depth gap on mutating admin requests |
| **P3** | **SEC-RBAC-P3-01** | Lack of Self-Modification Prevention | `app/api/admin/employees/[id]/route.ts` | Very Low | User with `employees.update` can edit their own role |
| **P3** | **SEC-RBAC-P3-02** | Legacy Hash Format vs PHC Standard | `lib/rbac/password.ts` | Very Low | Missing algorithm parameters in hash string |

---

## 2. Granular Remediation Specifications

---

### Finding SEC-RBAC-P0-01: Legacy Route RBAC Bypass
* **Affected Files:**
  * `app/api/orders/route.ts`
  * `app/api/orders/[id]/route.ts`
  * `app/api/products/route.ts`
  * `app/api/inquiries/route.ts`
  * `app/api/banners/route.ts`
  * `app/api/seed/route.ts`
  * `app/api/settings/route.ts`
  * `app/api/worlds/route.ts`
* **Evidence:** These routes guard administrative mutations with `if (!isAdminRequest(req))`. In `lib/auth.ts`, `isAdminRequest` returns `true` for **any** valid employee session (regardless of role or permissions) or any request supplying the historical `ADMIN_PASSCODE`.
* **Exploitability:** Trivial. An employee with role `customer_support` can call `DELETE /api/orders?id=MC-8921` or `POST /api/seed` (wiping all products and banners).
* **Recommended Fix:**
  1. Deprecate administrative mutations on public `/api/*` routes.
  2. Direct all dashboard administrative operations strictly through `/api/admin/*`.
  3. If `/api/*` endpoints must retain admin operations, migrate their gatekeeper from `isAdminRequest(req)` to `requirePermission(req, '<domain>.<action>')`.
  4. Specifically on `app/api/seed/route.ts`, permanently disable the route in production or require `auth.isOwner` with an explicit environment flag `ALLOW_SEEDING=true`.

---

### Finding SEC-RBAC-P0-02: Persistent Master Passcode Backdoor
* **Affected File:** `lib/rbac/guard.ts` (lines 148–161)
* **Evidence:**
  ```typescript
  if (isSecretHeaderValid) {
    return {
      authenticated: true,
      type: 'service',
      actorId: 'system_service',
      actorName: 'System Service',
      actorEmail: 'system@marinecreatures.local',
      roleId: 'owner',
      permissions: new Set(Object.keys(PERMISSIONS_REGISTRY)),
      isOwner: true,
    };
  }
  ```
* **Exploitability:** Any actor supplying `x-admin-secret: <ADMIN_PASSCODE>` is granted full Owner capabilities across all admin endpoints indefinitely, completely bypassing individual employee identity, scrypt authentication, and audit accountability.
* **Recommended Fix:**
  * Delete lines 148–161 in `lib/rbac/guard.ts`.
  * The master passcode must **only** be accepted during Bootstrap Mode (`activeOwnerCount === 0`).
  * Once an active Owner exists, master passcode access must be completely deactivated.

---

### Finding SEC-RBAC-P0-03: Unauthenticated Public Admin Event Spammer
* **Affected File:** `app/api/admin/analytics/events/route.ts`
* **Evidence:** `POST /api/admin/analytics/events` has no authentication check, no permission check, and no rate limiting.
* **Exploitability:** External bots can send millions of POST requests to `/api/admin/analytics/events`, filling MongoDB storage and degrading database performance.
* **Recommended Fix:**
  * Move this public route from `/api/admin/analytics/events` to `/api/analytics/events` to eliminate administrative path confusion.
  * Implement rate limiting: `checkRateLimit('analytics_event_' + ip, 60, 60)` (max 60 events/min per IP).

---

### Finding SEC-RBAC-P1-01: Privilege Escalation via Custom Permissions
* **Affected File:** `app/api/admin/employees/[id]/route.ts` (lines 121–124)
* **Evidence:**
  ```typescript
  if (customPermissions && Array.isArray(customPermissions)) {
    employee.customPermissions = customPermissions;
    employee.sessionVersion = (employee.sessionVersion || 1) + 1;
  }
  ```
* **Exploitability:** An employee holding `employees.update` permission can issue a PATCH request setting `customPermissions: ['*']`. In `resolveAuthContext`, line 96: `const isOwner = roleId === 'owner' || effectivePerms.has('*');`. This immediately elevates the employee to full Owner authority.
* **Recommended Fix:**
  * Restrict `customPermissions` assignment strictly to callers where `auth.isOwner === true`.
  * Prohibit the wildcard `'*'` inside `customPermissions` altogether.

---

### Finding SEC-RBAC-P1-02: TOCTOU Race Condition in Invitation Acceptance
* **Affected File:** `app/api/auth/invitation/accept/route.ts` (lines 41–75)
* **Evidence:** The endpoint executes `findOne({ invitationTokenHash: tokenHash, status: 'invited' })`, then calculates the scrypt hash, and finally calls `await employee.save()`.
* **Exploitability:** Two simultaneous requests can both find the employee in `'invited'` state before either executes `save()`. The second request overwrites the password set by the first.
* **Recommended Fix:**
  * Replace `findOne` + `save` with an atomic `findOneAndUpdate`:
    ```typescript
    const employee = await EmployeeModel.findOneAndUpdate(
      {
        invitationTokenHash: tokenHash,
        status: 'invited',
        $or: [
          { invitationExpiresAt: null },
          { invitationExpiresAt: { $gt: new Date() } },
        ],
      },
      {
        $set: {
          passwordHash: hashPassword(password),
          status: 'active',
          invitationTokenHash: null,
          invitationExpiresAt: null,
          sessionVersion: 1,
          lastLoginAt: new Date(),
          lastLoginIp: ip,
        },
      },
      { new: true }
    );
    ```

---

### Finding SEC-RBAC-P1-03: Synchronous Scrypt Event Loop Starvation
* **Affected File:** `lib/rbac/password.ts` (lines 38 & 57)
* **Evidence:** Uses `scryptSync(password, salt, KEY_LEN_BYTES)`.
* **Exploitability:** Synchronous scrypt computation requires 50–150ms of blocking CPU time on the Node.js main thread. Ten concurrent login attempts freeze all web server traffic for over one second.
* **Recommended Fix:**
  * Convert `hashPassword` and `verifyPassword` to asynchronous functions utilizing `util.promisify(crypto.scrypt)`:
    ```typescript
    import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
    import { promisify } from 'util';
    const scryptAsync = promisify(scrypt);

    export async function hashPassword(password: string): Promise<string> {
      const salt = randomBytes(SALT_BYTES);
      const derivedKey = (await scryptAsync(password, salt, KEY_LEN_BYTES)) as Buffer;
      return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
    }
    ```

---

### Finding SEC-RBAC-P1-04: Missing Account-Level Login Rate Limiting
* **Affected File:** `app/api/admin/login/route.ts`
* **Evidence:** Only evaluates `checkRateLimit('login_ip_' + ip, 120, 60)`.
* **Recommended Fix:**
  * Add a secondary rate limiter by normalized email address:
    ```typescript
    const emailRateLimit = await checkRateLimit(`login_email_${cleanEmail}`, 5, 300);
    if (!emailRateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many failed login attempts for this account. Please wait 5 minutes.' },
        { status: 429 }
      );
    }
    ```

---

### Finding SEC-RBAC-P2-01: Field-Level Overprivilege in Customer Updates
* **Affected File:** `app/api/admin/customers/route.ts` (lines 99–140)
* **Evidence:** Accepts either `customers.update` OR `customers.notes.create`. An employee with only `customers.notes.create` can modify `name`, `email`, `address`, `city`, and `pincode`.
* **Recommended Fix:**
  ```typescript
  const canUpdateProfile = auth.isOwner || auth.permissions.has('customers.update');
  if (canUpdateProfile) {
    if (typeof name === 'string' && name.trim()) customer.name = name.trim();
    if (typeof email === 'string') customer.email = email.trim();
    if (typeof address === 'string') customer.address = address.trim();
    if (typeof city === 'string') customer.city = city.trim();
    if (typeof pincode === 'string') customer.pincode = pincode.trim();
  }
  // All authorized users can append internalNotes
  if (typeof internalNotes === 'string') customer.internalNotes = internalNotes;
  ```

---

### Finding SEC-RBAC-P2-02: Permission Mismatch in Backup Route
* **Affected File:** `app/api/admin/backup/route.ts` (line 18)
* **Evidence:** Checks `'backup.manage'`, which is not present in `PERMISSIONS_REGISTRY`. Returns 401 instead of 403.
* **Recommended Fix:**
  * For `GET /api/admin/backup`, require `backups.read`.
  * For `POST /api/admin/backup`, require `backups.create`.
  * Return standard HTTP 403 on permission denial.

---

### Finding SEC-RBAC-P2-03: Inconsistent Audit Logger Usage
* **Affected Files:** `app/api/admin/orders/route.ts`, `app/api/admin/customers/route.ts`, `app/api/admin/system/settings/route.ts`
* **Evidence:** Imports `recordAuditLog` from `@/lib/audit` rather than `@/lib/rbac/guard`.
* **Recommended Fix:** Standardize on `recordAuditLog` from `@/lib/rbac/guard`, passing `actor: auth.actorEmail`.

