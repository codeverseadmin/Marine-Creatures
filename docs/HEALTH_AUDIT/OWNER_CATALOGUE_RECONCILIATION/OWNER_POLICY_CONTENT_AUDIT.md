# Marine Creatures — Owner Business Policies & Channel Audit

**Audit Date:** November 6, 2026  
**Focus:** Commercial Policy Alignment, Contact Data Verification, and WhatsApp Channel Availability  
**Scope:** Customer-facing policy pages, terms of purchase, header/footer components, and direct messaging integrations.

---

## 1. Policy-by-Policy Compliance Audit

The business owner has established six core operational directives governing livestock sales, transit guarantees, and trade terms. Each policy was inspected across the live production website (`app/shipping-policy/page.tsx`, `components/marketplace/ProductDetailView.tsx`, and storefront checkout routes):

### Policy 1: "Quarantined fish are not sold at cheap/discount pricing."
* **Status:** ❌ **ABSENT / UNREPRESENTED**
* **Findings:**
  * Nowhere on `/shipping-policy`, `/marketplace`, or individual live fish product pages is this value proposition articulated.
  * In fact, several dry goods cards show retail strikethrough discounts (`compareAtPrice`), but the live fish section has no explanation of why quarantined specimens carry premium pricing compared to unquarantined street-market fish.
* **Impact:** Lost brand positioning. Indian hobbyists frequently encounter cheaper wild-caught fish from informal sellers that die within days due to Velvet or Flukes. Explaining that Marine Creatures specimens reflect professional quarantine life-support, prophylactic treatments, and daily feeding labor justifies premium POR pricing.

### Policy 2: "Both sellers and hobbyists are welcome."
* **Status:** ✅ **PRESENT & FULLY REPRESENTED**
* **Location:** `app/shipping-policy/page.tsx`, Section 04:
  > **04. Buyer Classification & Trade Welcome**  
  > *"SELLER AND HOBBYIST WELCOME. Marine Creatures supplies both individual marine reef hobbyists and commercial aquarium retailers / retail sellers across India. Wholesale bulk dispatch, consolidated shipping crates, and quarantine batch scheduling are available for commercial partners upon direct coordinator contact."*
* **Compliance Level:** 100% compliant with owner's directive.

### Policy 3: "No DOA guarantee for railway and bus shipping."
* **Status:** ✅ **PRESENT & STRONGLY PROMINENT**
* **Locations:**
  * `app/shipping-policy/page.tsx`, Section 01 (Callout Box):
    > **CRITICAL TRANSIT RULE: NO DOA IN RAILWAY AND BUS SHIPPING.**  
    > *"Under no circumstances does Marine Creatures provide Dead On Arrival (DOA) replacement, credit, or reimbursement for orders dispatched via railway or inter-city bus transit. Buyers choosing surface road/rail methods do so entirely at their own risk."*
  * `components/marketplace/ProductDetailView.tsx`, Line 980:
    > *"Per store policy, railway and bus shipping do not carry DOA coverage."*
* **Compliance Level:** 100% compliant. Clear, unambiguous legal protection for the business.

### Policy 4: "No exchange."
* **Status:** ✅ **PRESENT & FULLY REPRESENTED**
* **Location:** `app/shipping-policy/page.tsx`, Section 02:
  > **NO EXCHANGE**  
  > *"Due to biological biosecurity and captive reef system safety, live marine specimens and opened aquatic dry goods cannot be exchanged once dispatched."*
* **Compliance Level:** 100% compliant.

### Policy 5: "No credit."
* **Status:** ✅ **PRESENT & FULLY REPRESENTED**
* **Location:** `app/shipping-policy/page.tsx`, Section 02:
  > **NO CREDIT**  
  > *"Marine Creatures operates strictly on direct settlement terms. Store credit, ledger credit, or deferred balance adjustments are not provided."*
* **Compliance Level:** 100% compliant.

### Policy 6: "Advance/booking money is non-refundable except where the failure is attributable to the seller."
* **Status:** ✅ **PRESENT & FULLY REPRESENTED**
* **Location:** `app/shipping-policy/page.tsx`, Section 03:
  > **03. Advance Deposits & Booking Money**  
  > *"ADVANCE / BOOKING MONEY IS STRICTLY NON-REFUNDABLE. When a specimen or custom equipment order is reserved, livestock is held under dedicated quarantine life-support and taken off public reservation.*  
  > *\* Exception: In the rare operational circumstance where Marine Creatures is unable to fulfill a booked specimen due to pre-dispatch quarantine observations or importer stock failure, the deposit will be returned in full or applied to an authorized replacement."*
* **Compliance Level:** 100% compliant with exact legal symmetry.

---

## 2. Contact Number Verification: +91 93304 36603

### A. Central Configuration
* In `lib/config.ts`:
  ```typescript
  export const SITE_CONFIG = {
    whatsapp: '+919330436603',
    phone: '+91 93304 36603',
    // ...
  };
  ```
* The number supplied by the owner matches the central configuration exactly.
* It powers all 1-tap WhatsApp ordering links (`https://wa.me/919330436603`), invoice footers, and administrative correspondence.

### B. Critical UI Bug Identified: Phone Label Truncation
* **File:** `app/contact/page.tsx` (Line 422)
* **Observed Markup:**
  ```tsx
  <a href={`tel:${SITE_CONFIG.phone.replace(/\s+/g, '')}`}>
    <span className="text-xs">Call +91 93304</span>
  </a>
  ```
* **Defect:** The anchor tag has the correct `tel:` link, but the visible button label is truncated to `"Call +91 93304"`, omitting the final five digits (`36603`). On mobile screens, this appears as an uncompleted developer placeholder and undermines caller confidence.

---

## 3. WhatsApp Channel Verification

### Owner Directive:
*"Follow WhatsApp channel for regular updates."*

### Codebase & Storefront Audit:
* **Current WhatsApp Links:**
  * Every existing WhatsApp trigger on the website (`wa.me/919330436603`) routes to a **direct 1-on-1 private messaging chat** with the founder/concierge.
* **WhatsApp Broadcast Channel Link:**
  * **Finding:** There is **NO WhatsApp Broadcast Channel URL** (`https://whatsapp.com/channel/...`) configured anywhere in the project.
  * In `lib/config.ts`, only `facebook`, `googleMaps`, `founderLink`, and `developerLink` are defined.
  * In `components/layout/Footer.tsx` and `components/layout/MobileMenu.tsx`, social icons link to Facebook and Google Maps, but have no option to join a WhatsApp Broadcast Channel.
* **Conclusion:** The owner has not yet provided the official channel URL for the broadcast community.

---

## 4. Policy Content Compliance Scorecard

```
========================================================================================
POLICY / DIRECTIVE                                  STATUS         LOCATION
========================================================================================
1. Quarantined fish not sold at cheap/discount      MISSING        Not found on website
2. Both sellers and hobbyists welcome               COMPLIANT      app/shipping-policy:157
3. No DOA for railway & bus shipping                COMPLIANT      app/shipping-policy:88
4. No exchange                                      COMPLIANT      app/shipping-policy:115
5. No credit                                        COMPLIANT      app/shipping-policy:121
6. Advance booking non-refundable (seller exception) COMPLIANT      app/shipping-policy:141
7. Verified Contact Number (+91 93304 36603)        COMPLIANT*     *Truncated on contact:422
8. WhatsApp Channel for regular updates             MISSING        No channel URL configured
========================================================================================
```

