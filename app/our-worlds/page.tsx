import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';
import { connectToDatabase } from '@/lib/db';
import CaseStudyModel from '@/models/CaseStudy';
import { INITIAL_CASE_STUDIES, ensureWorldsSeeded } from '@/lib/data/worlds';
import { serializePublicCaseStudy } from '@/lib/worlds/serializer';

export const metadata: Metadata = {
  title: 'Our Worlds — Architectural Living Reef Case Studies',
  description:
    'Explore completed bespoke marine environments by Marine Creatures. Architectural living reefs, custom acrylic monoliths, and turnkey engineering for private penthouses and estates.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/our-worlds`,
  },
  openGraph: {
    title: 'Our Worlds — Architectural Living Reef Case Studies | Marine Creatures',
    description:
      'Completed luxury marine aquariums, dual-sided living partitions, and bespoke coral reef monoliths across India.',
    url: `${SITE_CONFIG.url}/our-worlds`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'Our Worlds Architectural Case Studies — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Worlds — Architectural Case Studies | Marine Creatures',
    description:
      'Completed bespoke marine sanctuaries and custom living coral reef installations.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

async function getPublishedCaseStudies() {
  try {
    await connectToDatabase();
    await ensureWorldsSeeded();
    const docs = await CaseStudyModel.find({
      published: true,
      isArchived: { $ne: true },
    })
      .sort({ featured: -1, publishedAt: -1, createdAt: -1 })
      .lean();

    if (docs.length > 0) {
      return docs
        .map((d) => serializePublicCaseStudy(d))
        .filter((d): d is NonNullable<typeof d> => d !== null);
    }
  } catch (err) {
    console.error('[OurWorldsPage] Error loading published case studies:', err);
  }

  // Fallback to static seed
  return INITIAL_CASE_STUDIES.map((c) => serializePublicCaseStudy(c)).filter(
    (d): d is NonNullable<typeof d> => d !== null
  );
}

export default async function OurWorldsPage() {
  const caseStudies = await getPublishedCaseStudies();

  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Hello Marine Creatures, I would like to consult on commissioning an architectural aquarium project similar to your case studies.'
  )}`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Our Worlds', url: '/our-worlds' },
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
            Our Worlds
          </span>
        </nav>
      </div>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '60vh', minHeight: '440px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=85"
          alt="Our Worlds — Marine Creatures Case Studies"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.85) 75%, rgba(2,7,11,1) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-12 sm:pb-16">
          <span className="text-label text-[--color-accent] block mb-3">
            ARCHITECTURAL PORTFOLIO &amp; CASE STUDIES
          </span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light max-w-4xl leading-tight">
            Our Worlds.<br />
            <em className="font-normal text-cyan-300">Living Proof.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] leading-relaxed max-w-2xl mt-4 text-sm sm:text-base md:text-lg">
            Explore our commissioned marine sanctuaries across luxury residences, penthouses, and corporate boardrooms. Each project is an uncompromising fusion of marine biology, structural engineering, and spatial artistry.
          </p>
        </div>
      </div>

      {/* ── Case Studies Detailed Walkthrough ────────────────────────────── */}
      <div className="container-max pt-12 pb-32 space-y-28">
        {caseStudies.map((study, idx) => (
          <article
            key={study.id}
            id={study.slug || study.id}
            className="rounded-3xl border border-white/10 bg-[rgba(3,10,16,0.85)] backdrop-blur-2xl p-6 sm:p-10 lg:p-14 shadow-2xl overflow-hidden"
          >
            {/* Header: Project Name & Space Context */}
            <div className="border-b border-white/10 pb-8 mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-widest">
                    {study.eyebrow || `CASE STUDY 0${idx + 1}`}
                  </span>
                  <span className="text-xs text-[--color-muted]">•</span>
                  <span className="text-xs text-slate-300 font-medium">{study.scale}</span>
                </div>
                <h2 className="font-display text-2xl sm:text-4xl text-white font-light">
                  <Link
                    href={`/our-worlds/${study.slug}`}
                    className="hover:text-cyan-300 transition-colors"
                  >
                    {study.title}
                  </Link>
                </h2>
                {study.subtitle && (
                  <p className="text-sm sm:text-base text-cyan-300 mt-1 font-light">
                    {study.subtitle}
                  </p>
                )}
              </div>
              <div className="text-left lg:text-right">
                <span className="text-[11px] uppercase tracking-wider text-[--color-muted] block">Setting</span>
                <span className="text-xs sm:text-sm text-slate-200 block font-medium">{study.space}</span>
                {study.clientContext && (
                  <span className="text-[11px] text-[--color-muted] block mt-0.5">{study.clientContext}</span>
                )}
              </div>
            </div>

            {/* Main Visual Showcase */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-10 h-[300px] sm:h-[440px] lg:h-[520px] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={study.image}
                alt={study.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,7,11,0.7)] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex items-center justify-between pointer-events-none">
                <span className="text-xs font-mono text-white/80 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  {study.scale}
                </span>
                <span className="text-xs text-emerald-400 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-400/30 font-medium">
                  Verified Living Ecosystem
                </span>
              </div>
            </div>

            {/* Architectural Grid: Design Intent, Materials, Engineering, Marine World */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
              {/* Left Column: Design Intent & Result */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="text-label text-cyan-400 block mb-2">DESIGN INTENT</span>
                  <p className="font-body text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {study.designIntent}
                  </p>
                </div>

                <div className="p-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04]">
                  <span className="text-label text-emerald-400 block mb-2">PROJECT OUTCOME</span>
                  <p className="font-body text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {study.result}
                  </p>
                </div>

                {/* Marine World Specimen Profile */}
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                  <span className="text-label text-[--color-accent] block">LIVING BIODIVERSITY</span>
                  <div className="text-xs space-y-1.5">
                    <div>
                      <span className="text-[--color-muted] font-medium">Biome Profile: </span>
                      <span className="text-white">{study.marineWorld.biome}</span>
                    </div>
                    <div>
                      <span className="text-[--color-muted] font-medium">Specimen Stock: </span>
                      <span className="text-slate-200">{study.marineWorld.livestock}</span>
                    </div>
                    <div>
                      <span className="text-[--color-muted] font-medium">Curated Corals: </span>
                      <span className="text-slate-200">{study.marineWorld.corals}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Materials & Engineering */}
              <div className="lg:col-span-6 space-y-6">
                {/* Materials */}
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-label text-cyan-400 block mb-3">ARCHITECTURAL MATERIALS</span>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {study.materials.map((mat, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-cyan-400 font-bold shrink-0">▪</span>
                        <span>{mat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Life Support Engineering */}
                <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <span className="text-label text-emerald-400 block mb-3">LIFE SUPPORT &amp; ENGINEERING</span>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {study.engineering.map((eng, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span>{eng}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-[--color-muted]">
                Interested in a similar commission for your property?
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={`/our-worlds/${study.slug}`}
                  className="btn-primary text-center w-full sm:w-auto py-3 px-6 text-xs uppercase tracking-wider font-semibold"
                >
                  EXPLORE FULL CASE STUDY →
                </Link>
                <Link
                  href="/contact"
                  className="px-5 py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium text-xs tracking-wider uppercase transition-all w-full sm:w-auto text-center"
                >
                  DISCUSS THIS STUDY
                </Link>
              </div>
            </div>
          </article>
        ))}

        {/* ── Master Bottom CTA ───────────────────────────────────────────── */}
        <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-cyan-950/20 to-[rgba(3,13,20,0.95)] p-8 sm:p-14 text-center max-w-3xl mx-auto shadow-2xl space-y-6">
          <span className="text-label text-cyan-400 block">COMMISSION A LIVING SANCTUARY</span>
          <h2 className="font-display text-display-sm text-white font-light">
            Conceive Your Architectural Ocean
          </h2>
          <p className="font-body text-xs sm:text-base text-[--color-muted] leading-relaxed max-w-xl mx-auto">
            From initial spatial blueprints and structural load calculations to water fill and biological acclimation, Marine Creatures delivers complete turnkey living works of art.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/aquarium-design"
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <span>OPEN 7-STAGE WORLD BUILDER</span>
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl border border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs tracking-wider uppercase transition-all"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>CONNECT WITH FOUNDER SURAJ</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
