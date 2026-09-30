# MARINE CREATURES — BRAND ASSET REQUIREMENTS SPECIFICATION
**Document Code:** `MC-BAR-2026-V1`  
**Target:** Client Asset Production & Photography Direction  
**Author:** CTO & Principal Interaction Architect  
**Status:** Approved for Asset Commissioning  

---

## 1. PURPOSE & MANDATE

Phase 1 and Phase 2 establish a world-class, architectural frontend system with responsive image scaling, accessible UI controls, and performance-tuned layout transitions. 

Per **Section 15 of the CTO Execution Command**, stock imagery must not be randomly swapped with uncontrolled web images, and synthetic photography must never be fabricated. This document specifies the exact photography and video assets required from Marine Creatures studio and client project sites so they can be dropped directly into the production asset pipeline without requiring code or architectural revisions.

---

## 2. PHOTOGRAPHIC ART DIRECTION GUIDELINES

All Marine Creatures brand imagery must adhere to the following luxury architectural criteria:

* **Atmosphere:** Abyssal luxury — deep oceanic blues, crystal-clear water with natural caustics, and pristine low-iron optical glass transparency.
* **Lighting:** High CRI (Color Rendering Index > 95) architectural lighting. Avoid washed-out flash photography; preserve deep oceanic blacks (`#02070b`) with vivid biological illumination.
* **Color Accuracy:** Corals and specimen colors must reflect true biological pigments under balanced 14,000K–18,000K spectrum (avoid monochromatic purple/blue washes).
* **Interior Context:** For installed aquariums, shoot wide to capture high-end architectural surroundings (Italian marble, hardwood millwork, floor-to-ceiling windows) establishing luxury residential and commercial scale.
* **Format:** RAW master captures; delivered as uncompressed 16-bit TIFF or high-bitrate WebP/PNG with color profile sRGB / Display P3.

---

## 3. MASTER ASSET REQUIREMENTS MATRIX

| Asset ID | Required Image & Subject | Recommended Master Dimensions | Target Aspect Ratio | Intended Section & Component | Mobile Crop Requirement | Desktop Crop Requirement | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **IMG-01** | **Flagship Living Reef Hero**<br>Panoramic living SPS/LPS reef with swimming Clownfish & Tangs; natural caustics refracting from above. | 2560 × 1440 px (Min 2K, 300DPI) | 16:9 Landscape | Homepage Hero (`components/home/Hero.tsx`) | Center vertical crop at 35% from top to prioritize upper coral crests on 320px–430px screens. | Full panoramic 16:9 landscape with focal balance on center-right. | **P1 (Critical)** |
| **IMG-02** | **Founder & Principal Aquarist**<br>Studio portrait of Suraj Shasmal inspecting a living reef or interacting with an architectural specimen. | 1600 × 1600 px | 1:1 Square | Concierge Drawer, Contact Page, About Page (`app/contact/page.tsx`, `components/layout/Header.tsx`) | Tight square crop centered on face/specimen; legible down to 48×48 px. | 1:1 square with subtle atmospheric oceanic background. | **P1 (Critical)** |
| **IMG-03A** | **Renovation Before: Declining Tank**<br>Overrun nuisance hair algae, cyanobacteria, scratched glass, brownish-yellow imbalanced water. | 2400 × 1500 px | 16:10 | Renovation Slider (`components/ui/BeforeAfterSlider.tsx`, `app/renovation/page.tsx`) | Centered 16:10 frame aligned identically with IMG-03B so horizontal wipe reveals exact spatial coordinates. | Fixed 16:10 frame locked to IMG-03B tripod position. | **P1 (Critical)** |
| **IMG-03B** | **Renovation After: Living Centerpiece**<br>The exact same tank after Marine Creatures transformation: OptiWhite clarity, sculpted rock, thriving corals. | 2400 × 1500 px | 16:10 | Renovation Slider (`components/ui/BeforeAfterSlider.tsx`, `app/renovation/page.tsx`) | Centered 16:10 frame aligned identically with IMG-03A. | Fixed 16:10 frame matching IMG-03A tripod position. | **P1 (Critical)** |
| **IMG-04** | **Penthouse Monolith Form Factor**<br>Monumental wall-integrated cast acrylic reef in a luxury penthouse salon. | 2000 × 1333 px | 3:2 | Architectural Design (`components/home/DesignSection.tsx`, `components/services/AquariumEstimator.tsx`) | 4:3 centered crop emphasizing wall integration. | Full 3:2 or 16:9 showing room width and joinery. | **P2 (High)** |
| **IMG-05** | **Panoramic Room Divider Form Factor**<br>Dual-sided freestanding aquarium dividing formal dining and living spaces. | 2000 × 1333 px | 3:2 | Architectural Design (`components/home/DesignSection.tsx`, `components/services/AquariumEstimator.tsx`) | Center 4:3 crop showing depth through glass. | 3:2 wide shot showing both rooms visible through water. | **P2 (High)** |
| **IMG-06** | **360° Cylindrical Column Sanctuary**<br>Monumental circular marine column with schooling fish in corporate atrium or villa rotunda. | 2000 × 1333 px | 3:2 | Architectural Design (`components/home/DesignSection.tsx`, `components/services/AquariumEstimator.tsx`) | Vertical center crop showing full height of column. | 3:2 wide shot showing architectural volume. | **P2 (High)** |
| **IMG-07** | **Case Study: Alipore Penthouse**<br>7,800L architectural living wall in private Kolkata residence with Italian marble cladding. | 2400 × 1350 px | 16:9 | Our Worlds Portfolio (`app/our-worlds/page.tsx`) | Focus on primary living coral reef panel. | Wide interior angle showing interior salon integration. | **P2 (High)** |
| **IMG-08** | **Case Study: Sector V Corporate HQ**<br>4,200L cylindrical sanctuary in corporate boardroom setting with delegates. | 2400 × 1350 px | 16:9 | Our Worlds Portfolio (`app/our-worlds/page.tsx`) | Tight shot on cylindrical glass and vibrant reef fish. | Wide boardroom shot showing meeting table and aquarium. | **P2 (High)** |
| **IMG-09** | **Case Study: Ballygunge Heritage Villa**<br>3,200L reef integrated into historic colonial teak joinery with zero moisture damage. | 2400 × 1350 px | 16:9 | Our Worlds Portfolio (`app/our-worlds/page.tsx`) | Medium crop contrasting teak millwork with modern reef. | Wide shot showcasing historic architecture and tank. | **P2 (High)** |
| **IMG-10** | **Specimen Macro: Clownfish & Anemone**<br>Captive-bred designer Ocellaris hosting in Entacmaea quadricolor (Bubble Tip Anemone). | 1600 × 1600 px | 1:1 Square | Marketplace Detail (`components/marketplace/ProductDetailView.tsx`) | 1:1 square centered on fish eyes and anemone tentacles. | 1:1 square on solid deep-navy/black water background. | **P2 (High)** |
| **IMG-11** | **Specimen Macro: Blue Tang / Schooling**<br>Flawless Paracanthurus hepatus and Zebrasoma flavescens schooling over live rock. | 1600 × 1600 px | 1:1 Square | Marketplace Detail (`components/marketplace/ProductDetailView.tsx`) | 1:1 square centered on swimming specimens. | 1:1 square macro on deep-water background. | **P2 (High)** |
| **IMG-12** | **Specimen Macro: Cultured Corals (SPS/LPS)**<br>Vibrant Australian Acropora and Euphyllia Torch coral showing polyp extension and glow. | 1600 × 1600 px | 1:1 Square | Marketplace Detail (`components/marketplace/ProductDetailView.tsx`) | 1:1 square macro showing individual coral polyp detail. | 1:1 square macro on dark water backdrop. | **P2 (High)** |
| **IMG-13** | **Engineering & Life Support Plant**<br>Sump system with Schedule-80 PVC plumbing, titanium chillers, and zero vibration dampeners. | 1920 × 1080 px | 16:9 | Installation & Services (`app/installation/page.tsx`, `app/services/page.tsx`) | Medium shot of neat color-coded PVC manifold. | Wide view of entire sub-cabinet plant room organization. | **P3 (Medium)** |
| **IMG-14** | **Water Testing & Laboratory Care**<br>Senior aquarist conducting digital photometer / ICP-OES water testing at mobile testing console. | 1920 × 1080 px | 16:9 | Services & Renovation (`app/services/page.tsx`, `app/renovation/page.tsx`) | Focus on digital testing instruments and vials. | Medium environmental shot of aquarist in clean uniform. | **P3 (Medium)** |

---

## 4. INGESTION & PIPELINE CONVENTIONS

When real assets are delivered by Marine Creatures:

1. **Storage Location:** Save optimized WebP masters in `public/images/brand/` or upload to the production CDN.
2. **File Naming Convention:**
   - Hero: `hero-living-reef-2026.webp`
   - Before/After: `renovation-before-case1.webp`, `renovation-after-case1.webp`
   - Form Factors: `form-monolith.webp`, `form-divider.webp`, `form-cylinder.webp`
   - Case Studies: `world-alipore.webp`, `world-sector-v.webp`, `world-ballygunge.webp`
   - Specimens: `specimen-[slug].webp`
3. **Format & Compression:**
   - WebP format (quality 85–90)
   - Include corresponding `@2x` retina files or modern responsive `srcset`
   - Retain exact aspect ratios listed in Section 3 to ensure zero layout shift (CLS = 0)
