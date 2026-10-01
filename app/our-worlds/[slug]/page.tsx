import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';
import { connectToDatabase } from '@/lib/db';
import CaseStudyModel from '@/models/CaseStudy';
import { INITIAL_CASE_STUDIES, ensureWorldsSeeded } from '@/lib/data/worlds';
import { serializePublicCaseStudy } from '@/lib/worlds/serializer';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

/**
 * Generate Static Params for all published Case Studies
 */
export async function generateStaticParams() {
  try {
    await connectToDatabase();
    await ensureWorldsSeeded();
    const caseStudies = await CaseStudyModel.find({
      published: true,
      isArchived: { $ne: true },
    }).lean();

    if (caseStudies.length > 0) {
      return caseStudies.map((cs) => ({
        slug: cs.slug || cs.id,
      }));
    }
  } catch {
    // Fallback during static generation
  }

  return INITIAL_CASE_STUDIES.map((cs) => ({
    slug: cs.slug,
  }));
}

/**
 * Resolve Case Study by slug (handles canonical slugs and aliases)
 */
async function getCaseStudy(slug: string) {
  try {
    await connectToDatabase();
    await ensureWorldsSeeded();

    // Map common aliases to canonical slugs
    const slugMap: Record<string, string> = {
      'alipore-penthouse': 'alipore-penthouse-monolith',
      'salt-lake-corporate': 'sector-v-corporate-sanctuary',
      'ballygunge-villa': 'ballygunge-heritage-villa-reef',
    };

    const targetSlug = slugMap[slug] || slug;

    const doc = await CaseStudyModel.findOne({
      $or: [{ slug: targetSlug }, { id: targetSlug }, { slug }, { id: slug }],
      published: true,
      isArchived: { $ne: true },
    }).lean();

    if (doc) {
      return serializePublicCaseStudy(doc);
    }
  } catch (err) {
    console.error('[getCaseStudy] Error fetching case study:', err);
  }

  // Fallback to static seed if database unavailable
  const fallback = INITIAL_CASE_STUDIES.find(
    (c) => c.slug === slug || c.id === slug || (slug.includes('alipore') && c.id.includes('alipore')) || (slug.includes('sector-v') && c.id.includes('sector-v')) || (slug.includes('ballygunge') && c.id.includes('ballygunge'))
  );

  return fallback ? serializePublicCaseStudy(fallback) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudy(slug);

  if (!study) {
    return {
      title: 'Case Study Not Found | Marine Creatures',
      robots: { index: false, follow: false },
    };
  }

  const title = study.seoTitle || `${study.title} — Architectural Living Reef | Marine Creatures`;
  const description =
    study.seoDescription ||
    `${study.title}: ${study.scale}. ${study.designIntent} Turnkey bespoke marine engineering by Marine Creatures.`;

  const canonicalUrl = study.canonicalOverride || `${SITE_CONFIG.url}/our-worlds/${study.slug}`;
  const ogImg = study.ogImage || study.image || `${SITE_CONFIG.url}/og-image.jpg`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: !study.noIndex,
      follow: true,
    },
    openGraph: {
      title: study.ogTitle || title,
      description: study.ogDescription || description,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'en_IN',
      type: 'article',
      images: [
        {
          url: ogImg,
          width: 1600,
          height: 900,
          alt: study.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImg],
    },
  };
}

export default async function CaseStudyDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const study = await getCaseStudy(slug);

  if (!study) {
    notFound();
  }

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Our Worlds', url: '/our-worlds' },
    { name: study.title, url: `/our-worlds/${study.slug}` },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  // CreativeWork / Article Schema
  const creativeWorkJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: study.title,
    headline: study.subtitle || study.title,
    description: study.designIntent,
    image: study.image,
    creator: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    datePublished: study.publishedAt || '2025-01-01',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/our-worlds/${study.slug}`,
    },
  };

  const whatsappInquiryUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello Suraj, I am reviewing your case study "${study.title}" (${study.scale}) and would like to discuss commissioning an architectural living reef for my property.`
  )}`;

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Schema Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creativeWorkJsonLd) }}
      />

      {/* Preview Warning Banner if requested in preview mode */}
      {preview === 'true' && (
        <aside
          aria-label="Preview notice"
          className="bg-amber-500/10 border-b border-amber-500/30 text-amber-300 px-4 py-2.5 text-center text-xs font-mono flex items-center justify-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>ADMINISTRATIVE PREVIEW MODE — Unindexed &amp; Draft Governance</span>
        </aside>
      )}

      {/* Visual Breadcrumb Navigation */}
      <div className="container-max pt-24 sm:pt-28 pb-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-400"
        >
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <span className="opacity-40">/</span>
          <Link href="/our-worlds" className="hover:text-cyan-400 transition-colors">
            Our Worlds
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-cyan-400 font-medium truncate max-w-[200px] sm:max-w-none" aria-current="page">
            {study.title}
          </span>
        </nav>
      </div>

      {/* ── 01. HERO / THE PROJECT ────────────────────────────────────────── */}
      <section className="relative flex items-end overflow-hidden" style={{ minHeight: '65vh' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={study.image}
          alt={study.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(2,7,11,0.3) 0%, rgba(2,7,11,0.8) 65%, rgba(2,7,11,1) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-12 sm:pb-16 pt-32">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-widest px-2.5 py-1 rounded bg-cyan-400/10 border border-cyan-400/30">
              {study.eyebrow || 'ARCHITECTURAL PORTFOLIO'}
            </span>
            <span className="text-xs font-mono text-slate-300 px-2.5 py-1 rounded bg-black/50 border border-white/10">
              {study.scale}
            </span>
            {study.biome && (
              <span className="text-xs text-emerald-400 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                {study.biome}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl text-white font-light max-w-4xl leading-tight">
            {study.title}
          </h1>

          {study.subtitle && (
            <p className="text-base sm:text-xl text-cyan-300 font-light mt-3 max-w-2xl">
              {study.subtitle}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-6 mt-6 text-xs text-slate-300">
            <div>
              <span className="text-slate-500 uppercase block tracking-wider">Setting</span>
              <span className="font-medium text-slate-200">{study.space}</span>
            </div>
            {study.clientContext && (
              <div>
                <span className="text-slate-500 uppercase block tracking-wider">Context</span>
                <span className="font-medium text-slate-200">{study.clientContext}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 02. NARRATIVE BODY: THE SPACE & THE CONCEPT ───────────────────── */}
      <section className="container-max py-16 space-y-16">
        {/* Design Intent & Narrative Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-label text-cyan-400 block">THE ARCHITECTURAL VISION</span>
            <h2 className="font-display text-2xl sm:text-4xl text-white font-light">
              Design Intent &amp; Spatial Integration
            </h2>
            <p className="font-body text-sm sm:text-base text-slate-300 leading-relaxed">
              {study.designIntent}
            </p>
            {study.introduction && (
              <p className="font-body text-sm sm:text-base text-slate-400 leading-relaxed">
                {study.introduction}
              </p>
            )}
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[rgba(3,10,16,0.85)] p-6 sm:p-8 space-y-5">
            <h3 className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Project Factsheet
            </h3>
            <dl className="text-xs space-y-3">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-slate-400">Water Volume:</dt>
                <dd className="text-white font-mono font-medium">{study.aquariumVolume || study.scale}</dd>
              </div>
              {study.aquariumType && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <dt className="text-slate-400">Construction:</dt>
                  <dd className="text-white text-right">{study.aquariumType}</dd>
                </div>
              )}
              {study.biome && (
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <dt className="text-slate-400">Biotope:</dt>
                  <dd className="text-white text-right">{study.biome}</dd>
                </div>
              )}
              <div className="flex justify-between border-b border-white/5 pb-2">
                <dt className="text-slate-400">Location:</dt>
                <dd className="text-white text-right">{study.space}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Asset Verification:</dt>
                <dd className="text-emerald-400 font-medium">Verified Living Ecosystem</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Challenge & Engineering Concept if present */}
        {(study.challenge || study.concept) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {study.challenge && (
              <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3">
                <span className="text-label text-amber-400 block">THE STRUCTURAL CHALLENGE</span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {study.challenge}
                </p>
              </div>
            )}
            {study.concept && (
              <div className="p-6 sm:p-8 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.03] space-y-3">
                <span className="text-label text-cyan-400 block">THE LIVING CONCEPT</span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {study.concept}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── 03. BEFORE & AFTER TRANSFORMATION ────────────────────────────── */}
        {study.beforeAfter?.beforeImage && study.beforeAfter?.afterImage && (
          <div className="rounded-3xl border border-white/10 bg-[rgba(3,10,16,0.9)] p-6 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <span className="text-label text-emerald-400 block mb-1">TRANSFORMATION RECORD</span>
                <h3 className="font-display text-xl sm:text-3xl text-white font-light">
                  Before Commission vs Living Ocean
                </h3>
              </div>
              <span className="text-xs text-slate-400">Direct Architectural Comparison</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 block">
                  {study.beforeAfter.beforeLabel || 'Before Commission'}
                </span>
                <div className="rounded-2xl overflow-hidden border border-white/10 h-64 sm:h-80 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={study.beforeAfter.beforeImage}
                    alt={study.beforeAfter.beforeLabel || 'Before state'}
                    className="w-full h-full object-cover grayscale opacity-70"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded text-xs text-slate-300 font-mono">
                    Prior State
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-cyan-400 block font-semibold">
                  {study.beforeAfter.afterLabel || 'Completed Living Ocean'}
                </span>
                <div className="rounded-2xl overflow-hidden border border-cyan-400/30 h-64 sm:h-80 relative shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={study.beforeAfter.afterImage}
                    alt={study.beforeAfter.afterLabel || 'Living ocean state'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 bg-cyan-950/80 backdrop-blur-md px-3 py-1 rounded text-xs text-cyan-300 font-mono border border-cyan-400/30">
                    Living Commission
                  </div>
                </div>
              </div>
            </div>

            {study.beforeAfter.caption && (
              <p className="text-xs text-slate-400 italic text-center max-w-2xl mx-auto pt-2">
                {study.beforeAfter.caption}
              </p>
            )}
          </div>
        )}

        {/* ── 04. THE MARINE WORLD: LIVING BIODIVERSITY ─────────────────────── */}
        <div className="rounded-3xl border border-white/10 bg-[rgba(3,10,16,0.85)] p-6 sm:p-10 space-y-6">
          <span className="text-label text-[--color-accent] block">LIVING BIODIVERSITY &amp; BIOTOPE</span>
          <h3 className="font-display text-xl sm:text-3xl text-white font-light">
            Curated Marine Ecosystem
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block">
                Target Biome
              </span>
              <p className="text-xs sm:text-sm text-slate-200">
                {study.marineWorld.biome || study.biome || 'Indo-Pacific Shallow Coral Atoll'}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 block">
                Specimen Stock
              </span>
              <p className="text-xs sm:text-sm text-slate-200">
                {study.marineWorld.livestock || 'Quarantined pelagic & benthic specimens'}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-pink-400 block">
                Cultured Corals
              </span>
              <p className="text-xs sm:text-sm text-slate-200">
                {study.marineWorld.corals || 'SPS and LPS coral gardens'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 05. MATERIALS & ENGINEERING ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Architectural Materials */}
          {study.materials && study.materials.length > 0 && (
            <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <span className="text-label text-cyan-400 block">ARCHITECTURAL MATERIALS</span>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                {study.materials.map((mat, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-cyan-400 font-bold shrink-0">▪</span>
                    <span>{mat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Life Support Engineering */}
          {study.engineering && study.engineering.length > 0 && (
            <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/[0.02] space-y-4">
              <span className="text-label text-emerald-400 block">LIFE SUPPORT &amp; ENGINEERING</span>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                {study.engineering.map((eng, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{eng}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── 06. GALLERY ──────────────────────────────────────────────────── */}
        {study.gallery && study.gallery.length > 0 && (
          <div className="space-y-6">
            <span className="text-label text-cyan-400 block">PHOTOGRAPHIC ARCHIVE</span>
            <h3 className="font-display text-xl sm:text-3xl text-white font-light">
              Architectural Perspectives
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {study.gallery.map((img, i) => (
                <figure key={i} className="space-y-2">
                  <div className="rounded-2xl overflow-hidden border border-white/10 h-72 sm:h-96 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || `${study.title} perspective ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  {img.caption && (
                    <figcaption className="text-xs text-slate-400">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* ── 07. PROJECT OUTCOME ──────────────────────────────────────────── */}
        {study.result && (
          <div className="p-8 sm:p-12 rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/20 to-[rgba(3,10,16,0.9)] space-y-4 shadow-2xl">
            <span className="text-label text-emerald-400 block">PROJECT OUTCOME</span>
            <h3 className="font-display text-2xl sm:text-3xl text-white font-light">
              Execution Result &amp; Living State
            </h3>
            <p className="font-body text-sm sm:text-base text-slate-200 leading-relaxed max-w-3xl">
              {study.result}
            </p>
          </div>
        )}

        {/* ── 08. START YOUR WORLD CTA ────────────────────────────────────── */}
        <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-cyan-950/20 to-[rgba(3,13,20,0.95)] p-8 sm:p-14 text-center max-w-3xl mx-auto shadow-2xl space-y-6">
          <span className="text-label text-cyan-400 block">COMMISSION A LIVING SANCTUARY</span>
          <h2 className="font-display text-2xl sm:text-4xl text-white font-light">
            Conceive Your Architectural Ocean
          </h2>
          <p className="font-body text-xs sm:text-base text-slate-400 leading-relaxed max-w-xl mx-auto">
            From initial spatial blueprints and structural load calculations to water fill and biological acclimation, Marine Creatures delivers complete turnkey living works of art.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/aquarium-design"
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 text-xs uppercase tracking-wider font-semibold"
            >
              <span>OPEN 7-STAGE WORLD BUILDER</span>
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-emerald-400/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs tracking-wider uppercase transition-all"
            >
              <span>DISCUSS THIS SPECIFIC STUDY</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
