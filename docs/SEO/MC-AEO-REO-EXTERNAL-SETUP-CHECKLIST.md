# MARINE CREATURES — AEO & REO EXTERNAL SETUP CHECKLIST
**Reference:** MC-AEO-REO-EXTERNAL-SETUP-NOV2026  
**Date:** November 15, 2026  
**Auditor:** Lead Systems Architect / CTO Office  
**Target Domain:** `https://www.marinecreatures.co.in`  
**Classification:** Operational Governance & Search Console Verification (P0)

---

## 1. PURPOSE & SEPARATION OF CONCERNS

This document details the external ownership and verification actions required by the business founder (Suraj Shasmal) to activate third-party search engine consoles, index submission APIs, and local map listings.

Per engineering governance rules:
* Code implementation and technical crawlability have been completed inside the Next.js codebase.
* External account creation, DNS records, Google Search Console claims, and IndexNow key generation require **authorized owner credentials** and are intentionally separated from codebase commits.
* No mock tokens, private analytics keys, or unverified claims have been injected into production code.

---

## 2. GOOGLE SEARCH CONSOLE SETUP

### Step 2.1: Domain Property Verification (Recommended)
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Choose **Domain** property type and enter `marinecreatures.co.in`.
3. Copy the `TXT` verification token provided by Google (e.g., `google-site-verification=...`).
4. Log into your domain DNS provider (e.g., GoDaddy, Cloudflare, Namecheap) and add a TXT record:
   * **Host:** `@`
   * **Type:** `TXT`
   * **Value:** `<google-verification-token>`
   * **TTL:** Automatic or 3600 seconds.
5. Alternatively, if using URL Prefix verification (`https://www.marinecreatures.co.in`), add the token to the `.env` variable:
   ```env
   NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="your-verification-token"
   ```
   *(Note: The codebase in `app/layout.tsx` is already configured to automatically read this environment variable into `<meta name="google-site-verification">` without code changes).*

### Step 2.2: XML Sitemap Submission
1. Once verified, go to **Index > Sitemaps** in the left navigation.
2. Enter `sitemap.xml` in the "Add a new sitemap" input.
3. Click **Submit**.
4. Confirm status displays **Success** with detected URLs (covers core pages, marketplace products, worlds case studies, and guides).

### Step 2.3: URL Inspection & Rich Results Test
1. Test core service pages:
   * `https://www.marinecreatures.co.in/installation`
   * `https://www.marinecreatures.co.in/renovation`
   * `https://www.marinecreatures.co.in/guides/marine-aquarium-setup-guide`
2. Run the [Rich Results Test](https://search.google.com/test/rich-results) on each URL to verify valid `Service`, `FAQPage`, `Product`, and `Article` structured data.

---

## 3. BING WEBMASTER TOOLS & INDEXNOW

### Step 3.1: Bing Webmaster Tools Import
1. Navigate to [Bing Webmaster Tools](https://www.bing.com/webmasters).
2. Sign in and select **Import from Google Search Console** (fastest method, inherits ownership automatically).
3. Verify that `https://www.marinecreatures.co.in/sitemap.xml` is imported and active.

### Step 3.2: IndexNow Rapid Indexing Activation
IndexNow instantly notifies Bing, Yandex, and Naver whenever products or case studies are updated.
1. Generate an IndexNow API Key from Bing Webmaster Tools.
2. Place the key file in `public/<apiKey>.txt`.
3. When new products or case studies are published in Control OS, ping the endpoint:
   `https://api.indexnow.org/indexnow?url=https://www.marinecreatures.co.in/marketplace/<id>&key=<apiKey>`

---

## 4. GOOGLE BUSINESS PROFILE (LOCALBUSINESS REO)

To anchor Marine Creatures in local Kolkata queries ("marine aquarium installation Kolkata", "saltwater reef tank renovation Alipore"):
1. Access [Google Business Profile](https://business.google.com/).
2. Claim or verify the business name: **MARINE CREATURES**.
3. **Primary Category:** `Aquarium Shop` or `Aquarium Service`.
4. **Secondary Categories:** `Interior Designer`, `Fish Store`, `Maintenance Service`.
5. **Service Area:** Kolkata Metropolitan Area, Alipore, Ballygunge, Salt Lake / Sector V, New Town, Southern Avenue, Park Street, and West Bengal.
6. **Operating Hours:** Monday to Saturday, 10:00 AM – 8:00 PM IST.
7. **Website Link:** `https://www.marinecreatures.co.in`.
8. **Products & Services:** Link to `/installation` (starts from ₹35,000) and `/renovation` (starts from ₹15,000).

---

## 5. AI CRAWLER CITATION & MONITORING (AEO)

### Step 5.1: Verify Robots.txt Accessibility
Test the live robots endpoint:
```
GET https://www.marinecreatures.co.in/robots.txt
```
Ensure the response contains the explicit allow rules for:
* `GPTBot` (OpenAI search and citation retriever)
* `ChatGPT-User` (ChatGPT real-time search)
* `PerplexityBot` (Perplexity AI answers)
* `ClaudeBot` (Anthropic citation retriever)
* `Applebot-Extended` (Apple Intelligence)

### Step 5.2: Verify llms.txt Discovery
Test the live machine-readable manifest:
```
GET https://www.marinecreatures.co.in/llms.txt
GET https://www.marinecreatures.co.in/llms-full.txt
```
Ensure that AI agents can parse the markdown summaries, service offerings, and product category links directly.

---

## 6. SEARCH PERFORMANCE & CONVERSION TRACKING

1. **Google Analytics 4 (GA4):**
   * If deploying GA4, pass the Measurement ID via environment variable (`NEXT_PUBLIC_GA_MEASUREMENT_ID`).
   * Track high-value events:
     * `lead_booking_submitted` (Consultation reservation form submission)
     * `whatsapp_concierge_clicked` (Direct founder inquiry)
     * `guide_reading_completed` (Content engagement)
2. **Weekly Performance Routine:**
   * Monitor Search Console for impression growth on intent queries ("aquarium installation Kolkata", "marine aquarium setup guide", "clownfish pair India").
   * Check "Page Indexing" report to confirm zero errors on canonical URLs.

