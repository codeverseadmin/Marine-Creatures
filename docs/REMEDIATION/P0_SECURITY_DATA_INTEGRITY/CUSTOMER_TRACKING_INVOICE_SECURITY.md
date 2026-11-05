# MARINE CREATURES — P0 REMEDIATION
## CUSTOMER TRACKING SEPARATION & ADMINISTRATIVE INVOICE SECURITY SPECIFICATION (REVISED)

**Document ID:** `MC-REM-P0-005-REV3`  
**Date:** November 6, 2026 (Strict Administrative Invoicing Edition)  
**Auditor / Principal Security Architect:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Domain:** Customer Tracking Telemetry, Administrative Invoice Control, RBAC Gating & Route Decommissioning  
**Status:** SPECIFICATION APPROVED FOR REMEDIATION  

---

## 1. MANDATORY ARCHITECTURAL PRINCIPLE: INVOICES ARE STRICTLY INTERNAL

Under explicit directive from the business owner:
**Marine Creatures invoices are strictly internal corporate business documents.**
Customers must **NEVER** have direct access to:
- A public customer-facing invoice web page.
- An invoice PDF download endpoint.
- An invoice generation or revision API.
- An invoice access token.
- Internal financial manifests, margins, unit rates, or line-item pricing through any public or tracking API.

**Only the Owner and explicitly authorized employees may access invoice functionality through the authenticated Admin Control OS.**

---

## 2. CUSTOMER TRACKING SEPARATION & DUAL-TIER SCHEMAS

Customer tracking is strictly decoupled from financial invoicing.
Tracking exists solely to provide live logistics telemetry for live marine cargo:

```
                    ┌──────────────────────────────────────────────┐
                    │      GET /api/orders/track?id=MC-XXXXX       │
                    └──────────────────────┬───────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
           [No Auth / Public Query]            [Authorized Customer Tier]
                        │                       (Requires Verified mct_ Token)
                        ▼                                     │
           ┌─────────────────────────┐                        ▼
           │  PUBLIC MINIMAL SCHEMA  │          ┌───────────────────────────┐
           │   - Masked Name (D***)  │          │   SCOPED MANIFEST SCHEMA  │
           │   - Destination City    │          │   - Full Verified Name    │
           │   - Fulfilment Stage    │          │   - Carrier Flight & AWB  │
           │   - Estimated Delivery  │          │   - Live Tracking Link    │
           │   - Redacted History    │          │   - Specimen Names & Qty  │
           │   - ZERO Financials     │          │   - Detailed Timeline     │
           │   - ZERO Courier AWBs   │          │   - ZERO Financials       │
           │   - ZERO Line Items     │          │   - ZERO Invoice Links    │
           │   - ZERO Invoices       │          │   - ZERO Invoice Tokens   │
           └─────────────────────────┘          └───────────────────────────┘
```

### 2.1 Public Tracking Schema (Minimal Tier — Zero Authentication)
```json
{
  "success": true,
  "data": {
    "id": "MC-740020EJ",
    "customerMaskedName": "D**** H****",
    "destinationCity": "Kolkata",
    "currentStep": "quarantine",
    "statusTitle": "Quarantine Health Inspection",
    "statusDescription": "Specimens are undergoing proactive salinity dip and parasite screening.",
    "estimatedDelivery": "Tomorrow via Priority Air Cargo",
    "isApproved": true,
    "createdAt": "05 Nov 2026, 11:30 PM",
    "detailedShipmentAuthorized": false,
    "history": [
      {
        "step": "placed",
        "timestamp": "05 Nov 2026, 11:30 PM",
        "publicStatus": "Order registered with Marine Creatures Concierge"
      },
      {
        "step": "quarantine",
        "timestamp": "06 Nov 2026, 09:00 AM",
        "publicStatus": "Specimen conditioning active in biological quarantine facility"
      }
    ]
  }
}
```

### 2.2 Authorized Customer Tracking Schema (Scoped `mct_` Token Required)
Exposes physical logistics telemetry, flight numbers, and cargo contents, but **STRICTLY ZERO FINANCIAL DATA AND ZERO INVOICE REFERENCES**:
```json
{
  "success": true,
  "data": {
    "id": "MC-740020EJ",
    "customerName": "Debabrata Halder",
    "phoneMasked": "+91 ******3603",
    "destinationCity": "Kolkata",
    "destinationPincode": "700091",
    "currentStep": "dispatched",
    "estimatedDelivery": "06 Nov 2026, 04:30 PM",
    "courier": {
      "carrierName": "IndiGo CarGo Priority Express",
      "flightNumber": "6E-442",
      "awbNumber": "312-98471201",
      "trackingUrl": "https://www.goindigo.in/cargo/track-shipment.html?awb=312-98471201",
      "isLiveCargoCertified": true
    },
    "cargoManifest": [
      {
        "id": "rainbow-chalice-coral",
        "name": "Rainbow Chalice Coral (Ultra Grade)",
        "quantity": 1,
        "category": "marine-life"
      }
    ],
    "detailedShipmentAuthorized": true
  }
}
```

---

## 3. STRICT ADMINISTRATIVE INVOICE ACCESS & RBAC GATING

All invoice operations require:
1. Valid authenticated administrative session (`SESSION_COOKIE`).
2. Active employee status (not suspended or revoked).
3. Server-side verification of explicit granular RBAC permissions on **every** request.
4. The Owner retains unconditional super-administrator authority.

### 3.1 Granular Invoicing Permissions Matrix
```
┌────────────────────────────────────────────────────────────────────────┐
│                   INVOICE RBAC PERMISSION REGISTRY                     │
├───────────────────┬──────────────────────┬─────────────────────────────┤
│ Permission ID     │ Action Scope         │ Minimum Role Tier           │
├───────────────────┼──────────────────────┼─────────────────────────────┤
│ invoices.view     │ View invoice data &  │ STORE_MANAGER,              │
│                   │ billing totals in UI │ SALES_ASSOCIATE, OWNER      │
│ invoices.generate │ Issue initial formal │ STORE_MANAGER, OWNER        │
│                   │ invoice manifest     │                             │
│ invoices.download │ Download binary PDF  │ STORE_MANAGER, OWNER        │
│                   │ document stream      │                             │
│ invoices.revise   │ Issue numbered price │ OWNER (Mandatory)           │
│                   │ revision (INV-*-R1)  │                             │
│ invoices.revoke   │ Cancel/void existing │ OWNER (Mandatory)           │
│                   │ invoice manifest     │                             │
└───────────────────┴──────────────────────┴─────────────────────────────┘
```

> [!IMPORTANT]
> **Permission Decoupling:** Permission to view an order (`orders.read`) does **NOT** grant permission to view billing lines (`invoices.view`), generate an invoice (`invoices.generate`), or download an invoice PDF (`invoices.download`).

---

## 4. API AND ROUTE SECURITY SPECIFICATIONS

### 4.1 Route Security Enforcement
1. **Endpoint `GET /api/admin/orders/[id]/invoice-pdf`:**
   - **Protection:** Enforces `requirePermission(req, 'invoices.download')`.
   - **Checks:** Validates employee session, verifies order exists in MongoDB, verifies order confirmation, verifies zero unresolved POR items.
   - **Header:** Streams `application/pdf` with `Content-Disposition: attachment; filename="Marine-Creatures-INV-MC-XXXX.pdf"`.
   - **Zero Public Access:** Anonymous or invalid employee requests return HTTP 401/403 with generic errors. Zero financial disclosure.
2. **Endpoint `POST /api/admin/orders/[id]/invoice/generate`:**
   - **Protection:** Enforces `requirePermission(req, 'invoices.generate')`.
   - **Rules:** Blocked if order is unconfirmed or any line item remains unpriced.
3. **Endpoint `POST /api/admin/orders/[id]/invoice/revise`:**
   - **Protection:** Enforces `requirePermission(req, 'invoices.revise')`. Owner-only privilege.
4. **Endpoint `POST /api/admin/orders/[id]/invoice/revoke`:**
   - **Protection:** Enforces `requirePermission(req, 'invoices.revoke')`. Owner-only privilege.

### 4.2 Decommissioning of Public Invoice Routes
The existing public customer-facing invoice route [`app/invoice/[id]/page.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/invoice/[id]/page.tsx) and public endpoint [`app/api/orders/[id]/route.ts`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/orders/[id]/route.ts) must be safely decommissioned:
- **`app/invoice/[id]/page.tsx` Retirement:**
  - Remove all customer-facing token entry forms.
  - If visited by an unauthenticated public visitor: Return HTTP 404 (Not Found) or redirect to homepage (`/`).
  - If visited by an authenticated administrator holding `invoices.view`: Redirect immediately to `/admin?tab=sales&orderId=[id]`.
- **`app/api/orders/[id]/route.ts` Retirement:**
  - Remove public `GET` token verification handler.
  - Remove public `POST` token issuance handler.
  - Route will be deprecated in favor of strictly administrative `/api/admin/orders/[id]/*` endpoints.

---

## 5. INVOICE LIFECYCLE & STATUTORY FORMATTING

1. **Explicit Administrative Action:** Invoicing is triggered strictly when an authorized manager clicks `Issue Invoice & Dispatch Manifest` inside Control OS Sales.
2. **Pre-Generation Gates:**
   - All POR items must possess confirmed customer agreements (`pricingLifecycle.allPorAgreed === true`).
   - Order must be formally confirmed (`confirmationLifecycle.isConfirmed === true`).
   - Operator must possess `invoices.generate`.
3. **Document Heading Compliance:**
   - Heading is permanently hardcoded as `INVOICE & DISPATCH MANIFEST`.
   - The label `TAX INVOICE` is strictly prohibited.
   - GSTIN line is omitted unless verified statutory tax registration is formally introduced.
