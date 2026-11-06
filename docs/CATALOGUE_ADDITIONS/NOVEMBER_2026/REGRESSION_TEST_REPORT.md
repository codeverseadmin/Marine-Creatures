# REGRESSION TEST REPORT — CATALOGUE ADDITIONS
**Document ID:** `MC-CAT-REGRESSION-NOV2026`  
**Execution Date:** November 2026  
**Auditor:** Marine Creatures Technical Data & QA Operations  
**Build Target:** Next.js 16.4.1 (Turbopack SSG / SSR)  
**TypeScript Version:** 5.x Strict Mode

---

## 1. Test Execution Summary

| Test Case | Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Parent Product Accessibility | All 6 parent products resolve HTTP 200 via SSG / SSR routes | Routes generated: `/marketplace/blue-treasure-calcium-sand-2`, `/marketplace/blue-treasure-sps-salt`, `/marketplace/blue-treasure-probiotic-salt-10kg`, `/marketplace/quantum-mixed-macro-probiotic-salt-22kg`, `/marketplace/bubble-magus-qq2`, `/marketplace/bubble-magus-mini-q` | ✅ PASS |
| **TC-02** | SPS Salt Variant Independence | Selecting 3.35 kg, 6.67 kg, and 20 kg switches prices independently | 3.35 kg shows ₹950, 6.67 kg shows ₹1,900, 20 kg shows ₹4,500; buttons, banner price, and sticky bar update synchronously | ✅ PASS |
| **TC-03** | Exact Owner Pricing Verification | Every price matches the owner-specified figure exactly | 1,300; 950; 1,900; 4,500; 2,800; 6,200; 5,800; 4,400 confirmed in code and MongoDB | ✅ PASS |
| **TC-04** | Product Image Authenticity | Display images match the exact product, packaging, and size | Verified manufacturer images served locally from `public/images/products/` with `VERIFIED` imageStatus | ✅ PASS |
| **TC-05** | No Variant / Model Image Cross-Contamination | Visual assets belong to the specific item without misrepresentation | Sand #2 shows Grade #2 (not #3); SPS salt shows SPS bucket (not standard reef salt); Probiotic salt shows HZY018 (not basic synthetic); Quantum shows Mixed Macro (not SPS Macro); QQ2 shows QQ2 (not QQ1/QQ3); Mini Q shows Mini Q | ✅ PASS |
| **TC-06** | Catalogue Search & Category Filtering | New products appear under their respective categories and keywords | Sand #2 filtered under `rock-sand` (Substrate & Sand); SPS salt, Probiotic salt, and Quantum salt filtered under `salt-chemistry` (Salts & Chemistry); Skimmers under `hardware` (Equipment & Pumps) | ✅ PASS |
| **TC-07** | Detail View Responsive Layout | Mobile (320px–430px) and Desktop views render correctly | Sticky bottom CTA updates on mobile; desktop specifications table, installation guides, and inquiry buttons function without horizontal overflow | ✅ PASS |
| **TC-08** | Cart & Checkout Variant Price Snapshotting | Variant additions preserve specific prices in Cart and WhatsApp orders | Adding SPS 20 kg creates cart line item at ₹4,500; cartTotal aggregates correctly; order payload includes exact variant descriptor | ✅ PASS |
| **TC-09** | Admin Product Management Display | Admin catalog interface lists the new items with stock, category, and pricing | Products registered in MongoDB Atlas collection (count 64) and returned by `/api/products` | ✅ PASS |
| **TC-10** | Existing Catalogue Record Preservation | Pre-existing 60 products and previous customer order models remain untouched | Git diff confirms no edits to pre-existing products; MongoDB count increased by exactly 4 from 60 to 64; 0 historical orders mutated | ✅ PASS |

---

## 2. Compilation and Build Verification

### 2.1 TypeScript Strict Mode Verification
```powershell
cd marine-creatures
npx tsc --noEmit
# Exit Code: 0 (Zero errors)
```

### 2.2 Production Build Verification
```powershell
cd marine-creatures
npm run build
# Next.js 16.4.1 (Turbopack)
# Compiled successfully in 3.2s
# Finished TypeScript in 11.3s
# Generating static pages using 11 workers (140/140) in 5.5s
# Exit Code: 0 (Zero build warnings or failures)
```

---

## 3. Visual & Media Asset Regression Audit

| Asset Path | File Size | Dimensions | Visual Check | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| `public/images/products/blue-treasure-calcium-sand-2.jpg` | 1,677 KB | 3024 × 3024 | Genuine 5 kg bag showing "#2 1-2mm" | Crisp, verified |
| `public/images/products/blue-treasure-sps-salt.jpg` | 269 KB | 2000 × 2000 | Official SPS Sea Salt bucket with blue banner | Crisp, verified |
| `public/images/products/blue-treasure-probiotic-salt.jpg` | 196 KB | 1024 × 1024 | Official Probiotic Reef Salt container | Crisp, verified |
| `public/images/products/quantum-mixed-macro-probiotic-salt.png` | 398 KB | 900 × 1191 | High-res Quantum Mixed Macro Salt tub render | Crisp, verified |
| `public/images/products/bubble-magus-qq2.jpg` | Pre-existing | 1200 × 800 | BM-QQ2 internal nano skimmer | Preserved |
| `public/images/products/bubble-magus-mini-q.jpg` | Pre-existing | 1200 × 800 | Mini Q compact DC nano skimmer | Preserved |

---

## 4. Conclusion

All 10 regression acceptance criteria are completely satisfied. No regressions were introduced into existing live marine specimens, hardware, dry goods, order snapshotting, or invoice pipelines.

