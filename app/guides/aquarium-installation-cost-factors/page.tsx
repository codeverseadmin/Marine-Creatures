import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'What Affects Marine Aquarium Installation Cost in India? (Pricing Guide)',
  description:
    'Comprehensive analysis of custom marine aquarium installation costs in India. Key pricing factors: water volume, OptiWhite glass vs acrylic, plumbing, and livestock tiers. Installations start from ₹35,000.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/guides/aquarium-installation-cost-factors`,
  },
  openGraph: {
    title: 'What Affects Marine Aquarium Installation Cost in India? | Marine Creatures',
    description:
      'Transparent guide to bespoke luxury aquarium costs in India. Dimensions, structural engineering, DC life support, and confirmed baseline pricing starting at ₹35,000.',
    url: `${SITE_CONFIG.url}/guides/aquarium-installation-cost-factors`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'article',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Aquarium Installation Cost Factors — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marine Aquarium Installation Cost Factors in India',
    description:
      'Transparent breakdown of installation pricing factors in India. Turnkey commissions start from ₹35,000.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const ARTICLE_FAQS = [
  {
    question: 'How much does a custom marine aquarium installation cost in India?',
    answer:
      'At Marine Creatures, turnkey bespoke marine aquarium installations start from ₹35,000 INR for compact architectural systems. Mid-scale residential reef aquariums typically range between ₹75,000 and ₹2,50,000, while monumental multi-thousand-liter installations in luxury penthouses or corporate venues scale higher based on custom acrylic engineering, automated titanium chillers, and rare quarantined species.',
  },
  {
    question: 'Why does marine aquarium installation cost more than freshwater?',
    answer:
      'Marine systems require Schedule 80 corrosion-resistant plumbing, precision DC needle-wheel protein skimmers, high-output coral photosynthetic lighting, zero-TDS reverse osmosis hydration, specialized synthetic sea salt with trace element stability, and prolonged 14-day nitrogen cycle conditioning.',
  },
  {
    question: 'Is OptiWhite glass or monolithic acrylic better for custom aquariums?',
    answer:
      'OptiWhite (low-iron) glass provides outstanding scratch resistance, high optical clarity, and cost efficiency for tanks up to 6–8 feet. Monolithic thermoformed acrylic is preferred for monumental aquariums exceeding 8 feet or curved architectural shapes due to its superior tensile strength and seamless bonding.',
  },
  {
    question: 'What are the ongoing operating costs after installation?',
    answer:
      'Ongoing costs include electrical power for DC pumps and LED lighting, replacement filter media, and specialized sea salt for bi-weekly water changes. Our scheduled White-Glove Marine Concierge maintenance plans start from ₹18,500 / month, covering all lab testing, salt water, and 24/7 emergency response.',
  },
];

export default function AquariumInstallationCostFactorsPage() {
  const canonicalUrl = `${SITE_CONFIG.url}/guides/aquarium-installation-cost-factors`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Aquarium Installation Cost Factors', url: '/guides/aquarium-installation-cost-factors' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const articleJsonLd = generateArticleJsonLd({
    title: 'What Affects Marine Aquarium Installation Cost in India? (Pricing Guide)',
    description:
      'Comprehensive analysis of custom marine aquarium installation costs in India. Key pricing factors: water volume, OptiWhite glass vs acrylic, plumbing, and livestock tiers. Installations start from ₹35,000.',
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
            Installation Cost Factors
          </span>
        </nav>
      </div>

      {/* Header */}
      <header className="container-max pt-6 pb-12 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full">
            Buying Guide &amp; Economics
          </span>
          <span className="text-xs text-[--color-muted] font-mono">
            6 min read · Updated November 15, 2026
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-light max-w-4xl leading-tight">
          What Affects Marine Aquarium<br />
          <em className="font-normal text-cyan-300">Installation Cost in India?</em>
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
            In India, turnkey bespoke marine aquarium installations by Marine Creatures <strong>start from ₹35,000 INR</strong> for compact custom systems. Total project investment is driven by four primary variables: <strong>(1) Water volume &amp; viewing material</strong> (OptiWhite low-iron glass vs thermoformed monolithic acrylic); <strong>(2) Life support complexity</strong> (DC variable-speed protein skimmers, Schedule 80 plumbing, and automated top-off); <strong>(3) Lighting tier</strong> (app-controlled full-spectrum LEDs); and <strong>(4) Quarantined livestock rarity</strong>.
          </p>
        </div>

        {/* Section 1: The 4 Primary Cost Drivers */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            1. The Four Primary Cost Drivers
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            Unlike mass-produced glass boxes, an architectural living marine reef is an engineered biological life support system integrated into your interior architecture. The budget is distributed across four essential disciplines:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Driver 01</span>
              <h3 className="font-display text-lg text-white mb-2">Viewing Vessel &amp; Glass Grade</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Standard green soda-lime glass distorts marine coral fluorescence. We utilize ultra-clear OptiWhite™ low-iron glass with diamond-beveled edges or monolithic acrylic, ensuring 99.2% optical transmission.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Driver 02</span>
              <h3 className="font-display text-lg text-white mb-2">Structural Cabinetry &amp; Floor Load</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Seawater weighs ~1.025 kg per liter. A 500-liter system with rockwork exceeds 650 kg. Installations require powder-coated structural steel framing, laser leveling, and vibration-damped neoprene pads.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Driver 03</span>
              <h3 className="font-display text-lg text-white mb-2">Filtration &amp; DC Life Support</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Schedule 80 hard-plumbing with true union valves, quiet DC needle-wheel protein skimmers, and titanium chillers to maintain stable 24.5°C water temperatures in Indian climates.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Driver 04</span>
              <h3 className="font-display text-lg text-white mb-2">Quarantined Livestock &amp; Corals</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                All living marine animals undergo a rigorous 14–21 day prophylactic quarantine and conditioning cycle at our Kolkata aquaculture facility to guarantee disease-free handover.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Transparent Pricing Comparison Table */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            2. System Categories &amp; Investment Ranges
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            The following ranges provide realistic budget projections for turnkey installation and life-support commissioning:
          </p>

          <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 text-cyan-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3 sm:p-4">System Tier</th>
                  <th className="p-3 sm:p-4">Typical Dimensions</th>
                  <th className="p-3 sm:p-4">Starting Price (INR)</th>
                  <th className="p-3 sm:p-4">Ideal Setting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Architectural Compact</td>
                  <td className="p-3 sm:p-4">45 – 60 cm (60–120 L)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">Starting from ₹35,000</td>
                  <td className="p-3 sm:p-4">Private study, executive suites</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Living Reef Centerpiece</td>
                  <td className="p-3 sm:p-4">90 – 120 cm (200–450 L)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">₹75,000 – ₹1,80,000</td>
                  <td className="p-3 sm:p-4">Luxury residences, living rooms</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Architectural Monolith</td>
                  <td className="p-3 sm:p-4">150 – 240 cm (600–1,200 L)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">₹2,50,000+</td>
                  <td className="p-3 sm:p-4">Bespoke penthouses, villas</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Aquarium Renovation &amp; Revival</td>
                  <td className="p-3 sm:p-4">Existing tanks (any size)</td>
                  <td className="p-3 sm:p-4 text-cyan-400">Starting from ₹15,000</td>
                  <td className="p-3 sm:p-4">Troubled or clouded existing setups</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Call to Action */}
        <div className="p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-slate-900/60 my-12 text-center space-y-4">
          <span className="text-label text-cyan-400 block">ON-SITE FORENSIC SURVEY</span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-light">
            Receive a Fixed-Scope Architectural Quotation
          </h3>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] max-w-xl mx-auto leading-relaxed">
            Founder Suraj Shasmal conducts confidential on-site structural inspections for private residences and luxury commercial venues in Kolkata and West Bengal.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className="btn-primary text-xs uppercase tracking-wider">
              BOOK SITE SURVEY →
            </Link>
            <Link href="/installation" className="px-6 py-3.5 rounded-full border border-white/20 hover:border-cyan-400 text-xs font-semibold tracking-wider uppercase text-white transition-all">
              EXPLORE INSTALLATION PROTOCOL
            </Link>
          </div>
        </div>

        {/* Section 4: FAQs */}
        <section className="mt-16 pt-12 border-t border-white/10">
          <div className="mb-8">
            <span className="text-label text-[--color-accent] block mb-2">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
              Installation Cost &amp; Pricing FAQs
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

