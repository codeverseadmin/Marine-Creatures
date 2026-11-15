import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Reef Tank Lighting & PAR Selection Guide for Living Corals',
  description:
    'Authoritative reef aquarium lighting guide. Understand Photosynthetic Active Radiation (PAR), 395nm UV, royal blue spectrums, and app-controlled LED fixture selection.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/guides/reef-tank-lighting-par-guide`,
  },
  openGraph: {
    title: 'Reef Tank Lighting & PAR Selection Guide | Marine Creatures',
    description:
      'Master coral PAR targets (Soft: 50–100, LPS: 100–180, SPS: 200–350+), 4-channel spectrum control, and fixture sizing with NemoLight Extreme.',
    url: `${SITE_CONFIG.url}/guides/reef-tank-lighting-par-guide`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'article',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Reef Tank Lighting & PAR Guide — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Reef Tank Lighting & PAR Selection Guide',
    description:
      'Understanding PAR targets, 395nm UV fluorescence, and 4-channel Bluetooth lighting automation.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const ARTICLE_FAQS = [
  {
    question: 'What is PAR in marine aquarium lighting and why does it matter?',
    answer:
      'Photosynthetic Active Radiation (PAR) measures the light quantum flux between 400nm and 700nm that zooxanthellae micro-algae living inside coral tissue can utilize for photosynthesis. Insufficient PAR results in coral starvation and tissue browning, while excessive PAR causes photo-inhibition and coral bleaching.',
  },
  {
    question: 'What are the optimal PAR targets for Soft, LPS, and SPS corals?',
    answer:
      'Recommended PAR ranges at depth are: Soft corals (Zoanthids, Mushrooms, Leathers): 50–100 PAR; Large Polyp Stony (LPS) corals (Torches, Hammers, Brains): 100–180 PAR; Small Polyp Stony (SPS) corals (Acropora, Montipora): 200–350+ PAR.',
  },
  {
    question: 'Why are 395nm UV and 450nm Royal Blue wavelengths critical for corals?',
    answer:
      'Wavelengths in the 395nm (near-UV) and 450nm (Royal Blue) range excite green fluorescent proteins (GFP) and cyan fluorescent proteins inside coral tissue. This stimulation triggers vivid bioluminescent pigmentation and fuels the chlorophyll-a absorption peak without encouraging green hair algae proliferation.',
  },
  {
    question: 'How long should an aquarium reef lighting photoperiod run each day?',
    answer:
      'A natural reef photoperiod spans 10 to 12 hours total: 1.5–2 hours of progressive sunrise ramp, 6–8 hours of peak photosynthetic daylight spectrum, 1.5–2 hours of progressive sunset ramp, and optional low-intensity moonlight illumination.',
  },
];

export default function ReefTankLightingParGuidePage() {
  const canonicalUrl = `${SITE_CONFIG.url}/guides/reef-tank-lighting-par-guide`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Reef Tank Lighting & PAR Guide', url: '/guides/reef-tank-lighting-par-guide' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const articleJsonLd = generateArticleJsonLd({
    title: 'Reef Tank Lighting & PAR Selection Guide for Living Corals',
    description:
      'Authoritative reef aquarium lighting guide. Understand Photosynthetic Active Radiation (PAR), 395nm UV, royal blue spectrums, and app-controlled LED fixture selection.',
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
            Reef Lighting &amp; PAR Guide
          </span>
        </nav>
      </div>

      {/* Header */}
      <header className="container-max pt-6 pb-12 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full">
            Lighting Technology &amp; Optics
          </span>
          <span className="text-xs text-[--color-muted] font-mono">
            7 min read · Updated November 15, 2026
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-light max-w-4xl leading-tight">
          Reef Tank Lighting &amp; PAR Guide:<br />
          <em className="font-normal text-cyan-300">Spectral Science for Living Corals</em>
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
            Selecting marine aquarium lighting requires matching fixture power and spectrum to coral biology: <strong>Soft corals thrive under 50–100 PAR</strong>, <strong>LPS corals require 100–180 PAR</strong>, and <strong>SPS corals demand 200–350+ PAR</strong>. The ideal spectrum emphasizes <strong>395nm near-UV and 450nm Royal Blue wavelengths</strong> to excite coral fluorescent proteins, controlled via a <strong>10–12 hour progressive photoperiod ramp</strong> using modern smart Bluetooth/Wi-Fi LED fixtures.
          </p>
        </div>

        {/* Section 1: PAR Distribution Across Coral Biotopes */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            1. Target PAR Zones by Coral Species
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            In reef aquariums, light intensity decreases exponentially with water depth and surface wave refraction. Aquascaping should align with three distinct PAR zones:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Zone 01: Low Light</span>
              <h3 className="font-display text-lg text-white mb-1">Soft Corals &amp; Polyps</h3>
              <div className="text-xs font-mono text-cyan-300 mb-2">50 – 100 PAR</div>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Positioned in lower rockwork or sandbed substrate. Species include Zoanthids, Discosoma mushrooms, Ricordea, and leather corals.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Zone 02: Medium Light</span>
              <h3 className="font-display text-lg text-white mb-1">Large Polyp Stony (LPS)</h3>
              <div className="text-xs font-mono text-cyan-300 mb-2">100 – 180 PAR</div>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Positioned along mid-level rock shelves with moderate water flow. Species include Euphyllia (Torch, Hammer, Frogspawn), Acanthastrea, and Favia.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Zone 03: High Light</span>
              <h3 className="font-display text-lg text-white mb-1">Small Polyp Stony (SPS)</h3>
              <div className="text-xs font-mono text-cyan-300 mb-2">200 – 350+ PAR</div>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                Positioned along upper crests closest to the LED fixture with turbulent flow. Species include Acropora, Montipora, and Seriatopora.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: NemoLight Extreme Sizing Guide */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            2. NemoLight Extreme Fixture Sizing Matrix
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            The NemoLight Extreme series features aircraft-grade aluminum heatsinks, 4-channel Bluetooth smartphone application control, and 120-degree optical lenses:
          </p>

          <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 text-cyan-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3 sm:p-4">Model</th>
                  <th className="p-3 sm:p-4">Wattage</th>
                  <th className="p-3 sm:p-4">Recommended Tank Length</th>
                  <th className="p-3 sm:p-4">Full Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Nemo E450</td>
                  <td className="p-3 sm:p-4 text-cyan-400">24W</td>
                  <td className="p-3 sm:p-4">45 – 60 cm (1.5 – 2 ft)</td>
                  <td className="p-3 sm:p-4">
                    <Link href="/marketplace/nemo-e450" className="text-cyan-400 underline hover:text-cyan-300">
                      View E450 →
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Nemo E600</td>
                  <td className="p-3 sm:p-4 text-cyan-400">36W</td>
                  <td className="p-3 sm:p-4">60 – 80 cm (2 – 2.5 ft)</td>
                  <td className="p-3 sm:p-4">
                    <Link href="/marketplace/nemo-e600" className="text-cyan-400 underline hover:text-cyan-300">
                      View E600 →
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Nemo E900</td>
                  <td className="p-3 sm:p-4 text-cyan-400">60W</td>
                  <td className="p-3 sm:p-4">90 – 110 cm (3 – 3.5 ft)</td>
                  <td className="p-3 sm:p-4">
                    <Link href="/marketplace/nemo-e900" className="text-cyan-400 underline hover:text-cyan-300">
                      View E900 →
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Nemo E1200</td>
                  <td className="p-3 sm:p-4 text-cyan-400">72W</td>
                  <td className="p-3 sm:p-4">120 – 140 cm (4 – 4.5 ft)</td>
                  <td className="p-3 sm:p-4">
                    <Link href="/marketplace/nemo-e1200" className="text-cyan-400 underline hover:text-cyan-300">
                      View E1200 →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            Explore the complete fixture lineup on our dedicated <Link href="/marketplace/lighting" className="text-cyan-400 underline hover:text-cyan-300">Aquarium Lighting Hub</Link>.
          </p>
        </section>

        {/* Section 3: Call to Action */}
        <div className="p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-slate-900/60 my-12 text-center space-y-4">
          <span className="text-label text-cyan-400 block">CUSTOM SPECTRUM CALIBRATION</span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-light">
            Need Expert Lighting Advice for Your Tank?
          </h3>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] max-w-xl mx-auto leading-relaxed">
            Contact our senior biological curators for on-site PAR meter mapping, custom mounting solutions, and lighting retrofits during aquarium renovations (from ₹15,000).
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/marketplace/lighting" className="btn-primary text-xs uppercase tracking-wider">
              BROWSE LIGHTING CATALOG →
            </Link>
            <Link href="/contact" className="px-6 py-3.5 rounded-full border border-white/20 hover:border-cyan-400 text-xs font-semibold tracking-wider uppercase text-white transition-all">
              BOOK CONSULTATION
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
              Reef Lighting &amp; PAR FAQs
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

