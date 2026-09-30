# MARINE CREATURES
## CTO MASTER UX & DESIGN SYSTEM DOCUMENT
### ABYSSAL LUXURY — PREMIUM, READABLE, INTERACTIVE, FAST

**Document Reference:** `MC-UX-CTO-2026-V2`  
**Role:** CTO, Principal UX Architect, Creative Director, Senior Frontend Engineer  
**Client / Brand Signatory:** Suraj Shasmal (Founder, Marine Creatures)  
**Lead Architect:** Aritya Saha (CODEVERSE Technologies)  
**Status:** Master Standard — All Engineers & Designers Must Adhere  

---

## EXECUTIVE DESIGN MANDATE

> **PREMIUM IS CLARITY. INTERACTION IS PURPOSE. ANIMATION IS STORYTELLING. USABILITY IS NON-NEGOTIABLE.**

The finished website must simultaneously achieve five non-negotiable outcomes:

| Priority | Outcome | What This Means |
| :---: | :--- | :--- |
| **1** | BEAUTIFUL | Looks exceptionally premium at first glance |
| **2** | READABLE | Every word is immediately legible — no contrast failures |
| **3** | USABLE | Users always know their next action. Zero confusion |
| **4** | INTERACTIVE | Interactions feel fluid, purposeful — never random |
| **5** | FAST | 60fps on mid-range mobile. Performance is a design feature |

---

## THE MOST IMPORTANT DESIGN RULE

> **PREMIUM ≠ COMPLICATED**

**If an animation makes the interface harder to understand — REMOVE IT.**

---

## THE GOLDEN UX FORMULA

Every section must answer within 3 seconds:

```
WHAT IS THIS?  →  WHY SHOULD I CARE?  →  WHAT CAN I DO?  →  WHERE WILL THIS TAKE ME?
```

---

## DESIGN DECISION HIERARCHY

```
1. CLARITY        ← Always wins
2. USABILITY      ← Never compromised
3. CONTENT        ← Shapes layout
4. VISUAL HIERARCHY
5. BRAND
6. INTERACTION
7. DECORATION     ← Always last
```

---

## PART 01 — VISUAL LANGUAGE: ABYSSAL LUXURY

The website should feel like:
> *A luxury architectural studio that exists underwater.*

NOT a gaming website. NOT a neon aquarium. NOT a generic dark template.

---

## PART 02 — COLOR SYSTEM

### Primary Surfaces
```
#020609   Void Black       ← Max contrast sections
#06151C   Abyssal Navy     ← Primary background (--color-secondary)
#082B32   Ocean Trench     ← Elevated surfaces, cards (--color-deep)
```

### Accent
```
#00D4FF   Bioluminescent Cyan   ← Primary action signal (mapped: --color-accent #00B8D9)
#69E7EA   Soft Aqua             ← Hover states (mapped: --color-cyan #36D6E8)
```

### Typography Colors
```
#F4F7F5   Pearl White   ← Primary text (--color-text)
#9BAFB3   Mist Grey     ← Secondary text (--color-muted)
```

### Luxury Accent (Sparingly)
```
#C9AD78   Champagne Gold   ← Premium badges, signature highlights (--color-gold)
```

> [!CAUTION]
> Cyan and gold must NEVER overpower readable content. They are semantic signals, not decoration.

### Section Rhythm — Create Visual Breathing Room

```
Dark Immersive  →  Clean Editorial  →  Dark Marine  →  Light Architectural  →  Dark Project  →  Clean CTA
```

---

## PART 03 — TYPOGRAPHY SYSTEM

### Font Roles (from [`globals.css`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/globals.css) & [`layout.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/layout.tsx))

```
--font-display: Cormorant Garamond   ← Hero headlines, section titles, product names, scientific names
--font-body:    Inter                ← Body copy, labels, buttons, navigation, UI chrome
```

### Type Scale
| CSS Class | Fluid Scale | Use |
| :--- | :--- | :--- |
| `.text-display-xl` | `clamp(2.6rem, 8.5vw, 9rem)` | Hero primary heading |
| `.text-display-lg` | `clamp(2.1rem, 6.5vw, 6.5rem)` | Section hero headline |
| `.text-display-md` | `clamp(1.75rem, 4.8vw, 4.5rem)` | Section heading |
| `.text-display-sm` | `clamp(1.35rem, 3.2vw, 3rem)` | Card headings, sub-section titles |
| `.text-label-lg` | `0.75rem / 0.25em tracking` | Eyebrows, nav links, button text |
| `.text-label` | `0.625rem / 0.2em tracking` | Micro labels, status badges |

### Typography Rules — NON-NEGOTIABLE

- ✅ Body text minimum `16px` on mobile, `17–18px` on desktop
- ✅ Line length: **60–75 characters per line** for long-form reading. Never full-screen paragraphs.
- ✅ Contrast: WCAG AA minimum (4.5:1 body, 3:1 large text)
- ✅ Aggressive letter-spacing (`0.15–0.25em`) only for uppercase labels, never body text
- ❌ Uppercase body copy — reserved strictly for nav labels, buttons, eyebrows
- ❌ Text directly over moving particles or video — always apply gradient overlay first

---

## PART 04 — READABILITY RULES (NON-NEGOTIABLE)

### Never Do
- ❌ Body paragraphs spanning 100% screen width on desktop
- ❌ White text on light-coloured backgrounds
- ❌ Text over visually chaotic regions without contrast overlay
- ❌ Font weight below 300 for body content
- ❌ Text that shifts position while the user is reading it
- ❌ Tiny labels with no contextual meaning

### Always Do
- ✅ Generous vertical spacing between paragraphs (`mb-6` to `mb-8`)
- ✅ Clear heading hierarchy (one H1 per page, logical H2–H4)
- ✅ Short paragraphs (3–5 lines maximum before a visual break)
- ✅ Visible, high-priority CTA hierarchy per section
- ✅ Gradient overlays behind hero/section text on imagery

---

## PART 05 — INFORMATION HIERARCHY

```
TIER 1 — PRIMARY    Visible immediately. The user must know this.
TIER 2 — SECONDARY  Reveals on scroll. Useful supporting context.
TIER 3 — OPTIONAL   Revealed on interaction. Details for explorers.
```

**Never display all three simultaneously. Use progressive disclosure.**

---

## PART 06 — THE 3-SECOND & 5-SECOND TESTS

**3-Second Section Test:** If a first-time visitor sees this for 3 seconds, do they understand the purpose?  
If NO → Simplify. Do not add more decoration.

**5-Second CTA Test:** User must identify primary and secondary actions without studying the page.

```
PRIMARY:   [EXPLORE MARINE LIFE]    ← Solid fill, maximum weight
SECONDARY: [DESIGN YOUR AQUARIUM]  ← Outlined, subordinate
TERTIARY:  Learn more →            ← Text link
```

**Never make five buttons equally important.**

---

## PART 07 — BUTTON SYSTEM (from [`globals.css`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/app/globals.css#L492-L541))

| Level | Class | Appearance | Usage |
| :--- | :--- | :--- | :--- |
| **Primary** | `.btn-primary` | Solid `#00B8D9` fill | Single most important page action |
| **Secondary** | `.btn-ghost` | Transparent + `1px border` | Supporting, second choice |
| **Tertiary** | Text link | Text only with `→` | Exploratory, "learn more" |

- Minimum touch target: **44px × 44px** on mobile
- Button text: Uppercase Inter, `0.6875rem`, `0.15em` letter-spacing
- Never add glow to every button — glow is a **semantic interaction signal**

---

## PART 08 — NAVIGATION (from [`Navbar.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/layout/Navbar.tsx) & [`MobileBottomNav.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/layout/MobileBottomNav.tsx))

- **Elegant:** Minimal visual noise; uses `.glass-dock` appearance
- **Obvious:** Recognized as navigation immediately — no puzzle labels
- **Predictable:** Labels describe destinations, not decode brand vocabulary
- **Fast:** No animation delays on nav interactions

### Vocabulary Clarity Rule
Luxury labels must always communicate meaning:

| Label | Must Convey |
| :--- | :--- |
| OUR WORLDS | Completed aquarium projects |
| REVIVE | Renovation & restoration |
| MARINE LIFE | Species catalog |
| CREATE | Design your custom aquarium |

---

## PART 09 — HERO ([`Hero.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/home/Hero.tsx))

### Sequence
```
Darkness → Particles → Bioluminescent light → Reef → Marine life
→ Marine Creatures wordmark → Tagline → Clear primary CTA
```

### Critical Rules
1. **Do NOT make the hero too long.** Visitors reach meaningful content within 4 seconds.
2. **Hero text readable even when animation is fully active.**
3. **Gradient overlays** create stable text contrast regions.
4. **CTA in stable negative space** — never over visually chaotic areas.
5. **Mobile hero:** Dedicated portrait-optimized composition. Never crop desktop.

> [!IMPORTANT]
> Apply minimum 7:1 contrast ratio for the primary headline against its background region.

---

## PART 10 — ANIMATION SYSTEM (Three-Tier Model)

### Level 1 — ESSENTIAL (Always On)
- Duration: 150–300ms | Easing: `--ease-gentle` (`cubic-bezier(0.4, 0, 0.2, 1)`)
- For: buttons, nav links, form focus states, toggles, feedback
- Character: Never distracting. Always immediate.

### Level 2 — EXPERIENCE (On Scroll / Interaction)
- Duration: 500–800ms | Easing: `--ease-ocean` (`cubic-bezier(0.25, 0.46, 0.45, 0.94)`)
- For: section reveals (`.reveal-hidden`), image reveals, product discovery, drawers
- Character: Purposeful. Enhances content perception.

### Level 3 — CINEMATIC (Hero / Major Transitions Only)
- Duration: 800–2000ms | Easing: `--ease-reveal` (`cubic-bezier(0.77, 0, 0.175, 1)`)
- For: hero entrance, project gallery transitions
- Character: Atmospheric. Used sparingly.

> [!WARNING]
> Do NOT turn the entire website into Level 3.

### Approved Interactions
| Interaction | Component | Level |
| :--- | :--- | :--- |
| Fly-to-Cart Bezier | [`FlyToCartEffect.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/cart/FlyToCartEffect.tsx) | 2 (500–900ms) |
| Cart Drawer spring | [`CartDrawer.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/cart/CartDrawer.tsx) | 1–2 |
| Custom fish cursor + bubbles | `components/ui/Cursor.tsx` | 2 |
| Section reveal | `.reveal-hidden` via GSAP | 2 |
| Particle drift + caustics | Hero GSAP | 3 |
| Before/After slider | `.ba-slider`, `.ba-handle` | 1 (interactive) |
| Image reveal + scale | `.img-reveal-wrapper` | 2 |
| Shimmer skeleton loaders | `.shimmer` keyframe | 1 |
| Lenis smooth scroll | [`SmoothScroll.tsx`](file:///c:/Users/User/OneDrive/Desktop/Marine%20Creatures/marine-creatures/components/layout/SmoothScroll.tsx) | Always-on |

### Animation Feeling
- **Preferred:** Fluid + Restrained + Cinematic
- **Avoid:** Bouncy springs, elastic scaling, abrupt snapping, random rotations

---

## PART 11 — SCROLL EXPERIENCE

- ✅ Normal scrolling must remain possible and predictable at all times
- ✅ Lenis scroll is ambient — never aggressive
- ✅ Scroll triggers reveal content hierarchy (headings first, then content)
- ❌ No horizontal scroll on mobile
- ❌ No forced scroll sequences that prevent skipping
- ❌ Text must not move while users are reading it

---

## PART 12 — MOBILE-FIRST STANDARDS

> **MOBILE IS NOT A SHRUNK DESKTOP.**

The mobile experience should feel like:
> *Holding a luxury digital aquarium in your hand.*

### Requirements
- All interactive elements: minimum **44×44px** touch targets
- Bottom nav: `env(safe-area-inset-bottom)` — uses `.pb-safe` class
- Input elements: locked at `16px` to prevent iOS auto-zoom (in `globals.css`)
- Paragraph length on mobile: 3 lines maximum before a visual break
- Particle count: maximum **15 on mobile**, maximum **40 on desktop**

### Desktop → Mobile Interaction Mapping
| Desktop | Mobile |
| :--- | :--- |
| Hover to reveal | Tap to reveal |
| Drag slider | Swipe with visible handle + "DRAG TO REVEAL" label |
| Cursor label | Static instruction label |
| Parallax scroll | Reduced parallax (40% transform range) |
| Multi-column grid | Single column, full card width |

---

## PART 13 — MARINE LIFE PRODUCT EXPERIENCE

### Product Card Hierarchy
```
Large specimen image  →  Common name  →  Scientific name (italic)
Price  →  Stock badge  →  Single CTA button
```

### Species Dossier Page Architecture

```
[AT A GLANCE]           ← No scroll required
Species name (Display)
Scientific name (Italic, pearl-muted)
Origin / Biome  |  Temperament  |  Reef Compatibility  |  Care Level  |  Min Tank

[WATER PARAMETERS]      ← Visual gauge dials
Temperature: 24°C – 26°C | Salinity: 1.023–1.025 SG | pH: 8.1–8.4

[CARE GUIDE]            ← Short paragraphs
Diet  |  Behaviour  |  Tank Compatibility

[LIVE ARRIVAL GUARANTEE]

[PRIMARY ACTIONS]
[ASK ABOUT THIS SPECIMEN]   [ADD TO CART]
```

### Fly-to-Cart Rule
- Duration: **500–900ms maximum**
- Commerce must NEVER wait for decoration

---

## PART 14 — WORLD BUILDER UX

```
01 / 06 → ENVIRONMENT: Tropical Reef | Deep Ocean | Minimal Marine | Custom
02 / 06 → FORM: Built-In | Freestanding | Room Divider | Custom
03 / 06 → MATERIAL: Low-Iron Glass | Acrylic | Custom
04 / 06 → MARINE LIFE: Species selection
05 / 06 → SYSTEM: Lighting | Filtration | Cabinetry
06 / 06 → YOUR WORLD → [SAVE MY WORLD] [SPEAK TO A DESIGN CONCIERGE]
```

- Always show progress: `01 / 06` label and step breadcrumb
- Visual tile selectors with preview imagery — never dropdowns with 40 options
- Users can navigate backwards freely at any step

---

## PART 15 — RENOVATION BEFORE/AFTER (`.ba-slider`, `.ba-handle`)

- Handle must be **visually obvious** — circular grip with `DRAG TO REVEAL` label + `← →` arrows
- Works on both desktop drag and mobile touch drag
- Never hide the slider behind "click to reveal"
- Label states: `BEFORE` and `AFTER` always visible

---

## PART 16 — OUR WORLDS PROJECT PAGES

```
THE PROJECT → THE SPACE → THE DESIGN → THE ENGINEERING
→ THE LIVING WORLD → THE RESULT

[CREATE SOMETHING LIKE THIS]   ← Always ends with conversion CTA
```

---

## PART 17 — FORMS

- Short: Ask only what is absolutely necessary
- Progressive disclosure: Name + phone first, then context-specific fields
- Friendly microcopy: *"Tell us about your space"* not *"Message"*
- Inline error messages — immediate, human-readable, field-specific

---

## PART 18 — FEEDBACK, LOADING & EMPTY STATES

### Action Feedback
| Action | Feedback |
| :--- | :--- |
| Add to cart | Fly-to-cart + "ADDED TO YOUR WORLD" toast |
| Place order | "ORDER RECEIVED" confirmation screen |
| Submit inquiry | "REQUEST RECEIVED" + WhatsApp routing |
| Admin stock update | "INVENTORY UPDATED" toast (3s) |
| Save World | "YOUR WORLD HAS BEEN SAVED" |
| Snapshot capture | "SNAPSHOT CAPTURED" with checksum |

### Loading States
- Never: generic spinners
- Use: `.shimmer` skeleton, underwater fade-in, ocean-themed placeholder

### Empty States (Must Answer 3 Questions)
```
WHAT HAPPENED? → "No specimens are currently available in this collection."
WHY?           → "We refresh with new rare arrivals regularly."
WHAT CAN I DO? → [EXPLORE OTHER SPECIES]   [NOTIFY ME ON RESTOCK]
```

### Error States
- Customer-facing: Human-readable, solution-oriented, never raw error codes
- Admin-facing: Full diagnostic context (endpoint, error code, timestamp)

---

## PART 19 — ADMIN CONTROL OS (`/admin`)

### Priority Order (Different From Storefront)
1. Readability — all data scannable at a glance
2. Speed — actions complete in 1 tap
3. Information density — more data per screen
4. Usability — nothing ambiguous
5. Responsiveness — fully operable from a smartphone

> [!NOTE]
> Admin must NOT be cinematic. No particles, no complex animations, no decorative parallax.

### Admin Tab Standards
| Tab | Primary Function | Key Mobile Req |
| :--- | :--- | :--- |
| Overview | Summary metrics | 2-column stat cards |
| Products | Stock CRUD + management | `+`/`-` steppers 48px min, pause toggle |
| Orders | Approval + tracking + AWB | Large step buttons, 1-tap WhatsApp |
| Banners | Homepage slide CRUD | Slide preview in edit form |
| Inquiries | Lead CRM + follow-up | 1-tap WhatsApp, status chip |
| System | DB health + backup + restore | Large action buttons, monospace metrics |

---

## PART 20 — COMPONENT SYSTEM

| Component | Purpose | Level |
| :--- | :--- | :--- |
| `OceanSection` | Padded section with dark/light rhythm | None |
| `MarineCard` | Product card: image, name, price, stock, CTA | 1 |
| `SpeciesDossier` | Full species detail layout with gauges | 2 |
| `WaterGauge` | Visual parameter dial (temp/salinity/pH) | 2 |
| `WorldSelector` | Step-selection tile with preview | 1 |
| `ProjectStory` | Portfolio story layout | 2 |
| `BeforeAfter` | Renovation drag comparison | 1 |
| `ConciergeCTA` | Final page CTA section | 2 |
| `PremiumButton` | Standardized CTA with hierarchy variants | 1 |
| `InquiryForm` | Multi-step consultation form | 1 |

### Glassmorphism (`.glass-card`, `.glass-dock`) — Use Selectively
- Navigation dock ✅
- Floating cart/wishlist panels ✅
- Overlay controls and drawers ✅
- Admin stat cards ✅
- **Never:** Make the entire website glassmorphic

### Glow Rules
Cyan glow communicates:
- Active focus state
- Hover interaction readiness
- Bioluminescent specimen imagery

**Do not surround everything with glow. It must carry semantic meaning.**

---

## PART 21 — PERFORMANCE STANDARDS

| Area | Target | Implementation |
| :--- | :--- | :--- |
| FCP | < 0.8s on 4G | ISR + localStorage hydration |
| LCP | < 1.8s | Next.js Image optimization |
| CLS | < 0.05 | `aspect-ratio` reservations |
| Animation FPS | 60fps mid-range mobile | `transform` + `opacity` only |
| Particle Count | 15 mobile / 40 desktop | `IntersectionObserver` pause |
| Fonts | `font-display: swap` | Implemented in `layout.tsx` |

### Device-Adaptive Complexity
```
High-end (>8GB):   Full richness — all particles, parallax
Mid-range (4–8GB): Reduced particles, no WebGL
Low-end (<4GB):    Static hero, no particles, no parallax
```
> The design must still look premium at all levels.

---

## PART 22 — ACCESSIBILITY

| Standard | Requirement |
| :--- | :--- |
| WCAG 2.1 AA | All primary text/BG contrast ≥ 4.5:1 |
| Touch Targets | Minimum 44×44px |
| Keyboard Nav | Full site navigable Tab/Enter/Escape |
| Focus States | Visible cyan focus ring |
| Reduced Motion | `@media (prefers-reduced-motion)` — in globals.css |
| Semantic HTML | `<nav>`, `<main>`, `<article>`, `<section>` |
| Alt Text | All non-decorative images |
| Form Labels | All inputs have visible or SR labels |

---

## PART 23 — RESPONSIVE BREAKPOINTS

Test at: `320 / 360 / 375 / 390 / 414 / 430 / 768 / 1024 / 1280 / 1440 / 1920px+`

---

## PART 24 — CTO QUALITY GATE CHECKLIST

Before any feature ships:

- ☐ **READABILITY:** First-time visitor understands every major section?
- ☐ **USABILITY:** Can they find: products / services / projects / contact / cart / consultation?
- ☐ **3-SECOND TEST:** Every section's purpose understood within 3 seconds?
- ☐ **MOBILE TEST:** Operable comfortably with one hand at 390px?
- ☐ **ANIMATION TEST:** Every animation genuinely improves the experience?
- ☐ **PERFORMANCE:** 60fps on mid-range Android (Snapdragon 680 class)?
- ☐ **ACCESSIBILITY:** Keyboard-only and reduced-motion users can access all functions?
- ☐ **BUSINESS:** Every service has a clear, unobstructed conversion path?
- ☐ **EMPTY STATES:** Meaningful content for all missing-data scenarios?
- ☐ **ERROR STATES:** All customer errors are human-readable and solution-oriented?

---

## DESIGN BENCHMARK TARGETS

| Benchmark | What to Borrow |
| :--- | :--- |
| Apple | Clarity, hierarchy, restraint, purposeful animation |
| Luxury Architectural Editorial | Typography scale, negative space, print-quality composition |
| Cinematic Underwater | Depth, atmosphere, bioluminescent colour, wonder |
| Modern Interactive Web | Progressive disclosure, micro-interactions, natural motion |
| Serious Production Engineering | Performance, accessibility, SEO, reliability |

> **Do NOT copy another company's design. Use these as quality benchmarks only.**

---

## THE CTO DECISION RULES

```
MORE ANIMATION  vs.  BETTER USABILITY        → CHOOSE BETTER USABILITY
MORE EFFECTS    vs.  BETTER PERFORMANCE       → CHOOSE BETTER PERFORMANCE
MORE INFORMATION vs.  BETTER READABILITY      → CHOOSE BETTER READABILITY
AESTHETIC NOVELTY vs. USER CONFIDENCE         → CHOOSE USER CONFIDENCE
```

---

## THE FINAL COMMAND

> **The visitor must feel:**
> 1. *"This is premium."*
> 2. *"This is easy to understand."*
> 3. *"I want to explore."*
> 4. *"I know exactly what I can do next."*

**MAKE IT BEAUTIFUL. MAKE IT INTERACTIVE. MAKE IT MEMORABLE.**

**BUT ABOVE EVERYTHING:**

# MAKE IT EASY TO USE.
# MAKE IT EASY TO READ.
# MAKE IT EASY TO UNDERSTAND.

---

*CTO Master UX & Design System — Marine Creatures v2.0*  
*Aritya Saha / CODEVERSE Technologies × Suraj Shasmal / Marine Creatures*
