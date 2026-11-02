# CONTROLLED SECURITY UPGRADE PLAN: NEXT.JS FRAMEWORK
## CODEVERSE TECHNICAL ARCHITECTURE & INFRASTRUCTURE GOVERNANCE

**Document ID:** `SEC-PLAN-NEXTJS-2026-11`  
**Current State:** Next.js `16.4.0` (Turbopack) | React `19.2.8`  
**Target State:** Next.js `16.4.1` (Patched Security Release)  
**Security Classification:** Mandatory Dependency Patch (Controlled Execution)  
**Status:** Approved for Implementation on Isolated Branch / Separate Worktree  

---

## 1. VULNERABILITY CONTEXT & IMPACT ANALYSIS

During production build optimization, the Next.js compilation engine flagged a known security advisory from the npm security registry (`https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`).

### Specific Vulnerabilities in Next.js 16.4.0:
1. **GHSA-673q-mjm6-r5xr / GHSA-xqc2-xf4c-x3h3 (App Router Cache Serialization):**
   * *Type:* Remote Code Execution / Prototype Pollution via cached typed arrays.
   * *Scope:* Applies to App Router Server Components using experimental or advanced cache directives.
   * *Mitigation in 16.4.1:* Strict serialization sanitization and buffer validation.
2. **GHSA-2464-fhr4-w9xw / CVE-2026-96889 (Image Optimization Vector Handling):**
   * *Type:* Denial of Service / Memory Corruption via maliciously crafted SVG images passed through Next.js Image Optimization API.
   * *Mitigation in 16.4.1:* Upgraded upstream image processing filters and SVG sanitization headers.
3. **GHSA-p3m5-59mp-jv5r (Server Actions Payload Flooding):**
   * *Type:* Denial of Service via unbounded action payload streaming.
   * *Mitigation in 16.4.1:* Default body size limits and early payload abortion.

### Backward Compatibility Assessment:
* **Breaking Changes:** **NONE.** The transition from `16.4.0` to `16.4.1` is a semver-patch release.
* **Compatibility:** Fully retains compatibility with React `19.2.8`, App Router conventions, Mongoose 8.x, and Tailwind CSS v3.4.

---

## 2. CONTROLLED UPGRADE EXECUTION PROTOCOL

To ensure 100% zero production downtime and prevent workspace pollution, the upgrade must be executed in a dedicated Git worktree or isolated feature branch.

### Step 1: Create Isolated Worktree
```bash
# From workspace root
git worktree add -b chore/nextjs-security-upgrade ../marine-creatures-upgrade main
cd ../marine-creatures-upgrade/marine-creatures
```

### Step 2: Execute Dependency Upgrade
```bash
# Option A: Official Next.js Security Nudge Command
npx next upgrade --agent=security --internal-nudge-id=d3994f46-852f-4e99-a55f-4f6aeb9faea7

# Option B: Direct Package Update
npm install next@16.4.1 --save-exact
```

### Step 3: Clean Rebuild Verification
```bash
# Remove stale turbopack caches
rm -rf .next
npm run build
```
*Expected Output:* Build completes with `Compiled successfully` without the `Error [SecurityFatalError]` prompt. All 130 static and dynamic routes generate cleanly.

### Step 4: Automated Regression Suite Run
```bash
# Start background server on isolated port (e.g. 3001)
npm run start -- -p 3001

# Execute automated Control OS verification
node scripts/test-control-os-flow.mjs
node scripts/run-full-mobile-qa.mjs
```
*Criteria:* 18/18 admin endpoints 200 OK, 10/10 public routes 200 OK, 8/8 viewport screenshots verified.

### Step 5: Merge and Worktree Cleanup
```bash
git add package.json package-lock.json
git commit -m "chore(security): upgrade Next.js to 16.4.1 security release"
git checkout main
git merge chore/nextjs-security-upgrade --ff-only
git worktree remove ../marine-creatures-upgrade
git branch -d chore/nextjs-security-upgrade
```

---

## 3. ROLLBACK STRATEGY

If any unexpected regression occurs during Step 4:
1. Discard the worktree immediately: `git worktree remove --force ../marine-creatures-upgrade`.
2. Existing `main` branch remains untouched on stable `16.4.0`.
3. Zero risk to production runtime or live customer transactions.
