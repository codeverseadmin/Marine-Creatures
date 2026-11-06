# Marine Creatures — Missing Products, Missing Variants & Inactive Inventory Report

**Audit Date:** November 6, 2026  
**Auditor:** Technical & Architectural Audit Team  
**Scope:** Deep-dive identification of unrepresented, partially configured, and archived inventory items from the Owner's Availability List.

---

## 1. Inventory Deficit Overview

The reconciliation audit identified three distinct tiers of inventory deficiency:
1. **Completely Missing Products (11 items):** Zero records exist in MongoDB Atlas or the codebase catalogue.
2. **Missing Product Variants (1 item):** The parent product exists, but the requested commercial variant is unconfigured in the SKU matrix.
3. **Inactive / Archived Products (2 items):** Valid database documents exist in MongoDB Atlas, but have `isArchived: true` and are stripped from the active catalogue fallback, rendering them completely invisible to customers.

---

## 2. Completely Missing Products (11 Items)

The following 11 items requested by the owner have **zero presence** in the production database (`products` collection) and codebase data files (`lib/data/products.ts`):

### A. Missing Indian Marine Life (9 Species)

| # | Requested Name | Biological / Trade Identity | Category | Taxonomic Classification | Estimated Rarity / Market Role |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **1** | **Clarky** | Clark's Anemonefish (*Amphiprion clarkii*) | `marine-life` | Teleostei / Pomacentridae | Popular, hardy hosting clownfish; accepts almost any host anemone. High commercial demand. |
| **2** | **Pink Carpet** | Pink Carpet Anemone (*Stichodactyla haddoni* / *gigantea*) | `marine-life` | Anthozoa / Stichodactylidae | High-end showpiece host anemone. Highly light-demanding, delicate transit requirements. |
| **3** | **Blue Carpet** | Blue Carpet Anemone (*Stichodactyla gigantea* / *haddoni*) | `marine-life` | Anthozoa / Stichodactylidae | Ultra-rare vibrant morph. Premium price on request centerpiece specimen. |
| **4** | **Dr Wrasse** | Common Cleaner Wrasse / Doctor Wrasse (*Labroides dimidiatus*) | `marine-life` | Teleostei / Labridae | Essential reef utility fish. Actively cleans ectoparasites from larger tangs/angelfish. High demand among hobbyists. |
| **5** | **Turbo Snail** | Mexican / Indo-Pacific Turbo Snail (*Turbo fluctuosa* / *brunneus*) | `marine-life` | Gastropoda / Turbinidae | Foundational Clean-Up Crew (CUC) grazer. Critical for controlling nuisance hair algae. Essential baseline stock. |
| **6** | **Sea Slug Multicolour** | Nudibranch / Chromodoris / Phyllidiella | `marine-life` | Gastropoda / Nudibranchia | Colorful ornamental micro-invert. Highly specialized sponge or bryozoan diet; requires expert feeding guidance. |
| **7** | **Queen Coris Adult** | Queen Coris Wrasse Adult (*Coris formosa* / *Coris frerei*) | `marine-life` | Teleostei / Labridae | Large show fish (up to 30 cm) with dramatic adult blue/green geometric stripes. Requires cavernous rockwork. |
| **8** | **Sand Shifter Star** | Sand Sifting Sea Star (*Astropecten polyacanthus*) | `marine-life` | Asteroidea / Astropectinidae | Substrate utility echinoderm. Aerates aragonite sandbeds and consumes trapped detritus. Crucial for reef health. |
| **9** | **Peppermint Shrimp** | Peppermint Shrimp (*Lysmata wurdemanni* / *boggessi*) | `marine-life` | Malacostraca / Hippolytidae | Premium biological control invert. Renowned for consuming invasive pest Aiptasia anemones. Consistently sought after. |

### B. Missing Nutrition & Dry Goods (2 Items)

| # | Requested Name | Trade Description | Category | Manufacturer / Brand | Notes |
| :-: | :--- | :--- | :--- | :--- | :--- |
| **10** | **Finova Spirulina Flake** | Spirulina-enriched dry flake nutrition | `salt-chemistry` | Finova Aquatic Feeds | High-protein vegetable staple for herbivorous tangs and dwarf angels. |
| **11** | **Finova Brine Shrimp Flakes** | Artemia brine shrimp dry flake nutrition | `salt-chemistry` | Finova Aquatic Feeds | General marine community flake food with balanced lipid profile. |

---

## 3. Missing Product Variants (1 Item)

### Cinnamon Tomato Clownfish (`cinnamon-tomato-clown`)
* **Owner's Request:** *"Cinnamon Tomato Clown — pair/single"*
* **Current Catalogue Representation:**
  * Product ID: `cinnamon-tomato-clown`
  * Name: `Cinnamon Tomato Clownfish`
  * Status: Active (`isArchived: false`), Category: `marine-life`, Price: `POR` (Price on Request / ₹0).
  * In MongoDB Atlas and `lib/data/products.ts`, `variants` array is **empty (`[]`)**.
  * The description mentions: *"Available as single specimen or bonded pair."*
* **Deficiency:**
  * There is no structured variant selection mechanism on the storefront. A customer cannot select between `Single Specimen` and `Bonded Pair` on the product detail page, cart, or order payload.
  * In the administrative Control OS and checkout pipeline, pricing cannot be differentiated between a single fish and an established pair without separate variant IDs.

---

## 4. Inactive / Archived Products in MongoDB (2 Items)

Two items requested by the owner exist as pre-configured database documents in MongoDB Atlas (`Cluster0.products`), but were flagged with `isArchived: true` during earlier catalogue rationalization:

### 1. Ultra Rose Bubble Tip Anemone (`rose-bubble-tip-anemone`)
* **MongoDB Record:**
  ```json
  {
    "_id": "6aeb66dc0071bce58ed8764b",
    "id": "rose-bubble-tip-anemone",
    "name": "Ultra Rose Bubble Tip Anemone (RBTA)",
    "scientificName": "Entacmaea quadricolor",
    "category": "marine-life",
    "categoryLabel": "Marine Life & Corals",
    "price": 8999,
    "inStock": true,
    "stockCount": 4,
    "isArchived": true,
    "images": ["/images/products/rose-bubble-tip-anemone.jpg"],
    "imageStatus": "VERIFIED"
  }
  ```
* **Storefront Visibility:** **HIDDEN**. The API route `/api/products` filters out `isArchived: { $ne: true }`, and `lib/data/products.ts` excludes it from the static SSG build. Navigating directly to `/marketplace/rose-bubble-tip-anemone` triggers a `404 Not Found`.
* **Archival Reason:** Flagged as historical test data during initial prototype cleanup.
* **Correction Required:** Update `isArchived: false` in MongoDB, add to `lib/data/products.ts`, verify verified image `/images/products/rose-bubble-tip-anemone.jpg`, and set pricing to POR or official owner rate.

### 2. Emperor Angelfish Juvenile (`emperor-angelfish-juvenile`)
* **MongoDB Record:**
  ```json
  {
    "_id": "6aeb66dc0071bce58ed8764c",
    "id": "emperor-angelfish-juvenile",
    "name": "Emperor Angelfish (Show Juvenile)",
    "scientificName": "Pomacanthus imperator",
    "category": "marine-life",
    "categoryLabel": "Marine Life & Corals",
    "price": 19500,
    "inStock": true,
    "stockCount": 2,
    "isArchived": true,
    "images": ["/images/products/emperor-angelfish-juvenile.jpg"],
    "imageStatus": "VERIFIED"
  }
  ```
* **Storefront Visibility:** **HIDDEN**. Excluded from public endpoints and static route params.
* **Archival Reason:** Flagged as mock catalogue data during initial launch.
* **Correction Required:** Unarchive record in MongoDB (`isArchived: false`), assign quarantine metadata, update category label to `"Fish & Reef Life"`, and synchronize into active codebase data.

---

## 5. Potential Naming Ambiguity: "Clown Yellow Belly"

* **Owner Request:** Listed under Indian Marine Life as *"Clown Yellow Belly"*.
* **Current Catalogue Content:**
  * The catalogue contains `metallic-yellow-belly-blue-damsel` (*Metallic Yellow Belly Blue Damselfish*, `Chrysiptera hemicyanea`).
  * The catalogue also contains clownfish (`banggai-cardinal`, `cinnamon-tomato-clown`, `percula-picasso-clown`).
* **Ambiguity:**
  * In Indian aquarium trade vernacular, *"Yellow Belly"* is commonly shorthand for the *Yellow Belly Blue Damselfish* (a very common, hardy Indian coastal/imported damselfish).
  * However, if the owner intended a *Yellow Belly Clarkii Clownfish* or *Yellow Belly Regal Tang*, this represents a completely different taxonomic specimen.
* **Recommendation:** Formal confirmation must be obtained from the owner before creating new records or linking to `metallic-yellow-belly-blue-damsel`.

---

## 6. Commercial & SEO Impact of the Deficit

1. **Lost Search Intent (Clean-Up Crew & Essential Marine Life):**
   * Turbo Snails, Peppermint Shrimp, and Sand Sifting Sea Stars represent high-volume utility queries in India (*"buy turbo snails online India"*, *"peppermint shrimp for aiptasia India"*). Having zero listings forfeits organic search capture.
2. **Incomplete Anemone / Clownfish Synergy:**
   * Bubble Tip Anemones and Clarkii Clownfish are natural symbiotic pairs. While the site features custom aquarium design around clownfish hosting, neither the host anemones nor Clarkii clowns can currently be purchased from the marketplace.
3. **Storefront Stagnation Perception:**
   * A client browsing the "Fish & Reef Life" category sees only 14 fish, completely missing standard foundational clean-up crew inverts and staple Indian livestock.

