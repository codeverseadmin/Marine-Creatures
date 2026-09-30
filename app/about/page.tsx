import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'About Our Studio — Marine Biology & Architectural Aquariums',
  description:
    'Marine Creatures is a luxury marine design house in Kolkata creating living underwater environments. Our story, philosophy, marine biological expertise, and master craftsmanship.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/about`,
  },
  openGraph: {
    title: 'About Our Studio — Marine Biology & Architectural Aquariums | Marine Creatures',
    description:
      'Where architectural ambition meets marine science. Discover the ethos and expertise behind Marine Creatures.',
    url: `${SITE_CONFIG.url}/about`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'About Marine Creatures Studio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Marine Creatures Studio',
    description:
      'Luxury marine design house creating living underwater environments.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const VALUES = [
  { title: 'Marine Biology Expertise', desc: 'In-house marine biologists ensuring ideal water chemistry, symbiotic coral pairings, and healthy livestock longevity.' },
  { title: 'Master Craftsmanship', desc: 'Precision cabinetry, concealed Schedule 80 plumbing, and monolithic viewing panels engineered for decades of reliability.' },
  { title: 'Architectural Harmony', desc: 'Aesthetic designs developed in synergy with luxury interior palettes, custom lighting moods, and spatial acoustics.' },
  { title: 'Lifecycle Concierge', desc: 'Dedicated 24/7 water monitoring, routine automated salt-water exchange, and white-glove ongoing care.' },
];

export default function AboutPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
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
            About
          </span>
        </nav>
      </div>

      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '70vh', minHeight: '520px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1542496658-e33a6d0d4f17?w=1920&q=85"
          alt="Marine Creatures — About"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.1) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">OUR STORY & HERITAGE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Beyond<br /><em>The Glass.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-xl text-base md:text-lg leading-relaxed">
            We believe an aquarium is never just a vessel of water — it is a living, breathing architectural sanctuary that elevates the human spirit.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-max pt-16 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">

          <div className="lg:col-span-5">
            <p className="font-display text-display-sm text-[--color-text] font-light italic leading-relaxed mb-8">
              &ldquo;We Don&apos;t Just Build Aquariums. We Create Living Worlds.&rdquo;
            </p>
            <div className="accent-line mb-8" />
            <p className="font-body font-light text-[--color-muted] leading-relaxed mb-6 text-base md:text-lg">
              Founded on the belief that marine beauty should be experienced in its purest, most authentic form, Marine Creatures unites marine biology, fluid dynamics, and luxury architectural design.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-relaxed mb-8 text-base md:text-lg">
              Every installation we deliver is completely custom-engineered — ensuring healthy ecosystems that flourish effortlessly while offering a transcendent visual focal point.
            </p>
            <div className="grid grid-cols-2 gap-4 border-t border-[rgba(255,255,255,0.06)] pt-6">
              <div>
                <span className="font-display text-3xl text-[--color-accent] block">15+</span>
                <span className="text-label text-[--color-muted]">YEARS IN OCEAN DESIGN</span>
              </div>
              <div>
                <span className="font-display text-3xl text-[--color-accent] block">200+</span>
                <span className="text-label text-[--color-muted]">WORLDS DELIVERED</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1570126618953-d437176e8c79?w=900&q=85"
              alt="Marine expertise"
              className="w-full object-cover mb-8 border border-[rgba(255,255,255,0.06)]"
              style={{ aspectRatio: '16/10' }}
              loading="lazy"
            />

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="p-6 border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)]">
                  <h3 className="font-display text-lg text-[--color-accent] font-light mb-2">{v.title}</h3>
                  <p className="font-body font-light text-[--color-muted] text-sm sm:text-base leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 pt-16 border-t border-[rgba(255,255,255,0.06)] text-center">
          <h2 className="font-display text-display-md text-[--color-text] font-light mb-6">
            Ready to Begin Your Commission?
          </h2>
          <p className="font-body font-light text-[--color-muted] max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Contact our senior consultants to schedule an exploratory session and architectural review.
          </p>
          <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
            START A PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}

