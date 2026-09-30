# MARINE CREATURES — CLIENT CONTENT & COMMERCIAL CLAIM APPROVAL MATRIX

**Document Code:** `MC-CAM-2026-V1`  
**Purpose:** Pre-Phase-3 Commercial, Operational, and Content Reconciliation  
**Target Reviewer:** Suraj Shasmal (Founder & Principal Aquarist)  
**Status:** AWAITING CLIENT APPROVAL  
**Last Updated:** September 29, 2026  
---
## 1. PURPOSE & MANDATE
This matrix cataloges every operational claim, performance metric, commercial pricing formula, and portfolio case study introduced during Phase 2 frontend refinement. Per the CTO Reconciliation Gate, no claim may be presented as verified commercial fact without explicit client confirmation.
All items with status `CLIENT CONFIRMATION REQUIRED` must be reviewed and signed off by Founder Suraj Shasmal prior to public marketing launch.
---
## 2. MASTER COMMERCIAL & OPERATIONAL CLAIM MATRIX

| Claim / Item | Current Page / Component | Current Value / Text | Approved Source | Client Approval | Launch Status | Reconciliation Notes |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **Zero Livestock Loss Protocol** | `/renovation` (Pillars) | "Zero Livestock Casualties (Temp Holding & Quarantine Facilities Provided)" | Phase 2 Editorial | PENDING | `CLIENT CONFIRMATION REQUIRED` | Confirm on-site mobile staging pod capacity and temporary aeration protocols. |
| **<28dB Acoustic Threshold** | `/renovation` & `/our-worlds` | "Whisper-quiet DC variable pumps operating below 28dB" / sub-24dB plant room | Phase 2 Engineering Spec | PENDING | `CLIENT CONFIRMATION REQUIRED` | Confirm decibel ratings of specified DC return pumps and sound-damped cabinetry. |
| **Museum-Grade Optical Clarity** | `/renovation` (Pillars & Showcase) | "Museum-grade biological clarity guarantee" | Phase 2 Editorial | PENDING | `CLIENT CONFIRMATION REQUIRED` | Confirm multi-stage chemical and carbon polish standards. |
| **48h Average Renovation Turnaround** | `/renovation` (Metrics) & `banners.ts` | "48h Average Turnaround — Plumbing & sump replacement with minimal disruption" | Phase 2 Editorial | PENDING | `CLIENT CONFIRMATION REQUIRED` | **Distinction:** Strictly describes on-site mechanical hardware and sump overhaul; distinct from transit delivery guarantee. |
| **99.8% Specimen Survival Rate** | `/renovation` (Metrics) | "99.8% Specimen Survival — Safe on-site staging & acclimation protocol" | Phase 2 Editorial | PENDING | `CLIENT CONFIRMATION REQUIRED` | **Distinction:** Strictly describes on-site renovation holding survival; distinct from air cargo live-arrival rate. |
| **48-Hour Live Arrival Guarantee (LAG)** | Marketplace, Checkout, Tracking (`Order.ts`, `OrderContext.tsx`, `PRD`) | "48-Hour Live Arrival Guarantee (LAG) Active on Air Cargo" / Delivery within 24–48h | PRD `MC-PRD-2026-V2` | PENDING | `CLIENT CONFIRMATION REQUIRED` | Confirmed as established PRD transit policy for nationwide air cargo deliveries. |
| **99.5%+ Live Arrival Rate** | PRD (`MC-PRD-2026-V2` Line 303) | "99.5%+ successful live livestock arrivals" | PRD `MC-PRD-2026-V2` | PENDING | `CLIENT CONFIRMATION REQUIRED` | Nationwide cargo logistics DOA policy for online specimen orders; distinct from renovation survival metric. |
| **30-Day Stability Warranty** | `/renovation` (Metrics) | "30-Day Stability Warranty — Guaranteed parameter support following handover" | Phase 2 Editorial | PENDING | `CLIENT CONFIRMATION REQUIRED` | Confirm duration and frequency of post-commissioning chemical water testing. |
| **World Builder Indicative Pricing** | `/aquarium-design` (`AquariumEstimator.tsx`) | Parametric formula: `₹1,85,000` to `₹22,00,700` (Default: `₹3,41,000`) | Phase 2 Algorithmic Estimate | PENDING | `CLIENT CONFIRMATION REQUIRED` | Classified as `INDICATIVE ESTIMATE`. Must be confirmed against actual fabrication and livestock costs. |
| **Case Study: Alipore Penthouse** | `/our-worlds` | 7,800L living reef partition; Studio Morphogenesis; 2025 | Demonstration Case Study | PENDING | `CLIENT CONTENT VERIFICATION REQUIRED` | Confirm whether client name, 7,800L scale, and partner architect represent real project or need replacement. |
| **Case Study: Sector V Corporate** | `/our-worlds` | 4,200L cylindrical coral column; Apex Energy Holdings; 2024 | Demonstration Case Study | PENDING | `CLIENT CONTENT VERIFICATION REQUIRED` | Confirm whether corporate client name and 4,200L scale represent real project or need replacement. |
| **Case Study: Ballygunge Heritage Villa** | `/our-worlds` | 3,200L reef in Burmese teak cabinetry; 2024 | Demonstration Case Study | PENDING | `CLIENT CONTENT VERIFICATION REQUIRED` | Confirm whether private residence details represent real installation or need replacement. |
| **Founder Studio Portrait** | `/contact`, Header, Footer | Placeholder brand logo (`/logo.jpg`) | Asset Pipeline | PENDING | `CLIENT CONFIRMATION REQUIRED` | High-resolution studio portrait of Suraj Shasmal required per `BRAND_ASSET_REQUIREMENTS.md` (IMG-02). |
| **Renovation Tripod Before/After Pair** | `/renovation` (`BeforeAfterSlider.tsx`) | Unsplash matched photography pair | Asset Pipeline | PENDING | `CLIENT CONFIRMATION REQUIRED` | Client must provide authentic matched tripod before/after photography per `BRAND_ASSET_REQUIREMENTS.md` (IMG-03A/B). |
---
## 3. METRIC DISCREPANCY ANALYSIS & RESOLUTION
### 3.1 Live-Arrival Metric vs Specimen Survival Metric
| Attribute | E-Commerce Livestock Delivery Metric | Renovation On-Site Staging Metric |
| :--- | :--- | :--- |
| **Value in System** | `99.5%+` | `99.8%` |
| **Source Document** | PRD `MC-PRD-2026-V2` (Line 303) | `app/renovation/page.tsx` (Line 107) |
| **Domain** | Logistics & Transit (IndiGo / Air India Cargo) | On-Site Biological Restoration |
| **Subject** | Packed live coral and captive-bred fish in oxygenated insulated shipping pods | Existing residential/commercial livestock transferred to on-site holding pods during plumbing rebuild |
| **Resolution** | **DIFFERENT METRICS.** They govern separate business domains and must NOT be merged or conflated. Both require empirical sign-off from Suraj Shasmal. |
---
### 3.2 The 48-Hour Delivery Guarantee vs 48-Hour Renovation Turnaround
| Attribute | Transit Delivery Guarantee | Renovation Overhaul Turnaround |
| :--- | :--- | :--- |
| **Value in System** | `Within 24-48 Hours` / `48-hr LAG Active` | `48h Average Turnaround` |
| **Source Document** | PRD & `Order.ts` & `OrderTrackingModal.tsx` | `app/renovation/page.tsx` & `banners.ts` |
| **Domain** | Specimen Order Handover | Mechanical Life Support & Sump Swap |
| **Meaning** | Guaranteed delivery timeframe from order confirmation to doorstep arrival | Standard on-site duration required to strip failing sumps and install modern DC plumbing manifolds |
| **Resolution** | **SEPARATE CLAIMS.** The delivery guarantee must never be represented as a renovation turnaround promise, and the renovation turnaround must never be confused with shipping SLA. |
---
## 4. WORLD BUILDER INDICATIVE PRICING STRUCTURE
The 7-Stage Architectural World Builder (`components/services/AquariumEstimator.tsx`) calculates investment using the following formula:
$$\text{Estimated Price} = \text{round}\Big(\text{basePrice} \times \text{scaleMultiplier} \times \text{biomeMultiplier}\Big) + \text{materialAddon} + \text{systemAddon}$$
### Breakdown of Current Codebase Parameters:
1. **Form Factors (`basePrice`):**
   - Custom Wall Inset: ₹2,20,000
   - Freestanding Monolith: ₹1,85,000
   - Dual-Sided Room Divider: ₹3,10,000
   - Curved Monolith Panorama: ₹3,90,000
2. **Scale Multipliers (`scaleMultiplier`):**
   - Executive (3.5 ft / ~320L): `1.0`
   - Centerpiece (5.0 ft / ~650L): `1.55` *(Default)*
   - Estate Grand (7.0 ft / ~1,300L): `2.4`
   - Monumental (10.0+ ft / ~2,800L+): `3.8`
3. **Biome Multipliers (`biomeMultiplier`):**
   - Indo-Pacific Living Coral Reef: `1.0` *(Default)*
   - Pelagic Deep-Blue Predator Biotope: `1.15`
   - Bioluminescent Moon Jellyfish Kreisel: `1.25`
   - Hard Coral (SPS) Ultra Sanctuary: `1.35`
4. **Material Add-ons (`materialAddon`):**
   - Museum OptiWhite™ Low-Iron Glass: +₹0 *(Base)*
   - Seamless Cast Acrylic Monolith: +₹55,000
5. **System Add-ons (`systemAddon`):**
   - Smart Silent Sump & Flow: +₹0 *(Base)*
   - Titanium Climate & Automated Dosing: +₹65,000
   - Autonomous IoT Cloud Ecosystem: +₹1,45,000
### Dynamic Range:
- **Theoretical Minimum:** ₹1,85,000 (Freestanding, 320L, Reef, Glass, Smart Sump)
- **Theoretical Maximum:** ₹22,00,700 (Curved Acrylic, 2,800L+, SPS Sanctuary, IoT Cloud)
- **Default Starting Configuration:** ₹3,41,000 (Wall Inset, 650L, Reef, Glass, Smart Sump)
- **Commercial Classification:** `INDICATIVE ESTIMATE` — In the UI, this is explicitly marked *"Indicative Investment Range — Subject to architectural site audit and water supply verification."* Client must approve the multipliers before representing as confirmed contract pricing.
---
## 5. CASE STUDY RECONCILIATION SUMMARY
| Project Identifier | Displayed Name | Displayed Volume | Displayed Client | Current Action |
| :--- | :--- | :--- | :--- | :--- |
| **CS-01** | The Alipore Penthouse Monolith | 7,800 Liters | Studio Morphogenesis | Retain as demonstration layout; await client real project photos or name confirmation. |
| **CS-02** | The Sector V Corporate Sanctuary | 4,200 Liters | Apex Energy Holdings | Retain as demonstration layout; await client real corporate project reference. |
| **CS-03** | The Ballygunge Heritage Villa Reef | 3,200 Liters | Private Heritage Collector | Retain as demonstration layout; await client real villa reference. |
---
## 6. CLIENT ACTION CHECKLIST BEFORE LAUNCH
- [ ] Confirm or adjust the 48-hour renovation turnaround claim.
- [ ] Confirm or adjust the 99.8% specimen survival claim during on-site staging.
- [ ] Confirm or adjust the 30-day parameter stability warranty.
- [ ] Confirm or adjust the World Builder pricing formula and base figures.
- [ ] Supply or approve real project names and photography for `/our-worlds`.
- [ ] Supply Founder Studio Portrait (IMG-02).
- [ ] Supply matched Before/After Renovation tripod photos (IMG-03A/B).
