# MARINE CREATURES — CONTROL OS API MATRIX & CONTRACT SPECIFICATION

**Project:** Marine Creatures  
**Document Code:** `MC-P3-API-2026-V1`  
**Authority:** CTO / Lead System Architect — CODEVERSE Technologies  
**Phase:** Phase 3 — Operations, Administration & Business Intelligence  
**Status:** SPECIFICATION ONLY (CTO AUTHORIZED)  
**Date:** September 2026  

---

## 1. ARCHITECTURAL API STANDARDS & CONVENTIONS

### 1.1 Route Structure & Protocol
* **Location:** All administrative endpoints reside under `/api/admin/*`.
* **Public Telemetry:** Non-privileged ingestion endpoints (e.g. `/api/analytics/event`) reside under `/api/*` with strict rate limiting.
* **Format:** Strict JSON exchange with header `Content-Type: application/json`.
* **Standard Response Envelope:**
  ```typescript
  // Success Response
  { "success": true, "count"?: number, "data": T }

  // Error Response
  { "success": false, "error": string, "code"?: string }
  ```

### 1.2 Authentication & Security Policy
1. **Primary Session Mechanism:** Enforces `isAdminRequest(req)`, which checks for the presence and validity of the signed `mc_admin_session` `httpOnly` cookie.
2. **Timing Safe Comparison:** All HMAC-SHA256 signature verifications and passcode validations execute via `crypto.timingSafeEqual`.
3. **Session Expiration:** Rejects tokens older than 8 hours (`28,800,000 ms`).
4. **Brute-Force Delay:** Unauthenticated or invalid login attempts incur an artificial `500ms` delay before responding with `HTTP 401 Unauthorized`.
5. **Mutation Risk Ratings:**
   - **LOW:** Read-only queries, telemetry captures, filtered lists.
   - **MEDIUM:** Non-destructive updates, CRM status tags, draft saves.
   - **HIGH:** Live product price changes, order step handovers, publishing to public website.
   - **CRITICAL:** Destructive record deletion, database snapshot restores, database re-seeding.

---

## 2. COMPLETE ADMINISTRATIVE API MATRIX

### 2.1 Authentication & Session Subsystem

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `POST` | `/api/admin/login` | Authenticate admin, issue signed session cookie | Public (Passcode) | `{ passcode: string }` | `{ success: true }` + `Set-Cookie: mc_admin_session` | **MEDIUM** |
| `POST` | `/api/admin/logout` | Destroy admin session, invalidate cookie | Public / Admin | None | `{ success: true }` + `Set-Cookie: mc_admin_session=; Max-Age=0` | **LOW** |
| `GET` | `/api/admin/session` | Inspect active session state & time remaining | Cookie Auth | None | `{ success: true, authenticated: true, expiresAt: string }` | **LOW** |

---

### 2.2 Catalog & Product Management

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/admin/products` | Paginated catalog listing with search/filter | Cookie Auth | Query: `?page=1&limit=25&category=x&status=y&q=search` | `{ success: true, total: number, page: number, data: IProduct[] }` | **LOW** |
| `POST` | `/api/admin/products` | Create new commercial catalog product | Cookie Auth | Full product payload (id, name, price, category, stockCount, images) | `{ success: true, data: IProduct }` (HTTP 201) | **HIGH** |
| `PATCH` | `/api/admin/products` | Partial update (price, stockCount, inStock, badge) | Cookie Auth | `{ id: string, ...partialUpdates }` | `{ success: true, data: IProduct }` | **HIGH** |
| `DELETE` | `/api/admin/products` | Archive or remove product from catalog | Cookie Auth | Query: `?id=product-slug` | `{ success: true, message: string }` | **CRITICAL** |
| `PATCH` | `/api/admin/inventory/batch` | Quick inline multi-row stock adjustment | Cookie Auth | `{ updates: Array<{ id: string, stockCount: number, inStock: boolean }> }` | `{ success: true, modifiedCount: number }` | **HIGH** |

---

### 2.3 Worlds & Dynamic Case Study CMS

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/admin/case-studies` | List all case studies including drafts | Cookie Auth | Query: `?status=all&page=1&limit=20` | `{ success: true, count: number, data: ICaseStudy[] }` | **LOW** |
| `GET` | `/api/admin/case-studies/:id` | Fetch full case study document for editing | Cookie Auth | Path: `id` | `{ success: true, data: ICaseStudy }` | **LOW** |
| `POST` | `/api/admin/case-studies` | Create draft case study | Cookie Auth | Full case study schema (title, slug, clientAlias, narrative, photos) | `{ success: true, data: ICaseStudy }` (HTTP 201) | **MEDIUM** |
| `PATCH` | `/api/admin/case-studies/:id` | Update narrative, visual assets, or status | Cookie Auth | Path: `id`, Body: `{ ...updates }` | `{ success: true, data: ICaseStudy }` | **HIGH** |
| `DELETE` | `/api/admin/case-studies/:id` | Soft delete or archive case study | Cookie Auth | Path: `id` | `{ success: true, message: string }` | **CRITICAL** |

---

### 2.4 Active Client Projects (Internal Operations)

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/admin/projects` | List operational client installations | Cookie Auth | Query: `?status=fabrication&city=kolkata` | `{ success: true, count: number, data: IClientProject[] }` | **LOW** |
| `POST` | `/api/admin/projects` | Create new client installation tracking job | Cookie Auth | `{ clientName, phone, siteAddress, projectType, tankVolumeLiters, contractValueINR }` | `{ success: true, data: IClientProject }` (HTTP 201) | **MEDIUM** |
| `PATCH` | `/api/admin/projects/:id` | Update milestone (site audit $\rightarrow$ installation) | Cookie Auth | Path: `id`, Body: `{ status, notes, targetCompletionDate }` | `{ success: true, data: IClientProject }` | **MEDIUM** |

---

### 2.5 Orders & Live Air Cargo Operations

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/admin/orders` | Full admin order queue with status filters | Cookie Auth | Query: `?step=quarantine&approved=false` | `{ success: true, count: number, data: IOrder[] }` | **LOW** |
| `PATCH` | `/api/admin/orders` | Approve order, assign invoice number | Cookie Auth | `{ id: string, isApproved: true, invoiceNumber?: string }` | `{ success: true, data: IOrder }` | **HIGH** |
| `PATCH` | `/api/admin/orders/dispatch` | Update step, assign AWB flight code & courier | Cookie Auth | `{ id: string, currentStep: 'dispatched', awbNumber: string, courierName: string, estimatedDelivery: string }` | `{ success: true, data: IOrder }` | **HIGH** |
| `DELETE` | `/api/admin/orders` | Cancel and delete order | Cookie Auth | Query: `?id=MC-8921` | `{ success: true, message: string }` | **CRITICAL** |

---

### 2.6 CRM & Lead Conversion Engine

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/admin/inquiries` | Retrieve all customer leads & blueprints | Cookie Auth | Query: `?crmStage=new&serviceType=design` | `{ success: true, count: number, data: IInquiry[] }` | **LOW** |
| `PATCH` | `/api/admin/inquiries` | Update qualification stage or append note | Cookie Auth | `{ id: string, crmStage?: string, note?: string, assignedTo?: string }` | `{ success: true, data: IInquiry }` | **MEDIUM** |
| `DELETE` | `/api/admin/inquiries` | Archive dead lead | Cookie Auth | Query: `?id=INQ-117844` | `{ success: true, message: string }` | **MEDIUM** |
| `GET` | `/api/admin/crm/client/:phone`| Unified history across orders & inquiries | Cookie Auth | Path: `phone` | `{ success: true, client: { phone, name, orders: [], inquiries: [], totalSpent: number } }` | **LOW** |

---

### 2.7 Centralized Media Asset Library

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/admin/media` | List media assets without binary chunks | Cookie Auth | Query: `?type=image&tag=case-study&limit=40` | `{ success: true, count: number, data: Array<{ id, filename, size, url, altText }> }` | **LOW** |
| `POST` | `/api/admin/upload` | Upload & optimize photo/video to CDN / Atlas | Cookie Auth | `multipart/form-data`: `file`, `type`, `altText`, `entityType` | `{ success: true, url: string, mediaId: string, size: number }` (HTTP 201) | **MEDIUM** |
| `DELETE` | `/api/admin/media/:id` | Remove orphaned media asset from storage | Cookie Auth | Path: `id` | `{ success: true, message: string }` | **HIGH** |

---

### 2.8 Business Intelligence & First-Party Analytics

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `POST` | `/api/analytics/event` | First-party telemetry capture | Public (Throttled) | `{ eventType: 'page_view' \| 'product_view' \| 'estimator_completed', path: string, entityId?: string }` | `{ success: true }` | **LOW** |
| `GET` | `/api/admin/analytics/overview` | Aggregated funnel metrics & demand indicators | Cookie Auth | Query: `?period=30d` | `{ success: true, funnel: {}, topProducts: [], demandByService: {} }` | **LOW** |
| `GET` | `/api/admin/analytics/monthly` | Historical month-by-month business health | Cookie Auth | Query: `?year=2026` | `{ success: true, months: Array<{ month, inquiries, orders, gmvINR, topCategory }> }` | **LOW** |

---

### 2.9 System Health, Snapshots & Audit Trail

| Method | Route | Purpose | Auth Required | Input Payload | Output Format | Mutation Risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| `GET` | `/api/health` | Live database ping, latency, document counts | Public / Admin | None | `{ connected: true, cluster: 'Cluster0', latencyMs: number, counts: {} }` | **LOW** |
| `GET` | `/api/admin/backup` | List existing database backup snapshots | Cookie Auth / Bearer | None | `{ success: true, count: number, data: ISnapshot[] }` (Without data blobs) | **LOW** |
| `POST` | `/api/admin/backup` | Trigger instant complete JSON database snapshot | Cookie Auth / Bearer | `{ label?: string }` | `{ success: true, id: string, checksum: string, sizeBytes: number }` | **HIGH** |
| `GET` | `/api/admin/audit` | Paginated immutable administrative action log | Cookie Auth | Query: `?entity=order&page=1&limit=50` | `{ success: true, count: number, data: IAuditLog[] }` | **LOW** |

---

*Certified as Authoritative API Matrix & Interface Specification for Phase 3 by CTO Execution Agent.*
