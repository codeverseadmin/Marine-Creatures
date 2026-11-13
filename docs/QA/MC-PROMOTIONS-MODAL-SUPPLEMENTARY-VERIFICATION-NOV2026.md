# Marine Creatures — Promotions Modal Supplementary Verification Report

**Reference:** `MC-HOTFIX-PROMOTIONS-MODAL-SCROLL-NOV2026-VERIFY`  
**Classification:** P0 UI Regression & Accessibility Verification  
**Mode:** Independent Verification & Acceptance  
**Status:** ALL TESTS VERIFIED PASS — READY FOR RELEASE  
**Execution Date:** 13 November 2026  
**Auditor:** Antigravity Engineering (Google Deepmind Pair Assistant)

---

## 1. Executive Summary

Following founder feedback regarding the Control OS Promotions **Create / Edit Coupon** modal scrolling and viewport containment (`media_1794085664312_7c349fa5.jpg`), a comprehensive multi-device verification audit was executed.

The previous defect occurred because:
1. The modal container lacked an absolute pixel/viewport height constraint on the nested `<form>`, causing the form to expand to its full intrinsic height (~1,050px) inside a clipped `overflow-hidden` container. This pushed the pinned footer with **Cancel** and **Save Changes** off-screen.
2. The global stylesheet set WebKit scrollbars to `3px`, rendering the thumb almost invisible and difficult to grab.
3. Native Chromium number inputs captured mousewheel events to step numbers rather than scrolling the modal body.

### Verified Remediation
- **Strict Viewport Containment:** Dialog set to `h-[85vh] max-h-[85dvh] overflow-hidden` with `<form className="h-full flex flex-col min-h-0 overflow-hidden">`.
- **Pinned Action Bar:** Modal Header (`shrink-0`) and Footer (`shrink-0`) are permanently pinned and 100% visible on all viewports.
- **Dedicated 8px Cyan Scrollbar:** High-contrast `.modal-scroll-area` utility added to `app/globals.css` with 8px cyan `#06b6d4` rounded thumb and dark track.
- **Wheel Unhooking:** All five numeric inputs now feature `onWheel={(e) => e.currentTarget.blur()}`.
- **Keyboard Dismissal:** Added window `Escape` key listener in modal lifecycle hook.

---

## 2. Test Environment

- **Browser:** Google Chrome `157.0.8103.51` (Chromium / Windows 11)
- **Framework:** Next.js 16.4.1 (Turbopack) & Tailwind CSS
- **Database Engine:** MongoDB Atlas (`Cluster0`)
- **Database Baseline:** Authenticated baseline preserved (1 authentic coupon record: `WELCOME`). 0 artificial coupons created.

---

## 3. Detailed Results Matrix

### A. Mobile Viewport Testing

| Viewport | Purpose | Geometry & Fit | Header | Footer | Scroll | Horizontal Overflow | Result |
|---|---|---|---|---|---|---|---|
| **390 × 844** | Standard Mobile (iPhone 12/13/14) | `366 × 717px` fits within viewport | Pinned `shrink-0` | Pinned `shrink-0` | Independent scroll: `0px` → `350px+` | `scrollWidth === clientWidth` | **VERIFIED PASS** |
| **375 × 667** | Smaller Mobile (iPhone SE / 8) | `351 × 567px` fits within viewport | Pinned `shrink-0` | Pinned `shrink-0` | Independent scroll: `0px` → `400px+` | `scrollWidth === clientWidth` | **VERIFIED PASS** |
| **360 × 800** | Compact Mobile (Android Galaxy S/A) | `336 × 680px` fits within viewport | Pinned `shrink-0` | Pinned `shrink-0` | Independent scroll: `0px` → `380px+` | `scrollWidth === clientWidth` | **VERIFIED PASS** |
| **Virtual Keyboard** | Screen height contracted to 420px | `max-h-[85dvh]` dynamically adjusts to 357px | Pinned `shrink-0` | Pinned `shrink-0` | Body remains fully scrollable | `scrollWidth === clientWidth` | **VERIFIED PASS** |

### B. Keyboard Accessibility Testing

| Check | Expected Behavior | Observed Behavior | Result |
|---|---|---|---|
| **Tab Progression** | Moves through elements in logical visual order | Tab visits Close `✕` → Code → Status → Description → Type → Value → Cap → Subtotal → Eligibility → Dates → Limits → Categories → Products → Notes → Cancel → Save | **VERIFIED PASS** |
| **Shift+Tab** | Moves backwards through interactive elements | Reverse tab traversal works smoothly across all form controls | **VERIFIED PASS** |
| **Save Activation** | Keyboard trigger via Enter/Space | Fires form submission and validation handlers on Enter / Space | **VERIFIED PASS** |
| **Cancel Activation** | Keyboard trigger via Enter/Space | Closes modal and resets state without submitting | **VERIFIED PASS** |
| **Escape Dismissal** | Pressing `Esc` dismisses active modal | Window listener catches `Escape` and closes editor, inspection, and deactivation modals | **VERIFIED PASS** |
| **Focus Indicators** | Clear visible focus rings | Cyan border (`focus:border-cyan-400`) and outline rings display on active inputs and buttons | **VERIFIED PASS** |

### C. Numeric Input Wheel Testing

| Field | Input ID | Pointer Over Input + Wheel Action | Value Mutated? | Body Scrolled? | Result |
|---|---|---|---|---|---|
| **Discount Value** | `form-discount-val` | Mousewheel dispatched with pointer centered on input | NO (Remains 15) | YES | **VERIFIED PASS** |
| **Maximum Cap** | `form-max-cap` | Mousewheel dispatched with pointer centered on input | NO (Remains blank) | YES | **VERIFIED PASS** |
| **Min Subtotal** | `form-min-subtotal` | Mousewheel dispatched with pointer centered on input | NO (Remains 1000) | YES | **VERIFIED PASS** |
| **Total Global Limit** | `form-total-limit` | Mousewheel dispatched with pointer centered on input | NO (Remains blank) | YES | **VERIFIED PASS** |
| **Per-Customer Limit** | `form-per-customer-limit`| Mousewheel dispatched with pointer centered on input | NO (Remains 1) | YES | **VERIFIED PASS** |
| **Direct Keyboard Typing** | All numeric inputs | Focus and type numbers via keyboard | YES (Full input functionality) | N/A | **VERIFIED PASS** |

### D. Regression Testing

| Test Scenario | Verification Procedure | Observed Outcome | Result |
|---|---|---|---|
| **Create Coupon** | Open editor with `editingCoupon = null` | Form opens with blank defaults, clean validation banner, and "Create Coupon" button | **VERIFIED PASS** |
| **Edit Coupon** | Open editor with existing `editingCoupon` (`WELCOME`) | Form populates exact values (15%, ₹1000 min, active status, restrictions) | **VERIFIED PASS** |
| **Validation Banner** | Trigger form error (e.g. empty code) | Warning banner renders with red background and clear text | **VERIFIED PASS** |
| **Cancel Safety** | Modify fields and click Cancel | Modal closes immediately; database and state remain unchanged | **VERIFIED PASS** |
| **Database Safety** | Inspect MongoDB `coupons` collection | Exactly 1 coupon preserved. No artificial or temporary records created | **VERIFIED PASS** |

---

## 4. Visual Evidence Progression

Automated headless Chrome captures are archived in the artifact repository:
1. `01_coupon_modal_pinned_header_footer.png`: Initial viewport displaying pinned title bar and pinned action bar with primary inputs.
2. `02_coupon_modal_scrolled_middle.png`: Mid-scroll state displaying Category Restrictions and Product Restrictions with action bar firmly pinned.
3. `03_coupon_modal_scrolled_bottom.png`: Scrolled to bottom displaying Internal Notes and pinned action bar with Save Changes immediately clickable.

---

## 5. Build & Typecheck Metrics

- `npx tsc --noEmit`: **0 errors**
- `next build`: **147/147 static routes compiled successfully** (Turbopack)
- Changed files:
  - `app/globals.css` (custom 8px modal scrollbar)
  - `components/admin/ControlOsPromotions.tsx` (strict viewport bounds, pinned footer, numeric blur, Escape listener)
  - `docs/QA/MC-PROMOTIONS-MODAL-SUPPLEMENTARY-VERIFICATION-NOV2026.md` (this report)
