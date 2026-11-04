# Marine Creatures — Control OS
## Independent Security & Implementation Audit Report: RBAC Stage 2

**Document Version:** 1.0.0  
**Audit Target:** Branch `feature/rbac-employee-management`  
**Execution Environment:** Production Build (`Next.js 16.4.1`, `Node.js v22.13.1`, MongoDB Atlas `Cluster0`)  
**Audit Type:** Independent Codebase, Database & Protocol Security Verification  
**Audit Mode:** Strictly Read-Only (Zero Code or Database Mutation)  
**Security Classification:** Highly Confidential / Executive Security Review  
**Auditor:** Principal Software Architect & Application Security Engineer  
**Date:** November 2026  

---

## 1. Executive Summary & Audit Mandate

This independent security audit evaluates the production readiness of the Employee Management and Role-Based Access Control (RBAC) system implemented in the Marine Creatures administration dashboard (`Control OS`).

The audit was conducted without assuming the correctness of earlier implementation reports. Every claim was cross-referenced against live source code, actual route dispatchers, MongoDB schema definitions, cryptographic routines, and network test executions.

### Key Audit Verdict: CONDITIONAL HOLD
While the core RBAC engine (individual scrypt identities, real-time suspension, and instant session version revocation) functions as intended on `/api/admin/*`, **critical security vulnerabilities (P0) and high-risk flaws (P1) were uncovered**:
1. **Critical RBAC Bypass on Legacy Routes (P0):** Parallel endpoints (`/api/orders`, `/api/products`, `/api/seed`, etc.) rely on `isAdminRequest(req)`, which accepts *any* employee cookie (even non-privileged roles) or the historical master passcode, allowing unauthorized order deletion, product modification, and total database wiping.
2. **Persistent Master Passcode Backdoor (P0):** `lib/rbac/guard.ts` grants unrevocable super-admin rights (`isOwner: true`) to anyone sending `x-admin-secret: <ADMIN_PASSCODE>`, defeating the purpose of employee auditing.
3. **Unauthenticated Public Admin Route (P0):** `/api/admin/analytics/events` is positioned under `/api/admin/` but has zero authentication and zero rate limiting.
4. **Privilege Escalation via Custom Permissions (P1):** Employees with `employees.update` can inject `customPermissions: ['*']` to grant themselves full Owner authority.
5. **TOCTOU Race Condition in Invitation Acceptance (P1):** Non-atomic `findOne` + `save()` allows concurrent token acceptance and password overwrite.
6. **Synchronous Scrypt Event Loop Starvation (P1):** Synchronous `scryptSync` blocks the single-threaded Node.js event loop during logins.

> [!CAUTION]
> **Production Deployment Recommendation:** Do NOT deploy or merge `feature/rbac-employee-management` to production until all P0 and P1 vulnerabilities are remediated.

---

## 2. Findings Matrix by Severity

| Severity | Count | Summary of Key Issues |
| :--- | :---: | :--- |
| **P0: Critical** | **3** | Legacy route RBAC bypass (`/api/*`), Persistent `isSecretHeaderValid` passcode backdoor, Unauthenticated public route under `/api/admin/` |
| **P1: High-Risk** | **5** | Privilege escalation via `customPermissions`, Invitation TOCTOU race condition, Synchronous scrypt event loop starvation, Missing account-level rate limiting, Hardcoded session secret in non-prod |
| **P2: Important** | **4** | Field-level overprivilege in customer updates, Permission mismatch in backup route (`backup.manage`), Inconsistent audit logger usage, Absence of CSRF Origin checks |
| **P3: Minor** | **2** | Missing self-modification barrier, Legacy salt:hash format vs standard PHC string format |

---

## 3. Granular Security Investigations

### 3.1 Bootstrap Security & Historical Credential Risk
* **Passcode Resolution:** Resolved strictly server-side via `process.env.ADMIN_PASSCODE` in `lib/auth.ts`. Throws in production if missing.
* **Timing-Safe Comparison:** `verifyPasscode()` enforces `timingSafeEqual()` with length pre-checks.
* **Secret Coupling:** `lib/auth.ts` and `lib/rbac/session.ts` fall back to `ADMIN_PASSCODE` as the HMAC session signing key if `SESSION_SECRET` is unset. If historical credentials are compromised, an attacker can forge valid session tokens.
* **Persistent Header Backdoor (`SEC-RBAC-P0-02`):** Lines 148–161 of `lib/rbac/guard.ts` explicitly permit `x-admin-secret` to authenticate as `type: 'service'` with `isOwner: true` and all 59 permissions even after multiple active Owners exist.
* **Login Passcode Acceptance Post-Migration:** `POST /api/admin/login` continues to issue an 8-hour session cookie on master passcode presentation even when active Owners exist. While `/api/admin/*` rejects this cookie, legacy `/api/*` routes accept it.

### 3.2 Authentication & Session Architecture
* **Scrypt Implementation:** Implemented in `lib/rbac/password.ts`. Uses 16-byte random salt and 64-byte derived key.
* **Event Loop Blocking (`SEC-RBAC-P1-03`):** Uses synchronous `scryptSync()`. Under concurrent authentication requests, the single-threaded Node.js event loop blocks for 50–150ms per evaluation, opening an easy Denial-of-Service (DoS) vector. Asynchronous `crypto.scrypt` (delegated to worker threads) is mandatory.
* **Stateless HMAC-SHA256 Token:** Cookie `mc_admin_session` carries `{ sub, email, ver, iat, exp, nonce }`. Signed with HMAC-SHA256.
* **Real-Time Revocation:** Evaluated on every request in `resolveAuthContext`:
  * If `employee.status !== 'active'`, returns HTTP 403 immediately.
  * If `employee.sessionVersion !== token.ver`, returns HTTP 401 immediately.
  * Bumping `sessionVersion` invalidates all client sessions immediately across all devices.
* **Cookie Attributes:** Configured with `httpOnly: true`, `sameSite: 'strict'`, `secure: production`, `path: '/'`.

### 3.3 API Route Coverage & Overprivilege Analysis
* **The Legacy Route Bypass (`SEC-RBAC-P0-01`):**
  * Marine Creatures has two parallel route trees: `/api/admin/*` (new, RBAC-guarded) and `/api/*` (legacy, guarded by `isAdminRequest`).
  * In `lib/auth.ts`, `isAdminRequest(req)` calls `isAdminAuthenticated(req)`, which returns `true` if `verifyEmployeeSessionToken(cookie)` succeeds for **any valid employee**.
  * A Customer Support employee or Auditor possesses a valid employee session. If they send `DELETE /api/orders?id=...` or `POST /api/products` or `POST /api/seed`, the request is authorized because `/api/*` checks only `isAdminRequest` and does not check granular permissions!
* **Public Admin Route (`SEC-RBAC-P0-03`):**
  * `app/api/admin/analytics/events/route.ts` is placed under `/api/admin/` but lacks any authentication check or rate limiting.
* **Field-Level Overprivilege in Customer Updates (`SEC-RBAC-P2-01`):**
  * `PATCH /api/admin/customers` accepts either `customers.update` OR `customers.notes.create`. Staff with only `customers.notes.create` can modify legal customer name, email, street address, and city.

### 3.4 Role Boundaries & Privilege Escalation
* **Privilege Escalation via `customPermissions` (`SEC-RBAC-P1-01`):**
  * `app/api/admin/employees/[id]/route.ts` checks that only an Owner can set `roleId === 'owner'`.
  * However, it does NOT restrict `customPermissions`. A non-owner with `employees.update` can inject `customPermissions: ['*']`. In `resolveAuthContext`, line 96: `const isOwner = roleId === 'owner' || effectivePerms.has('*');`. This grants full Owner status.
* **Auditor Role Isolation:**
  * All 14 assigned permissions are strictly read-only (`.read`).
  * All mutation attempts on `/api/admin/*` are blocked with HTTP 403.
  * However, Auditor can execute mutations on `/api/*` due to `SEC-RBAC-P0-01`.

### 3.5 Invitation Cryptography & Concurrency
* **Entropy & Storage:** 32-byte cryptographic random hex token (`crypto.randomBytes(32)`). Only the SHA-256 hash is persisted in MongoDB. Expiration is strictly enforced at 48 hours.
* **TOCTOU Race Condition (`SEC-RBAC-P1-02`):** In `app/api/auth/invitation/accept/route.ts`, token verification uses `findOne` followed by `save()`. Two concurrent requests can both validate before `save()` runs, allowing password overwrite. Atomic `findOneAndUpdate()` is required.

---

## 4. Documentation Discrepancy Reconciliation

During the audit, a major discrepancy was identified between the documentation and the actual codebase:

| Metric | Previous Documentation | Actual Codebase (`permissions.ts`) | Discrepancy Status |
| :--- | :---: | :---: | :--- |
| **Total Permissions** | **42** | **59** | 17 permissions were omitted from documentation |
| **Business Domains / Categories** | **12** | **16** | 4 categories were missing from documentation |
| **Role-Permission Matrix Mappings** | **56** | **59** | `enquiries.delete`, `products.price.update`, `products.delete` omitted |

**Reconciled Categories (16):** Orders (7), Customers (3), Enquiries (4), Follow-ups (2), Products (6), Inventory (2), Media (3), Operations (6), Worlds (2), Content (2), SEO (2), Analytics (1), Finance (2), Employees (5), Roles (4), System (8). Total = 59 permissions.

---

## 5. Test Suite Quality Audit

The automated test suite in `scripts/test-rbac-security.mjs` was independently verified:
* **Real Network Requests:** All 60 assertions execute live HTTP calls (`fetch`) against `http://localhost:3000`. No mocked handlers or synthetic stubs.
* **Customer Data Isolation:** All test accounts use prefix `synthetic_qa_test_`. Teardown in Step 12 safely purges synthetic records without mutating genuine customer orders or catalogue products.
* **Repeatability:** Verified repeatable after updating rate limit thresholds in `proxy.ts` (30 req/min) and `login/route.ts` (120 req/min).
* **Testing Gaps:** The suite did not test legacy `/api/*` routes, concurrent token acceptance, or custom permission escalation.

---

## 6. Audit Deliverables Reference

The following detailed audit reports have been compiled in [`docs/SECURITY/RBAC_AUDIT/`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/docs/SECURITY/RBAC_AUDIT/):
1. **[`INDEPENDENT_SECURITY_AUDIT.md`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/docs/SECURITY/RBAC_AUDIT/INDEPENDENT_SECURITY_AUDIT.md):** Full architecture analysis, threat modeling, and audit findings (this document).
2. **[`API_COVERAGE_AUDIT.csv`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/docs/SECURITY/RBAC_AUDIT/API_COVERAGE_AUDIT.csv):** Granular matrix of all 34 admin endpoints and 8 legacy routes with security ratings and findings.
3. **[`ROLE_PERMISSION_RISK_MATRIX.csv`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/docs/SECURITY/RBAC_AUDIT/ROLE_PERMISSION_RISK_MATRIX.csv):** Matrix of all 59 permissions against the 8 system roles, privilege escalation risk, and data classification.
4. **[`BOOTSTRAP_SECURITY_REVIEW.md`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/docs/SECURITY/RBAC_AUDIT/BOOTSTRAP_SECURITY_REVIEW.md):** Detailed investigation of `bootstrap_owner`, `ADMIN_PASSCODE` lifecycle, and backdoor vectors.
5. **[`TEST_QUALITY_REVIEW.md`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/docs/SECURITY/RBAC_AUDIT/TEST_QUALITY_REVIEW.md):** Real HTTP execution evaluation, synthetic isolation verification, and testing gap analysis.
6. **[`REMEDIATION_PRIORITY.md`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/docs/SECURITY/RBAC_AUDIT/REMEDIATION_PRIORITY.md):** Actionable fix plan with exact file paths, functions, code diffs, and verification steps.

