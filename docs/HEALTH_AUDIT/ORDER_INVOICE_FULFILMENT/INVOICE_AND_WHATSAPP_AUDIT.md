# MARINE CREATURES — END-TO-END HEALTH AUDIT
## DELIVERABLE 3: INVOICE GENERATION & WHATSAPP PDF DISPATCH AUDIT

**Audit Date:** November 6, 2026  
**Auditor:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Audit Target:** `@react-pdf/renderer` Pipeline, Statutory Compliance, PDF Delivery & WhatsApp Web Share  
**Audit Status:** AUDIT COMPLETE — ORPHANED FRONTEND INTEGRATION & CUSTOMER ACCESS WALL IDENTIFIED  

---

## 1. EXECUTIVE SUMMARY & VERDICT

The invoice and dispatch documentation system is designed to provide luxury marine clients and airline cargo carriers with verifiable, executive-grade physical and digital documentation.
The business specification mandates:
1. **Corporate Document Heading:** Fixed permanently as `INVOICE & DISPATCH MANIFEST` (conditional switching to `TAX INVOICE` is prohibited until GSTIN is formally registered).
2. **Statutory Integrity:** GSTIN display fallback for unregistered/composition operators, correct legal entity naming (`Marine Creatures Aquatics Private Limited`), and Kolkata registered studio details.
3. **Multi-Page Pagination & Layout:** Table row wrapping without awkward page splits, running headers, and dynamic page numbering (`Page X of Y`).
4. **Immutable Revisions:** Numbered revisions (`INV-MC-xxx-R1`, `R2`) whenever prices or line items change.
5. **WhatsApp PDF Delivery:** Seamless mobile Web Share API dispatch (`navigator.share` with PDF blob) with automatic desktop fallback (download PDF + open `wa.me` chat).
6. **Customer Self-Service:** Zero-friction invoice viewing for authenticated customers via WhatsApp links.

### Audit Verdict: **PARTIAL (BACKEND COMPLIANT / FRONTEND ORPHANED & GATED)**
- **PDF Engine (`lib/invoice-pdf-template.tsx`):** **EXCELLENT / PASS.** The PDF template uses `@react-pdf/renderer` and adheres strictly to corporate typography, colors, layout, and statutory requirements.
- **Invoice Endpoint (`/api/admin/orders/[id]/invoice-pdf`):** **PASS (with synthetic test caveats).** Correctly buffers and streams PDF with proper `application/pdf` headers.
- **WhatsApp PDF Delivery Hook (`lib/hooks/useInvoicePdfShare.ts`):** **PASS (LOGIC) / FAIL (INTEGRATION).** Hook handles mobile file sharing and desktop fallback smoothly, but is completely absent from the active Admin Dashboard (`ControlOsSales.tsx`).
- **Customer Invoice Access (`app/invoice/[id]/page.tsx`):** **FAIL (CRITICAL UX BLOCKER).** Imposes an aggressive 64-character cryptographic token gate without providing customers their token in tracking links or WhatsApp messages, blocking legitimate customer invoice access.

---

## 2. INVOICE RENDERING PIPELINE FORENSICS

### A. Document Heading & Brand Compliance
- **Location:** [marine-creatures/lib/invoice-pdf-template.tsx#L581-L587](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/invoice-pdf-template.tsx#L581-L587)
- **Code Audit:**
  ```typescript
  // Permanent Invoice Classification:
  // Marine Creatures operates without a GSTIN registration.
  // Under statutory compliance and owner directive, this document heading is
  // PERMANENTLY fixed as 'INVOICE & DISPATCH MANIFEST'.
  // Automatic or conditional switching to 'TAX INVOICE' is strictly disallowed
  // without explicit business owner authorization.
  const docTitle = 'INVOICE & DISPATCH MANIFEST';
  ```
- **Finding:** The title is permanently hardcoded to `INVOICE & DISPATCH MANIFEST`. There are no dynamic code paths that switch to `TAX INVOICE`.
- **Verdict:** **PASS.**

### B. GSTIN & Statutory Entity Metadata
- **Location:** [marine-creatures/lib/invoice-pdf-template.tsx#L605-L635](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/invoice-pdf-template.tsx#L605-L635)
- **Legal Entity:** Renders `Marine Creatures Aquatics Private Limited` with descriptor `Bringing Ocean at Your Doorstep`.
- **GSTIN Logic:**
  ```tsx
  {order.gstin ? (
    <View style={styles.headerMetaRow}>
      <Text style={styles.headerMetaLabel}>GSTIN:</Text>
      <Text style={styles.headerMetaValue}>{order.gstin}</Text>
    </View>
  ) : null}
  ```
  If GSTIN is omitted, the field is cleanly hidden rather than displaying undefined or placeholder text.
- **Registered Studio:** Kolkata, West Bengal, India. Contact: `+91 93304 36603`.
- **Verdict:** **PASS.**

### C. Multi-Page Pagination & Table Row Wrapping
- **Location:** [marine-creatures/lib/invoice-pdf-template.tsx#L690-L777](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/lib/invoice-pdf-template.tsx#L690-L777)
- **Row Protection:** Each line item is rendered inside a `<View style={styles.tableRow}>` with consistent cell widths: `colNum: '6%'`, `colDesc: '48%'`, `colHsn: '10%'`, `colQty: '8%'`, `colRate: '14%'`, `colAmt: '14%'`.
- **Summary & Signatory Wrap:** The summary card and signatory block use `wrap={false}` to guarantee that financial totals and signatures are never severed across page boundaries.
- **Running Footer:** Dynamic page number render prop:
  ```tsx
  <Text
    style={styles.brandBaseline}
    render={({ pageNumber, totalPages }) =>
      `Marine Creatures — Bringing Ocean at Your Doorstep • Page ${pageNumber} of ${totalPages}`
    }
    fixed
  />
  ```
- **Visual Artifacts:** Verified against generated test artifacts `EXECUTIVE_INVOICE_STANDARD_SAMPLE.pdf` (1 page) and `EXECUTIVE_INVOICE_MULTIPAGE_SAMPLE.pdf` (2 pages). Both render clean borders, sharp typography, and zero layout overflows.
- **Verdict:** **PASS.**

---

## 3. INVOICE REVISION SNAPSHOTTING FORENSICS

### Intended Behaviour:
When an order's prices are agreed upon or modified post-approval, the original invoice number (`INV-MC-xxx`) should be preserved, and a new revision (`INV-MC-xxx-R1`, `INV-MC-xxx-R2`) should be generated. The prior invoice state must be immutably snapshotted in `order.invoiceRevisions`.

### Code Implementation Audit:
- **Order Model Schema:** [marine-creatures/models/Order.ts#L110-L146](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/models/Order.ts#L110-L146)
  The Mongoose schema properly defines `InvoiceRevisionSchema`:
  ```typescript
  const InvoiceRevisionSchema = new Schema<IInvoiceRevision>({
    revisionNumber: { type: Number, required: true },
    invoiceNumber: { type: String, required: true },
    revisedAt: { type: String, required: true },
    revisedBy: { type: String, required: true },
    subtotal: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    items: { type: [OrderItemSchema], default: [] },
    reason: { type: String },
  }, { _id: false });
  ```
- **POR Pricing Route Snapshotting:** [marine-creatures/app/api/admin/orders/[id]/por-pricing/route.ts#L243-L275](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/api/admin/orders/[id]/por-pricing/route.ts#L243-L275)
  When `isRevision` evaluates to `true`:
  1. Base invoice number is extracted (`oldInvoiceNumber.replace(/-R\d+$/, '')`).
  2. Next revision number calculated (`currentRevisions.length + 1`).
  3. Snapshot object with prior subtotal, items, timestamp, and user is pushed to `order.invoiceRevisions`.
  4. Current `invoiceNumber` is updated to `${baseInvoiceNumber}-R${nextRevNum}`.
- **Defect in Snapshot Trigger Condition:**
  In line 180 of `por-pricing/route.ts`:
  ```typescript
  let isRevision = Boolean(
    order.isApproved ||
    order.porPricingResolvedAt ||
    order.items.some((it: any) => it.pricingStatus === 'AGREED')
  );
  ```
  However, in line 250:
  ```typescript
  if (isRevision && (order.isApproved || order.invoiceNumber || order.porPricingResolvedAt)) {
  ```
  Because storefront order creation sets `invoiceNumber: 'INV-' + id` upon initial creation in `OrderContext.tsx` line 320, **the very first time a POR price is agreed upon, it creates an `-R1` revision immediately** instead of establishing the initial baseline invoice.
- **Verdict:** **PARTIAL.** Schema and persistence work, but revision logic prematurely appends `-R1` on first pricing resolution.

---

## 4. CUSTOMER INVOICE ACCESS & THE TOKEN WALL DEFECT

### Investigation of `app/invoice/[id]/page.tsx`
- **Location:** [marine-creatures/app/invoice/[id]/page.tsx#L22-L145](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/invoice/[id]/page.tsx#L22-L145)

When a user visits `/invoice/MC-740020EJ`:
1. The component checks for `?token=...` in the URL query string.
2. If absent, it attempts to fetch `/api/admin/overview` with `credentials: 'include'`.
3. If the visitor is NOT an authenticated administrator with access to `/api/admin/overview`, `authorized` remains `false`.
4. The page renders the **Cryptographic Token Verification Gate**:
   ```tsx
   <div className="max-w-md w-full bg-slate-900/90 border border-slate-700/60 rounded-2xl p-8">
     <h3>Invoice Access Verification</h3>
     <p>Please enter the 64-character verification token provided in your order confirmation.</p>
     <input type="text" placeholder="Enter security token..." />
     <button>Verify Access</button>
   </div>
   ```

### The Systemic Breakdown:
1. **WhatsApp Order Messages omit the token:** When a customer places an order via `CartDrawer.tsx` line 139, the WhatsApp message template includes the customer name, phone, address, and item list, but **never includes the token**.
2. **Customer Tracking page omits the token:** When a customer tracks their order via `/track-order`, the response does not expose the raw `invoiceToken`.
3. **Admin Sales links omit the token:** In `ControlOsSales.tsx` line 265:
   ```tsx
   <a href={`/invoice/${o.id}`} target="_blank">Invoice ↗</a>
   ```
   If the admin's session does not have access to `/api/admin/overview` (e.g. an employee with role `DISPATCH_EXECUTIVE` or `SALES_ASSOCIATE`), even the employee is locked out by the token gate!
- **Verdict:** **FAIL (CRITICAL OPERATIONAL BLOCKER).**

---

## 5. WHATSAPP PDF DISPATCH HOOK AUDIT

### Implementation Forensics (`lib/hooks/useInvoicePdfShare.ts`)
The hook is architected with three-phase state management:
1. **Fetch Stage:** Retrieves binary PDF blob from `/api/admin/orders/${orderId}/invoice-pdf`.
2. **Mobile Web Share API:**
   ```typescript
   if (navigator.canShare?.({ files: [pdfFile] })) {
     await navigator.share({
       files: [pdfFile],
       title: `Marine Creatures Invoice — ${cleanInv}`,
       text: message,
     });
   }
   ```
   On modern iOS Safari and Android Chrome, this directly opens the OS share sheet with the attached PDF file and pre-filled message.
3. **Desktop Fallback:**
   ```typescript
   // 1. Download file
   anchor.download = `Marine-Creatures-${cleanInv}.pdf`;
   anchor.click();
   // 2. Open WhatsApp Web with pre-formatted message
   window.open(`https://wa.me/${phoneWithCC}?text=${encodeURIComponent(message)}`, '_blank');
   ```
   On desktop Chrome/Edge/Firefox, it downloads the PDF to the user's Downloads folder and opens WhatsApp Web with the chat addressed to the customer.

### Why the Feature Disappeared in Production:
- The hook was built for and embedded in `components/admin/tabs/OrdersTab.tsx`.
- When `app/admin/page.tsx` was redesigned to mount `ControlOsSales.tsx`, the developers failed to import or invoke `useInvoicePdfShare` inside `ControlOsSales.tsx`.
- As a result, the admin dashboard only provides a standard HTML hyperlink (`<a href="/invoice/id">Invoice ↗</a>`) and has **zero capability to dispatch PDFs or trigger WhatsApp shares**.
- **Verdict:** **PARTIAL.** Hook is production-ready; dashboard integration is missing.

---

## 6. REQUIRED REMEDIATION SPECIFICATION

To restore full invoice generation and WhatsApp delivery:

1. **`components/admin/ControlOsSales.tsx`**:
   - Import `useInvoicePdfShare` and mount the share button in each order table row and drawer.
   - Add status indicator pills (`idle`, `generating`, `ready`) and a modal guidance banner when the desktop fallback triggers.
2. **`app/invoice/[id]/page.tsx`**:
   - Permit customer invoice access if the customer presents a valid session, OR provides their verified Order ID + matching 10-digit phone number (replacing the hostile 64-character token gate with a customer-friendly OTP or phone verification).
   - Ensure admin access checks allow ANY valid employee session with `orders.read` or `orders.invoice.generate` permission (not hardcoded to `/api/admin/overview`).
3. **`app/api/admin/orders/[id]/por-pricing/route.ts`**:
   - Fix baseline invoice numbering: Only append `-R1` if the order had previously been priced or approved, preventing clean first-time orders from becoming revisions.

