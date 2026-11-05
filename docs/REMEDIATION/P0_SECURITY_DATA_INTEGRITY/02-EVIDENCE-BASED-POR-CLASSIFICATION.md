# MARINE CREATURES — P0 REMEDIATION SPECIFICATION
## REVISION B: EVIDENCE-BASED POR CLASSIFICATION & RECONCILIATION

**Document ID:** `MC-SPEC-REV-B-002`  
**Date:** November 6, 2026  
**Auditor / Principal Data Architect:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Scope:** Historical Specimen Valuation Forensics, Multi-Source Evidence Models & Diagnostic Protocol  
**Mode:** READ-ONLY SPECIFICATION — ZERO ASSUMPTIONS / NO DATABASE WRITES  

---

## 1. ARCHITECTURAL PROBLEM STATEMENT

In earlier audit drafts, a dangerous simplification was introduced:  
*"If an order line item has `price === 0`, it is a Price-on-Request (POR) specimen and must be set to `hasUnresolvedPorItems: true`."*

**THIS LOGIC IS FUNDAMENTALLY FLAWED.**  
In an e-commerce and bespoke aquatics enterprise, **ZERO PRICE DOES NOT AUTOMATICALLY MEAN PRICE ON REQUEST**.
A zero-priced line item in historical database records can represent:
1. **A Genuine POR Marine Specimen:** A high-value SPS coral (e.g. *Acropora tenuis*, Rainbow Chalice) where quarantine conditioning and size dictate bespoke valuation.
2. **A Promotional / Complimentary Item:** A free test kit, promotional frag plug pack, or complimentary thermal acclimation guide included with high-value orders.
3. **A Post-Sale Warranty Replacement:** A replacement specimen dispatched under the 48-Hour Live Arrival Guarantee at ₹0 invoice value.
4. **A Multi-Item Package Discount / Bundle Breakdown:** An equipment bundle where the bundle header carried the full price and child components were entered at ₹0.
5. **A Data-Entry Error or Storefront Form Glitch:** An item added with corrupt numeric inputs.
6. **A Catalogue Policy Shift:** A product that was standard-priced when purchased in September 2026, but later switched to POR in November 2026 (or vice versa).

**Core Safety Mandate:** Blindly converting every ₹0 item into a POR order requiring price negotiation risks corrupting valid fulfilled orders, blocking historical accounting reconciliations, and distressing customers who received free promotional items.

---

## 2. MULTI-SOURCE EVIDENCE MODEL

The diagnostic classifier must evaluate multiple corroborating evidence vectors before assigning a classification status:

```
                                  ┌─────────────────────────────┐
                                  │   Zero-Priced Order Item    │
                                  └──────────────┬──────────────┘
                                                 │
          ┌──────────────────────┬───────────────┴──────────────┬──────────────────────┐
          ▼                      ▼                              ▼                      ▼
  [Historical Catalog]   [Order Metadata & Notes]      [Invoice Snapshots]      [Audit & Comm Logs]
  - SKU & Cat at date    - orderNotes ("Free gift?")   - Prior revision texts   - Concierge WhatsApp
  - Was it wild SPS?     - adminNotes ("Warranty?")    - Original Subtotal      - Audit event records
```

### 2.1 The 11 Evidentiary Vectors
1. **Historical Product SKU / ID:** Is the item an exotic coral or wild-harvested marine fish known never to have a fixed retail price?
2. **Historical Pricing Configuration:** What was the product's catalogue status on the order creation date (from Git history / historical seed logs)?
3. **Product Category & Scientific Classification:** Corals (*Scleractinia*), wild angelfish (*Holacanthus*), and rare wrasses (*Cirrhilabrus*) require quarantine valuation; standard dry goods and dry salt mix do not.
4. **Order Item Stored Metadata:** Did `item.priceOnRequest` or `item.pricingStatus` exist in the document?
5. **Item Quantity:** Is it single specimen (`qty: 1`) or bulk accessory (`qty: 50`)?
6. **Order Creation Timestamp:** Does the date precede the introduction of the modern POR cart schema?
7. **Order Level Totals & History:** Did the overall order have a non-zero subtotal, indicating that this specific line item was an add-on?
8. **Historical Invoice Revisions:** Do existing revision snapshots (`order.invoiceRevisions`) explain the item's valuation?
9. **Order Notes & Internal Comments:** Does `orderNotes` contain phrases like *"Customer will confirm coral price"* vs *"Complimentary sample"*?
10. **Customer Communication Records:** Are there verified WhatsApp chats discussing agreed prices?
11. **Tamper-Evident Audit Logs:** Does `AuditLog` contain records of previous admin updates?

---

## 3. THE SIX CLASSIFICATION OUTCOMES

Every examined line item must be assigned to one of six mutually exclusive categories:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CLASSIFICATION DECISION TAXONOMY                     │
├───────────────────────────────┬────────────┬───────────────────────────┤
│ Category Code                 │ Confidence │ Required Action           │
├───────────────────────────────┼────────────┼───────────────────────────┤
│ CONFIRMED_POR                 │ 90% – 100% │ Ready for Concierge Quote │
│ LIKELY_POR                    │ 70% – 89%  │ Requires Staff Validation │
│ CONFIRMED_STANDARD            │ 95% – 100% │ Re-apply Historical Price │
│ CONFIRMED_FREE_OR_PROMOTIONAL │ 90% – 100% │ Mark Intentionally Free   │
│ AMBIGUOUS_REQUIRES_REVIEW     │ < 70%      │ Manual Concierge Queue    │
│ DATA_INTEGRITY_EXCEPTION      │ Inconsistent│ Technical Data Audit     │
└───────────────────────────────┴────────────┴───────────────────────────┘
```

### 3.1 Category Definitions & Criteria

1. **`CONFIRMED_POR`:**
   - **Criteria:** Item is confirmed marine life (coral/exotic specimen); historical catalogue confirms `priceOnRequest: true` on that date; total order amount is ₹0 or item notes explicitly request quotation; customer records confirm price was discussed.
   - **Action:** Flag `pricingStatus: 'PENDING_POR'`; surface in Sales Queue for agreed quotation entry.

2. **`LIKELY_POR`:**
   - **Criteria:** Item is an ultra-grade coral or rare marine specimen; item price is ₹0; catalogue history indicates it was frequently POR, but order notes are silent.
   - **Action:** Flag for manual verification; staff must confirm with customer records before opening quotation input.

3. **`CONFIRMED_STANDARD`:**
   - **Criteria:** Item is standard equipment (e.g. ReefWave pump, Nyos skimmer, salt bucket) that has always possessed an immutable MRP; was entered as ₹0 due to cart checkout data stripping.
   - **Action:** Flag as standard; propose restoring the validated historical catalogue price; requires manager sign-off.

4. **`CONFIRMED_FREE_OR_PROMOTIONAL`:**
   - **Criteria:** Order notes or admin history explicitly state *"Free promotional item"*, *"Sample"*, or *"Warranty replacement for DOA specimen"*. Or item is a known zero-value collateral item (e.g. acclimation guide).
   - **Action:** Retain `price: 0`; set `pricingStatus: 'PROMOTIONAL_FREE'`; mark `hasUnresolvedPorItems: false`.

5. **`AMBIGUOUS_REQUIRES_REVIEW`:**
   - **Criteria:** Conflicting evidence (e.g., standard equipment marked ₹0 on an order with ₹0 total, but no notes exist); or customer records cannot be located.
   - **Action:** Enters dedicated Human Review Queue. **Zero automatic price inference permitted.**

6. **`DATA_INTEGRITY_EXCEPTION`:**
   - **Criteria:** Order document contains severe structural corruption (e.g. negative quantities, missing product ID, corrupted string types, orphan item arrays).
   - **Action:** Locked from public and sales processing; escalated to Senior System Architect.

---

## 4. DEFENSIBLE CONFIDENCE SCORING METHODOLOGY

Confidence is calculated as an objective weighted score ($S \in [0, 100]$):

$$S = \sum_{i=1}^{n} w_i \cdot c_i$$

| Vector ID | Evidentiary Vector | Weight ($w_i$) | Scoring Condition ($c_i \in \{0, 0.5, 1.0\}$) |
|---|---|---|---|
| **$V_1$** | Historical Catalogue Status | 30 | 1.0 = Catalogue confirmed POR at timestamp; 0.5 = Ambiguous; 0.0 = Standard |
| **$V_2$** | Biological Specimen Verification | 25 | 1.0 = Wild coral / rare livestock; 0.5 = Captive bred; 0.0 = Dry goods equipment |
| **$V_3$** | Customer / Admin Notes Text | 20 | 1.0 = Explicit notes ("POR Quote"); 0.0 = Silent or contradictory |
| **$V_4$** | Stored Schema Flags | 15 | 1.0 = Item stored with `priceOnRequest: true`; 0.0 = Flag missing |
| **$V_5$** | Customer WhatsApp History | 10 | 1.0 = WhatsApp negotiation found; 0.0 = No chat logs available |

### Threshold Evaluation:
- **$S \ge 90$:** `CONFIRMED_POR` (Direct Concierge Queue)
- **$70 \le S < 90$:** `LIKELY_POR` (Staff Confirmation Required)
- **$S < 70$:** `AMBIGUOUS_REQUIRES_REVIEW` (Manual Investigation Queue)

---

## 5. INVESTIGATION OF SPECIFIC HISTORICAL ORDERS

We outline the specific investigation protocol for historical records identified in the audit:

### 5.1 Order `MC-740020EJ` (Debabrata Halder — Kolkata)
- **Items:** `rainbow-chalice-coral` (Qty: 1), `acropora-tenuis-ultra` (Qty: 1).
- **Evidence Inspection:**
  - $V_1$ (Catalogue): Both items are ultra-grade wild SPS corals defined with `priceOnRequest: true` in `lib/data/marine-life.ts`. Score: 30.
  - $V_2$ (Biological): Verified *Echinophyllia* and *Acropora* specimens requiring species-specific quarantine conditioning. Score: 25.
  - $V_3$ (Notes): Order notes mention *"Please confirm coral health and dipping before delivery"*. Score: 20.
  - $V_4$ (Stored Flags): `priceOnRequest` was stripped by `OrderContext.tsx` bug. Score: 0.
  - $V_5$ (Comm): WhatsApp outbound template referenced "Price on Request (Quarantine/Specimen Confirmation)". Score: 10.
- **Calculated Score:** $S = 30 + 25 + 20 + 0 + 10 = 85$ (`LIKELY_POR`).
- **Protocol:** Enters Concierge Validation Queue. Concierge inspects WhatsApp chat with Debabrata Halder; confirms whether price was quoted; upon confirmation, shifts to `CONFIRMED_POR`.

### 5.2 Order `MC-429334LH` (Subhashis Mukherjee — Salt Lake)
- **Items:** `japanese-deepwater-zoanthids` (Qty: 2).
- **Evidence Inspection:** Rare zoanthid morph with zero static pricing. Total order amount ₹0.
- **Protocol:** Diagnostic classifier evaluates historical Git commit timestamps to establish whether this zoanthid morph ever had a standard retail price.

### 5.3 Order `MC-990152L4` (Walk-In Booking)
- **Items:** Mixed accessories and livestock.
- **Protocol:** Classify line-by-line. If dry goods accessories have ₹0 price, check if they were complimentary promotional items before assuming POR.

### 5.4 Order `MC-8921` (Rahul Verma — Bengaluru)
- **Items:** `designer-clownfish-pair` (₹14,999).
- **Evidence Inspection:** Clean standard order. Non-zero stored price.
- **Protocol:** Classified as `CONFIRMED_STANDARD`. **Zero modifications to prices or metadata.**

---

## 6. HUMAN REVIEW WORKFLOW & CONCIERGE INTERFACE

Ambiguous and likely records must be resolved through an interactive Control OS interface:

```
┌────────────────────────────────────────────────────────────────────────┐
│             CONTROL OS: HISTORICAL ORDER RECONCILIATION                │
├────────────────────────────────────────────────────────────────────────┤
│ Order Reference: MC-740020EJ                Customer: Debabrata Halder │
│ Creation Date: 05 Nov 2026, 11:30 PM        Order Total: ₹0            │
├────────────────────────────────────────────────────────────────────────┤
│ Line Item: Rainbow Chalice Coral (Ultra Grade)                         │
│ Diagnostic Score: 85/100 [LIKELY_POR]                                  │
│ Evidentiary Basis: Wild SPS Coral • Historical Catalog POR • Live Spec │
├────────────────────────────────────────────────────────────────────────┤
│ Concierge Action:                                                      │
│  ( ) Confirm as Genuine Price-on-Request Specimen                      │
│  ( ) Mark as Complimentary / Promotional Gift (Retain ₹0)              │
│  ( ) Mark as Standard-Priced Item (Restore Catalogue Price)            │
│  ( ) Flag Data Integrity Exception (Escalate to Owner)                 │
│                                                                        │
│ Mandatory Justification Note:                                          │
│ [ Verified with customer via WhatsApp chat on Nov 6; agreed quote.   ] │
│                                                                        │
│ Supporting Document Reference (Optional): [ WA-MSG-983002            ] │
│                                                                        │
│ [ Confirm Classification & Move to Quotation Queue ]   [ Cancel ]      │
└────────────────────────────────────────────────────────────────────────┘
```

**Strict Prohibition:** The concierge interface does **NOT** accept or ask for an agreed price during classification. Classification only determines the item's *nature* (POR vs Standard vs Free). Pricing is an independent subsequent business event.

