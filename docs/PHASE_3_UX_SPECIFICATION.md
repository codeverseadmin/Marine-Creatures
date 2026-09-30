# MARINE CREATURES — CONTROL OS UX & INTERACTION SPECIFICATION

**Project:** Marine Creatures  
**Document Code:** `MC-P3-UX-2026-V1`  
**Authority:** CTO / Lead System Architect — CODEVERSE Technologies  
**Phase:** Phase 3 — Operations, Administration & Business Intelligence  
**Status:** SPECIFICATION ONLY (CTO AUTHORIZED)  
**Date:** September 2026  

---

## 1. DESIGN PHILOSOPHY & OPERATIONAL DESIGN SYSTEM

### 1.1 The Operational Mandate
The public Marine Creatures website is designed to be cinematic, editorial, and leisurely immersive.

In contrast, **Marine Creatures Control OS is an operational cockpit.** It must be:
* **Calm:** Zero visual noise, minimal distraction, zero decorative animations.
* **Dense:** Maximum actionable data per vertical viewport inch; clean scannability.
* **Precise:** Clear status indicators, unambiguous labels, exact rupee formatting, explicit time offsets.
* **Fast:** Zero perceptible UI lag; sub-100ms response on filtering and search; instant drawer opens.

### 1.2 Color Tokens & Surface Elevation
The Control OS uses a high-contrast dark system specifically tuned to prevent eye fatigue during extended operational work:

```
┌────────────────────────────────────────────────────────┐
│ Workspace Canvas: #02070c (Deep Matte Obsidian)        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Base Card Surface: #07131d (Solid Charcoal Navy)   │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ Elevated Element: #0b1a26 (Row Hover / Modals) │ │ │
│ │ │ ┌────────────────────────────────────────────┐ │ │ │
│ │ │ │ Highlight / Input: #0d2233                 │ │ │ │
│ │ │ └────────────────────────────────────────────┘ │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

* **Surface Tokens:**
  - `bg-surface-canvas`: `#02070c` (Underlying shell)
  - `bg-surface-card`: `#07131d` (Panels, tables, sidebars)
  - `bg-surface-elevated`: `#0b1a26` (Active rows, modals, slide-overs)
  - `bg-surface-input`: `#040d14` (Form inputs, search bars)
  - `border-subtle`: `rgba(255, 255, 255, 0.08)` (Standard structural divider)
  - `border-focus`: `rgba(0, 184, 217, 0.5)` (Input active outline)
* **Functional Semantic Tokens:**
  - **Brand Accent / Primary:** `#00B8D9` (Cyan-400) — Primary buttons, active tabs, system focus.
  - **Success / Positive:** `#10B981` (Emerald-500) — Completed orders, live stock, approved state, healthy metrics.
  - **Warning / Action Required:** `#F59E0B` (Amber-500) — Quarantine status, pending reviews, low stock (1–2 units).
  - **Danger / Critical:** `#EF4444` (Rose-500) — Out of stock, order cancellation, backup failure, database alert.
  - **Neutral Muted:** `#94A3B8` (Slate-400) — Labels, secondary timestamps, helper notes.

### 1.3 Typography Hierarchy
* **UI Controls & Headers:** Inter (`--font-inter`)
  - Screen Titles: `text-xl sm:text-2xl font-bold tracking-tight text-white`
  - Section Headers: `text-xs font-bold uppercase tracking-wider text-slate-400`
  - Table Cell Primary: `text-xs font-medium text-slate-200`
  - Table Cell Secondary: `text-[11px] text-slate-500`
* **Data, Identifiers & Codes:** JetBrains Mono (`font-mono`)
  - Order IDs (`MC-8921`), Inquiries (`INQ-117844`), AWBs (`BLR-AIR-892144`)
  - Currency: `₹14,999` (Right-aligned in tables)
  - Water Chemistry: `25.5°C | 1.025 sg | 8.3 pH`
  - Timestamps: `2026-09-29 14:30 IST`

---

## 2. INFORMATION ARCHITECTURE & NAVIGATION STRUCTURE

The Control OS provides direct access to 8 operational domains through a persistent collapsible sidebar on desktop and a mobile quick-access drawer:

```text
MARINE CREATURES CONTROL OS
├── 01. OVERVIEW
│   ├── Business Vital Signs (KPIs)
│   ├── Priority Action Center ("Needs Attention")
│   └── Live Conversion Funnel
│
├── 02. CATALOG
│   ├── All Products (Inventory, Pricing, Badges, Stock Status)
│   ├── Marine Life Dossiers (Biological Curation & Care Specs)
│   ├── Materials & Hardware (OptiWhite Glass, Cast Acrylic, Titanium)
│   └── Category Taxonomies
│
├── 03. WORLDS (CMS)
│   ├── Case Studies (Editorial Publishing Workflow)
│   ├── Active Projects (Architectural Site Tracking)
│   └── Client Testimonials
│
├── 04. OPERATIONS
│   ├── Orders & Dispatch Queue (Live Step Progression & Invoices)
│   ├── Renovation Protocols (Site Teardown & Sump Swaps)
│   └── Maintenance Care Contracts
│
├── 05. CRM
│   ├── Inquiries (Inbound Website & WhatsApp Leads)
│   ├── Qualified Leads (Pipeline Stage & Budgeting)
│   └── Client Directory (Unified Customer Relationship Timeline)
│
├── 06. CONTENT & MEDIA
│   ├── Promo Banners (Carousel Order & Visibility)
│   ├── Centralized Media Library (Binary Storage & CDN Assets)
│   └── FAQs & Service Copy
│
├── 07. ANALYTICS
│   ├── Monthly Business Analysis
│   ├── Product Demand & Popularity
│   ├── Service Demand (Design vs Renovation)
│   └── Lead Source Attribution
│
└── 08. SYSTEM
    ├── MongoDB Atlas Health & Latency
    ├── Serialized Snapshots & Recovery
    ├── Administrative Audit Log
    └── Core Business Settings
```

---

## 3. SCREEN & COMPONENT SPECIFICATIONS

### 3.1 Overview Dashboard (The Operational Cockpit)
* **Goal:** Answers: *"What is happening in my business right now, and what needs my decision?"*
* **Top Metric Bar (4 Primary Cards):**
  1. **New Inquiries & Leads:** Count of leads received in past 7 days; comparison delta vs previous period.
  2. **Active Orders & Dispatches:** Count of orders in progress (`placed`, `quarantine`, `packed`, `dispatched`); total monetary value.
  3. **Low / Depleted Stock:** Count of live coral frags or captive fish requiring immediate restocking.
  4. **Active Architectural Commissions:** Number of active design and renovation projects currently in fabrication or on-site installation.
* **The Priority Action Center ("Needs Attention"):**
  A high-contrast card with direct one-click resolution buttons:
  - `[ 2 ORDERS ]` Awaiting approval and invoice number assignment $\rightarrow$ *Opens Order Approval Drawer*
  - `[ 1 DISPATCH ]` Order marked "packed" awaiting AWB flight code $\rightarrow$ *Opens Dispatch Modal*
  - `[ 4 INQUIRIES ]` Leads received > 12 hours ago without aquarist contact $\rightarrow$ *Opens Lead Timeline*
  - `[ 3 SPECIMENS ]` Stock count at 0 with active customer wishlist requests $\rightarrow$ *Opens Catalog Restock*
  - `[ 1 BACKUP ]` Last database snapshot created 8 days ago $\rightarrow$ *Triggers Backup Snapshot*
* **Conversion Funnel Visualization:**
  Clean horizontal bar showing step drop-offs:
  $$\text{Website Visitors} \longrightarrow \text{Inquiries} \longrightarrow \text{Qualified Consultations} \longrightarrow \text{Commissions / Orders}$$

---

### 3.2 Catalog & Marine Life Dossier CMS
* **Dual View Architecture:**
  - **Quick Table Mode:** Rapidly adjust price, stock count, and toggle `inStock` / `featured` directly in table rows without opening modals.
  - **Full Dossier Editor:** Slide-over drawer for deep editorial and biological curation.
* **Dossier Editor Layout (Tabbed Drawer):**
  1. **Commercial Tab:** SKU, HSN Code, Selling Price, Base Cost, Stock Count, Shipping Method (`Live Air Cargo Express`), DOA Guarantee text (`100% DOA Live Arrival Guaranteed`).
  2. **Biological Dossier Tab:**
     - Scientific Name, Family, Wild Geographic Origin (e.g. Coral Sea, Red Sea).
     - Reef Safe status: `Yes`, `Caution`, `No`.
     - Temperament: `Peaceful`, `Semi-Aggressive`, `Aggressive`.
     - Minimum Aquarium Volume: Formatted in liters and gallons.
     - Dietary Classification: Herbivore, Carnivore, Planktivore.
     - Water Chemistry Matrix: Temperature Range (24–26°C), Specific Gravity (1.024–1.026), pH (8.1–8.4).
  3. **Media Tab:** Primary cover photo selector, multi-photo gallery uploader, specimen video link.

---

### 3.3 Dynamic Case Study / Worlds CMS
* **The Problem Solved:** Founder Suraj Shasmal must be able to document luxury installations directly without developer assistance.
* **Publishing Lifecycle Machine:**
  - `DRAFT` $\rightarrow$ `IN REVIEW` $\rightarrow$ `APPROVED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED`.
  - Status is displayed with color-coded badges in table headers.
  - Unapproved or draft case studies are strictly blocked from rendering on public `/our-worlds` routes.
* **8-Stage Storytelling Editor Layout:**
  ```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │ CASE STUDY EDITOR: Alipore Penthouse Living Coral Wall                 │
  │ Status: [ PUBLISHED ▼ ]   Slug: /our-worlds/alipore-penthouse          │
  ├────────────────────────────────────────────────────────────────────────┤
  │ [1. Project Identity]                                                  │
  │ Project Title: Penthouse Marine Sanctuary                              │
  │ Client Anonymized Alias: Alipore Industrialist Family                  │
  │ Typology: [ Residential Penthouse ▼ ]   Year: 2025    Volume: 7,800 L  │
  ├────────────────────────────────────────────────────────────────────────┤
  │ [2. Visual Story Assets]                                               │
  │ ┌───────────────────────────┐  ┌─────────────────────────────────────┐ │
  │ │ BEFORE Photo (Tripod Matched)│  │ AFTER Photo (OptiWhite Living Reef) │ │
  │ │ [ Drag & Drop File ]      │  │ [ Drag & Drop File ]                │ │
  │ └───────────────────────────┘  └─────────────────────────────────────┘ │
  │ Hero Banner (2400×1350) + Gallery Sliders (Min 4 architectural angles) │
  ├────────────────────────────────────────────────────────────────────────┤
  │ [3. Architectural Narrative (6-Part Accordion)]                        │
  │ 1. The Challenge    - Structural weight calculation & floor loading    │
  │ 2. The Concept      - Room divider dividing salon and dining gallery   │
  │ 3. Engineering      - 100mm cast acrylic with titanium closed-loop     │
  │ 4. Life Support     - Acoustic dampening achieving <24dB quiet plant   │
  │ 5. Marine World     - 45 captive-bred fish, 80 SPS coral colonies      │
  │ 6. Handover Result  - 100% biological stability achieved in 30 days    │
  ├────────────────────────────────────────────────────────────────────────┤
  │ [4. SEO & Canonical Metadata]                                          │
  │ Meta Title, Meta Description, OG Image override                        │
  ├────────────────────────────────────────────────────────────────────────┤
  │ [ CANCEL ]               [ SAVE AS DRAFT ]           [ PUBLISH LIVE → ]│
  └────────────────────────────────────────────────────────────────────────┘
  ```

---

### 3.4 Operations & Live Dispatch Manager
* **Order Card & Stage Queue:**
  Orders are organized into a 5-step visual pipeline:
  `01 PLACED` $\rightarrow$ `02 QUARANTINE` $\rightarrow$ `03 PACKED` $\rightarrow$ `04 DISPATCHED` $\rightarrow$ `05 DELIVERED`
* **Stage Handover Actions:**
  - **Quarantine Step:** Technician logs water salinity matching destination tank parameters and checks specimen feeding vigor.
  - **Packing Step:** Logs packing container serial number, oxygen charge level, and insulation heat/ice pack configuration.
  - **Dispatch Step:** Requires entry of Carrier (`IndiGo CarGo Priority`), AWB Tracking Number, Flight Number, and Estimated Delivery Airport / Doorstep arrival window.
  - **One-Click Invoice Generator:** Opens print-ready, GST-compliant tax invoice in a new tab formatted with Founder Suraj Shasmal's official digital signature (`/signature.png`).
  - **WhatsApp Dispatch Bridge:** Generates pre-filled WhatsApp text with customer name, AWB code, and acclimation instructions.

---

### 3.5 CRM & Enquiry Intelligence
* **Unified Client Relationship Drawer:**
  Clicking any phone number opens the full interaction history for that individual:
  - *Timestamp 1:* Submitted World Builder Blueprint (Monolith, 1,300L, Est: ₹5.5L).
  - *Timestamp 2:* Founder Suraj Shasmal initiated WhatsApp concierge consultation.
  - *Timestamp 3:* Site visit conducted at Alipore residence.
  - *Timestamp 4:* Order `MC-8924` placed for specimen staging pack.
* **Lead Qualification Controls:**
  Drop-down selector to move inquiries across stages:
  `New` $\rightarrow$ `Contacted` $\rightarrow$ `Site Visit Scheduled` $\rightarrow$ `Quotation Sent` $\rightarrow$ `Won (Commissioned)` $\rightarrow$ `Archived`.
* **Private Notes:**
  Allows aquarists to document site access constraints (e.g. *"Service elevator max load 800kg; plumbing access in east wall"*).

---

### 3.6 Media Asset Library
* **Grid & Search Interface:**
  - Displays thumbnail grid of all media in Cloudinary or MongoDB Atlas binary storage.
  - Filter chips: `All`, `Specimens`, `Case Studies`, `Banners`, `Signatures`.
  - Badges on media showing file size, resolution, and usage count across products and pages.
* **Asset Uploader:**
  - Client-side auto-optimization before upload: images compressed to high-efficiency WebP (quality 0.85, max width 2400px).
  - Enforces mandatory accessibility `altText` before upload completes.
  - Supports quick clipboard copy of permanent URL (`/api/media/[id].webp`).

---

### 3.7 Analytics & Monthly Business Intelligence
* **Explainable Business Health Model (Zero Fabricated Metrics):**
  Instead of an arbitrary single number, the Control OS provides an explainable 4-dimensional assessment calculated from database records:
  1. **Demand Health:** Volume of new inquiries and World Builder blueprint completions vs previous 30-day period.
  2. **Conversion Health:** Ratio of inquiries converted into approved orders and site consultations.
  3. **Fulfillment Health:** Average time from order placement to air cargo delivery; percentage of zero-delay deliveries.
  4. **Catalog Health:** Ratio of active in-stock products vs out-of-stock items; stock turnover velocity.
* **Monthly Business Overview Table:**
  Aggregated month-by-month historical table:
  - Month (e.g. `September 2026`)
  - Total Inquiries
  - Orders Confirmed
  - Total Merchandise Value (₹)
  - Architectural Projects Commissioned
  - Top Performing Specimen Category (e.g. `Designer Clownfish`)
  - Primary Acquisition Channel (`Direct WhatsApp`, `Marketplace Checkout`, `World Builder Blueprint`)

---

## 4. RESPONSIVE ARCHITECTURE: DESKTOP VS MOBILE

### 4.1 Desktop Console Experience (1280px+)
* **Layout Structure:**
  - Fixed 260px left navigation sidebar with collapsible grouping.
  - Sticky top action bar with global search (`Ctrl + K`), database health indicator, and user session badge.
  - Main workspace: High-density multi-column data tables with horizontal scroll containers when viewing wide financial columns.
  - Split-screen detail drawers sliding in from the right (600px width), allowing the user to inspect lead details or edit products without losing their place in the table.
* **Keyboard Hotkeys:**
  - `Ctrl + K`: Universal search (search by order ID, customer phone, product name, or case study).
  - `Esc`: Close any open drawer, modal, or toast.
  - `Ctrl + S`: Quick-save active form or product edit.

### 4.2 Mobile Field Console Experience (320px–430px)
* **Mobile Reality:** Founder Suraj Shasmal frequently inspects client sites, airport cargo bays, and marine holding facilities using a phone. The mobile admin must be fully functional.
* **Mobile-First Adjustments:**
  - **Zero Horizontal Table Overflow:** Wide desktop tables automatically transform into stacked, touch-friendly operational cards.
  - **Bottom Navigation Bar:** 4 core mobile tabs pinned to the thumb zone:
    `[ 📊 Overview ]` `[ 📦 Orders ]` `[ 💬 Leads ]` `[ 🐠 Catalog ]`
  - **Quick Thumb Actions:** Every order card features a prominent direct green *"WhatsApp Customer"* button and a *"Update Step"* selector designed for one-handed operation.
  - **Full-Screen Slide-Overs:** Drawers expand to full screen with sticky bottom action bars (`Save`, `Cancel`, `Approve`).

---

## 5. RECOVERY, DRAFT PERSISTENCE & CONCURRENT EDITING UX

* **Session Expiration Graceful Handling:**
  If the 8-hour session cookie expires while an aquarist is typing a long case study narrative:
  1. The Control OS caches the form state in encrypted session storage.
  2. A calm, non-blocking modal appears: *"Session expired for security. Please re-enter your passcode to resume."*
  3. Upon entering the passcode, the API returns a fresh signed session cookie and immediately submits the pending draft without data loss.
* **Optimistic Concurrency Guards:**
  Every record update includes a timestamp check. If another administrator updated the same product or order in the background, a warning appears: *"This record was modified by another session a moment ago. Review differences before overwriting."*

---

*Certified as Authoritative UX & Information Architecture Specification for Phase 3 by CTO Execution Agent.*
