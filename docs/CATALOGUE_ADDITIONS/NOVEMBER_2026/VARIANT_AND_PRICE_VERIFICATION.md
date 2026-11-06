# VARIANT AND PRICE VERIFICATION MATRIX
**Document ID:** `MC-CAT-VERIFY-NOV2026`  
**Date:** November 2026  
**Auditor:** Marine Creatures Technical Data & Catalogue Operations  
**Compliance Standard:** Owner-Supplied Price Enforcement & Variant Integrity

---

## 1. Owner Price Enforcement Summary

Every price in the Marine Creatures catalogue has been verified against the owner-authorised pricing directive. Competitor prices, placeholder numbers, and undocumented markups are strictly prohibited.

| Product Name | Category | Pack / Variant | Owner Price (INR) | Database & Code Price | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Blue Treasure Calcium Sand #2 — 5 kg** | `rock-sand` | 5 kg Bag | **₹1,300** | ₹1,300 | ✅ MATCH |
| **Blue Treasure SPS Sea Salt** | `salt-chemistry` | 3.35 kg Pack / Bucket | **₹950** | ₹950 | ✅ MATCH |
| **Blue Treasure SPS Sea Salt** | `salt-chemistry` | 6.67 kg (6.7 kg) Bucket | **₹1,900** | ₹1,900 | ✅ MATCH |
| **Blue Treasure SPS Sea Salt** | `salt-chemistry` | 20 kg Heavy Bucket | **₹4,500** | ₹4,500 | ✅ MATCH |
| **Blue Treasure Probiotic Reef Salt — 10 kg** | `salt-chemistry` | 10 kg Container (HZY018) | **₹2,800** | ₹2,800 | ✅ MATCH |
| **Quantum Mixed Macro Probiotic Salt — 22 kg** | `salt-chemistry` | 22 kg Tub (8 dKH) | **₹6,200** | ₹6,200 | ✅ MATCH |
| **Bubble Magus QQ2 Nano Protein Skimmer** | `hardware` | BM-QQ2 (Rock SP600) | **₹5,800** | ₹5,800 | ✅ MATCH (Preserved) |
| **Bubble Magus Mini Q Nano Protein Skimmer** | `hardware` | Mini Q (2W DC5V) | **₹4,400** | ₹4,400 | ✅ MATCH (Preserved) |

---

## 2. Multi-Variant Architecture & Price Resolution

### SPS Sea Salt Single Parent Architecture
The owner instructed:
> *"Create ONE parent product with THREE purchasable variants. Preserve the owner's 6.67 kg display preference if needed, but record the manufacturer-standard 6.7 kg specification accurately. Do not create duplicate parent products for the three sizes."*

#### Data Representation (`lib/data/products.ts` & `models/Product.ts`):
```typescript
{
  id: 'blue-treasure-sps-salt',
  name: 'Blue Treasure SPS Sea Salt',
  brand: 'Blue Treasure',
  price: 950, // Base / entry variant price
  variants: [
    {
      id: 'sps-salt-3-35kg',
      name: '3.35 kg Pack / Bucket',
      price: 950,
      specs: { Packaging: '3.35 kg', Price: '₹950', Formulation: 'Fast-dissolving synthetic SPS formula' },
      inStock: true,
    },
    {
      id: 'sps-salt-6-7kg',
      name: '6.67 kg (6.7 kg) Pack / Bucket',
      price: 1900,
      specs: { Packaging: '6.67 kg / 6.7 kg manufacturer spec', Price: '₹1,900', Formulation: 'Fast-dissolving synthetic SPS formula' },
      inStock: true,
    },
    {
      id: 'sps-salt-20kg',
      name: '20 kg Bucket',
      price: 4500,
      specs: { Packaging: '20 kg Bucket', Price: '₹4,500', Formulation: 'Fast-dissolving synthetic SPS formula' },
      inStock: true,
    },
  ],
}
```

### Storefront UI & Cart Price Traceability

1. **Product Card (`components/marketplace/ProductCard.tsx`):**
   - Displays base entry price: **₹950**.
   - Direct link routes to `/marketplace/blue-treasure-sps-salt`.

2. **Product Detail Page (`components/marketplace/ProductDetailView.tsx`):**
   - State: `selectedVariant` initializes to `'sps-salt-3-35kg'` (or query param).
   - Dynamic Price Calculation: `activePrice = selectedVariantObj?.price !== undefined ? selectedVariantObj.price : product.price`.
   - Selecting `3.35 kg` updates header, sticky bar, and Add-to-Bag button to **₹950**.
   - Selecting `6.67 kg (6.7 kg)` updates header, sticky bar, and Add-to-Bag button to **₹1,900**.
   - Selecting `20 kg` updates header, sticky bar, and Add-to-Bag button to **₹4,500**.
   - Variant selector pills explicitly show the variant price: `3.35 kg Pack / Bucket — ₹950`, `6.67 kg (6.7 kg) Pack / Bucket — ₹1,900`, `20 kg Bucket — ₹4,500`.

3. **Cart & Bag Context (`lib/context/CartContext.tsx`):**
   - When adding a variant with an explicit price, `handleAddToCart` generates a variant-scoped cart item:
     - `id`: `blue-treasure-sps-salt__sps-salt-6-7kg`
     - `name`: `Blue Treasure SPS Sea Salt — 6.67 kg (6.7 kg) Pack / Bucket`
     - `price`: `1900`
   - `resolveCanonicalCartProduct` guarantees that local storage hydration and cart updates reconcile back to the canonical parent product while preserving the exact variant price and variant name.
   - Customers can add both the 3.35 kg pack and the 20 kg bucket simultaneously; they remain distinct line items with independent quantities and accurate line-item subtotals.

4. **Cart Drawer & Checkout (`components/cart/CartDrawer.tsx`):**
   - Renders each variant as an independent line item with its full name and verified price.
   - Computes `cartTotal` correctly: $(1 \times 1,900) + (1 \times 4,500) = ₹6,400$.
   - WhatsApp order generation includes the variant name, quantity, and verified price snapshot in the message string and creates immutable order snapshots via `OrderContext`.

---

## 3. Existing Products Duplicate Verification & Preservation

Before inserting any products, the catalogue was searched for duplicates and conflicts:
- **`bubble-magus-qq2`**: Verified existing in repository (`lib/data/products.ts`, line 1445) and MongoDB Atlas. Selling price in database is already exactly **₹5,800**. Verified image `/images/products/bubble-magus-qq2.jpg` is active and correct. Record was preserved untouched.
- **`bubble-magus-mini-q`**: Verified existing in repository (`lib/data/products.ts`, line 1503) and MongoDB Atlas. Selling price in database is already exactly **₹4,400**. Verified image `/images/products/bubble-magus-mini-q.jpg` is active and correct. Record was preserved untouched.
- **`blue-treasure-coral-sand`**: Existing general aragonite sand listing at ₹1,400 with 4 mixed variants. Retained completely untouched to prevent breaking existing links, bookmarks, or order snapshots. The new owner-requested item `blue-treasure-calcium-sand-2` (Grade #2, 5 kg at ₹1,300) was created as a distinct, dedicated product line.

