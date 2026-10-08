# PRODUCTION DATABASE TEST DATA & RECORD REVIEW
**Document:** `docs/PRODUCTION_TEST_DATA_REVIEW.md`  
**Classification:** Forensic Database Integrity Audit / Zero Unauthorized Data Loss Policy  
**Cluster:** MongoDB Atlas Production Cluster (`Cluster0` / `marine_creatures`)  
**Auditor:** Senior Security Engineer & Release Engineer  
**Date:** October 9, 2026  

---

## 1. Executive Summary & Policy Enactment

During the final production readiness audit, several development-era orders, inquiries, and demo records were identified within the live MongoDB Atlas database.

### Absolute Release Engineering Policy:
> **ZERO UNAUTHORIZED DATA LOSS.**  
> Under no circumstances may any order, inquiry, or customer record be deleted or modified in the production database without explicit, written confirmation and approval from the client / stakeholder (`Suraj Shasmal` / `Marine Creatures Management`).

This document provides a forensic record-by-record analysis, relationship trace, and risk classification for every record identified in MongoDB Atlas.

---

## 2. Forensic Analysis of Orders Collection

The live database currently contains **12 total order records**. Each record has been evaluated across timestamp, customer identity, payment amount, order notes, and relationship references:

| Order ID | Customer Name | Phone | City / Delivery Address | Total Amount | Status / Step | Created At | Order Notes / Identifiers | Forensic Classification | Recommended Client Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`MC-8921`** | Rahul Verma | `9876543210` | Flat 402, Coral Heights, Indiranagar, Bengaluru | ₹14,999 | `dispatched` (Approved) | 2026-09-07 10:15 AM | AWB: `BLR-AIR-892144`<br>Invoice: `INV-MC-8921` | **LIKELY TEST DATA** (Initial Seed Demo) | Client to confirm if historical demo order should be archived prior to launch. |
| **`MC-8922`** | Dr. Ananya Sen | `9830112233` | Villa 14, Silver Oak Estate, New Town, Kolkata | ₹18,500 | `delivered` (Approved) | 2026-09-08 09:00 AM | Note: *"Please ring the bell twice and place directly in shade."*<br>Invoice: `INV-MC-8922` | **LIKELY TEST DATA** (Initial Seed Demo) | Client to confirm if historical demo order should be archived prior to launch. |
| **`MC-967327GB`** | Aritya Saha | `7890983925` | Nazrul Sarani, mathkal pump house, Kolkata (700065) | ₹39,998 | `placed` (Unapproved) | Fri Sep 11 2026 05:19:27 GMT | Cart checkout validation order | **CONFIRMED TEST DATA** (Developer Checkout Test) | Recommend client archive after launch approval. |
| **`MC-34848987`** | Aritya Saha | `7890983925` | Nazrul Sarani, mathkal pump house, Kolkata (700065) | ₹32,498 | `placed` (Unapproved) | Tue Sep 15 2026 05:15:49 GMT | Order Note: **`"Jni na"`** *(Bengali: "I don't know")* | **CONFIRMED TEST DATA** (Developer Test with informal note) | Recommend client archive prior to launch. |
| **`MC-57044654`** | ARITYA SAHA | `7890983925` | NAZRUL SARANI MATHKAL, RABINDRA NAGAR (700065) | ₹74,999 | `placed` (Unapproved) | Tue Sep 15 2026 05:52:51 GMT | Single high-value item test | **CONFIRMED TEST DATA** (Developer Checkout Test) | Recommend client archive prior to launch. |
| **`MC-60016409`** | ARITYA SAHA | `7890983925` | NAZRUL SARANI MATHKAL, RABINDRA NAGAR (700065) | ₹158,532 | `placed` (Unapproved) | Tue Sep 15 2026 05:53:25 GMT | Multi-item basket stress test (7 items) | **CONFIRMED TEST DATA** (Developer Cart Capacity Test) | Recommend client archive prior to launch. |
| **`MC-201079CT`** | Aritya Saha | `7890983925` | Nazrul Sarani, mathkal pump house, Kolkata (700065) | ₹14,999 | `placed` (Unapproved) | Wed Sep 16 2026 04:33:22 GMT | Clownfish pair order test | **CONFIRMED TEST DATA** (Developer Checkout Test) | Recommend client archive prior to launch. |
| **`MC-914048AU`** | Suraj | `9330436603` | 29 pc mitra road, North 24 pgs, Kolkata (700079) | ₹19,999 | `placed` (Unapproved) | Wed Sep 16 2026 13:21:55 GMT | Founder / Client phone number and address | **POSSIBLY REAL / REQUIRES CLIENT CONFIRMATION** | **DO NOT DELETE**. Represents founder/client test or real order. Requires Suraj's confirmation. |
| **`MC-949109S3`** | gfsteng | `1234567890` | ggjhgjh, ghgjghh (pincode: gfgfgf) | ₹8,999 | `placed` (Unapproved) | Thu Sep 24 2026 06:50:54 GMT | Order Note: **`"gytghfghdfdg"`** (Keyboard mash) | **CONFIRMED TEST DATA** (Synthetic Input Validation Test) | Recommend client archive prior to launch. |
| **`MC-69452464`** | ARITYA SAHA | `7890983925` | NAZRUL SARANI MATHKAL, RABINDRA NAGAR (700065) | ₹163,998 | `placed` (Unapproved) | Fri Sep 25 2026 15:05:09 GMT | High-value tank package order test | **CONFIRMED TEST DATA** (Developer Checkout Test) | Recommend client archive prior to launch. |
| **`MC-990152L4`** | Aritya Saha | `7890983925` | Nazrul Sarani, mathkal pump house, Kolkata (700065) | ₹0 | `placed` (Unapproved) | Mon Oct 05 2026 05:59:51 GMT | Zero-amount edge case test | **CONFIRMED TEST DATA** (Edge Case Test Order) | Recommend client archive prior to launch. |
| **`MC-611716YH`** | Aritya Saha | `7890983925` | Nazrul Sarani, mathkal pump house, Kolkata (700065) | ₹1,450 | `placed` (Unapproved) | Wed Oct 07 2026 20:56:52 GMT | Recent low-value supplies test | **CONFIRMED TEST DATA** (Developer Checkout Test) | Recommend client archive prior to launch. |

---

## 3. Forensic Analysis of Inquiries Collection

The live database currently contains **3 total inquiry records**:

| Inquiry ID | Name | Phone | Service / Message | Created At | Status | Forensic Classification | Recommended Client Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`INQ-02005`** | Aritya Saha | `7890983928` | Custom Aquarium Concierge | 8 Sept, 12:33 pm | `new` | **LIKELY TEST DATA** | Client to review and confirm whether to retain as lead. |
| **`INQ-41441`** | hgvjym | `7890983925` | Vision: `"44skud,ujfcufu"` (Keyboard mash) | 16 Sept, 11:57 am | `new` | **CONFIRMED TEST DATA** | Recommend client archive prior to launch. |
| **`INQ-87027`** | Aritya Saha | `7890983925` | Aquarium Consultation | 16 Sept, 12:33 pm | `new` | **LIKELY TEST DATA** | Client to review and confirm whether to retain as lead. |

---

## 4. Relationship & Integrity Tracing

- **Audit Logs:** Audit logging currently tracks operations performed in the Control OS. None of these legacy orders cause orphaned foreign keys or audit trail corruption.
- **Invoices:** Invoices for `MC-8921` (`INV-MC-8921`) and `MC-8922` (`INV-MC-8922`) are referenced in demo links.
- **Customers Collection:** Current count in `customers` collection is 0 (customers are derived dynamically from orders and inquiries in Customer 360 view). Archiving or removing test orders will cleanly update the Customer 360 dashboard without residual ghost entities.

---

## 5. Client Archival & Cleanup Protocol

When client approval is granted, records should **NOT** be permanently dropped with raw MongoDB commands (`db.orders.drop()`). Instead, the recommended operational workflow is:

1. **Option A (Control OS Admin UI):**  
   Log in to `/admin` -> Navigate to **Orders** tab -> Locate test order -> Click **Delete** or **Archive**. The authenticated API executes `OrderModel.deleteOne({ id })` with full audit logging.
2. **Option B (Safe Script with Atlas Snapshot Guard):**  
   Take an on-demand Atlas snapshot prior to running any targeted archive script. Run an authenticated script that moves records to an `orders_archive` collection rather than hard deleting.

---

## 6. Current Audit Verdict on Test Data

* **Current Status:** `HELD IN PLACE — PENDING EXPLICIT CLIENT CONFIRMATION`
* **Zero unauthorized mutations performed.**
* **Security & privacy impact mitigated:** With the closure of `SEC-P0-01`, these records can no longer be scraped or enumerated over the public internet.
