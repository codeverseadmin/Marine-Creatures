import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Marine Aquarium Setup Guide: Water Chemistry, Nitrogen Cycle & Equipment',
  description:
    'Comprehensive marine aquarium setup guide. Direct answers on salinity (1.025 SG), nitrogen cycling (14-day protocol), pH 8.1–8.4, and sump filtration architecture.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/guides/marine-aquarium-setup-guide`,
  },
  openGraph: {
    title: 'Marine Aquarium Setup Guide: Water Chemistry, Cycling & Life Support | Marine Creatures',
    description:
      'Learn exact scientific parameters, RO/DI synthesis, biological bacterial cycling, and Schedule 80 plumbing standards.',
    url: `${SITE_CONFIG.url}/guides/marine-aquarium-setup-guide`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'article',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Marine Aquarium Setup Guide — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marine Aquarium Setup & Water Chemistry Guide',
    description:
      'Direct specifications for salinity, alkalinity (8–9 dKH), calcium, magnesium, and biological cycling.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const ARTICLE_FAQS = [
  {
    question: 'What are the required water parameters for a marine reef aquarium?',
    answer:
      'Optimal saltwater aquarium parameters are: Salinity at 1.025–1.026 SG (35 ppt), Temperature at 24.5°C–25.5°C, pH between 8.1 and 8.4, Alkalinity at 8.0–9.0 dKH, Calcium at 420–440 ppm, Magnesium at 1,300–1,350 ppm, Nitrate below 5.0 ppm, and Phosphate between 0.02 and 0.05 ppm. Ammonia and nitrite must always be 0.0 ppm.',
  },
  {
    question: 'How long does a marine aquarium take to cycle before adding fish?',
    answer:
      'Under our bio-augmented cycling protocol using live nitrifying bacteria and zero-TDS RO/DI synthetic saltwater, biological cycling completes in 10 to 14 days. Adding fish earlier than 10 days risks ammonia toxicity.',
  },
  {
    question: 'Why is tap water forbidden in a marine aquarium?',
    answer:
      'Municipal tap water in India contains dissolved solids, silicates, chlorine, chloramines, and heavy metals (copper, iron). These impurities immediately trigger virulent blooms of cyanobacteria and dinoflagellates and poison delicate invertebrates. Only 0-TDS reverse osmosis deionized (RO/DI) water should be used.',
  },
  {
    question: 'What is the role of live rock and aragonite substrate in a marine tank?',
    answer:
      'Porous calcium carbonate live rock and aragonite sand provide massive surface area for billions of aerobic and anaerobic nitrifying bacteria. Anaerobic zones inside the rock convert harmful nitrates into harmless nitrogen gas (N2), completing the biological cycle naturally.',
  },
];

export default function MarineAquariumSetupGuidePage() {
  const canonicalUrl = `${SITE_CONFIG.url}/guides/marine-aquarium-setup-guide`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Marine Aquarium Setup Guide', url: '/guides/marine-aquarium-setup-guide' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const articleJsonLd = generateArticleJsonLd({
    title: 'Marine Aquarium Setup Guide: Water Chemistry, Nitrogen Cycle & Equipment',
    description:
      'Comprehensive marine aquarium setup guide. Direct answers on salinity (1.025 SG), nitrogen cycling (14-day protocol), pH 8.1–8.4, and sump filtration architecture.',
    url: canonicalUrl,
    datePublished: '2026-11-01',
    dateModified: '2026-11-15',
    authorName: 'Suraj Shasmal',
  });
  const faqJsonLd = generateFaqJsonLd(ARTICLE_FAQS);

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Visual Breadcrumbs */}
      <div className="container-max pt-24 sm:pt-28 pb-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-400 flex-wrap"
        >
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <span className="opacity-40">/</span>
          <Link href="/guides" className="hover:text-cyan-400 transition-colors">
            Guides
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-cyan-400 font-medium" aria-current="page">
            Marine Aquarium Setup Guide
          </span>
        </nav>
      </div>

      {/* Article Header */}
      <header className="container-max pt-6 pb-12 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full">
            Marine Biology Standard
          </span>
          <span className="text-xs text-[--color-muted] font-mono">
            8 min read · Updated November 15, 2026
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-light max-w-4xl leading-tight">
          Marine Aquarium Setup Guide:<br />
          <em className="font-normal text-cyan-300">Water Chemistry &amp; Nitrogen Cycle</em>
        </h1>
        <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-3">
          Curated by Suraj Shasmal, Founder &amp; Lead Aquarist at Marine Creatures, Kolkata.
        </p>
      </header>

      {/* Article Body */}
      <main className="container-max py-12 max-w-4xl">
        {/* Direct Answer Summary Box for AEO */}
        <div className="p-6 sm:p-8 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 mb-12 shadow-xl">
          <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-widest block mb-2 font-bold">
            DIRECT ANSWER SUMMARY
          </span>
          <p className="font-body text-sm sm:text-base text-slate-100 leading-relaxed font-light">
            Setting up a marine aquarium requires establishing three foundational pillars: <strong>(1) Zero-TDS purified saltwater</strong> synthesized with laboratory-grade probiotic sea salt calibrated to a specific gravity of <strong>1.025 SG (35 ppt)</strong>; <strong>(2) A 10–14 day biological nitrogen cycling phase</strong> that inoculates nitrifying bacterial colonies to eliminate ammonia; and <strong>(3) Multi-stage life support</strong> combining mechanical surface skimming, a DC variable-flow protein skimmer, and high-PAR full-spectrum LED lighting.
          </p>
        </div>

        {/* Section 1: Water Chemistry */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            1. Authoritative Reef Water Chemistry Parameters
          </h2>
          <p className="font-body text-sm text-[--color-muted] leading-relaxed">
            In natural ocean reef environments, marine animals thrive within exceptionally stable chemical boundaries. The table below represents the biological standard enforced across all Marine Creatures living installations:
          </p>

          <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 text-cyan-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3 sm:p-4">Chemical Parameter</th>
                  <th className="p-3 sm:p-4">Optimal Marine Target</th>
                  <th className="p-3 sm:p-4">Testing Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Salinity / Specific Gravity</td>
                  <td className="p-3 sm:p-4 text-cyan-400">1.025 – 1.026 SG (35 ppt)</td>
                  <td className="p-3 sm:p-4">Optical refractometer with ATC</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Temperature</td>
                  <td className="p-3 sm:p-4 text-cyan-400">24.5°C – 25.5°C</td>
                  <td className="p-3 sm:p-4">Digital titanium probe chiller</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">pH Level</td>
                  <td className="p-3 sm:p-4 text-cyan-400">8.1 – 8.4</td>
                  <td className="p-3 sm:p-4">Calibrated glass electrode meter</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Alkalinity (dKH)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">8.0 – 9.0 dKH</td>
                  <td className="p-3 sm:p-4">High-precision chemical titration</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Calcium (Ca)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">420 – 440 ppm</td>
                  <td className="p-3 sm:p-4">Colorimetric titration test</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Magnesium (Mg)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">1,300 – 1,350 ppm</td>
                  <td className="p-3 sm:p-4">Colorimetric titration test</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Nitrate (NO3)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">&lt; 5.0 ppm</td>
                  <td className="p-3 sm:p-4">Photometric reagent test</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Phosphate (PO4)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">0.02 – 0.05 ppm</td>
                  <td className="p-3 sm:p-4">Ultra-low range colorimeter</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            We formulate all initial system hydration using <Link href="/marketplace/quantum-mixed-macro-probiotic-salt-22kg" className="text-cyan-400 underline hover:text-cyan-300">Quantum Mixed Macro Probiotic Salt 22kg</Link>, which arrives with individual batch ICP-OES laboratory analysis to guarantee purity.
          </p>
        </section>

        {/* Section 2: Nitrogen Cycle */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            2. The 14-Day Biological Nitrogen Cycle Protocol
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            Every marine system produces teleost waste, unconsumed food, and cellular sloughing. Without established biological filtration, this waste degrades into highly toxic free ammonia (NH3). The nitrogen cycle operates in three sequential biochemical conversions:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Stage 01</span>
              <h3 className="font-display text-base text-white mb-1">Ammonia (NH3)</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Organic matter decays into ammonia. Nitrosomonas bacteria oxidize ammonia into toxic nitrite (NO2-).
              </p>
            </div>
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Stage 02</span>
              <h3 className="font-display text-base text-white mb-1">Nitrite (NO2-)</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Nitrobacter and Nitrospira bacteria oxidize nitrite into relatively non-toxic nitrate (NO3-).
              </p>
            </div>
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Stage 03</span>
              <h3 className="font-display text-base text-white mb-1">Nitrate Export (NO3-)</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Anaerobic bacteria in deep live rock and protein skimmer foam fractionation export nitrate permanently from the water column.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Life Support Architecture */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            3. Life Support Hardware &amp; Plumbing Architecture
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            A durable marine aquarium relies on concealed engineering that prioritizes acoustic dampening and fail-safe water flow:
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-[--color-muted]">
            <li className="flex items-start gap-2.5">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>Schedule 80 PVC Hard-Plumbing:</strong> Heavy-wall rigid pipework with true union ball valves ensures zero leaks and quiet operation under 28 dB.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>BeanAnimal 3-Pipe Overflow:</strong> A full siphon drain, an open channel trickle drain, and an emergency dry drain guarantee silent operation with zero flooding risk.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>DC Protein Skimmer:</strong> Features needle-wheel impellers to inject micro-bubbles that bind to organic proteins before they break down into nitrate. See our <Link href="/marketplace/super-protein-skimmer-dc" className="text-cyan-400 underline hover:text-cyan-300">Super Protein Skimmer DC</Link>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>Full-Spectrum Marine LED Lighting:</strong> Coral zooxanthellae require focused PAR in the 420–460nm blue spectrum. See our <Link href="/marketplace/lighting" className="text-cyan-400 underline hover:text-cyan-300">NemoLight Extreme Reef LED Systems</Link>.</span>
            </li>
          </ul>
        </section>

        {/* Section 4: Related Services Callout */}
        <div className="p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-slate-900/60 my-12 text-center space-y-4">
          <span className="text-label text-cyan-400 block">PROFESSIONAL COMMISSIONING</span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-light">
            Want Turnkey Architectural Execution?
          </h3>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] max-w-xl mx-auto leading-relaxed">
            Marine Creatures delivers turnkey marine installations starting from ₹35,000 across Kolkata and West Bengal, covering structural planning, Schedule 80 plumbing, and biological cycling.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/installation" className="btn-primary text-xs uppercase tracking-wider">
              VIEW INSTALLATION PROTOCOL →
            </Link>
            <Link href="/contact" className="px-6 py-3.5 rounded-full border border-white/20 hover:border-cyan-400 text-xs font-semibold tracking-wider uppercase text-white transition-all">
              BOOK SITE SURVEY
            </Link>
          </div>
        </div>

        {/* Section 5: Frequently Asked Questions Accordion */}
        <section className="mt-16 pt-12 border-t border-white/10">
          <div className="mb-8">
            <span className="text-label text-[--color-accent] block mb-2">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
              Marine Aquarium Setup FAQs
            </h2>
          </div>
          <div className="space-y-4">
            {ARTICLE_FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group p-5 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)] open:bg-[rgba(5,15,22,0.9)] open:border-cyan-400/30 transition-all duration-200"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none text-sm sm:text-base font-light text-white group-hover:text-cyan-300">
                  <span className="pr-4">{faq.question}</span>
                  <span className="text-cyan-400 text-lg font-mono shrink-0 transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 font-body font-light text-xs sm:text-sm text-[--color-muted] leading-relaxed border-t border-white/5 pt-3">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

