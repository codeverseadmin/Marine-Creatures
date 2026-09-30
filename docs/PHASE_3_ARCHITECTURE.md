# MARINE CREATURES — CONTROL OS TECHNICAL ARCHITECTURE

**Project:** Marine Creatures  
**Document Code:** `MC-P3-ARCH-2026-V1`  
**Authority:** CTO / Lead System Architect — CODEVERSE Technologies  
**Phase:** Phase 3 — Operations, Administration & Business Intelligence  
**Status:** SPECIFICATION ONLY (CTO AUTHORIZED)  
**Date:** September 2026  

---

## 1. EXECUTIVE OVERVIEW & ARCHITECTURAL MANDATE

### 1.1 Purpose
Marine Creatures Phase 2 established a world-class, luxury public digital experience spanning an interactive e-commerce catalog, architectural inquiry funnels, a 7-stage Parametric World Builder, and educational species dossiers.

The mandate of Phase 3 is **NOT** to redesign the public website or build unnecessary consumer features. The objective of Phase 3 is to transform the existing single-view administrative prototype into a mission-critical, high-performance operational command center:

> **MARINE CREATURES CONTROL OS**

The Control OS is the centralized business operating system empowering the founder, head aquarists, and operations team to govern catalog inventory, biological curation, nationwide live-cargo dispatches, bespoke architectural projects, dynamic portfolio storytelling, lead conversion pipelines, and monthly business health analytics.

### 1.2 Non-Negotiable Operational Boundaries
In strict compliance with CTO directives:
* **Specification First:** This document provides the complete technical and architectural blueprint. Zero production code, models, or endpoints may be modified during this specification phase.
* **Preserve Phase 2:** The public storefront, World Builder, cart, WhatsApp ordering pipeline, design token architecture, and existing database collections remain 100% untouched.
* **No Unnecessary Technologies:** No external payment gateways, multi-currency engines, cargo APIs, loyalty systems, subscriptions, WebGL 3D runtimes, or synthetic AI chat agents.
* **Evidence-Based Security:** Client-side route blocking or hidden UI controls are strictly prohibited as security mechanisms. All privileged mutations must be authenticated and authorized server-side.

---

## 2. DESIGN PHILOSOPHY & OPERATIONAL AESTHETIC

| Dimension | Public Luxury Experience (Phase 2) | Control OS Command Center (Phase 3) |
| :--- | :--- | :--- |
| **Aesthetic Goal** | Cinematic, immersive, editorial, oceanic luxury | Precise, calm, dense, operational, analytical, fast |
| **Background Surfaces** | Deep abyssal gradients with ambient cyan glow | Solid matte obsidian (`#02070c`), charcoal cards (`#07131d`) |
| **Typography** | Cormorant Garamond italic display + Inter body | Inter / SF Pro clean sans + JetBrains Mono for data & codes |
| **Motion & Animation** | GSAP timelines, Lenis smooth scrolling, caustics | Instantaneous transitions, micro-state indicators, zero latency |
| **Data Density** | Generous whitespace, high-impact imagery | Dense data tables, split-pane drawers, structured key-value grids |
| **Ornamentation** | Particles, glassmorphism, decorative blur | Clean 1px borders (`rgba(255,255,255,0.08)`), functional color tokens |

### Brand Language in the Control OS
The Control OS maintains brand identity through disciplined restraint rather than theatrical effects:
* **Primary Matte Obsidian:** `#02070c` (Base workspace canvas)
* **Surface Neutral Elevated:** `#07131d` (Cards, sidebars, toolbars)
* **Surface Active Hover:** `#0b1a26` (Selected rows, active pills)
* **Accent Cyan (Brand):** `#00B8D9` / `#22D3EE` (Primary CTAs, active status, system state)
* **Functional Emerald:** `#10B981` (Completed orders, in-stock inventory, approved records)
* **Functional Amber:** `#F59E0B` (Low stock, quarantine stage, pending reviews)
* **Functional Rose:** `#EF4444` (Out of stock, cancelled orders, security alerts)
* **Monospace Metadata:** JetBrains Mono for SKUs, order IDs, AWB tracking codes, timestamps, and rupee amounts.

---

## 3. CORE ARCHITECTURAL FOUNDATIONS

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MARINE CREATURES CONTROL OS                         │
│                    Next.js 16 (Turbopack)                              │
├────────────────────────────────────────────────────────────────────────┤
│  ADMIN ROUTE TREE: /admin/*                                            │
│  ├── /admin (Overview KPI & Priority Action Center)                   │
│  ├── /admin/catalog (Products, Dossiers, Materials, Inventory)        │
│  ├── /admin/worlds (Dynamic Case Studies & Portfolio CMS)             │
│  ├── /admin/operations (Live Orders, Air Cargo, Renovations)          │
│  ├── /admin/crm (Enquiries, Leads, Consultations, Directory)          │
│  ├── /admin/content (Banners, FAQs, Dynamic Page Content)             │
│  ├── /admin/media (Centralized Binary & Cloud CDN Asset Library)      │
│  ├── /admin/analytics (Monthly Business Intelligence & Funnels)       │
│  └── /admin/system (Atlas Health, Snapshots, Audit Log, Settings)     │
├────────────────────────────────────────────────────────────────────────┤
│  SERVER-SIDE AUTHENTICATION & SECURITY GUARD                           │
│  ├── Signed httpOnly Cookie: mc_admin_session (HMAC-SHA256, 8h TTL)   │
│  ├── Timing-Safe Equal Verification (crypto.timingSafeEqual)          │
│  ├── Brute-Force Rate Limiter & Delay Engine (>=500ms)                │
│  └── Server-to-Server Programmatic Token Validator                    │
├────────────────────────────────────────────────────────────────────────┤
│  API ACCESS LAYER (app/api/admin/*)                                   │
│  ├── Zod/Native Schema Payload Validation                             │
│  ├── Structured JSON Errors ({ success: false, error: string })       │
│  └── Idempotent Mutation Handlers with Optimistic Concurrency Checks  │
├────────────────────────────────────────────────────────────────────────┤
│  DATA PERSISTENCE & STORAGE LAYER (MongoDB Atlas Cluster0)            │
│  ├── Existing Models: Product, Order, Inquiry, Banner, Media, Setting │
│  ├── Phase 3 Extensions: CaseStudy, ClientProject, LeadActivity       │
│  └── Storage: High-Speed Document Indexing + Binary Media Store       │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Runtime & Framework Standards
* **Framework:** Next.js 16.3.1 using React 19.2.8 with Server Components where beneficial and client-side interactive controllers for rich data tables.
* **Compilation:** Turbopack for sub-second development updates and rapid production compilation.
* **Styling:** Vanilla CSS design tokens with Tailwind CSS 4 utility classes for dense layout grids.
* **State Management:** URL-driven state for filters, search queries, pagination, and active tabs (`useSearchParams`, `useRouter`) ensuring direct shareability and browser back-button reliability.

### 3.2 Authentication & Session Architecture
The Control OS strictly enforces the verified Phase 2 security architecture:
1. **Primary Session Mechanism:** Authentication uses an `httpOnly`, `secure`, `sameSite: 'strict'` cookie named `mc_admin_session`.
2. **Cryptographic Token Format:** `<base64url(payload)>.<hex_signature>`
   - `payload`: `mc_admin_${timestamp}_${nonce}`
   - `signature`: HMAC-SHA256(`payload`, `SESSION_SECRET`)
3. **Validation Algorithm:**
   - Verify token format and length.
   - Recompute expected HMAC-SHA256 signature using server-only `SESSION_SECRET`.
   - Validate signatures using `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
   - Enforce maximum session age: reject any token where `Date.now() - timestamp > 8 hours` (`28,800,000 ms`).
4. **Credential Isolation:**
   - `ADMIN_PASSCODE` and `SESSION_SECRET` remain strictly server-side.
   - Never expose passcodes or secrets in `NEXT_PUBLIC_*` environment variables, client bundles, `localStorage`, `sessionStorage`, or public JSON responses.
5. **Session Destruction:** `POST /api/admin/logout` issues an immediate cookie invalidation response (`Set-Cookie: mc_admin_session=; Max-Age=0; Path=/`).

---

## 4. SUBSYSTEM ARCHITECTURAL BLUEPRINTS

### 4.1 Overview & Action Center Engine
* **Purpose:** Provides the business owner with an immediate answer to: *"What requires my attention right now, and how is the business performing this month?"*
* **Core Components:**
  1. **Business Vital Signs Grid:** Total active inquiries, unapproved orders, in-quarantine live specimens, estimated monthly pipeline value, inventory stock alerts.
  2. **Priority Action Center ("Needs Attention"):** A queue of actionable events linked directly to resolution drawers:
     - Orders awaiting approval / invoice assignment
     - Dispatches awaiting air cargo AWB tracking numbers
     - Inquiries received in the last 24h with zero follow-up recorded
     - Live coral or marine specimens with stock count <= 1
     - System snapshot or backup overdue (> 7 days)
  3. **Live Pipeline Funnel:** Inquiries $\rightarrow$ Qualified Leads $\rightarrow$ Consultations $\rightarrow$ Active Projects / Orders.

### 4.2 Catalog & Marine Species Dossier Engine
* **Purpose:** Complete lifecycle management for live specimens, dry goods, and architectural materials.
* **Architectural Separation:**
  - **Commercial Product Record (`Product`):** Governs e-commerce price, stock count, SKU, HSN tax code, shipping guarantees, and cart availability.
  - **Educational / Biological Dossier (`MarineSpecies`):** Governs biological taxonomy, wild origin, natural biome, reef compatibility, minimum aquarium volume, dietary regimen, water chemistry tolerances, and cohabitation rules.
* **Inventory State Machine:**
  - `IN_STOCK`: Available for marketplace checkout.
  - `LOW_STOCK`: Automatic badge trigger (count <= 2) and restocking alert.
  - `OUT_OF_STOCK`: Disables checkout; enables *"Request Curation"* lead capture.
  - `QUARANTINE_HOLD`: Specimen on-site undergoing prophylactic conditioning; hidden from immediate dispatch.
  - `ARCHIVED`: Historical record preserved for past order references; excluded from public catalog.

### 4.3 Worlds & Dynamic Case Study CMS
* **Purpose:** Solves the primary Phase 3 content requirement: allowing the founder to publish and curate luxury portfolio installations without code deployments.
* **Publishing Lifecycle Machine:**
  ```text
  [ DRAFT ] ───────────► [ IN REVIEW ] ───────────► [ APPROVED ]
     ▲                         │                          │
     │                         ▼                          ▼
  Re-edit                 Rejection                 [ PUBLISHED ]
     │                                                    │
     └────────────────── [ ARCHIVED ] ◄───────────────────┘
  ```
  - **DRAFT:** Private to Control OS; excluded from sitemap and public routes.
  - **IN REVIEW:** Editorial validation pass; requires confirmation of client privacy permissions and photography rights.
  - **APPROVED:** Ready for public launch; scheduled publishing date support.
  - **PUBLISHED:** Active in public `/our-worlds` gallery and dynamic `/our-worlds/[slug]` routes. Automatically included in `sitemap.xml`.
  - **ARCHIVED:** Soft-deleted from public view; returns 301 redirect to `/our-worlds` or renders historical badge if explicitly permitted.
* **Architectural Storytelling Schema (8-Part Progression):**
  Matches the approved Phase 2 editorial layout:
  1. *Project Identity:* Client alias (e.g., Alipore Penthouse), location, space typology, commissioning year.
  2. *Spatial Context:* Room dimensions, architectural integration (inset, monolith, room divider).
  3. *Design Intent:* Conceptual objective, light penetration, acoustic isolation.
  4. *Material Specifications:* Viewing panel type (OptiWhite glass vs cast acrylic), thickness, millwork cladding.
  5. *Life Support System:* Closed-loop filtration, pump decibel rating, automation controllers.
  6. *Marine World:* Biome classification, livestock roster, coral colonies.
  7. *Handover Result:* Matched tripod before/after transformation, client operational satisfaction.
  8. *Client Context:* Private residence vs corporate headquarters; privacy scrubbing verification.

### 4.4 Operational Project vs Public Case Study Relationship
* **Architectural Rule:** An active client project and a public case study **MUST NOT** share the same database entity.
* **Rationale:**
  - An active project contains sensitive internal data: real client identity, private phone/email, full physical address, contractor access codes, raw margins, bill of materials, and technician notes.
  - A case study is an editorial marketing piece requiring anonymized client references (e.g. "Alipore Industrialist Penthouse"), vetted photography, and approved copy.
* **Architecture:**
  - `ClientProject`: Internal operational entity under `/admin/operations/projects`.
  - `CaseStudy`: Public editorial entity under `/admin/worlds/case-studies`.
  - Linkage: `CaseStudy.projectId` optionally references `ClientProject.id`. When generating a case study from an active project, the Control OS triggers a sanitization wizard that strips all private client PII before creating the draft case study.

### 4.5 CRM & Lead Conversion Engine
* **Purpose:** Converts website inquiries and World Builder blueprint submissions into high-value design commissions.
* **Lead Lifecycle:**
  ```text
  NEW ──► CONTACTED ──► QUALIFIED ──► CONSULTATION ──► PROPOSAL ──► WON / LOST
  ```
* **Identity & De-Duplication Strategy:**
  - Customers are keyed primary by normalized 10-digit phone number (`phone.replace(/\D/g, '')`).
  - When an inquiry is submitted with an existing phone number, the inquiry is automatically appended to the client's unified relationship timeline rather than creating a disconnected duplicate record.
  - Quick action links generate pre-filled WhatsApp concierge conversations using Founder Suraj Shasmal's business WhatsApp protocol.

### 4.6 Operations & Order Lifecycle
* **Preserved Order Progression:**
  ```text
  [ PLACED ] ──► [ QUARANTINE ] ──► [ PACKED ] ──► [ DISPATCHED ] ──► [ DELIVERED ]
  ```
* **Control OS Operational Actions:**
  1. **Order Approval:** Only authenticated admins can approve public orders (`isApproved: true`, `invoiceNumber: "INV-MC-XXXX"`).
  2. **Biological Quarantine Logging:** Records salinity, temperature, and prophylactic dip completion before packing.
  3. **Oxygenated Packing Verification:** Medical-grade oxygen sealing in thermal containers.
  4. **Air Cargo Dispatch:** Assignment of IndiGo CarGo / Air India flight number, AWB tracking code, and estimated airport pickup window.
  5. **Automated WhatsApp Notification:** Triggers pre-formatted dispatch message to customer with tracking link.

### 4.7 Centralized Media Library
* **Storage Architecture:**
  - **Primary CDN:** Cloudinary (if environment variables `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET` are configured).
  - **High-Performance Fallback:** MongoDB Atlas Binary Media Store (`MediaModel`). Binary stream served via `/api/media/[id]` with `Cache-Control: public, max-age=31536000, immutable`.
* **Asset Categorization:**
  - Entity Association: Tags assets by usage (`product`, `dossier`, `case-study`, `banner`, `logo`, `signature`).
  - Metadata: Stores width, height, aspect ratio, MIME type, file size, and mandatory accessibility `altText`.
  - Reusability: The CMS file picker allows selecting existing uploaded media, eliminating duplicate uploads.

---

## 5. TECHNICAL HEALTH, AUDIT TRAILS & SECURITY

### 5.1 Immutable Administrative Audit Log
To maintain strict accountability, every privileged administrative mutation records an immutable entry:
* **Log Schema:**
  - `actor`: Passcode-authenticated session identifier or future admin username.
  - `action`: `CREATE` | `UPDATE` | `DELETE` | `PUBLISH` | `DISPATCH` | `BACKUP` | `RESTORE`.
  - `entity`: `product` | `order` | `inquiry` | `case_study` | `banner` | `setting`.
  - `entityId`: Unique identifier of the target record.
  - `diff`: Sanitized summary of changed fields (sensitive credentials excluded).
  - `ip`: Client IP address.
  - `timestamp`: UTC ISO-8601 timestamp.
* **Security Rule:** Audit logs **NEVER** capture passwords, session secret hashes, or raw banking/identity data.

### 5.2 System Health Telemetry
The Control OS monitors real system indicators via `/api/health`:
* **MongoDB Atlas Status:** Latency in milliseconds, active connection count, connection pool saturation.
* **Collection Counts:** Live document counts for all primary collections.
* **Storage Utilization:** Binary media collection size vs database quota.
* **Backup Integrity:** Date of latest serialized snapshot, checksum validation status.
* **Zero Credential Exposure:** Environment connection strings, passwords, and cluster private keys are strictly stripped from all health responses.

---

## 6. PERFORMANCE & SCALABILITY BLUEPRINT

1. **Server-Side Pagination:** All Control OS data tables enforce mandatory limit/skip pagination (default `25` records, max `100`). Full collection dumps (`Model.find({})`) are strictly prohibited in admin table views.
2. **Lean Projection Queries:** Queries exclude heavy data payloads when rendering lists (e.g. `MediaModel.find({}, { data: 0 })`, `SnapshotModel.find({}, { data: 0 })`).
3. **Compound Database Indexes:**
   - Orders: `{ currentStep: 1, createdAt: -1 }`, `{ phone: 1 }`
   - Inquiries: `{ status: 1, createdAt: -1 }`, `{ phone: 1 }`
   - Products: `{ category: 1, inStock: 1 }`, `{ id: 1 }`
   - Case Studies: `{ status: 1, slug: 1 }`, `{ featured: 1, order: 1 }`
4. **Draft Cache Invalidation:** When content is published or updated in the Control OS, Next.js revalidation tags (`revalidatePath('/marketplace')`, `revalidatePath('/our-worlds')`) ensure public static caches update immediately without requiring manual server restarts.

---

*Certified as Authoritative Technical Architecture for Phase 3 by CTO Execution Agent.*
