# MARINE CREATURES — CONTROL OS IMPLEMENTATION ROADMAP

**Project:** Marine Creatures  
**Document Code:** `MC-P3-ROADMAP-2026-V1`  
**Authority:** CTO / Lead System Architect — CODEVERSE Technologies  
**Phase:** Phase 3 — Operations, Administration & Business Intelligence  
**Status:** SPECIFICATION ONLY (CTO AUTHORIZED)  
**Date:** September 2026  

---

## 1. STRATEGIC EXECUTION PRINCIPLES

1. **Zero Downtime & Zero Regression:** The public storefront, checkout, WhatsApp order generation, World Builder, and MongoDB production collections must continue running with zero downtime during Phase 3 deployment.
2. **Schema Non-Destructiveness:** Existing models (`Product`, `Order`, `Inquiry`, `Banner`, `Media`, `Setting`, `Snapshot`) are extended only with backwards-compatible optional fields. No existing keys are renamed or deleted.
3. **Sequential Sub-Phases:** Each sub-phase must pass an explicit verification gate before subsequent modules are initiated.

---

## 2. SUB-PHASE IMPLEMENTATION SEQUENCE

```text
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3A: CONTROL OS FOUNDATION & NAVIGATION SHELL                    │
│ ├── Persistent Dark Shell (#02070c canvas, Inter typography)          │
│ ├── Desktop 260px Collapsible Sidebar + Mobile Bottom App Bar         │
│ ├── Global Search & Command Bar (Ctrl + K)                            │
│ └── Server-Side Route Guard Middleware (/admin/*)                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3B: DYNAMIC CASE STUDY CMS & WORLDS PUBLISHING                   │
│ ├── CaseStudy Mongoose Model & /api/admin/case-studies API Routes     │
│ ├── 8-Stage Storytelling Editor with Tripod Before/After Uploader     │
│ ├── Publishing Lifecycle Machine (Draft → Review → Published)         │
│ └── Dynamic Public Route: /our-worlds/[slug] with Static ISR Caching  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3C: CRM, OPERATIONS & DISPATCH LIFECYCLE                         │
│ ├── Unified Customer Relationship Drawer (by Phone Number)            │
│ ├── Live Order 5-Stage Queue (Quarantine → Packing → Air Cargo AWB)   │
│ ├── Print-Ready GST Invoice Generation with Digital Signature         │
│ └── Internal ClientProject Tracking Schema for Architectural Works    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3D: BUSINESS INTELLIGENCE & ANALYTICS ENGINE                     │
│ ├── First-Party Telemetry Ingestion (/api/analytics/event)            │
│ ├── Overview Dashboard Vital Signs & Priority Action Center           │
│ ├── Explainable Multidimensional Health Assessment (Demand/Conversion)│
│ └── Month-by-Month Performance Overview Table                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PHASE 3E: SYSTEM HARDENING, AUDIT TRAILS & RECOVERY                    │
│ ├── Immutable Administrative Action Logging (AuditLog Model)          │
│ ├── Automated Serialized Snapshots (Cron / Manual Trigger)            │
│ ├── Media Library Centralized Asset Picker                            │
│ └── Credential Hygiene & Database Security Validation                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SUB-PHASE DETAILS & DELIVERABLES

### Phase 3A: Control OS Foundation & Shell
* **Scope:** Replace the temporary single-view tab switcher in `app/admin/page.tsx` with a multi-route Next.js App Router layout (`app/admin/layout.tsx`).
* **Deliverables:**
  - `components/admin/layout/AdminSidebar.tsx`: Fixed 260px collapsible sidebar with grouped navigation items.
  - `components/admin/layout/AdminMobileNav.tsx`: Bottom sticky app bar for mobile field operations.
  - `components/admin/ui/CommandPalette.tsx`: Global search modal (`Ctrl + K`).
  - Route Layout Security: Centralized `AdminAuthGuard` verifying `mc_admin_session` cookie before page rendering.
* **Verification Gate 3A:** Authenticated administrator can navigate between `/admin`, `/admin/catalog`, `/admin/worlds`, `/admin/operations`, `/admin/crm`, and `/admin/system` with sub-100ms transitions on desktop and mobile.

### Phase 3B: Dynamic Case Study CMS & Worlds Publishing
* **Scope:** Provide full editorial capability for luxury aquarium portfolio installations.
* **Deliverables:**
  - `models/CaseStudy.ts`: Mongoose schema supporting the 8-part storytelling progression.
  - `app/api/admin/case-studies/route.ts`: CRUD endpoints with publishing lifecycle guards.
  - `components/admin/case-studies/CaseStudyEditor.tsx`: Split-screen editor with before/after photo drop-zones and live public preview toggle.
  - `app/our-worlds/[slug]/page.tsx`: Dynamic public presentation page featuring ISR caching and SEO meta tags.
* **Verification Gate 3B:** Administrator can create a draft, upload before/after photos, preview it privately, and publish it. The new project renders immediately on `/our-worlds` without requiring developer deployment or git commits. Unpublished drafts strictly return 404 on public routes.

### Phase 3C: CRM, Operations & Dispatch Lifecycle
* **Scope:** Centralize inquiry handling, lead conversions, order fulfillment, and air cargo tracking.
* **Deliverables:**
  - `components/admin/crm/ClientRelationshipDrawer.tsx`: Aggregates all orders and inquiries sharing the same phone number into a single interaction timeline.
  - `components/admin/operations/OrderDispatchModal.tsx`: Captures quarantine checks, packing box serials, IndiGo/Air India AWB codes, and dispatches automated WhatsApp customer alerts.
  - `models/ClientProject.ts`: Operational tracking schema separating private customer address and contract value from public editorial case studies.
* **Verification Gate 3C:** Admin approves incoming public orders, updates dispatch steps through to completion, assigns AWB tracking numbers, and views customer lifetime interaction history.

### Phase 3D: Business Intelligence & Analytics Engine
* **Scope:** Real-time business vitals, funnel drop-off analytics, and historical monthly summaries without fabricating static metrics.
* **Deliverables:**
  - `models/AnalyticsEvent.ts`: Privacy-conscious first-party event capture.
  - `app/api/analytics/event/route.ts`: Non-blocking telemetry ingestion with IP anonymization.
  - `components/admin/overview/ActionCenter.tsx`: Dynamic "Needs Attention" queue prioritizing pending orders, unanswered inquiries, and depleted stock.
  - `components/admin/analytics/MonthlyReportTable.tsx`: Historical month-by-month financial and inquiry aggregates.
* **Verification Gate 3D:** Dashboard displays real calculated numbers derived directly from MongoDB Atlas collections (`orders`, `inquiries`, `products`). Zero hardcoded mock numbers.

### Phase 3E: System Hardening, Audit Trails & Recovery
* **Scope:** Enterprise-grade operational auditability and disaster recovery.
* **Deliverables:**
  - `models/AuditLog.ts`: Immutable record capturing actor, action, entity, diff, and timestamp.
  - `app/api/admin/audit/route.ts`: Read-only audit trail viewer.
  - Snapshot Restore Guard: Multi-step modal requiring explicit confirmation string typing before database restore execution.
  - Deprecate client-side passcode transmission in modals (`ProductFormModal.tsx`, `BannersTab.tsx`) in favor of exclusive cookie authentication.
* **Verification Gate 3E:** Every administrative edit generates an audit log entry containing zero credential leaks. Database backup and restore verified in staging.

---

## 4. RISK ASSESSMENT & MITIGATION MATRIX

| Risk Factor | Severity | Mitigation Strategy |
| :--- | :---: | :--- |
| **Accidental Public Exposure of Drafts** | **HIGH** | Mongoose query filters on public routes strictly enforce `{ status: 'published' }`. Dynamic `[slug]` pages reject non-published records with `notFound()`. |
| **Client PII Leakage from Projects** | **CRITICAL** | `ClientProject` (private operations) and `CaseStudy` (public editorial) remain separate database collections. Case study creation wizard strips addresses, phone numbers, and contractor notes. |
| **MongoDB Atlas Schema Incompatibility** | **HIGH** | All new models use independent collections. Existing models are extended strictly with optional fields (`field?: string`). Zero existing collection names or fields are altered. |
| **Credential Exposure in Admin Scripts** | **CRITICAL** | Rotate MongoDB Atlas `mc_admin` password prior to deployment. Prohibit embedding connection strings in transient scratch scripts. |
| **Unapproved Commercial Claims in UI** | **MEDIUM** | CMS UI enforces explicit disclaimer footnotes (*"Indicative Investment Guide — Subject to site survey"*) and displays client approval status badges based on `CLIENT_CONTENT_APPROVAL_MATRIX.md`. |

---

## 5. MEASURABLE PHASE 3 ACCEPTANCE CRITERIA

1. **Case Study Publishing:** Administrator can create, edit, save drafts, and publish case studies. Unpublished case studies never appear in `/our-worlds` or `sitemap.xml`.
2. **Product Catalog Governance:** Administrator can adjust prices, stock counts, and biological dossier parameters with instant public reflection and zero database downtime.
3. **Traceable CRM Pipeline:** Every inbound lead and World Builder blueprint is linked to a customer timeline keyed by normalized phone number.
4. **Preserved Order Lifecycle:** Orders advance through `placed` $\rightarrow$ `quarantine` $\rightarrow$ `packed` $\rightarrow$ `dispatched` $\rightarrow$ `delivered` with AWB tracking integration.
5. **Authentic Business Intelligence:** Monthly analysis, pipeline value, and conversion funnels calculate 100% from stored database records. Zero fabricated statistics.
6. **Server-Authorized Mutations:** Every mutation route under `/api/admin/*` enforces valid HMAC-SHA256 session tokens; invalid requests return `401 Unauthorized`.
7. **Zero Secret Logging:** Audit logs capture entity changes but strictly scrub passwords, passcodes, session tokens, and customer payment details.
8. **Responsive Ergonomics:** Control OS performs fluidly on desktop (1280px+) with dense tables and on mobile (390px) with touch-first action cards.
9. **Zero Scope Regression:** Phase 2 public storefront, World Builder, and shopping cart remain fully operational without functional regressions.

---

*Certified as Authoritative Implementation Roadmap for Phase 3 by CTO Execution Agent.*
