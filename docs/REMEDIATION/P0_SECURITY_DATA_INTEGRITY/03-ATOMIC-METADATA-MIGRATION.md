# MARINE CREATURES — P0 REMEDIATION SPECIFICATION
## REVISION C: ATOMIC, IDEMPOTENT & REVERSIBLE METADATA MIGRATION FRAMEWORK

**Document ID:** `MC-SPEC-REV-C-003`  
**Date:** November 6, 2026  
**Auditor / Principal Database Engineer:** Principal Enterprise Architect, AppSec & Systems Auditor  
**Scope:** Controlled Database Migration, Before-Image Manifests, Optimistic Locking & Safe Rollback  
**Mode:** READ-ONLY SPECIFICATION — ZERO SCRIPT EXECUTION / NO MIGRATIONS RUN  

---

## 1. ARCHITECTURAL PROBLEM STATEMENT

Updating order metadata across a live e-commerce database is fraught with catastrophic operational risks:
1. **Crash During Mid-Execution (Partial Write):** If a migration script updates 10 out of 50 documents and crashes, the database is left in a bifurcated, half-migrated state with zero record of what succeeded.
2. **Duplicate Run Hazard (Non-Idempotency):** If an operator runs the script twice, it must not increment versions twice, create duplicate audit log entries, or overwrite manual changes.
3. **Concurrent Administrative Writes:** If a store manager updates shipping details on order `MC-740020EJ` while a script executes, a blind `$set` could wipe out the manager's changes.
4. **Unintended Field Overwrites:** A broad `OrderModel.updateOne({ id }, { ...payload })` can wipe out unmapped fields, customer addresses, or custom tracking notes.
5. **Irreversible Mutations:** Applying database changes without a structured, immutable before-image prevents instant recovery if an unexpected bug emerges.

---

## 2. THE FIVE PILLARS OF CONTROLLED MIGRATION

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MIGRATION CONTROL ARCHITECTURE                    │
├───────────────────┬────────────────────────────────────────────────────┤
│ Pillar            │ Technical Implementation                           │
├───────────────────┼────────────────────────────────────────────────────┤
│ 1. Dry-Run First  │ Default mode is strictly read-only; requires       │
│                   │ explicit `--commit` flag for database writes.      │
│ 2. Before-Image   │ Full immutable snapshot of affected documents is   │
│                   │ encrypted & stored in a migration manifest before. │
│ 3. Atomicity      │ Multi-document ACID transactions where supported;   │
│                   │ atomic document-level `$set` with version check.   │
│ 4. Idempotency    │ Migration state tracking via `migrations` collection│
│                   │ and document version guards.                       │
│ 5. Safe Rollback  │ Automated rollback verifying document has not been │
│                   │ modified post-migration before restoring fields.   │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 3. CLI SPECIFICATION: DRY-RUN BY DEFAULT

The migration runner ([`marine-creatures/scripts/reconcile-por-metadata.mjs`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/scripts/reconcile-por-metadata.mjs)) must enforce safe CLI ergonomics:

### 3.1 Invocation Syntax
```bash
# 1. Default Read-Only Dry Run (Safe to run anywhere, anytime)
node scripts/reconcile-por-metadata.mjs --dry-run

# 2. Targeted Dry Run for Specific Order
node scripts/reconcile-por-metadata.mjs --dry-run --order=MC-740020EJ

# 3. Explicit Commit Execution (Requires Operator Identity & Reason)
node scripts/reconcile-por-metadata.mjs --commit --operator="Founder (Debabrata)" --reason="P0 Metadata Reconciliation"

# 4. Safe Rollback Execution (Requires Migration ID)
node scripts/reconcile-por-metadata.mjs --rollback --migration-id="MIG-20261106-01" --operator="Founder (Debabrata)"
```

### 3.2 Dry-Run Safety Contract
When executed with `--dry-run` (or without `--commit`):
- Connects using a read-only MongoDB user session (or enforces `readPreference: 'secondary'`).
- Loads candidate orders.
- Evaluates the 11-vector evidence scoring model.
- Generates a local diagnostic report: `docs/REMEDIATION/reports/migration-dryrun-[timestamp].json`.
- Prints a colorized diff showing the **exact fields that would change**:
  ```diff
  Order MC-740020EJ:
    [Line 0: Rainbow Chalice Coral]
  -   pricingStatus: "STANDARD"
  +   pricingStatus: "PENDING_POR"
  -   priceOnRequest: false
  +   priceOnRequest: true
  -   hasUnresolvedPorItems: false
  +   hasUnresolvedPorItems: true
  +   reconciliationMigrationId: "MIG-20261106-01"
  ```
- **Zero database writes. Zero audit log writes. Zero customer token mutations.**

---

## 4. MIGRATION MANIFEST & BEFORE-IMAGE SCHEMA

Before modifying any document, the migration creates an immutable manifest record stored in a dedicated MongoDB collection `_schema_migrations` and persisted to an encrypted local backup file:

```json
{
  "migrationId": "MIG-20261106-01",
  "migrationName": "reconcile_historical_por_metadata",
  "version": 1,
  "executedAt": "2026-11-06T02:00:00.000Z",
  "gitCommit": "ffd220da7586e557c1a176448afdc2c691486265",
  "operator": "Founder (Debabrata)",
  "reason": "P0 Health Audit Remediation: Evidence-Based POR Flagging",
  "status": "IN_PROGRESS",
  "targetOrdersCount": 2,
  "records": [
    {
      "orderId": "MC-740020EJ",
      "preMigrationVersion": 1,
      "classificationResult": "CONFIRMED_POR",
      "confidenceScore": 85,
      "evidenceSummary": "Wild SPS Coral; Historical Catalog POR; WhatsApp Specimen Quote",
      "beforeImage": {
        "hasUnresolvedPorItems": false,
        "pricingStatus": "STANDARD",
        "items": [
          {
            "id": "rainbow-chalice-coral",
            "price": 0,
            "pricingStatus": "STANDARD",
            "priceOnRequest": false
          }
        ]
      },
      "proposedModifications": {
        "hasUnresolvedPorItems": true,
        "pricingStatus": "PRICE_ON_REQUEST",
        "items.0.pricingStatus": "PENDING_POR",
        "items.0.priceOnRequest": true
      },
      "appliedAt": null,
      "rollbackStatus": "NOT_ROLLED_BACK"
    }
  ]
}
```

> [!NOTE]
> **Data Privacy in Manifests:** Before-images store **only** the pricing, status, and item identifiers being reconciled. Customer addresses, credit card hashes, and private personal notes are omitted from diagnostic manifests to comply with data privacy policies.

---

## 5. ATOMICITY & OPTIMISTIC CONCURRENCY CONTROLS

### 5.1 MongoDB Transaction Protocol (Replica Set / Atlas)
When running against MongoDB Atlas:
1. Start an ACID Client Session: `const session = client.startSession(); session.startTransaction();`
2. Perform targeted, item-level `$set` operations using MongoDB array filters:
   ```javascript
   const res = await OrderModel.updateOne(
     {
       _id: record.orderId,
       version: record.preMigrationVersion, // Optimistic Concurrency Guard
       'items.id': record.itemId,
     },
     {
       $set: {
         hasUnresolvedPorItems: true,
         pricingStatus: 'PRICE_ON_REQUEST',
         'items.$[itemElem].pricingStatus': 'PENDING_POR',
         'items.$[itemElem].priceOnRequest': true,
         lastReconciledAt: new Date().toISOString(),
         reconciliationMigrationId: migrationId,
       },
       $inc: { version: 1 }, // Increment optimistic lock version
     },
     {
       arrayFilters: [{ 'itemElem.id': record.itemId }],
       session,
     }
   );

   if (res.matchedCount === 0) {
     throw new Error(`Write conflict: Order ${record.orderId} was modified by another process. Aborting transaction.`);
   }
   ```
3. Commit transaction atomically: `await session.commitTransaction();`
4. If any order encounters a write conflict, the entire transaction rolls back automatically, leaving the database 100% clean.

### 5.2 Safe Fallback Protocol (Standalone / Non-Replica Set)
If transactions are unavailable (e.g. local standalone development instances):
- Execute atomic document-level conditional updates (`version: currentVersion`).
- If a document update fails, record the failure in the manifest and halt further processing.
- Provide an automated undo routine for already-modified documents.

---

## 6. IDEMPOTENCY & RESUMPTION RULES

The migration script must be safe to execute repeatedly without duplicating side-effects:

1. **State Checking:** Before processing an order, check if `reconciliationMigrationId === migrationId` or if `hasUnresolvedPorItems === true && items[n].pricingStatus === 'PENDING_POR'`. If already updated, log `SKIPPED_ALREADY_MIGRATED` and advance.
2. **Crash Resumption:** If an interrupted migration is re-run with the same `--migration-id`, the script loads the existing manifest, checks which records are marked `appliedAt: null`, and resumes processing only the remaining pending records.
3. **Audit Log Deduplication:** Audit events are created using a deterministic idempotent key:
   `dedupKey: migration_${migrationId}_order_${orderId}`. MongoDB unique index prevents duplicate audit records.

---

## 7. AUTOMATED ROLLBACK PROTOCOL

If post-migration testing uncovers an issue, the operator executes:
`node scripts/reconcile-por-metadata.mjs --rollback --migration-id=MIG-20261106-01`

### 7.1 Pre-Rollback Safety Checks
Before reverting any order, the rollback engine performs two strict validations:
1. **Migration Provenance Check:** Asserts that `order.reconciliationMigrationId === migrationId`.
2. **Subsequent Modification Guard:** Asserts that `order.version === preMigrationVersion + 1`.
   - **If `version > preMigrationVersion + 1`:** A store manager or customer has legitimately modified this order after the migration!  
     **AUTOMATIC ROLLBACK STOPS IMMEDIATELY.**  
     The system flags the record as `ROLLBACK_CONFLICT_MANUAL_REVIEW_REQUIRED` and refuses to overwrite subsequent business changes.

### 7.2 Safe Reversion Execution
For un-conflicted records:
- Restores the exact `beforeImage` fields stored in the manifest.
- Sets `reconciliationMigrationId: null`.
- Increments `version`.
- Logs an audit event: `MIGRATION_ROLLED_BACK`.
- Updates the migration manifest status to `ROLLED_BACK`.

