# Marine Creatures — Catalogue Reconciliation Recommendations & Action Plan

**Audit Date:** November 6, 2026  
**Status:** Strictly Proposed — Implementation Awaiting Owner Sign-Off  
**Scope:** Prioritised technical roadmap to achieve 100% inventory parity, policy compliance, and channel connectivity.

---

## 1. Prioritised Remediation Roadmap

### Phase P0: Production Blockers & Immediate Revenue Unlocks
*Urgent catalogue gaps that prevent customers from viewing or purchasing available stock.*

1. **Reactivate 2 Archived Live Species in MongoDB Atlas:**
   * Unarchive `rose-bubble-tip-anemone` (*Ultra Rose Bubble Tip Anemone*) and `emperor-angelfish-juvenile` (*Emperor Angelfish Show Juvenile*).
   * Update MongoDB records from `isArchived: true` $\rightarrow$ `isArchived: false`.
   * Add both entries to `lib/data/products.ts` so they compile into the Next.js static generation (`generateStaticParams`).
   * Backfill `isQuarantined: true` on Emperor Angelfish and assign biosecure copper-free holding notes to Bubble Tip Anemone.

2. **Ingest 9 Missing Indian Marine Species:**
   * Create structured product records for:
     1. `clarkii-clownfish` (*Clark's Anemonefish / Clarky*)
     2. `pink-carpet-anemone` (*Pink Carpet Anemone*)
     3. `blue-carpet-anemone` (*Blue Carpet Anemone*)
     4. `cleaner-doctor-wrasse` (*Common Cleaner / Doctor Wrasse*)
     5. `turbo-algae-snail` (*Indo-Pacific Turbo Snail*)
     6. `multicolour-sea-slug` (*Multicolour Nudibranch / Sea Slug*)
     7. `queen-coris-wrasse-adult` (*Queen Coris Wrasse Adult*)
     8. `sand-sifting-star` (*Sand Sifting Sea Star*)
     9. `peppermint-shrimp` (*Aiptasia-Eating Peppermint Shrimp*)
   * Assign `category: 'marine-life'`, `itemType: 'live'`, and appropriate care/quarantine guides.

3. **Ingest 2 Missing Finova Marine Flake Foods:**
   * Create structured product records for:
     1. `finova-spirulina-flake` (*Finova Spirulina Flake Food*)
     2. `finova-brine-shrimp-flake` (*Finova Brine Shrimp Flakes*)
   * Assign `category: 'salt-chemistry'`, `itemType: 'dry'`, and link under the Marine Nutrition subcategory.

4. **Fix Truncated Direct Call CTA on Contact Page:**
   * In `app/contact/page.tsx` line 422:
     * Change `<span className="text-xs">Call +91 93304</span>` $\rightarrow$ `<span className="text-xs">Call +91 93304 36603</span>`.

5. **Resolve SunSun JTP-3800 Pricing Conflict:**
   * Present the two conflicting price records to the owner and obtain definitive confirmation:
     * *Option A:* Selling Price **₹4,800** | MRP **₹5,500**
     * *Option B:* Selling Price **₹4,500** | MRP **₹4,800**
   * Update MongoDB and `lib/data/products.ts` from POR to the approved retail price.

---

### Phase P1: Variant Matrix & Commercial Policy Hardening
*Optimizing commercial clarity, trade terms, and customer communication.*

6. **Configure Cinnamon Tomato Clownfish Variant Matrix:**
   * Update `cinnamon-tomato-clown` to support structured commercial variants:
     * Variant 1: `Single Specimen` (Standard POR)
     * Variant 2: `Bonded Mated Pair` (Premium POR)
   * Ensures the administrative Control OS and checkout payloads capture exact customer intent.

7. **Incorporate Quarantined Fish Value Policy:**
   * Add a new section to `app/shipping-policy/page.tsx`:
     > **05. Prophylactic Quarantine & Fair Value Guarantee**  
     > *"Marine Creatures does not engage in discount clearance or street-market pricing for marine livestock. Every specimen undergoes intensive biological quarantine, parasite eradication, and vigorous captive feeding acclimation. Our pricing reflects active life-support maintenance, prophylactic medication costs, and guaranteed health stability."*
   * Surface a concise summary on live fish cards and detail pages.

8. **Integrate Official WhatsApp Broadcast Channel:**
   * Obtain the exact WhatsApp Channel URL from the owner (format: `https://whatsapp.com/channel/0029Va...`).
   * Add `whatsappChannel` to `SITE_CONFIG` in `lib/config.ts`.
   * Add a *"Join Official WhatsApp Channel for Stock Drops"* pill in the header, footer, and mobile drawer.

---

### Phase P2: Media Asset Pipeline & Database Parity
*Visual assets and multi-source data synchronization.*

9. **Sync Codebase Terminology into MongoDB Atlas:**
   * In the recent terminology cleanup, `blue-treasure-coral-sand` was updated in code to display as *"Blue Treasure Natural Marine Aragonite Sand"*.
   * Run a surgical update query on MongoDB Atlas `Cluster0.products` so the database reflects the updated name, ensuring admin Control OS and cloud sync match the code repository.

10. **Ingest Real Shop-Floor Photography for 8 Pending Dry Items:**
    * Coordinate with the owner to obtain real shop-floor photography for the 8 items currently rendering blueprint graphic fallbacks:
      1. `re-ocean-mini-60` (RE Ocean Mini 60 Filter)
      2. `re-ocean-mini-80` (RE Ocean Mini 80 Filter)
      3. `manual-marine-light` (Manual Marine Light)
      4. `qtermoline-bio-media` (Qtermoline Media)
      5. `amozorb-ammonia-adsorbent` (Amozorb Media)
      6. `ceramic-house-filter-media` (Ceramic House)
      7. `bio-pods-filter-media` (Bio Pods)
      8. `trwil-tower-filter-media` (Trwil Tower)

---

## 2. Explicit Owner Confirmations Required Before Implementation

Before any source code or database mutations are executed, the owner must provide written confirmation on the following four decisions:

```
========================================================================================
DECISION REQUIRED                      OPTIONS / SPECIFICS                      OWNER CHOICE
========================================================================================
1. SunSun JTP-3800 Retail Price        A) ₹4,800 (MRP ₹5,500)
                                       B) ₹4,500 (MRP ₹4,800)                  [ Pending ]

2. "Clown Yellow Belly" Identity       A) Metallic Yellow Belly Blue Damsel
                                       B) Yellow Belly Clarkii Clownfish morph
                                       C) New separate species record          [ Pending ]

3. Official WhatsApp Channel URL       Exact link required (e.g.
                                       https://whatsapp.com/channel/...)       [ Pending ]

4. Pricing for Missing Indian Species  Confirm whether all 9 missing species
                                       will launch as Price on Request (POR)
                                       or with fixed base retail rates         [ Pending ]
========================================================================================
```

