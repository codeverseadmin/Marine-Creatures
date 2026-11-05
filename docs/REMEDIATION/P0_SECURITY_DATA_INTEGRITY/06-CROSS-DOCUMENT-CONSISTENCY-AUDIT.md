# MARINE CREATURES — P0 REMEDIATION SPECIFICATION
## CROSS-DOCUMENT CONSISTENCY AUDIT & ARCHITECTURAL VERIFICATION

**Document ID:** `MC-SPEC-REV-AUD-006`  
**Date:** November 6, 2026  
**Auditor / Principal Security Architect:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Scope:** Comprehensive 14-Point Consistency Verification Across All Remediation Deliverables  
**Mode:** READ-ONLY SPECIFICATION — ZERO CODE MODIFICATIONS  

---

## 1. COMPREHENSIVE 14-POINT CONSISTENCY VERIFICATION CHECKLIST

Every revision and document in the remediation portfolio was cross-examined against the 14 non-negotiable architectural mandates:

| Mandate # | Architectural Requirement | Consistency Verification Status | Source Document Cross-References | Resolution & Evidence Details |
|---|---|---|---|---|
| **01** | Historical customer access never relies on phone numbers or order IDs alone | **VERIFIED CONSISTENT** | `01-HISTORICAL-CUSTOMER-TOKEN-ISSUANCE.md#L15-L25` | 10-digit phone number is treated strictly as an identity claim (username) to dispatch a 256-bit CSPRNG OTP challenge; never as an authenticator. |
| **02** | Tracking and invoice access use appropriately scoped credentials | **VERIFIED CONSISTENT** | `01-HISTORICAL-CUSTOMER-TOKEN-ISSUANCE.md`, `CUSTOMER_TRACKING_INVOICE_SECURITY.md` | Customer access is strictly restricted to tracking (`mct_`); customer invoice tokens and URLs are 100% eliminated. Invoice access is strictly administrative inside Control OS. |
| **03** | Zero-priced items are never automatically assumed to be POR | **VERIFIED CONSISTENT** | `02-EVIDENCE-BASED-POR-CLASSIFICATION.md#L12-L35` | Simplistic `price === 0 => POR` logic is completely replaced by 11-vector evidentiary scoring model and 6 classification categories. |
| **04** | Ambiguous historical records require manual review | **VERIFIED CONSISTENT** | `02-EVIDENCE-BASED-POR-CLASSIFICATION.md#L65-L90` | Records scoring $< 70/100$ enter `AMBIGUOUS_REQUIRES_REVIEW` queue; zero automated status changes permitted without concierge verification. |
| **05** | No historical price is inferred or invented | **VERIFIED CONSISTENT** | `02-EVIDENCE-BASED-POR-CLASSIFICATION.md#L140-L165`, `LEGACY_ORDER_RECOVERY_PLAN.md` | System never auto-fills agreed prices. Total remains ₹0 until concierge enters quote and records explicit customer agreement. |
| **06** | Every migration has a before-image and recovery strategy | **VERIFIED CONSISTENT** | `03-ATOMIC-METADATA-MIGRATION.md#L55-L95` | Pre-migration snapshots stored in `_schema_migrations` manifest collection and local JSON backup before any document write. |
| **07** | Migration execution is idempotent and concurrency-safe | **VERIFIED CONSISTENT** | `03-ATOMIC-METADATA-MIGRATION.md#L100-L140` | Optimistic locking on `version`; arrayFilters for targeted item updates; duplicate execution skips already-reconciled migration IDs. |
| **08** | Price proposal, agreement, confirmation, and invoice are separate events | **VERIFIED CONSISTENT** | `04-PRICE-AGREEMENT-ORDER-CONFIRMATION-INVOICE.md#L15-L60` | Decoupled 6-stage lifecycle: `proposedUnitPrice` != `agreedUnitPrice` != `isConfirmed` != `invoiceIssued`. |
| **09** | No invoice is generated automatically during POR reconciliation | **VERIFIED CONSISTENT** | `04-PRICE-AGREEMENT-ORDER-CONFIRMATION-INVOICE.md#L115-L135` | Invoicing requires explicit `POST /api/admin/orders/[id]/invoice/generate` action post-confirmation; blocked if unresolved POR exists. |
| **10** | All sensitive administrative actions enforce granular RBAC | **VERIFIED CONSISTENT** | `API_SECURITY_PERMISSION_MATRIX.csv`, `04-PRICE-AGREEMENT-ORDER-CONFIRMATION-INVOICE.md#L90-L120` | `isAdminRequest` legacy checks replaced by `requirePermission(req, '...')`. Distinct permissions for propose, commit, confirm, and invoice. |
| **11** | Every important business and security event is audit-logged | **VERIFIED CONSISTENT** | `01-HISTORICAL-CUSTOMER-TOKEN-ISSUANCE.md#L110`, `04-PRICE-AGREEMENT-ORDER-CONFIRMATION-INVOICE.md#L105` | `AuditLog` captures actor ID, timestamp, prior state, and action without leaking raw tokens or secret OTP strings. |
| **12** | Public APIs expose only the minimum necessary customer information | **VERIFIED CONSISTENT** | `CUSTOMER_TRACKING_INVOICE_SECURITY.md#L30-L65` | Public tracking returns masked customer name (`D**** H****`), city, and status timeline. Zero financials, line items, or AWBs disclosed. |
| **13** | No test-only fixture or QA interceptor can bypass production security | **VERIFIED CONSISTENT** | `ISOLATED_TEST_STRATEGY.md#L15-L35` | Complete purge of `if (orderId.startsWith('MC-QA-'))` blocks from all production routes. Tests execute strictly on isolated test DB. |
| **14** | Existing valid standard-priced orders remain unchanged | **VERIFIED CONSISTENT** | `LEGACY_ORDER_RECOVERY_PLAN.md`, `05-REVISED-IMPLEMENTATION-SEQUENCE.md#L90-L105` | Clean standard orders (e.g. `MC-8921`) are marked `STRICTLY IMMUTABLE` and skipped by all reconciliation and migration passes. |

---

## 2. CONTRADICTIONS DISCOVERED AND RESOLVED

During this revision, three critical internal contradictions across the initial audit documents were discovered and resolved:

### Contradiction 1: Customer Authentication Method in Tracking
- **The Initial Error:** In `docs/HEALTH_AUDIT/.../FULFILMENT_AND_TRACKING_AUDIT.md` and initial `CUSTOMER_TRACKING_INVOICE_SECURITY.md`, the specification stated: *"Require exact 10-digit phone match (`providedPhone === cleanOrderPhone`) to unlock full manifest."*
- **The Security Flaw:** A 10-digit phone number is not a secret. An acquaintance, courier agent, or scammer who knows the customer's phone number could scrape their high-value coral purchases and flight manifests.
- **The Resolution:** Updated `01-HISTORICAL-CUSTOMER-TOKEN-ISSUANCE.md` and `CUSTOMER_TRACKING_INVOICE_SECURITY.md` to mandate that **a phone number is only an identity claim to trigger an OTP challenge**. Full manifest access requires the 256-bit CSPRNG token (`mct_`) issued post-OTP verification.

### Contradiction 2: Automatic POR Classification of ₹0 Items
- **The Initial Error:** In `docs/HEALTH_AUDIT/.../POR_PRICING_AUDIT.md` and initial `LEGACY_ORDER_RECOVERY_PLAN.md`, it was stated: *"Any item with price 0 in MongoDB will be updated to hasUnresolvedPorItems: true and pricingStatus: 'PENDING_POR'."*
- **The Business Flaw:** Ignores promotional frags, complimentary gifts, and warranty replacements.
- **The Resolution:** Authored `02-EVIDENCE-BASED-POR-CLASSIFICATION.md` instituting the 11-vector evidentiary model and 6 classification categories. Zero automatic price inference.

### Contradiction 3: Conflation of Price Entry, Approval, and Invoicing
- **The Initial Error:** In initial `P0_REMEDIATION_SPECIFICATION.md`, the POR modal was described as entering the agreed price, which immediately recalculated totals, set `isApproved = true`, and established the baseline invoice.
- **The Operational Flaw:** Proposing a price to a customer is not customer acceptance, and customer acceptance is not an issued invoice.
- **The Resolution:** Authored `04-PRICE-AGREEMENT-ORDER-CONFIRMATION-INVOICE.md` establishing the decoupled 6-stage lifecycle with separate schema fields for proposed quote, customer agreement, order confirmation, and explicit invoice generation.

### Contradiction 4: Customer Invoice Access vs. Strictly Internal Corporate Invoices
- **The Initial Error:** Previous remediation drafts designed a customer-facing invoice token architecture (`mci_` tokens), public customer invoice pages (`/invoice/[id]`), and WhatsApp invoice PDF dispatch to customers.
- **The Business Reality:** Under explicit business owner instruction, **Marine Creatures invoices are strictly internal corporate business documents**. Customers must NEVER have direct access to invoice pages, PDF download endpoints, invoice tokens, or internal financial manifests.
- **The Resolution:** Eliminated all customer invoice tokens (`mci_`), retired the public `/invoice/[id]` web route and `/api/orders/[id]` token endpoints, and restricted all invoice operations (`invoices.view`, `invoices.generate`, `invoices.download`, `invoices.revise`, `invoices.revoke`) exclusively to authenticated staff inside the Admin Control OS. Customer tracking (`mct_`) remains separate and strictly surrenders zero pricing or invoice data.

---

## 3. UNRESOLVED DECISIONS REQUIRING BUSINESS OWNER INPUT

Before executing Phase 3 and Phase 4, the following business policy decisions require explicit owner sign-off:

1. **OTP Gateway Provider Selection:**
   - *Decision:* Should customer OTP challenges route via WhatsApp Business API interactive templates (recommended for Marine Creatures' luxury clientele) or traditional SMS gateways (Twilio / Gupshup)?
2. **Quotation Validity Window:**
   - *Decision:* When a concierge proposes a custom price for a wild coral specimen, what is the expiration window for client acceptance before the specimen is released back to inventory (recommended: 48 hours)?
3. **Classification Approval for Orders `MC-740020EJ` and `MC-429334LH`:**
   - *Decision:* The dry-run report classifies these orders as `LIKELY_POR` (Score: 85/100). The business owner must formally confirm their classification before quotation drafting begins.

