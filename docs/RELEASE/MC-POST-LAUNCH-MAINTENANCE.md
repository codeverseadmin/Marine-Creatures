# MARINE CREATURES — POST-LAUNCH MAINTENANCE RUNBOOK

**Reference:** `MC-POST-LAUNCH-MAINTENANCE`  
**Classification:** Operational Runbook & Ongoing Systems Governance  
**Audience:** Site Reliability Engineers, Lead Developers, Platform Administrators  
**Authority:** CODEVERSE Technologies — Chief Technology Office  
**Date:** November 8, 2026  
**Repository:** `marine-creatures`

---

## 1. OPERATIONAL ARCHITECTURE & MONITORING

### 1.1 Core System Health Metrics
The platform operates on Next.js 16 deployed on Vercel with MongoDB Atlas (Cluster0). Key monitoring vectors:
1. **API Latency & Health:** Monitor `/api/health` and `/api/admin/system/health`. Baseline p95 API response should remain < 350ms.
2. **Database Connection Pool:** MongoDB Mongoose pool is capped at `maxPoolSize: 10` per serverless instance with `bufferCommands: false`. If connection spikes occur, verify Atlas connection telemetry.
3. **Audit Log Streams:** Inspect `AuditLogModel` entries via Control OS at `/admin/system/audit`. Filter by `EMPLOYEE_LOGIN_FAILED`, `EMPLOYEE_SESSIONS_REVOKED`, and `SECURITY_SETTING_CHANGED`.

### 1.2 Rate Limiting & Abuse Prevention
- **Implementation:** [`lib/rate-limit.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/rate-limit.ts) enforces per-IP sliding window counters across:
  - `login_ip_*`: 5 failed attempts per 15 minutes before 429 lockout.
  - `invite_accept_*`: 10 attempts per 60 seconds.
  - `analytics:events:*`: 60 events per minute per IP.
- **Alert Trigger:** An alert should fire if any IP triggers > 3 consecutive HTTP 429 responses in a 5-minute window.

---

## 2. SECRET ROTATION & CREDENTIAL HYGIENE

### 2.1 Rotating `SESSION_SECRET`
If `SESSION_SECRET` requires periodic rotation or is suspected of compromise:
1. **Generate Secret:** Generate a cryptographically secure 256-bit random hex string locally:
   ```bash
   openssl rand -hex 32
   ```
2. **Update Vercel:** Open Vercel Project Settings > Environment Variables > Edit `SESSION_SECRET` for the **Production** environment.
3. **Deploy:** Trigger a redeployment in Vercel to load the new environment variable into warm serverless execution lambdas.
4. **Behavioral Impact:**
   - All currently signed employee session cookies will fail HMAC validation (`verifyEmployeeSessionToken` returns `null`).
   - Staff will be smoothly redirected to `/admin` to log in again with their email and password.
   - **Zero customer order, invoice, or catalogue data is modified.**

### 2.2 Rotating Staff Passwords & Revoking Sessions
- **Immediate Session Invalidation:** If an employee loses a device or resigns, an administrator with `employees.update` permission can revoke sessions via Control OS or by calling `POST /api/admin/employees/[id]/revoke-sessions`.
- **Mechanism:** This increments `employee.sessionVersion` in MongoDB Atlas. Any active token carrying an older version will be rejected immediately upon the next API call without waiting for token TTL expiration.

---

## 3. DATABASE BACKUP & DISASTER RECOVERY

### 3.1 MongoDB Atlas Automated Backups
- **Continuous Backups:** MongoDB Atlas Point-in-Time Recovery (PITR) is active on Cluster0.
- **Snapshot Retention:** Daily snapshots are retained for 7 days; weekly snapshots for 4 weeks.
- **Verification Routine:** SRE team should conduct a quarterly test restore into an isolated staging cluster (`Cluster0-Staging-Recovery`) to verify backup integrity.

### 3.2 Accidental Data Loss Prevention
- **Critical Collections:** `orders`, `products`, `employees`, `roles`, `settings`, `auditlogs`.
- **Safety Directive:** Dropping collections, running unconstrained updates (`$set` without `_id` filters), or deleting orders is strictly prohibited. Production database seeding via `POST /api/seed` is permanently locked out in `NODE_ENV === 'production'`.

---

## 4. CATALOGUE & WARRANTY MAINTENANCE

### 4.1 Adding New Products
- **Default Warranty Status:** All newly created products default to `warranty.enabled = false` until explicitly configured by an administrator.
- **Governance ID Stability:** Once assigned, a product's canonical ID (`id`) must never be modified, as historical orders and media assets reference this identifier.
- **Slug Management:** If an editable slug is modified, `resolveAuthoritativeProduct` maintains backwards compatibility by resolving both the original `id` and the updated `slug`.

### 4.2 Variant Pricing Integrity
- When configuring multi-variant products (e.g. lighting fixtures, skimmers):
  1. Specify the model name, SKU, specifications, and exact variant price in the Variants editor.
  2. The server independently verifies variant pricing during checkout.
  3. Never set variant price to ₹0 unless the item is explicitly intended as a free gift.

---

## 5. ORDER & INVOICE MANAGEMENT

### 5.1 Price on Request (POR) Workflows
- Marine specimens or specialized equipment marked `priceOnRequest: true` are submitted with status `PENDING_POR`.
- Staff must resolve the agreed unit price via Control OS order management before the order can be approved or fulfilled.
- When resolved, the approved price is permanently locked into `item.agreedUnitPrice` on the historical order document.

### 5.2 Invoice Revisions
- If customer billing details or shipping destinations require modification after placement:
  1. Generate an invoice revision via Control OS.
  2. The system embeds an immutable snapshot into `order.invoiceRevisions[]`.
  3. Historical warranty snapshots and line item prices are preserved from the original order and cannot be mutated by subsequent catalogue modifications.

---

## 6. INCIDENT RESPONSE & ESCALATION

| Event | Severity | Triage Procedure | Responsible Role |
|---|---|---|---|
| **E11000 Order Collision** | Low (Automatic) | System automatically regenerates 128-bit random entropy and retries up to 3 times. If repeated, check timestamp synchronization. | Platform Engineer |
| **Spike in 401/403 Admin Requests** | Medium | Check `/admin/system/audit` for brute force attempts. Confirm `SESSION_SECRET` has not been accidentally altered in Vercel. | Security Lead |
| **Missing Product in Editor** | Low | Check `resolveAuthoritativeProduct` logs. Confirm product is not archived (`isArchived: true`) and verify identifier via `id` or `slug`. | Catalog Admin |
| **Master Passcode Alert** | High | System automatically records `EMPLOYEE_LOGIN_FAILED` with `bootstrap_permanently_sealed`. Verify who attempted master passcode access. | Owner / CTO |

---

## 7. MAINTENANCE AUDIT SCHEDULE

- **Weekly:** Review audit logs for unusual permission escalations or failed logins.
- **Monthly:** Inspect rate-limiting metrics and storage consumption.
- **Quarterly:** Conduct database restore drill and verify cryptographic key rotation procedures.
- **Semi-Annually:** Full RBAC and dependency vulnerability scan (`npm audit`).

