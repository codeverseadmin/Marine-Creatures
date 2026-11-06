# Marine Creatures — Marine Life Husbandry & Quarantine System Audit

**Audit Date:** November 6, 2026  
**Focus:** Owner Directive: *"ALL FISH ARE QUARANTINED"* vs. Production Representation  
**Scope:** Technical data integrity across database models, UI badges, transit guarantees, and biological separation between Fish and Invertebrates.

---

## 1. Executive Summary

The business owner explicitly emphasizes that **all live fish undergo quarantine prior to commercial release**.

This audit examined:
1. Whether quarantine status is represented in database records.
2. How quarantine status is surfaced to prospective buyers on cards and detail views.
3. Whether transit claims accurately reflect quarantine conditioning versus immediate dispatch.
4. Whether non-fish livestock (anemones, sea stars, snails, shrimp, sea slugs) are correctly separated from fish quarantine claims.

---

## 2. Database & Data Model Architecture

In `models/Product.ts` and MongoDB Atlas (`Cluster0.products`), the product schema incorporates dedicated quarantine attributes:

```typescript
// models/Product.ts
export interface IProductDocument extends Document {
  availabilityStatus?: 'AVAILABLE' | 'LIMITED' | 'ON REQUEST' | 'QUARANTINED' | 'OUT OF STOCK';
  availabilityNote?: string;
  isQuarantined?: boolean;
  rarity?: string;
  feedingCondition?: string;
  origin?: string;
  careGuide?: {
    temperature: string;
    salinity: string;
    ph: string;
    diet?: string;
    temperament?: string;
    minimumTankSize?: string;
    reefSafe?: boolean;
    careLevel?: string;
    acclimationSteps?: string[];
  };
}
```

### Database Verification Findings:
* **All 14 active marine-life fish in MongoDB have:**
  * `isQuarantined: true`
  * `availabilityStatus: 'QUARANTINED'`
  * `priceOnRequest: true` (ensuring commercial quarantine protocols precede transaction)
  * Comprehensive `careGuide` with explicit 4-step drip acclimation guidelines.
  * Verified feeding condition notes (e.g. `feedingCondition: "Confirmed Feeding Actively on Pellets & Mysis"`).
* **Archived Records Lack Quarantine Metadata:**
  * The archived records (`rose-bubble-tip-anemone`, `emperor-angelfish-juvenile`, `designer-clownfish-pair`, `pacific-blue-tang`) have `isQuarantined: undefined` and `availabilityStatus: undefined`. If reactivated, they must be backfilled with explicit status flags.

---

## 3. Customer-Facing UI Presentation

On the customer storefront, quarantine status is rendered dynamically:

### A. Marketplace Product Cards (`components/marketplace/ProductCard.tsx`)
* **Visual Indicator:**
  ```tsx
  {product.isQuarantined ? (
    <span className="text-[var(--color-cyan)] flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" aria-hidden="true" />
      Quarantined
    </span>
  ) : ...}
  ```
* **Card Integrity:** Quarantined fish display a glowing, pulsing cyan status badge labeled `"Quarantined"`, distinguishing them from off-the-reef unconditioned stock.

### B. Product Detail View (`components/marketplace/ProductDetailView.tsx`)
* **Badges & Header Strip:** Renders an authoritative badge: `"Quarantined Specimen"`.
* **Curator Husbandry Note:** Lines 869–872 render a dedicated trust badge:
  > *"Marine Curators Note: Specimens are fully acclimated and feeding vigorously in captive quarantine prior to dispatch."*
* **Video Proof CTA:** Lines 675–689 render a direct conversion trigger:
  > `"REQUEST LIVE FEEDING VIDEO ON WHATSAPP"`  
  > (Opens a pre-filled WhatsApp inquiry asking the curator for a 10-second tank feeding clip before booking).

---

## 4. Transit Timeline Conflict: "Ready to Dispatch" vs. "Under Quarantine"

### Identified Defect:
While quarantine badges are prominent, the **Delivery Information Box** on product detail pages currently displays:
* **Estimated Transit:** `1-2 Days`
* **Shipping Method:** `Airport-to-Airport Air Cargo`
* **Guarantee:** `100% Live Arrival Guaranteed`

### The Operational Risk:
* When a customer sees `"Estimated Transit: 1-2 Days"`, they reasonably assume that the specimen will be dispatched tomorrow and arrive in 48 hours.
* However, if a newly imported specimen is on **Day 4 of a mandatory 14-day quarantine cycle**, immediate dispatch is impossible and would breach quarantine protocol.
* **Audit Finding:** The catalogue currently lacks a **Quarantine Release Date** or an explicit badge distinguishing between:
  1. *Fully Conditioned / Ready for Flight Booking*
  2. *Active Quarantine Cycle / Booking Open for Future Dispatch*

---

## 5. Biological Separation: Fish vs. Invertebrates

The owner's availability list groups all specimens under *"MARINE LIFE — FISH & INVERTEBRATES"* with the umbrella header *"ALL FISH ARE QUARANTINED"*.

### Critical Biological Distinctions:
Fish quarantine and invertebrate holding are **fundamentally incompatible systems**:

| Attribute | Marine Fish Quarantine | Marine Invertebrate Holding |
| :--- | :--- | :--- |
| **Prophylactic Treatments** | Copper sulphate / Seachem Cupramine (0.50 ppm), Chloroquine phosphate, Formalin dips, Praziquantel | **STRICTLY COPPER-FREE**. Even trace copper (0.05 ppm) is lethal to anemones, snails, sea stars, and shrimp. |
| **Quarantine Focus** | Marine Ich (*Cryptocaryon irritans*), Velvet (*Amyloodinium*), Flukes, Bacterial fin rot | Ectoparasite vector shedding, hitchhiker isolation, foot/tissue damage inspection |
| **Feeding Regimen** | Meaty mysis, enriched pellets, nori grazing to build fat reserves | Microplankton, light/zooxanthellae photosynthesis (anemones), detritus (sea stars), biofilm/algae (turbo snails) |
| **Specimens on List** | Purple Tang, Lyretail Hogfish, Cinnamon Clown, Clarky, Emperor Angel, Dr Wrasse, Queen Coris | Bubble Tip Anemone, Pink Carpet, Blue Carpet, Turbo Snail, Sea Slug, Sand Shifter Star, Peppermint Shrimp |

### Audit Recommendation:
1. **Never apply the `isQuarantined` fish badge to Invertebrates without precise labeling.** Invertebrate listings should be tagged as `"Conditioned & Biosecure System"` rather than `"Quarantined Fish"`.
2. **Explicit Water Isolation:** Customer-facing copy must assure reef hobbyists that invertebrates are maintained in copper-free holding systems, completely separate from medicated fish quarantine tanks.

---

## 6. Specimen-by-Specimen Quarantine Audit Matrix

| Requested Specimen | Taxon | Status in DB | `isQuarantined` Flag | Customer Visibility | Quarantine Claims Accuracy |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Purple Tang L (Red Sea)** | Fish | Active | `true` | Public | **Accurate.** Quarantined, feeding note present, POR pricing. |
| **Lair Tail Hogfish (rare)** | Fish | Active | `true` | Public | **Accurate.** Feeding condition noted, rare status marked. |
| **Cinnamon Tomato Clown** | Fish | Active | `true` | Public | **Accurate.** Marked quarantined; missing separate pair variant. |
| **Bubble Tip Anemone** | Invert | Archived | `undefined` | Hidden | **Inaccurate.** Hidden from customer; needs copper-free biosecure badge upon unarchiving. |
| **Clarky** | Fish | Missing | N/A | Missing | **Unrepresented.** Must receive `isQuarantined: true` upon creation. |
| **Pink Carpet** | Invert | Missing | N/A | Missing | **Unrepresented.** Invertebrate; requires biosecure reef system badge. |
| **Blue Carpet** | Invert | Missing | N/A | Missing | **Unrepresented.** Invertebrate; requires biosecure reef system badge. |
| **Emperor Angel Juvenile** | Fish | Archived | `undefined` | Hidden | **Inaccurate.** Archived in DB; needs quarantine flags when restored. |
| **Dr Wrasse** | Fish | Missing | N/A | Missing | **Unrepresented.** Delicate cleaner wrasse; requires verified feeding acclimation. |
| **Turbo Snail** | Invert | Missing | N/A | Missing | **Unrepresented.** Clean-Up Crew invert; copper-free holding only. |
| **Clown Yellow Belly** | Fish/Damsel | Active* | `true` | Public* | **Ambiguous.** Mapped to damselfish; verified quarantined. |
| **Sea Slug Multicolour** | Invert | Missing | N/A | Missing | **Unrepresented.** Specialized diet invert; non-medicated holding. |
| **Queen Coris Adult** | Fish | Missing | N/A | Missing | **Unrepresented.** Large carnivore wrasse; requires thorough prophylactic protocol. |
| **Sand Shifter Star** | Invert | Missing | N/A | Missing | **Unrepresented.** Substrate invert; copper-free holding only. |
| **Peppermint Shrimp** | Invert | Missing | N/A | Missing | **Unrepresented.** Crustacean; strictly copper-free holding. |

