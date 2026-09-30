# Marine Creatures — SEO Keyword Map & Information Architecture (Phase 1)

**Date:** 2026-10-01  
**Project:** Marine Creatures Next.js 16 Production Application  
**Standard:** Intent-Driven Semantic Mapping without Keyword Stuffing  
**Rule:** No fabricated search volumes or unverified difficulty metrics.

---

## 1. Information Architecture & URL Strategy

```
Homepage (/)
 ├── Marine Marketplace (/marketplace)
 │    ├── Dedicated Lighting & Tech Hub (/marketplace/lighting)
 │    │    ├── Nemo E450 App-Controlled LED (/marketplace/nemo-e450 -> canonical /marketplace/nemo-extreme-led?variant=e450)
 │    │    ├── Nemo E600 App-Controlled LED (/marketplace/nemo-e600 -> canonical /marketplace/nemo-extreme-led?variant=e600)
 │    │    ├── Nemo E900 App-Controlled LED (/marketplace/nemo-e900 -> canonical /marketplace/nemo-extreme-led?variant=e900)
 │    │    └── Nemo E1200 App-Controlled LED (/marketplace/nemo-e1200 -> canonical /marketplace/nemo-extreme-led?variant=e1200)
 │    ├── Individual Specimen & Equipment Routes (/marketplace/[id]) (50 SSG routes)
 │    └── Commercial Shipping & Transit Policy (/shipping-policy)
 ├── Bespoke Aquarium Design (/aquarium-design)
 ├── Turnkey Aquarium Installation (/installation)
 ├── Aquarium Renovation & Biological Revival (/renovation)
 ├── Master Services & Concierge Maintenance (/services)
 ├── Architectural Case Studies (/our-worlds)
 ├── About Our Studio (/about)
 └── Private Concierge Inquiry (/contact)
```

---

## 2. Master Keyword Mapping Matrix

| Keyword | Search Intent | Target URL | Page Type | Primary / Secondary | Content Required | Current Status | Notes |
|---|---|---|---|:---:|---|:---:|---|
| **nemo e450 aquarium light** | Commercial / Spec Investigation | `/marketplace/nemo-extreme-led` | Product Detail | Primary | 45–60 cm tank fit, 24W power, 4-channel spectrum, Bluetooth app setup | Implemented & Enhanced | Aliased at `/marketplace/nemo-e450` with variant pre-selection |
| **nemo e450 marine aquarium light** | Commercial / Specific | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | Coral fluorescence, UV/Royal Blue channels, rimless bracket fit | Implemented | Targeted in meta description and specifications table |
| **nemo e450 reef light** | Commercial / Product | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | Soft coral/LPS photosynthetic suitability for 1.5–2 ft nano reefs | Implemented | Documented in installation and care guides |
| **nemo e600 aquarium light** | Commercial / Spec Investigation | `/marketplace/nemo-extreme-led` | Product Detail | Primary | 60–80 cm tank fit, 36W power, sliding brackets, sunrise/sunset scheduling | Implemented & Enhanced | Aliased at `/marketplace/nemo-e600` |
| **nemo e600 marine aquarium light** | Commercial / Specific | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | Anodized aluminum heatsink, 24V regulated adapter, Bluetooth sync | Implemented | High-intent search term for 2–2.5 ft marine tanks |
| **nemo e600 reef light** | Commercial / Product | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | Spectrum tuning for coral polyp extension and live rock vitality | Implemented | Verified against manufacturer technical specs |
| **nemo e900 aquarium light** | Commercial / Spec Investigation | `/marketplace/nemo-extreme-led` | Product Detail | Primary | 90–110 cm tank fit, 60W power, 3-foot reef coverage, independent channels | Implemented & Enhanced | Aliased at `/marketplace/nemo-e900` |
| **nemo e900 marine aquarium light** | Commercial / Specific | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | 4-channel control (UV, Royal Blue, Deep Blue, Daylight White) | Implemented | Target for 3 ft living coral display systems |
| **nemo e900 reef light** | Commercial / Product | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | High PAR distribution for mixed reef systems with sliding glass mounts | Implemented | Referenced across renovation retrofitting guides |
| **nemo e1200 aquarium light** | Commercial / Spec Investigation | `/marketplace/nemo-extreme-led` | Product Detail | Primary | 120–140 cm tank fit, 72W power, 4-foot reef coverage, heavy-duty chassis | Implemented & Enhanced | Aliased at `/marketplace/nemo-e1200` |
| **nemo e1200 marine aquarium light** | Commercial / Specific | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | Aluminum slimline body for 4ft to 4.5ft architectural reef tanks | Implemented | Target for standard 4ft luxury installations |
| **nemo e1200 reef light** | Commercial / Product | `/marketplace/nemo-extreme-led` | Product Detail | Secondary | Full spectrum penetration across 48-inch reef configurations | Implemented | Verified against Something Fishy catalog data |
| **nemo aquarium light** | Commercial / Broad Brand | `/marketplace/lighting` | Category Hub | Primary | Overview of NemoLight Extreme II line, model matrix, spectrum technology | Implemented | Category hub acts as pillar page for all Nemo variants |
| **nemo marine aquarium light** | Commercial / Informational | `/marketplace/lighting` | Category Hub | Secondary | Comparison between manual nano fixtures and app-controlled Nemo series | Implemented | Direct CTA to model comparison matrix |
| **marine aquarium lights** | Commercial / Broad Category | `/marketplace/lighting` | Category Hub | Primary | Guide to actinic blue, UV, daylight white spectrums and photosynthesis | Implemented | Educational hub content with internal linking to products |
| **reef aquarium equipment** | Commercial / Catalog Discovery | `/marketplace` | Marketplace Catalog | Primary | Filtration, protein skimmers, DC pumps, wavemakers, LED fixtures | Implemented | 50 verified products with filterable category tabs |
| **marine aquarium equipment** | Commercial / Broad Catalog | `/marketplace` | Marketplace Catalog | Secondary | Full life-support systems (Bubble Magus, SunSun, Seachem, Reocean) | Implemented | Linked from homepage showcase and footer |
| **custom marine aquariums** | High-Commercial / Architectural | `/aquarium-design` | Service Page | Primary | Monolithic OptiWhite glass & acrylic monoliths for private residences | Implemented | Architectural survey booking form with parameter calculator |
| **aquarium design** | Commercial / Service | `/aquarium-design` | Service Page | Primary | Bespoke spatial integration, closed-loop filtration, custom scaping | Implemented | Structured showcase with engineering specifications |
| **aquarium installation** | Commercial / Transactional | `/installation` | Service Page | Primary | Structural floor load analysis, Schedule 80 plumbing, live cycling | Implemented | 6-stage engineering breakdown with inquiry modal |
| **aquarium renovation** | Commercial / Solution-Oriented | `/renovation` | Service Page | Primary | Glass scratch polishing, algae/cyanobacteria eradication, LED retrofits | Implemented | Interactive Before/After slider + livestock protection guarantee |
| **aquarium maintenance** | Commercial / Retainer | `/services` | Service Page | Primary | Bi-weekly chemical testing, RO/DI water exchanges, 24/7 concierge | Implemented | Service card with WhatsApp dispatch and SLA guarantees |
| **custom aquarium Kolkata** | Localized Commercial | `/` & `/contact` | Local / Home | Primary | Registered Kolkata aquaculture studio, on-site commissioning across WB | Implemented | Verified geographic anchor: Kolkata, West Bengal |
| **exotic marine fish** | Commercial / Livestock | `/marketplace` | Marketplace (Filter) | Primary | Quarantine-certified clownfish pairs, tangs, wrasses, captive-bred species | Implemented | 14 verified photographic marine species |
| **clownfish pairs India** | Commercial / Niche Livestock | `/marketplace/percula-picasso-clownfish` | Product Detail | Primary | Bonded Picasso True Percula pairs, quarantine acclimation, host anemones | Implemented | Direct live specimen dispatch protocol |
| **purple tang marine fish** | Commercial / Livestock | `/marketplace/purple-tang-l` | Product Detail | Primary | Red Sea specimen (*Zebrasoma xanthurum*), herbivorous diet, water params | Implemented | Verified FishBase biological taxonomy |
| **marine aquarium materials** | Commercial / Consumables | `/marketplace` | Marketplace (Filter) | Secondary | Bio-media, live rock, aragonite coral sand, synthetic adsorption resins | Implemented | 21 dry consumable products |
| **marine aquarium products** | Commercial / E-Commerce | `/marketplace` | Marketplace Catalog | Secondary | Comprehensive catalog across livestock, dry goods, chemistry, and hardware | Implemented | 77 SSG routes indexed in sitemap |

---

## 3. SEO Content Guidelines

1. **Brand Authority:** Mention "NemoLight" and "Marine Creatures" accurately based on official product specifications.
2. **Technical Grounding:** Cite verified metrics (e.g., 24W for E450, 36W for E600, 60W for E900, 72W for E1200; 4-channel Bluetooth 2.4G app control; 12mm glass thickness bracket fit).
3. **No Fabricated Specifications:** Never invent PAR numbers, lumen ratings, or unverified electrical certifications.
4. **Honest Commercial Clarity:** Clearly communicate that prices are provided via direct quotation ("Price on Request") due to dynamic logistics and live cargo protocols.
