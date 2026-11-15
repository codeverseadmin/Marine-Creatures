import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Marine Aquarium Guides, Chemistry & Buying Knowledge Hub',
  description:
    'Authoritative marine aquarium guides, water chemistry standards, lighting spectrum analyses, and equipment selection protocols curated by Marine Creatures.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/guides`,
  },
  openGraph: {
    title: 'Marine Aquarium Guides, Chemistry & Buying Knowledge Hub | Marine Creatures',
    description:
      'Master marine biology standards, water parameters, installation cost factors, and reef lighting guidelines.',
    url: `${SITE_CONFIG.url}/guides`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Marine Creatures Knowledge Base & Buying Guides',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marine Aquarium Knowledge Hub | Marine Creatures',
    description:
      'Authoritative marine aquarium setup guides, water parameters, and installation cost analyses.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const GUIDES = [
  {
    slug: 'marine-aquarium-setup-guide',
    title: 'Marine Aquarium Setup & Water Chemistry Standards',
    category: 'Marine Education',
    readTime: '8 min read',
    summary:
      'Direct specifications for salinity, alkalinity (8–9 dKH), calcium, magnesium, and biological nitrogen cycle stages before introducing live fish.',
    keyQuestion: 'What are the essential water parameters and biological stages for setting up a marine aquarium?',
  },
  {
    slug: 'aquarium-installation-cost-factors',
    title: 'What Affects Marine Aquarium Installation Cost in India?',
    category: 'Buying Guide & Pricing',
    readTime: '6 min read',
    summary:
      'Transparent analysis of tank volume, OptiWhite glass vs acrylic panels, Schedule 80 plumbing, and equipment tiers. Turnkey installations start from ₹35,000.',
    keyQuestion: 'How much does a bespoke luxury marine aquarium installation cost and what drives the pricing?',
  },
  {
    slug: 'reef-tank-lighting-par-guide',
    title: 'Reef Tank Lighting & PAR Selection for Living Corals',
    category: 'Equipment & Lighting',
    readTime: '7 min read',
    summary:
      'How to choose aquarium lighting: understanding Photosynthetic Active Radiation (PAR), 395nm UV, royal blue spectrum channels, and photoperiod timing.',
    keyQuestion: 'What PAR and light spectrum do photosynthetic corals require for growth and vibrant fluorescence?',
  },
  {
    slug: 'marine-fish-compatibility',
    title: 'Marine Fish Compatibility, Pairing & Quarantine Acclimation',
    category: 'Livestock & Husbandry',
    readTime: '6 min read',
    summary:
      'Proven compatibility matrices for clownfish pairs, tangs, and angelfish, paired with our 14-day quarantine prophylactic protocol.',
    keyQuestion: 'Which marine fish can live peacefully together in a home reef aquarium without aggression?',
  },
];

export default function GuidesPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides & Knowledge Hub', url: '/guides' },
  ];
  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Visual Breadcrumbs */}
      <div className="container-max pt-24 sm:pt-28 pb-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-400"
        >
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-cyan-400 font-medium" aria-current="page">
            Guides &amp; Knowledge Hub
          </span>
        </nav>
      </div>

      {/* Header */}
      <div className="container-max pt-8 pb-16 border-b border-white/10">
        <span className="text-label text-[--color-accent] block mb-3">
          SCIENTIFIC &amp; ARCHITECTURAL KNOWLEDGE BASE
        </span>
        <h1 className="font-display text-display-md text-white font-light max-w-3xl leading-tight">
          Marine Aquarium Guides &amp;<br />
          <em className="font-normal text-cyan-300">Technical Standards.</em>
        </h1>
        <p className="font-body text-base sm:text-lg text-[--color-muted] max-w-2xl mt-4 leading-relaxed">
          Comprehensive, answer-ready educational resources for saltwater aquarists, luxury homeowners, and architectural designers. Curated by Marine Creatures studio in Kolkata.
        </p>
      </div>

      {/* Guides Grid */}
      <div className="container-max py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {GUIDES.map((guide) => (
            <article
              key={guide.slug}
              className="p-8 rounded-3xl border border-white/10 bg-[rgba(5,15,22,0.7)] backdrop-blur-xl hover:border-cyan-400/40 transition-all duration-300 flex flex-col justify-between group shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1 rounded-full">
                    {guide.category}
                  </span>
                  <span className="text-xs text-[--color-muted] font-mono">
                    {guide.readTime}
                  </span>
                </div>
                <h2 className="font-display text-2xl text-white font-light group-hover:text-cyan-300 transition-colors mb-3">
                  <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                </h2>
                <div className="p-3 mb-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] font-mono text-[--color-accent] uppercase tracking-wider block mb-1">
                    PRIMARY QUESTION ANSWERED
                  </span>
                  <p className="text-xs text-slate-300 italic">
                    &ldquo;{guide.keyQuestion}&rdquo;
                  </p>
                </div>
                <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed mb-6">
                  {guide.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <Link
                  href={`/guides/${guide.slug}`}
                  className="text-xs font-semibold tracking-wider uppercase text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 transition-colors"
                >
                  <span>READ COMPLETE GUIDE</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <span className="text-[11px] text-[--color-muted]">Reviewed Nov 2026</span>
              </div>
            </article>
          ))}
        </div>

        {/* Studio Assistance Callout */}
        <div className="mt-20 p-8 sm:p-12 rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 to-slate-900/40 max-w-4xl mx-auto text-center space-y-4">
          <span className="text-label text-cyan-400 block">PRIVATE CONSULTATION</span>
          <h3 className="font-display text-2xl sm:text-3xl text-white font-light">
            Need Expert Biological or Engineering Advice for Your Space?
          </h3>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] max-w-xl mx-auto leading-relaxed">
            Speak directly with Founder Suraj Shasmal for on-site water chemistry diagnosis, turnkey aquarium installation planning (from ₹35,000), or tank restoration (from ₹15,000).
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className="btn-primary text-xs tracking-wider uppercase">
              RESERVE ON-SITE SURVEY →
            </Link>
            <Link
              href="/installation"
              className="px-6 py-3.5 rounded-full border border-white/20 hover:border-cyan-400 text-xs font-semibold tracking-wider uppercase text-white transition-all"
            >
              EXPLORE INSTALLATIONS
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

