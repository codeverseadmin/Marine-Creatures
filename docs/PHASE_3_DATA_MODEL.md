# MARINE CREATURES — CONTROL OS DATA MODEL SPECIFICATION

**Project:** Marine Creatures  
**Document Code:** `MC-P3-DATA-2026-V1`  
**Authority:** CTO / Lead System Architect — CODEVERSE Technologies  
**Phase:** Phase 3 — Operations, Administration & Business Intelligence  
**Status:** SPECIFICATION ONLY (CTO AUTHORIZED)  
**Date:** September 2026  

---

## 1. ENTITY CLASSIFICATION & STRATEGY MATRIX

To prevent unnecessary schema bloat and preserve existing working collections, every proposed business entity is categorized into one of four architectural states:
* **`EXISTS`**: Active Mongoose model in production; no structural schema changes required.
* **`EXTEND`**: Existing production model; backwards-compatible optional fields added in Phase 3.
* **`NEW`**: Brand new Mongoose model required to support dedicated Phase 3 operational subsystems.
* **`NOT REQUIRED`**: Concept embedded within an existing entity or handled via key-value settings; separate collection omitted to avoid over-engineering.

| Entity | Classification | Storage Location | Key Purpose |
| :--- | :---: | :--- | :--- |
| **1. Admin** | `NOT REQUIRED` | Server-Side Env / Cookie | Authenticated via server-only `ADMIN_PASSCODE` / `SESSION_SECRET` and HMAC-SHA256 session tokens. Multi-user RBAC table not required in Phase 3. |
| **2. Product** | `EXTEND` | Collection: `products` | Core catalog items (fish, coral, lighting, tanks). Extend with publishing flags and dossier link. |
| **3. MarineSpecies** | `NEW` | Collection: `marine_species` | Dedicated biological dossier taxonomy (water chemistry, temperament, reef safety, diet). |
| **4. Material** | `NOT REQUIRED` | Embedded / Settings | Material options (OptiWhite glass, cast acrylic) stored as structured catalog items or estimator config. |
| **5. Category** | `NOT REQUIRED` | Embedded in Products | Product categories (`marine-life`, `tanks`, `lighting`, `filtration`, `maintenance`) indexed on `products`. |
| **6. Order** | `EXTEND` | Collection: `orders` | Core commerce order with customer address, pricing, and 5-stage dispatch progression. Extend with email and tracking link. |
| **7. OrderItem** | `EXISTS` | Sub-document in `orders` | Array of ordered items (`id`, `name`, `price`, `quantity`, `image`, `category`). |
| **8. Inquiry** | `EXTEND` | Collection: `inquiries` | Leads captured from contact forms and World Builder blueprints. Extend with CRM qualification fields. |
| **9. Lead** | `NOT REQUIRED` | Unified inside `inquiries` | Inquiries and leads represent the same commercial relationship lifecycle. Separate lead collection would cause duplication. |
| **10. Client** | `NOT REQUIRED` | Aggregated by `phone` | Customer profile synthesized on demand by aggregating `orders` and `inquiries` sharing the same normalized phone number. |
| **11. Project** | `NEW` | Collection: `client_projects` | Internal operational tracking for active architectural installations (site surveys, drawings, fabrication, contractor notes). |
| **12. CaseStudy** | `NEW` | Collection: `case_studies` | Editorial public portfolio projects published on `/our-worlds` (anonymized alias, 8-part narrative, before/after photography). |
| **13. Renovation** | `NOT REQUIRED` | Sub-type of `client_projects` | Renovation jobs are operational client projects with category `renovation`. |
| **14. MaintenanceRecord**| `NEW` | Collection: `maintenance_logs` | On-site recurring service visits (water test readings, salt replenish, filter change, next service date). |
| **15. Media** | `EXTEND` | Collection: `media` | Binary media chunks and CDN asset records. Extend with metadata tags and entity association. |
| **16. Banner** | `EXISTS` | Collection: `banners` | Promotional homepage hero carousel banners (`id`, `title`, `badge`, `ctaLink`, `active`, `order`). |
| **17. Testimonial** | `NOT REQUIRED` | Embedded / Settings | Client testimonials managed via `settings` or embedded in Case Studies to avoid schema bloat. |
| **18. FAQ** | `NOT REQUIRED` | Settings / Static Content | FAQ content managed via key-value `SettingModel` under key `faq_content`. |
| **19. AnalyticsEvent** | `NEW` | Collection: `analytics_events` | First-party privacy-safe event stream for funnel drop-off and conversion tracking. |
| **20. MonthlySnapshot** | `NEW` | Collection: `monthly_reports` | Pre-computed monthly business performance summaries for instant historical reporting. |
| **21. Notification** | `NOT REQUIRED` | Calculated at Runtime | Action items ("Needs Attention") are generated dynamically via database queries rather than stale database notification rows. |
| **22. AuditLog** | `NEW` | Collection: `audit_logs` | Immutable audit trail capturing every privileged administrative action. |
| **23. Backup** | `EXISTS` | Collection: `snapshots` | Complete JSON database snapshots with SHA-256 integrity checksums (`SnapshotModel`). |

---

## 2. DETAILED SCHEMA DEFINITIONS

### 2.1 Extended Production Models

#### `Product` (Extension to `models/Product.ts`)
```typescript
// Existing fields preserved: id, name, scientificName, brand, itemType, category, categoryLabel,
// price, originalPrice, rating, reviewsCount, badge, inStock, stockCount, images, videos, media,
// shortDesc, description, deliveryInfo, careGuide, hsnCode, createdAt, updatedAt.

// PHASE 3 OPTIONAL EXTENSIONS:
export interface IProductDocumentPhase3 extends IProductDocument {
  dossierId?: string;               // Optional link to full MarineSpecies biological record
  inventoryStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'quarantine_hold' | 'discontinued';
  featuredOrder?: number;           // Explicit homepage / marketplace sorting priority
  published?: boolean;              // Controls public visibility (default: true)
  marginPercent?: number;           // Internal commercial cost margin (admin only)
  supplierCode?: string;            // Internal quarantine quarantine batch / import source code
}
```

#### `Order` (Extension to `models/Order.ts`)
```typescript
// Existing fields preserved: id, customerName, phone, address, city, pincode, orderNotes,
// items, subtotal, totalAmount, currentStep, awbNumber, courierName, estimatedDelivery,
// history, isApproved, approvedAt, invoiceNumber, createdAt.

// PHASE 3 OPTIONAL EXTENSIONS:
export interface IOrderDocumentPhase3 extends IOrderDocument {
  customerEmail?: string;           // Optional email for invoice dispatch
  cargoTrackingUrl?: string;        // IndiGo / Air India Cargo direct tracking URL
  quarantineNotes?: string;         // Salinity, temperature, and feeding health verification
  paymentStatus?: 'pending_cash_on_delivery' | 'bank_transfer_verified' | 'advance_received';
  internalNotes?: string;           // Operations staff communication log
}
```

#### `Inquiry` (Extension to `models/Inquiry.ts`)
```typescript
// Existing fields preserved: id, type, name, phone, email, serviceType, spaceType, tankSize,
// location, notes, preferredDate, items, status, createdAt.

// PHASE 3 OPTIONAL EXTENSIONS:
export interface IInquiryDocumentPhase3 extends IInquiryDocument {
  crmStage?: 'new' | 'contacted' | 'site_visit_scheduled' | 'quotation_sent' | 'won' | 'lost';
  assignedTo?: string;              // Senior Aquarist name (e.g., "Suraj Shasmal")
  estimatedBudget?: number;         // Estimated client budget in INR (from World Builder or discussion)
  followUpDate?: string;            // Next scheduled customer contact date
  leadNotes?: Array<{
    author: string;
    note: string;
    timestamp: string;
  }>;
}
```

---

### 2.2 New Subsystem Schemas

#### 1. `CaseStudy` (`models/CaseStudy.ts`)
Manages editorial public projects displayed on `/our-worlds` and `/our-worlds/[slug]`:
```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICaseStudyDocument extends Document {
  id: string;                       // e.g. "CS-ALIPORE-2025"
  slug: string;                     // e.g. "alipore-penthouse" (unique, URL safe)
  title: string;                    // e.g. "Penthouse Marine Sanctuary"
  clientAlias: string;              // e.g. "Alipore Industrialist Family" (Anonymized)
  category: 'residential' | 'commercial' | 'hospitality' | 'institutional';
  locationCity: string;             // e.g. "Kolkata, West Bengal"
  completionYear: number;           // e.g. 2025
  aquariumVolumeLiters: number;     // e.g. 7800
  aquariumDimensions: string;       // e.g. "450cm × 120cm × 150cm"
  viewingMaterial: string;          // e.g. "100mm Seamless Cast Acrylic Monolith"
  biome: string;                    // e.g. "Indo-Pacific Living Barrier Reef"
  
  // Visual Storytelling Assets
  heroImage: string;                // Master landscape photograph URL
  beforeImage?: string;             // Tripod-matched declining tank image URL
  afterImage?: string;              // Tripod-matched transformed tank image URL
  galleryImages: string[];          // Architectural detail photographs
  
  // 6-Part Narrative Storytelling
  challenge: string;                // Structural, spatial, or biological hurdle
  concept: string;                  // Architectural vision and light strategy
  engineering: string;              // Life support design, pumping, acoustic controls
  marineWorld: string;              // Coral colonies and specimen curation
  handoverResult: string;           // Handover state, water clarity, stability
  
  // Operations & Systems
  specifications: {
    circulationPumps: string;       // e.g. "Dual EcoTech Vectra L2 (<24dB)"
    lighting: string;               // e.g. "6× Radion XR30 G6 Pro Spectrum"
    filtration: string;             // e.g. "Custom Acrylic Sump + Royal Exclusiv Bubble King"
    automation: string;             // e.g. "Neptune Apex IoT Cloud Telemetry"
  };
  
  // Publishing Lifecycle & SEO
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  featured: boolean;                // Display on homepage portfolio strip
  sortOrder: number;
  publishedAt?: Date;
  seoTitle?: string;
  seoDescription?: string;
  projectId?: string;               // Optional reference to internal ClientProject.id
  createdAt: Date;
  updatedAt: Date;
}

const CaseStudySchema = new Schema<ICaseStudyDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    clientAlias: { type: String, required: true },
    category: {
      type: String,
      enum: ['residential', 'commercial', 'hospitality', 'institutional'],
      required: true,
    },
    locationCity: { type: String, required: true },
    completionYear: { type: Number, required: true },
    aquariumVolumeLiters: { type: Number, required: true },
    aquariumDimensions: { type: String, required: true },
    viewingMaterial: { type: String, required: true },
    biome: { type: String, required: true },
    heroImage: { type: String, required: true },
    beforeImage: String,
    afterImage: String,
    galleryImages: { type: [String], default: [] },
    challenge: { type: String, required: true },
    concept: { type: String, required: true },
    engineering: { type: String, required: true },
    marineWorld: { type: String, required: true },
    handoverResult: { type: String, required: true },
    specifications: {
      circulationPumps: String,
      lighting: String,
      filtration: String,
      automation: String,
    },
    status: {
      type: String,
      enum: ['draft', 'in_review', 'approved', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    publishedAt: Date,
    seoTitle: String,
    seoDescription: String,
    projectId: String,
  },
  { timestamps: true }
);

export const CaseStudyModel: Model<ICaseStudyDocument> =
  mongoose.models.CaseStudy || mongoose.model<ICaseStudyDocument>('CaseStudy', CaseStudySchema);
```

---

#### 2. `ClientProject` (`models/ClientProject.ts`)
Internal operational tracking for active installations:
```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClientProjectDocument extends Document {
  id: string;                       // e.g. "PRJ-2026-004"
  clientName: string;               // Real confidential client name
  phone: string;                    // Primary contact phone
  email?: string;
  siteAddress: string;              // Real site street address & floor
  city: string;
  projectType: 'custom_build' | 'renovation' | 'consultation';
  status: 'lead' | 'site_audit' | 'engineering_design' | 'fabrication' | 'installation' | 'cycling' | 'completed' | 'on_hold';
  tankVolumeLiters: number;
  contractValueINR: number;
  leadSource: string;
  targetCompletionDate?: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const ClientProjectSchema = new Schema<IClientProjectDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    email: String,
    siteAddress: { type: String, required: true },
    city: { type: String, required: true },
    projectType: {
      type: String,
      enum: ['custom_build', 'renovation', 'consultation'],
      required: true,
    },
    status: {
      type: String,
      enum: ['lead', 'site_audit', 'engineering_design', 'fabrication', 'installation', 'cycling', 'completed', 'on_hold'],
      default: 'lead',
      index: true,
    },
    tankVolumeLiters: { type: Number, default: 0 },
    contractValueINR: { type: Number, default: 0 },
    leadSource: String,
    targetCompletionDate: String,
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ClientProjectModel: Model<IClientProjectDocument> =
  mongoose.models.ClientProject || mongoose.model<IClientProjectDocument>('ClientProject', ClientProjectSchema);
```

---

#### 3. `AuditLog` (`models/AuditLog.ts`)
Immutable administrative action record:
```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLogDocument extends Document {
  actor: string;                     // "admin" or session ID
  action: 'create' | 'update' | 'delete' | 'publish' | 'unpublish' | 'backup' | 'restore';
  entity: 'product' | 'order' | 'inquiry' | 'case_study' | 'project' | 'banner' | 'setting';
  entityId: string;
  summary: string;
  diff?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    actor: { type: String, required: true, default: 'admin' },
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'publish', 'unpublish', 'backup', 'restore'],
      required: true,
    },
    entity: {
      type: String,
      enum: ['product', 'order', 'inquiry', 'case_study', 'project', 'banner', 'setting'],
      required: true,
    },
    entityId: { type: String, required: true, index: true },
    summary: { type: String, required: true },
    diff: { type: Schema.Types.Mixed, default: {} },
    ipAddress: String,
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable: no updatedAt
  }
);

export const AuditLogModel: Model<IAuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
```

---

#### 4. `AnalyticsEvent` (`models/AnalyticsEvent.ts`)
Privacy-conscious, first-party event tracking:
```typescript
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnalyticsEventDocument extends Document {
  eventType: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout_start' | 'order_completed' | 'inquiry_submitted' | 'whatsapp_click' | 'estimator_completed';
  path: string;
  entityId?: string;
  referrer?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  createdAt: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEventDocument>(
  {
    eventType: {
      type: String,
      enum: ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'order_completed', 'inquiry_submitted', 'whatsapp_click', 'estimator_completed'],
      required: true,
      index: true,
    },
    path: { type: String, required: true },
    entityId: String,
    referrer: String,
    deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet'], default: 'desktop' },
    createdAt: { type: Date, default: Date.now, expires: '90d' }, // Auto-expire raw events after 90 days
  },
  { timestamps: false }
);

export const AnalyticsEventModel: Model<IAnalyticsEventDocument> =
  mongoose.models.AnalyticsEvent || mongoose.model<IAnalyticsEventDocument>('AnalyticsEvent', AnalyticsEventSchema);
```

---

## 3. ID CONVENTIONS & RELATIONSHIP MAP

All entities follow human-scannable, prefixed string ID standards:
* Products: `[kebab-slug]` (e.g. `designer-clownfish-pair`)
* Orders: `MC-[4-digit-id]` (e.g. `MC-8921`)
* Inquiries: `INQ-[timestamp-tail]` (e.g. `INQ-117844`)
* Case Studies: `CS-[SLUG]` (e.g. `CS-ALIPORE-2025`)
* Client Projects: `PRJ-[YEAR]-[3-digit-id]` (e.g. `PRJ-2026-001`)
* Media Assets: `media-[timestamp]-[random]` (e.g. `media-1727632-x9k2p`)

```text
┌────────────────────────┐                  ┌────────────────────────┐
│     ClientProject      │                  │       CaseStudy        │
│  (Private Operations)  │                  │   (Public Editorial)   │
├────────────────────────┤                  ├────────────────────────┤
│ id: PRJ-2026-001       │◄───(Optional)────│ projectId: PRJ-2026-001│
│ clientName: "Confid."  │    Reference     │ clientAlias: "Alipore" │
│ siteAddress: "14 Elm"  │                  │ slug: "alipore-reef"   │
│ contractValue: ₹8.5L   │                  │ status: "published"    │
└────────────────────────┘                  └────────────────────────┘

┌────────────────────────┐                  ┌────────────────────────┐
│        Inquiry         │                  │         Order          │
│   (Leads & Funnels)    │                  │  (Commerce Dispatch)   │
├────────────────────────┤                  ├────────────────────────┤
│ id: INQ-117844         │                  │ id: MC-8921            │
│ phone: "9876543210"    │◄───(Synthesized)─│ phone: "9876543210"    │
│ serviceType: "Design"  │    Customer      │ isApproved: true       │
│ crmStage: "qualified"  │    Directory     │ totalAmount: ₹14,999   │
└────────────────────────┘                  └────────────────────────┘
```

---

*Certified as Authoritative Data Model & Schema Specification for Phase 3 by CTO Execution Agent.*
