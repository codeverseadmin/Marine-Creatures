# PRODUCTION DOMAIN LAUNCH & DNS DELEGATION CHECKLIST
**Document:** `docs/DOMAIN_LAUNCH_CHECKLIST.md`  
**Classification:** Infrastructure & Release Gate Checklist  
**Current State:** `PRODUCTION DOMAIN PENDING (REQUIRES CLIENT INPUT)`  
**Date:** October 9, 2026  

---

## 1. Current Infrastructure & Domain State

* **Active Domain Target:** `marinecreatures.com` (Apex) / `www.marinecreatures.com` (Canonical Subdomain)
* **Current Temporary Host:** `https://marine-creatures-krgsrl5sn-codeverse1.vercel.app`
* **Current `NEXT_PUBLIC_SITE_URL`:** `https://marine-creatures-krgsrl5sn-codeverse1.vercel.app`
* **Vercel Project:** `marine-creatures` (under Codeverse Vercel Team)
* **DNS Delegation Status:** Awaiting client registrar access / domain name server delegation.

---

## 2. End-to-End Architecture

```
[ Domain Registrar ] (e.g. GoDaddy, Namecheap, Cloudflare)
        │
        ▼ (A Record: 76.76.21.21 / CNAME: cname.vercel-dns.com)
[ Vercel Edge Network ]
        │
        ├── Auto Let's Encrypt SSL/TLS Certificate (HTTPS)
        ├── 308 Permanent Redirect (Apex -> www or www -> Apex)
        │
        ▼ (Environment Variable: NEXT_PUBLIC_SITE_URL=https://marinecreatures.com)
[ Next.js Application ]
        ├── Canonical URLs (app/layout.tsx, metadataBase)
        ├── Dynamic XML Sitemap (app/sitemap.ts)
        ├── Robots Directives (app/robots.ts)
        ├── OpenGraph & Twitter Social Cards
        ├── Schema.org JSON-LD (Product, Offer, BreadcrumbList)
        │
        ▼
[ Google Search Console ] (DNS TXT Verification & Sitemap Submission)
```

---

## 3. Step-by-Step Domain Connection Procedure

### Step 3.1: Add Domain to Vercel Project
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Navigate to: **Project (`marine-creatures`) → Settings → Domains**.
3. Add the following domains:
   - `marinecreatures.com`
   - `www.marinecreatures.com` (Select: *Redirect `marinecreatures.com` to `www.marinecreatures.com`* or vice versa per brand preference).

### Step 3.2: Configure DNS Records at Domain Registrar
In the client's domain registrar DNS Management dashboard:
1. **Apex (`@` or root):**
   - **Type:** `A`
   - **Name:** `@` (or leave blank)
   - **Value / Destination:** `76.76.21.21`
   - **TTL:** `600` (or Automatic)
2. **Subdomain (`www`):**
   - **Type:** `CNAME`
   - **Name:** `www`
   - **Value / Destination:** `cname.vercel-dns.com`
   - **TTL:** `600` (or Automatic)

### Step 3.3: Verify Automatic SSL Provisioning
* Once DNS propagates (typically 5 to 60 minutes), Vercel automatically generates and provisions an SSL/TLS certificate from Let's Encrypt.
* Verify both `http://` and `https://` URLs automatically redirect and resolve securely without certificate warnings.

### Step 3.4: Update Production Environment Variable in Vercel
1. In Vercel Project Settings → **Environment Variables**:
2. Set or update:
   ```env
   NEXT_PUBLIC_SITE_URL=https://marinecreatures.com
   ```
   *(Ensure environment is selected for **Production**).*
3. Trigger a redeployment or promote latest deployment so all dynamic metadata components pick up the new domain origin.

### Step 3.5: Post-Launch Metadata & Sitemap Verification
Verify live HTTP responses on the custom domain:
1. **Robots.txt:** `curl -IL https://marinecreatures.com/robots.txt`
   - Confirm `Host: https://marinecreatures.com`
   - Confirm `Sitemap: https://marinecreatures.com/sitemap.xml`
2. **Sitemap:** `curl -IL https://marinecreatures.com/sitemap.xml`
   - Confirm all 60 product URLs and static page URLs begin with `https://marinecreatures.com`
3. **Canonical Header:** Inspect `<link rel="canonical" href="https://marinecreatures.com/..." />` on storefront pages.

### Step 3.6: Google Search Console Verification
1. Access [Google Search Console](https://search.google.com/search-console).
2. Choose **Domain** property (`marinecreatures.com`).
3. Add the provided `google-site-verification` DNS TXT record at the registrar.
4. Click **Verify**.
5. Submit sitemap URL: `https://marinecreatures.com/sitemap.xml`.
6. Confirm status: `Success`.

---

## 4. Current Blocker Classification

* **Status:** `REQUIRES CLIENT INPUT`
* **Release Gate Impact:** Custom domain connection does not block local codebase readiness, but is a mandatory external gate prior to opening live public indexing and marketing campaigns.
