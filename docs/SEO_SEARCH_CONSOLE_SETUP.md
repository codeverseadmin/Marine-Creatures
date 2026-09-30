# Google Search Console Setup & Priority Indexing Protocol
**Project:** Marine Creatures  
**Document:** `docs/SEO_SEARCH_CONSOLE_SETUP.md`  
**Phase:** SEO-1 — Production SEO Foundation + Product Search Visibility  
**Author:** Senior SEO Architect & Technical SEO Engineer  
**Status:** Verification Architecture Ready (Pending Client Property Claim)

---

## 1. Production Canonical Base & Sitemap Specification

### Canonical Production Base
- **Current Canonical Host:** `https://marine-creatures-krgsrl5sn-codeverse1.vercel.app`
- **Environment Variable Override:** `NEXT_PUBLIC_SITE_URL` (configured in `lib/config.ts`)
- **Future Custom Domain:** Once purchased, update `NEXT_PUBLIC_SITE_URL` in Vercel project environment variables to update all canonical URLs, OpenGraph headers, JSON-LD `@id` elements, and XML sitemaps automatically.

### Production Sitemap & Robots Endpoints
- **XML Sitemap:** `https://marine-creatures-krgsrl5sn-codeverse1.vercel.app/sitemap.xml`
- **Robots.txt:** `https://marine-creatures-krgsrl5sn-codeverse1.vercel.app/robots.txt`

---

## 2. Google Search Console Property Setup Workflow

### Step 1: Add Property in Search Console
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Choose **URL prefix** property type (required for subdomains / Vercel deployment URLs before apex domain purchase):
   - Enter `https://marine-creatures-krgsrl5sn-codeverse1.vercel.app`
3. When the custom apex domain is purchased (e.g. `marinecreatures.com`), add a **Domain** property and verify via DNS TXT record.

### Step 2: Verification Methods
Choose one of the following methods for initial Vercel production deployment:

- **Method A: HTML Meta Tag Verification (Recommended)**
  1. Copy the Google site verification token from GSC (e.g. `google-site-verification=abc...`).
  2. Add the verification code to `app/layout.tsx` under `verification.google` in Next.js metadata, or configure `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in Vercel environment variables.
- **Method B: HTML File Upload**
  1. Download the verification HTML file from GSC (e.g. `googlexxxxxxxxxxxx.html`).
  2. Place it in `marine-creatures/public/` directory and deploy.

> **Note:** Search Console verification has **NOT** been performed yet because Google requires the site owner's Google account login. Antigravity does **not** claim verification is complete until client authorization and verification occur.

---

## 3. Sitemap Submission Workflow

Once the GSC property is verified:
1. In the left navigation, select **Sitemaps** under *Indexing*.
2. In the "Add a new sitemap" input field, enter:
   `sitemap.xml`
3. Click **Submit**.
4. Confirm Google fetches the sitemap with status **"Success"**.
5. Monitor **Discovered pages count** (expected: 77+ distinct canonical routes including products, category hubs, services, and Nemo product cluster aliases).

---

## 4. Priority URL Inspection & Indexing Queue

Submit these 15 high-intent URLs manually in Google Search Console via the **URL Inspection** tool to request immediate indexing upon launch:

| Priority | URL Path | Page Type | Primary Commercial Keyword Focus | Inspection Goal |
|---|---|---|---|---|
| **1** | `/` | Homepage | Custom Marine Aquariums, Living Reef Design, Kolkata | Validate Organization & WebSite JSON-LD, H1 hierarchy |
| **2** | `/marketplace` | Marketplace Hub | Marine Aquarium Equipment, Reef Lighting, Living Livestock | Validate catalog crawlability, canonical self-reference |
| **3** | `/marketplace/lighting` | Category Hub | Marine Aquarium Lights, Reef Lighting, App-Controlled LED | Validate ItemList JSON-LD, internal links to Nemo models |
| **4** | `/marketplace/nemo-e450` | Product Detail | Nemo E450 aquarium light, Nemo E450 marine reef light | Validate Product schema, variant selector, specs table |
| **5** | `/marketplace/nemo-e600` | Product Detail | Nemo E600 aquarium light, 60cm reef aquarium light | Validate Product schema, variant selector, specs table |
| **6** | `/marketplace/nemo-e900` | Product Detail | Nemo E900 aquarium light, 90cm reef aquarium light | Validate Product schema, variant selector, specs table |
| **7** | `/marketplace/nemo-e1200` | Product Detail | Nemo E1200 aquarium light, 120cm reef aquarium light | Validate Product schema, variant selector, specs table |
| **8** | `/aquarium-design` | Core Service | Custom marine aquarium design, architectural reef tank | Validate Service schema, BreadcrumbList, consultation CTA |
| **9** | `/renovation` | Core Service | Aquarium renovation, marine tank crash recovery Kolkata | Validate Service schema, project timeline, before/after |
| **10** | `/installation` | Core Service | Marine aquarium installation, turnkey reef plumbing | Validate Service schema, engineering specs, checklist |
| **11** | `/maintenance` | Core Service | Marine aquarium maintenance, reef biological concierge | Validate Service schema, water testing parameters |
| **12** | `/our-worlds` | Portfolio Hub | Luxury reef gallery, architectural marine installations | Validate visual image alt attributes, case study links |
| **13** | `/services` | Services Hub | Marine aquarium services Kolkata, professional reef curators | Validate BreadcrumbList, visual navigation, booking CTA |
| **14** | `/about` | Brand Authority | Marine aquarium curators, reef biological engineering | Validate Organization entity grounding, mission statement |
| **15** | `/contact` | Conversion | Aquarium consultation Kolkata, WhatsApp marine inquiry | Validate ContactPoint schema, local phone & contact forms |

---

## 5. URL Inspection & Crawl Error Troubleshooting

For each priority URL inspected in GSC:
1. Click **Test Live URL**.
2. Verify:
   - **Page fetch:** Successful (HTTP 200).
   - **Crawled as:** Googlebot smartphone.
   - **Indexing allowed?:** Yes.
   - **User-declared canonical:** Matches Google-selected canonical.
   - **Rich results detected:**
     - `BreadcrumbList` (detected on all pages)
     - `Product` (detected on `/marketplace/[id]`)
     - `Service` (detected on `/aquarium-design`, `/renovation`, `/installation`, `/maintenance`)
     - `ItemList` (detected on `/marketplace/lighting`)
3. Click **Request Indexing**. (Note: GSC has a daily quota of ~10-15 manual inspection requests per property).

---

## 6. Post-Launch Monitoring Schedule

- **Days 1–3:** Monitor URL Inspection status for Priority 1–7. Confirm no "Crawled - currently not indexed" or "Discovered - currently not indexed" stalls.
- **Day 7:** Review **Coverage / Page indexing** report in GSC. Verify:
  - Valid indexed pages trending up towards sitemap count (~77 URLs).
  - Excluded pages: Verify only `/admin`, `/api/*`, and filtered parameters are excluded.
- **Day 14:** Review **Performance** report:
  - Impressions on branded terms ("Marine Creatures") and product queries ("Nemo E450", "Nemo E600", "Nemo aquarium light").
  - Click-through rates (CTR) and average position.
- **Day 30:** Audit search queries to identify secondary keywords to incorporate into category content or FAQ sections.
