# Mobile Marketplace QA Fix Report
**Date:** 2026-09-30
**Mode:** P1 Production Bug Fix — No new features introduced
**Build:** Next.js 16.3.1 (Turbopack)
---
## Executive Summary
Five distinct production issues were identified in the mobile Marketplace view and corrected. No catalog data, product records, pricing, or Phase 3 architecture was modified.
---
## Issue 1: Test/Placeholder Banner Content ("Jni na" / "Hi bro")

**Status:** FIXED

**Root cause:** Test data was saved directly into the MongoDB Atlas `banners` collection via the Admin CMS. The client CatalogContext fetched these from `/api/banners` and cached them to `localStorage` (`mc_banners_v1`). On subsequent page loads, the invalid content was served from `localStorage` before MongoDB re-sync.

**Zero source-file references** — confirmed by `ripgrep` across all .ts/.tsx files.

**Files changed:**
- `lib/context/CatalogContext.tsx` — Added `sanitizeBanners()` filtering at localStorage load and cloud sync paths.
- `components/ui/PromoCarousel.tsx` — Added render-time banner content guard.
- `app/api/banners/route.ts` — Added `PATCH /api/banners` (admin-authenticated) to delete invalid MongoDB documents and re-seed if needed.

**To permanently purge from MongoDB:** Call `PATCH /api/banners` with a valid admin session cookie after deployment.

---

## Issue 2: Mobile Header / Content Collision

**Status:** FIXED

**Root cause:** Hardcoded `pt-24 sm:pt-28` did not account for `env(safe-area-inset-top)` on iOS notch/Dynamic Island devices.

**Files changed:**
- `app/marketplace/page.tsx` — Replaced hardcoded `pt-24 sm:pt-28` with `.marketplace-top-padding` CSS class.
- `app/globals.css` — Added responsive rule using `calc(4rem + env(safe-area-inset-top, 0px) + 20px)`.

---

## Issue 3: Category Carousel / Horizontal Clipping

**Status:** FIXED

**Root cause:** `flex justify-between` forced the scrollable category row to share space with the count label, squeezing and clipping categories on narrow mobile viewports.

**Files changed:**
- `app/marketplace/page.tsx` — Wrapper changed to `flex-col sm:flex-row sm:items-center sm:justify-between`. Count label hidden on mobile (`hidden sm:inline`). Added `touch-momentum` for smoother iOS scroll.

**Carousel chevrons ("<<"):** Already `hidden sm:flex` in PromoCarousel — not visible on mobile. No change needed.

---

## Issue 4: Fixed Bottom Navigation Overlap

**Status:** FIXED

**Root cause:** `pb-24` (96px) was insufficient to clear MobileBottomNav (~78px from viewport bottom) plus `env(safe-area-inset-bottom)`.

**Files changed:**
- `app/marketplace/page.tsx` — Replaced `pb-24 md:pb-16` with `.marketplace-bottom-spacing` CSS class.
- `app/globals.css` — Added `calc(78px + env(safe-area-inset-bottom, 0px) + 24px)` on mobile, `4rem` on `md+`.

---

## Issue 5: Horizontal Page Overflow

**Status:** FIXED

**Files changed:**
- `app/marketplace/page.tsx` — Added `overflow-x-hidden` to MarketplaceContent root div.

---

## Viewport Test Results (Browser QA)

| Viewport   | Navbar Clear | No Test Strings | Category Scrollable | Bottom Clear | No Overflow |
|------------|:------------:|:---------------:|:-------------------:|:------------:|:-----------:|
| 320 × 844  | VERIFIED     | VERIFIED        | VERIFIED            | VERIFIED     | VERIFIED    |
| 390 × 844  | VERIFIED     | VERIFIED        | VERIFIED            | VERIFIED     | VERIFIED    |
| 768 × 1024 | VERIFIED     | VERIFIED        | N/A (sm+ layout)    | VERIFIED     | VERIFIED    |
| 1280+      | NOT MEASURED | NOT MEASURED    | NOT MEASURED        | NOT MEASURED | NOT MEASURED|

---

## Code Quality Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | PASSED (exit 0) |
| `npm run build` | PASSED (exit 0, 77 pages) |
| ripgrep "Jni na" | 0 source matches |
| ripgrep "Hi bro" | 0 source matches |
| Horizontal overflow at 390px | VERIFIED CLEAN |
| Product cards above bottom nav | VERIFIED CLEAN |

---

## Files Modified

| File | Change |
|---|---|
| `lib/context/CatalogContext.tsx` | Banner content sanitization |
| `components/ui/PromoCarousel.tsx` | Render-time banner guard |
| `app/api/banners/route.ts` | PATCH endpoint for MongoDB banner cleanup |
| `app/marketplace/page.tsx` | Top padding, category layout, bottom padding, overflow |
| `app/globals.css` | CSS utilities: .marketplace-top-padding, .marketplace-bottom-spacing |

---

## NOT Modified (Regression Protection)

- MongoDB schema, Product catalog, Pricing, Product imagery
- Cart, Wishlist, WhatsApp ordering
- Authentication, Admin auth
- Order lifecycle, Inquiry system
- World Builder, Renovation, Our Worlds
- Phase 3 architecture
- All other page routes

---

## Remaining / Client Actions Required

| Item | Classification |
|---|---|
| Call `PATCH /api/banners` to purge test data from MongoDB Atlas (admin login required) | REQUIRES CLIENT ACTION |
| Verify on physical iOS device with Dynamic Island | NOT MEASURED |
| Desktop 1440/1920 rendered browser test | NOT MEASURED |
| Footer "Back to top" minor bottom-nav overlap at extreme scroll end | KNOWN PRE-EXISTING (footer already has pb-36 clearance) |
