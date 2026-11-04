# Marine Creatures — Control OS: Bootstrap Security Review

**Document Version:** 1.0.0  
**Target Environment:** Production Admin (`Control OS`)  
**Audit Date:** November 2026  
**Auditor:** Principal Application Security Engineer & Systems Architect  
**Classification:** Confidential / Security Audit  

---

## 1. Executive Summary

This security review independently investigates the `bootstrap_owner` mechanism, the founder passcode verification pathway, cryptographic secret derivation, and transition semantics from legacy single-passcode administration to individual Role-Based Access Control (RBAC).

Under our zero-trust threat model, **historical administrative credentials must be treated as potentially compromised**. Any pathway allowing historical credentials to bypass individual employee auditing, session versioning, or granular permission barriers represents an acute vulnerability.

---

## 2. Passcode Source & Secret Validation

### 2.1 Passcode Resolution (`lib/auth.ts`)
* **Environment Variable:** `process.env.ADMIN_PASSCODE`.
* **Server-Only Exposure:** Function `getAdminPasscode()` is exported only from `lib/auth.ts` and executed strictly in server-side route handlers. It is never imported into client components.
* **Production Validation:**
  ```typescript
  export function getAdminPasscode(): string {
    const code = process.env.ADMIN_PASSCODE;
    if (!code) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_PASSCODE environment variable is not configured');
      }
      return '';
    }
    return code.trim();
  }
  ```
  In production, the application will fail fast on startup if `ADMIN_PASSCODE` is unconfigured.
* **Timing-Safe Verification:** Input evaluation in `verifyPasscode(input)` executes `timingSafeEqual(inputBuffer, actualBuffer)` with strict buffer length pre-checks to mitigate side-channel timing attacks.

### 2.2 Critical Vulnerability: Secret Coupling & Hardcoded Fallback
1. **Coupled Session Secret (`lib/auth.ts` & `lib/rbac/session.ts`):**
   ```typescript
   const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSCODE;
   ```
   If `SESSION_SECRET` is not set explicitly in `.env.local`, the application automatically falls back to `ADMIN_PASSCODE` as the HMAC-SHA256 signing key.
   * **Exploitability:** If historical administrative credentials were leaked or shared with former employees/contractors, an attacker possessing `ADMIN_PASSCODE` can independently forge valid `mc_admin_session` cookie signatures for any employee identity.
2. **Hardcoded Fallback in Non-Production (`lib/rbac/session.ts` line 26):**
   ```typescript
   if (!secret) {
     if (process.env.NODE_ENV === 'production') {
       throw new Error('SESSION_SECRET environment variable is not configured');
     }
     return 'dev-mc-insecure-session-secret-change-in-production';
   }
   ```
   In staging, preview, or development environments where `NODE_ENV !== 'production'`, an attacker can forge arbitrary admin sessions using this known static string.

---

## 3. Rate Limiting & Brute-Force Resilience

### 3.1 Dual-Layer Rate Limiting
1. **Edge / Middleware Rate Limiter (`proxy.ts`):**
   * Path: `/api/admin/login` (POST only)
   * Limit: 30 requests per 60-second sliding window per IP.
   * Backing: In-memory sliding window Map.
2. **Persistent Route Rate Limiter (`app/api/admin/login/route.ts`):**
   * Key: `login_ip_${ip}`
   * Limit: 120 requests per 60 seconds per IP.
   * Backing: MongoDB `ratelimits` collection with TTL index.

### 3.2 Vulnerability: Absence of Account-Level (Email) Rate Limiting
* Both limiters track solely by **client IP address** (`login_ip_${ip}`).
* Neither limiter tracks attempts against specific employee accounts (`cleanEmail`).
* **Exploitability:** An attacker utilizing rotating proxies, mobile cellular IP pools, or distributed cloud endpoints can execute targeted brute-force or credential-stuffing attacks against a high-value account (e.g., `founder@marinecreatures.com`) without triggering the 30-req/min per-IP threshold.
* **Impact:** High (P1). An account-level rate limiter (`login_email_${cleanEmail}`) with progressive lockout (e.g., 5 failed attempts locks the email for 15 minutes) is required.

---

## 4. Bootstrap Lifecycle & First-Owner Creation

### 4.1 Bootstrap State Evaluation (`lib/rbac/guard.ts`)
The server dynamically assesses whether Bootstrap Mode is active by querying the database:
```typescript
const activeOwnerCount = await EmployeeModel.countDocuments({
  roleId: 'owner',
  status: 'active',
});
```

* **Zero-State Behavior (`activeOwnerCount === 0`):**
  * Presenting `ADMIN_PASSCODE` grants temporary context:
    * `type: 'bootstrap_owner'`
    * `roleId: 'owner'`
    * `permissions: Set(all 59 capabilities)`
  * Allows the founder to access `/admin/employees` and generate their primary Owner invitation.
* **Transition to Strict RBAC:**
  * Once the founder accepts their invitation and establishes their scrypt password, `activeOwnerCount` becomes $1$.
  * Subsequent requests evaluating `activeOwnerCount === 0` resolve to `false`.

### 4.2 Critical Defect: Login Handler Accepts Passcode After Migration
In `app/api/admin/login/route.ts` (lines 158–195):
* When an active Owner exists (`activeOwnerCount > 0`), submitting `{ passcode: ADMIN_PASSCODE }` **still succeeds with HTTP 200 OK** and issues an 8-hour legacy session cookie (`createSessionToken()`).
* When that cookie is subsequently presented to `/api/admin/*`, `resolveAuthContext` rejects it with HTTP 401 (*"System has been migrated to individual employee accounts"*).
* **Vulnerability:** The login endpoint falsely asserts successful authentication, issues a signed session cookie, and permits the bearer to access legacy `/api/*` endpoints (such as `/api/products` and `/api/seed`) which still rely on `isAdminRequest(req)`.
* **Required Fix:** Once `activeOwnerCount > 0`, `app/api/admin/login` must reject passcode authentication with HTTP 403 (*"Passcode login is disabled. Please sign in with your employee email and password."*).

---

## 5. Critical Backdoor: Persistent Header Bypass

### 5.1 The `isSecretHeaderValid` Vulnerability
Inspect lines 122–161 in `lib/rbac/guard.ts`:
```typescript
const secretHeader = req.headers.get('x-admin-secret') || req.headers.get('x-admin-passcode');
const isSecretHeaderValid = secretHeader ? verifyPasscode(secretHeader) : false;

if (isLegacyAdminCookie || isSecretHeaderValid) {
  await connectToDatabase();
  const activeOwnerCount = await EmployeeModel.countDocuments({ roleId: 'owner', status: 'active' });

  if (activeOwnerCount === 0) {
    return { authenticated: true, type: 'bootstrap_owner', ... };
  }

  // DANGER: If active owner exists, allow secretHeader for automated server-to-server operations!
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
}
```

### 5.2 Security Assessment
* **Vulnerability:** Even after the system is fully migrated and multiple active Owners exist, **anyone who supplies `x-admin-secret: <ADMIN_PASSCODE>` is granted full Owner authority (`isOwner: true`, all 59 permissions)** across every admin API route!
* **Exploitability:** Trivial. Any past employee, contractor, or script containing the old passcode can completely bypass individual employee logins, 2FA/scrypt security, and role boundaries without leaving an attributable audit trail (actions are logged generically as `system_service`).
* **Classification:** **P0 — Critical Security Vulnerability**.
* **Remediation:** Remove the `isSecretHeaderValid` bypass entirely. If automated server-to-server or webhook calls are required, implement cryptographically isolated API keys stored as SHA-256 hashes in MongoDB with granular permissions, rather than reusing the founder's master passcode.

---

## 6. Legacy Route RBAC Bypass Summary

The following public/legacy routes bypass RBAC entirely by calling `isAdminRequest(req)` instead of `requirePermission()`:

| Route | Methods Exposed | Current Guard | Risk |
| :--- | :--- | :--- | :--- |
| `/api/orders` | `GET`, `PATCH`, `DELETE` | `isAdminRequest(req)` | Any employee (e.g. inventory) or passcode holder can delete orders or harvest customer PII |
| `/api/products` | `POST`, `PUT`, `DELETE` | `isAdminRequest(req)` | Any employee can modify or delete catalogue products |
| `/api/inquiries` | `GET`, `PATCH`, `DELETE` | `isAdminRequest(req)` | Any employee can delete customer concierge leads |
| `/api/banners` | `POST`, `PUT`, `DELETE`, `PATCH` | `isAdminRequest(req)` | Any employee can overwrite promotional banners |
| `/api/seed` | `POST` | `isAdminRequest(req)` | **Catastrophic:** Any employee or passcode holder can wipe all products and banners |
| `/api/settings` | `POST` | `isAdminRequest(req)` | Any employee can alter core system settings |
| `/api/worlds` | `POST` | `isAdminRequest(req)` | Any employee can alter case study portfolios |

---

## 7. Bootstrap Review Verdict

The bootstrap mechanism succeeds in preventing founder lockout during initial setup. However, the presence of the persistent `isSecretHeaderValid` backdoor, combined with legacy `/api/*` routes relying on `isAdminRequest(req)`, leaves open critical attack vectors that defeat the core purpose of RBAC. Immediate remediation of these items is required prior to production release.

