import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import {
  generateArticleJsonLd,
  generateBreadcrumbJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Marine Fish Compatibility, Pairing & Quarantine Acclimation Guide',
  description:
    'Authoritative guide to marine fish compatibility. Clownfish pairing biology, reef-safe classifications, tang temperament, and our 14-day quarantine protocol.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/guides/marine-fish-compatibility`,
  },
  openGraph: {
    title: 'Marine Fish Compatibility, Pairing & Quarantine Guide | Marine Creatures',
    description:
      'Master peaceful marine community selection: clownfish pair dynamics, reef-safe guidelines, and our medical-grade quarantine conditioning.',
    url: `${SITE_CONFIG.url}/guides/marine-fish-compatibility`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'article',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Marine Fish Compatibility Guide — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marine Fish Compatibility & Quarantine Acclimation Guide',
    description:
      'Proven compatibility matrices for clownfish pairs, tangs, and angels, paired with our quarantine protocol.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const ARTICLE_FAQS = [
  {
    question: 'How do you successfully pair clownfish in a marine aquarium?',
    answer:
      'Clownfish are protandrous hermaphrodites; all are born sexually immature males. When two juveniles are introduced together, the larger, more aggressive specimen transitions into a dominant female, while the smaller remains male. Never introduce two mature females together, as violent territorial fighting will occur.',
  },
  {
    question: 'What makes a marine fish reef-safe vs non-reef-safe?',
    answer:
      'Reef-safe fish (e.g. Clownfish, Tangs, Blennies, Fairy Wrasses, Cardinalfish) graze on benthic algae or zooplankton without consuming coral polyps, decorative shrimp, or tridacna clams. Non-reef-safe fish (e.g. Large Angelfish, Triggerfish, Pufferfish, Butterflyfish) consume fleshy LPS corals or prey upon invertebrates.',
  },
  {
    question: 'Why can multiple Tangs fight in an aquarium and how is it prevented?',
    answer:
      'Tangs from the same genus (e.g. Zebrasoma flavescens vs Zebrasoma xanthurum) share identical body shapes and feeding niches, sparking intense territorial aggression over grazing turf. To prevent conflict, select tangs with differing body profiles (e.g., combining a Zebrasoma with a Ctenochaetus or Paracanthurus), introduce them simultaneously, and ensure adequate swimming volume (>300 liters).',
  },
  {
    question: 'What is the Marine Creatures 14-day quarantine protocol?',
    answer:
      'Every specimen entering our Kolkata aquaculture studio undergoes a minimum 14 to 21-day quarantine. Protocols include gradual osmotic salinity adjustment, prophylactic treatment for Cryptocaryon irritans (marine ich) and Amyloodinium, and active feeding conditioning with fortified omega-3 nutrition before VIP delivery.',
  },
];

export default function MarineFishCompatibilityGuidePage() {
  const canonicalUrl = `${SITE_CONFIG.url}/guides/marine-fish-compatibility`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Marine Fish Compatibility', url: '/guides/marine-fish-compatibility' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const articleJsonLd = generateArticleJsonLd({
    title: 'Marine Fish Compatibility, Pairing & Quarantine Acclimation Guide',
    description:
      'Authoritative guide to marine fish compatibility. Clownfish pairing biology, reef-safe classifications, tang temperament, and our 14-day quarantine protocol.',
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
            Fish Compatibility &amp; Quarantine
          </span>
        </nav>
      </div>

      {/* Header */}
      <header className="container-max pt-6 pb-12 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full">
            Livestock Ethology &amp; Husbandry
          </span>
          <span className="text-xs text-[--color-muted] font-mono">
            6 min read · Updated November 15, 2026
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-light max-w-4xl leading-tight">
          Marine Fish Compatibility Guide:<br />
          <em className="font-normal text-cyan-300">Pairing, Temperament &amp; Quarantine</em>
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
            Successful marine community aquariums depend on three rules: <strong>(1) Introducing fish with distinct ecological niches and body shapes</strong> to prevent territorial friction; <strong>(2) Pairing clownfish by selecting one dominant and one smaller juvenile specimen</strong> to leverage natural protandrous hermaphroditism; and <strong>(3) Enforcing a strict 14–21 day prophylactic quarantine</strong> to eliminate external parasites and condition fish to artificial diets before main tank introduction.
          </p>
        </div>

        {/* Section 1: Clownfish Biology & Pairing */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            1. Clownfish (Amphiprion) Pairing Dynamics
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            Clownfish are iconic members of any living marine reef. However, improper pairing frequently leads to severe fighting:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Biological Rule</span>
              <h3 className="font-display text-lg text-white mb-2">Protandrous Hermaphroditism</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                All Amphiprion species hatch as neuter juveniles and develop into males. In a social pair, the largest individual morphs into a sexually mature female. The secondary individual stays male, while subordinates remain non-reproductive.
              </p>
            </div>
            <div className="p-6 rounded-2xl border border-white/10 bg-[rgba(5,15,22,0.6)]">
              <span className="text-xl font-mono text-cyan-400 font-light block mb-2">Aquarium Protocol</span>
              <h3 className="font-display text-lg text-white mb-2">The Established Pair Method</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">
                We always supply bonded, swimming pairs acclimated together in our Kolkata quarantine studio. See our verified <Link href="/marketplace/pair-of-platinum-clownfish" className="text-cyan-400 underline hover:text-cyan-300">Pair of Platinum Clownfish</Link> for guaranteed harmony.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Reef-Safe Compatibility Matrix */}
        <section className="mb-14 space-y-4">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
            2. Marine Community Compatibility Matrix
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            The table below categorizes common marine species by reef compatibility and swimming level:
          </p>

          <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-white/5 text-cyan-300 uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-3 sm:p-4">Species Family</th>
                  <th className="p-3 sm:p-4">Reef Compatibility</th>
                  <th className="p-3 sm:p-4">Temperament</th>
                  <th className="p-3 sm:p-4">Key Husbandry Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Clownfish (Amphiprion)</td>
                  <td className="p-3 sm:p-4 text-emerald-400">100% Reef-Safe</td>
                  <td className="p-3 sm:p-4">Peaceful to Semi-Aggressive</td>
                  <td className="p-3 sm:p-4">Keep as bonded pairs or singles</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Yellow Tang (Zebrasoma)</td>
                  <td className="p-3 sm:p-4 text-emerald-400">100% Reef-Safe</td>
                  <td className="p-3 sm:p-4">Semi-Aggressive to similar tangs</td>
                  <td className="p-3 sm:p-4">Excellent filament algae grazer</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Flame Angel (Centropyge)</td>
                  <td className="p-3 sm:p-4 text-amber-400">Reef-Safe with Caution</td>
                  <td className="p-3 sm:p-4">Semi-Aggressive</td>
                  <td className="p-3 sm:p-4">May nip fleshy LPS corals if underfed</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Fairy Wrasse (Cirrhilabrus)</td>
                  <td className="p-3 sm:p-4 text-emerald-400">100% Reef-Safe</td>
                  <td className="p-3 sm:p-4">Peaceful Community</td>
                  <td className="p-3 sm:p-4">Requires jump-proof mesh aquarium lid</td>
                </tr>
                <tr>
                  <td className="p-3 sm:p-4 font-semibold text-white">Goby &amp; Pistol Shrimp Pair</td>
                  <td className="p-3 sm:p-4 text-emerald-400">100% Reef-Safe</td>
                  <td className="p-3 sm:p-4">Peaceful Bottom Dweller</td>
                  <td className="p-3 sm:p-4">Fascinating burrowing symbiosis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: Call to Action */}
        <div className="p-8 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-slate-900/60 my-12 text-center space-y-4">
          <span className="text-label text-cyan-400 block">QUARANTINED SPECIMEN SOURCING</span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-light">
            Acquire Certified Quarantine Marine Species
          </h3>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] max-w-xl mx-auto leading-relaxed">
            All livestock dispatched by Marine Creatures is acclimated under medical-grade quarantine protocols to guarantee robust health and immediate feeding.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/marketplace?category=marine-life" className="btn-primary text-xs uppercase tracking-wider">
              BROWSE LIVING SPECIES →
            </Link>
            <Link href="/shipping-policy" className="px-6 py-3.5 rounded-full border border-white/20 hover:border-cyan-400 text-xs font-semibold tracking-wider uppercase text-white transition-all">
              TRANSIT &amp; LIVE GUARANTEE
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
              Marine Fish Compatibility FAQs
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

