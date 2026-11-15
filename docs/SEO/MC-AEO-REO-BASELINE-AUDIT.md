# MARINE CREATURES — AEO + REO BASELINE AUDIT
**Reference:** MC-AEO-REO-AUDIT-NOV2026  
**Date:** November 15, 2026  
**Auditor:** Lead Systems Architect / CTO Office  
**Target Domain:** `https://www.marinecreatures.co.in`  
**Classification:** Strategic Search & AI Answer Engine Optimization (P0)

---

## 1. EXECUTIVE SUMMARY & AUDIT SCOPE

Before implementing new code, an exhaustive architectural inspection of the Marine Creatures web platform was executed across all public routes, metadata hierarchies, robots directives, XML sitemaps, JSON-LD structured data graphs, product catalog datasets, and local business signals.

### Core Objectives:
1. **Answer Engine Optimization (AEO):** Evaluate the site's readiness for AI search retrieval, direct quotation, and synthesis by Google AI Overviews, Perplexity, ChatGPT Search, Gemini, and Microsoft Copilot.
2. **Recommendation Engine Optimization (REO):** Assess structured machine-readable product identity, attribute completeness, deterministic compatibility graphs, and verified service baseline offerings.
3. **Data Integrity & Safety:** Identify discrepancies, duplicate schemas, missing canonical tags, or unverified claims while strictly preserving the "Abyssal Luxury" brand design and prohibited terminology rules.

---

## 2. ROUTE INVENTORY & INDEXABILITY AUDIT

| Route | Route Type | Dynamic / Static | Canonical Target | Robots Meta | Title Length | Description Length | Status |
|---|---|---|---|---|---|---|---|
| `/` | Core Homepage | Server Rendered | `https://www.marinecreatures.co.in/` | `index, follow` | 55 chars | 158 chars | Healthy |
| `/marketplace` | Catalog Browse | Client / SSR | `https://www.marinecreatures.co.in/marketplace` | `index, follow` | 62 chars | 162 chars | Needs `?q=` handling |
| `/marketplace/[id]` | Product Detail | SSR + ISR / Dynamic | `https://www.marinecreatures.co.in/marketplace/[id]` | `index, follow` (unless archived) | 50–70 chars | 140–160 chars | Strong catalog SEO map |
| `/marketplace/lighting`| High-Intent Landing| SSR | `https://www.marinecreatures.co.in/marketplace/lighting` | `index, follow` | 65 chars | 155 chars | Healthy |
| `/installation` | Core Service | Static / SSR | `https://www.marinecreatures.co.in/installation` | `index, follow` | 56 chars | 160 chars | Missing starting price & FAQ |
| `/renovation` | Core Service | Static / SSR | `https://www.marinecreatures.co.in/renovation` | `index, follow` | 48 chars | 165 chars | Missing starting price & FAQ |
| `/services` | Service Directory | Static / SSR | `https://www.marinecreatures.co.in/services` | `index, follow` | 53 chars | 170 chars | Has pricing in text, needs FAQ |
| `/aquarium-design` | Design Philosophy | Static / SSR | `https://www.marinecreatures.co.in/aquarium-design` | `index, follow` | 58 chars | 160 chars | Healthy |
| `/our-worlds` | Portfolio Directory | Dynamic / SSR | `https://www.marinecreatures.co.in/our-worlds` | `index, follow` | 52 chars | 150 chars | Healthy |
| `/our-worlds/[slug]` | Case Study Detail | Dynamic / SSR | `https://www.marinecreatures.co.in/our-worlds/[slug]` | `index, follow` | 55–65 chars | 150–160 chars | Healthy |
| `/about` | Brand Heritage | Static / SSR | `https://www.marinecreatures.co.in/about` | `index, follow` | 60 chars | 168 chars | Stat mismatch to fix |
| `/contact` | Concierge / Booking| Static / SSR | `https://www.marinecreatures.co.in/contact` | `index, follow` | 45 chars | 145 chars | Healthy |
| `/shipping-policy` | Customer Policy | Static / SSR | `https://www.marinecreatures.co.in/shipping-policy` | `index, follow` | 42 chars | 140 chars | Healthy |
| `/review` | Customer Feedback | Static / SSR | `https://www.marinecreatures.co.in/review` | `noindex, follow` | — | — | Correctly private |
| `/admin/*` | Internal Control OS | Client / Auth | N/A | `noindex, nofollow` | — | — | Strictly protected |
| `/invoice/*` | Financial Documents| Server Dynamic | N/A | `noindex, nofollow` | — | — | Strictly protected |
| `/api/*` | Backend Endpoints | Serverless API | N/A | Disallowed | — | — | Strictly protected |

---

## 3. CRAWLABILITY & BOT DIRECTIVES AUDIT (`app/robots.ts` & `app/sitemap.ts`)

### 3.1 `robots.ts` Findings:
- **Current State:**
  - Standard user-agent `*` disallows `/admin`, `/admin/*`, `/invoice`, `/invoice/*`, `/api/*`.
  - Mentions `Googlebot` with identical rules.
- **Identified Deficiencies:**
  - AI retrieval crawlers (`GPTBot`, `ChatGPT-User`, `PerplexityBot`, `ClaudeBot`, `Applebot-Extended`) lack explicit user-agent stanzas. Some AI crawlers respect targeted rules to discover content and parse citations while verifying they are not blocked by generic bot gates.
  - No reference to machine-readable documentation (`/llms.txt`).
  - Checkout routes (`/checkout*`) should be explicitly disallowed in robots rules to protect customer privacy and avoid indexing empty shopping carts.

### 3.2 `sitemap.ts` Findings:
- **Current State:**
  - Indexes 11 core marketing routes.
  - Indexes 54 static products from `PRODUCTS` + 4 high-intent Nemo alias routes (`nemo-e450`, `nemo-e600`, `nemo-e900`, `nemo-e1200`).
  - Dynamically merges published MongoDB products and published case studies from `CaseStudyModel`.
- **Identified Deficiencies:**
  - Missing educational guides hub (`/guides`) and foundational buying guides.
  - Last modified timestamps default to `now = new Date()`, which can cause search engines to treat all static pages as daily modifications rather than respecting actual content update cadences.

---

## 4. STRUCTURED DATA (JSON-LD) AUDIT (`lib/seo/structuredData.ts` & `app/layout.tsx`)

### 4.1 Global Graph (`app/layout.tsx`):
- **WebSite Schema:** Correctly defines `@type: "WebSite"` with `potentialAction: SearchAction`.
  - *Bug Discovered:* `urlTemplate: "${SITE_CONFIG.url}/marketplace?q={search_term_string}"` targets `?q=`, but `app/marketplace/page.tsx` only inspected `searchParams.get('section')` and did not extract `q` or `search` into the search query state!
- **LocalBusiness Schema:** Present with business name, geo-coordinates (22.5726, 88.3639), phone, and email.
  - *Deficiencies:*
    - Lacks explicit `makesOffer` or structured `Offer` items for confirmed installation starting price (₹35,000) and renovation starting price (₹15,000).
    - Contains `alternateName: "Marine Creatures Aquatics Private Limited"`, which should be aligned to verified trade naming "MARINE CREATURES".

### 4.2 Product Schema (`generateProductJsonLd`):
- **Strengths:**
  - 100% compliant with Google's non-fabrication guidelines: "Price on Request" products never emit ₹0 or fake numeric values; they emit descriptive `PriceSpecification`.
  - Zero fabricated ratings or review counts.
  - Detailed `PropertyValue` specifications extracted from product data.
  - Authoritative `WarrantyPromise` structured data integrated.
- **Gaps for REO & AEO:**
  - Lacks `itemCondition: "https://schema.org/NewCondition"`.
  - Lacks machine-readable `isRelatedTo` array referencing compatible equipment.
  - Lacks structured measurement codes (`hasMeasurement` / quantitative values) where volume or wattage are defined.

### 4.3 Service Schema (`generateServiceJsonLd`):
- **Current State:** Emits basic `Service` schema with `name`, `description`, `provider`, and `areaServed`.
- **Gaps:**
  - Does NOT emit the confirmed baseline pricing (`offers`: starting at ₹35,000 for installation, ₹15,000 for renovation).
  - Does not emit structured `priceSpecification`.

### 4.4 Missing Schemas:
- **`FAQPage` Schema:** Missing across all service and product pages. High-intent questions answered in page copy cannot be recognized by Google AI Overviews or Perplexity without structured Q&A markup.
- **`Article` Schema:** Missing for educational guides and tutorials.

---

## 5. ANSWER-READY CONTENT ARCHITECTURE (AEO) AUDIT

### 5.1 Service Pages (`/installation` & `/renovation`):
- `/installation` displays a 6-stage engineering protocol, but lacks:
  - Clear, direct answers to common customer questions (e.g., "What happens during installation?", "What affects the cost?", "How long does nitrogen cycling take?").
  - Published starting price ("Starting from ₹35,000").
- `/renovation` displays restoration dimensions and a 4-stage protocol, but lacks:
  - Clear answers to customer concerns (e.g., "What happens to live fish during renovation?", "How does the zero-loss holding protocol work?").
  - Published starting price ("Starting from ₹15,000").

### 5.2 Educational Content Clusters:
- The website currently lacks a dedicated, crawlable `/guides` section providing deep technical answers for:
  1. Marine aquarium setup requirements & nitrogen cycle chemistry.
  2. Marine aquarium installation cost factors.
  3. Reef lighting spectrum channels, PAR distribution, and photoperiods.
  4. Marine fish compatibility and quarantine acclimation protocols.

---

## 6. RECOMMENDATION ENGINE OPTIMIZATION (REO) AUDIT

### 6.1 Product Attribute Completeness:
- Inspected 54 catalog records in `lib/seo/catalogSeoData.ts` and `lib/data/products.ts`:
  - Brand: 54/54 (100% complete).
  - Categories & Subcategories: 54/54 (100% complete).
  - Specifications: 54/54 (100% complete).
  - Scientific Names: 14/14 for live species (100% complete; 40 non-livestock dry goods marked N/A).
  - Image Alt Text: 54/54 (100% complete).
  - Related Products: 54/54 (100% complete in SEO map).

### 6.2 Recommendation Engine Deficiencies:
- Product recommendations on `/marketplace/[id]` relied on generic category slicing if SEO map links were absent.
- No central deterministic recommendation rule engine existed to explain *why* products are recommended together (e.g., why a protein skimmer is paired with high-output reef lighting or probiotic marine salt).

---

## 7. TRUST & ENTITY CONSISTENCY AUDIT

### 7.1 Consistency Check:
- `lib/config.ts`:
  - Name: "Marine Creatures"
  - Founder: "Suraj Shasmal"
  - Address: "Kolkata, West Bengal, India"
  - Phone: `+91 93304 36603`
  - Stats: `50+ Aquariums Created`, `200+ Marine Species`, `40+ Projects Completed`, `5+ Years of Expertise`.
- `app/about/page.tsx`:
  - *Discrepancy Discovered:* Line 123 displayed `15+ YEARS IN OCEAN DESIGN` and `200+ WORLDS DELIVERED`. This contradicted `lib/config.ts` (`5+ Years of Expertise`).
  - *Action Required:* Align `/about` with verified `lib/config.ts` data to eliminate conflicting entity signals.

---

## 8. ACTIONABLE REMEDIATION ROADMAP

1. **Step 1:** Enhance `lib/seo/structuredData.ts` with `generateFaqJsonLd`, `generateArticleJsonLd`, enriched `generateServiceJsonLd` (with confirmed ₹35,000 & ₹15,000 baseline prices), and enriched `generateProductJsonLd` (with `isRelatedTo` and `itemCondition`).
2. **Step 2:** Update `app/layout.tsx` to align business naming and inject confirmed service starting prices into the organization graph.
3. **Step 3:** Fix query parameter extraction in `app/marketplace/page.tsx` to handle `?q=` and `?search=` from `SearchAction`.
4. **Step 4:** Implement `public/llms.txt` and `public/llms-full.txt` as standardized AI discovery manifests.
5. **Step 5:** Expand `app/robots.ts` with explicit user-agent rules for AI search retrieval crawlers (`GPTBot`, `PerplexityBot`, `ClaudeBot`, etc.).
6. **Step 6:** Enrich `/installation`, `/renovation`, and `/services` with server-rendered Q&A accordions and `FAQPage` JSON-LD schemas.
7. **Step 7:** Build a dedicated, crawlable `/guides` educational content cluster answering customer buying and care questions.
8. **Step 8:** Build `lib/data/product-recommendations.ts` providing deterministic, explainable equipment and accessory pairings.
9. **Step 9:** Reconcile entity statistics in `app/about/page.tsx` with `lib/config.ts`.
10. **Step 10:** Compile and verify with `npx tsc --noEmit` and `npm run build`.

