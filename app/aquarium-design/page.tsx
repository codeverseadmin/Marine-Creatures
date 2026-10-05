import type { Metadata } from 'next';
import Link from 'next/link';
import { AquariumEstimator } from '@/components/services/AquariumEstimator';

import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd, generateServiceJsonLd } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Bespoke Aquarium Design & Engineering',
  description:
    'Custom architectural marine aquarium design for luxury residences and commercial spaces. Structural OptiWhite glass, acrylic monoliths, and closed-loop filtration.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/aquarium-design`,
  },
  openGraph: {
    title: 'Bespoke Aquarium Design & Engineering | Marine Creatures',
    description:
      'Living architectural sanctuaries tailored to your interior architecture. Custom glass & acrylic marine aquariums with turnkey life-support engineering.',
    url: `${SITE_CONFIG.url}/aquarium-design`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'Bespoke Aquarium Design — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bespoke Aquarium Design & Engineering | Marine Creatures',
    description:
      'Architectural marine aquariums for private estates and luxury interiors.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const DESIGN_PILLARS = [
  {
    number: '01',
    title: 'Architectural Integration',
    desc: 'Seamlessly embedding custom aquaria into walls, room dividers, reception desks, and freestanding luxury centerpieces.',
    image: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=800&q=80',
  },
  {
    number: '02',
    title: 'Precision Ecosystem Engineering',
    desc: 'Custom closed-loop filtration, silent pumps, automated dosing, and spectrum-tuned coral reef lighting systems.',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80',

  },
  {
    number: '03',
    title: 'Bespoke Aquascaping',
    desc: 'Handcrafted ceramic reef architecture and cured Tonga branching rock structured to create dramatic depth and swimming channels.',
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
  },
  {
    number: '04',
    title: 'Curated Marine Biodiversity',
    desc: 'Harmonious cohabitation plans combining rare coral frags, symbiotic invertebrates, and exquisite schooling reef fish.',
    image: 'https://images.unsplash.com/photo-1601459427108-47e20b8dcd65?w=800&q=80',
  },
];

const SPECIFICATIONS = [
  {
    label: 'Ultra-Clear OptiWhite™ Glass',
    detail: 'Low-iron museum-grade glass with up to 99% light transmission for true color rendition with zero green hue tint.',
  },
  {
    label: 'Cast Acrylic Monoliths',
    detail: 'Seamless curved viewing panels up to 100mm thickness for large-scale and high-pressure luxury installations.',
  },
  {
    label: 'Titanium Closed Loops',
    detail: 'Corrosion-proof titanium chillers, silent brushless DC flow generators, and magnetic wavemakers.',
  },
  {
    label: 'Intelligent IoT Controllers',
    detail: 'Cloud-connected continuous water chemistry monitoring with real-time alerts for salinity, pH, ORP, and temperature.',
  },
];

export default function AquariumDesignPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Aquarium Design', url: '/aquarium-design' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const serviceJsonLd = generateServiceJsonLd({
    name: 'Bespoke Architectural Aquarium Design & Engineering',
    description:
      'Turnkey custom marine aquarium design integrating structural OptiWhite glass, acrylic monoliths, and automated life-support systems.',
    url: '/aquarium-design',
    serviceType: 'AquariumDesignService',
  });

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
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
            Aquarium Design
          </span>
        </nav>
      </div>

      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '65vh', minHeight: '480px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&q=85"
          alt="Bespoke Aquarium Design"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">BESPOKE SERVICES</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Aquarium<br /><em>Design & Engineering.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-lg leading-relaxed text-base md:text-lg">
            Where architectural ambition meets marine science. Every installation is a living masterwork conceived specifically for your space.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-max pt-16 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">

          <div className="lg:col-span-6">
            <span className="text-label text-[--color-accent] block mb-3">OUR PHILOSOPHY</span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light leading-snug mb-8">
              Every space has a rhythm. We design the ocean to inhabit it.
            </h2>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-6 text-base md:text-lg">
              A luxury marine aquarium is not merely a tank of water; it is a dynamic living canvas that commands attention, inspires tranquility, and redefines luxury interiors.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-8 text-base md:text-lg">
              We collaborate directly with architects, interior designers, and discerning private clients from structural feasibility through to first water fill and biological maturation.
            </p>
            <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
              START A PROJECT →
            </Link>
          </div>

          <div className="lg:col-span-6 space-y-4">
            {SPECIFICATIONS.map((spec, i) => (
              <div
                key={spec.label}
                className="p-6 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,184,217,0.3)] transition-colors duration-300 bg-[rgba(255,255,255,0.01)]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-label text-[--color-accent]">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="font-display text-xl text-[--color-text] font-light">{spec.label}</h3>
                </div>
                <p className="font-body font-light text-[--color-muted] text-xs leading-relaxed pl-7">
                  {spec.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Estimator Configurator */}
        <div className="mb-24">
          <AquariumEstimator />
        </div>

        {/* Pillars Grid */}
        <div className="pt-16 border-t border-[rgba(255,255,255,0.06)]">
          <span className="text-label text-[--color-accent] block mb-4">DESIGN METHODOLOGY</span>
          <h2 className="font-display text-display-md text-[--color-text] font-light mb-12">
            The Pillars of Excellence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {DESIGN_PILLARS.map((pillar) => (
              <div
                key={pillar.number}
                className="group border border-[rgba(255,255,255,0.06)] p-8 bg-[rgba(7,21,28,0.4)] hover:border-[rgba(0,184,217,0.3)] transition-all duration-300"
              >
                <div className="overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pillar.image}
                    alt={pillar.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
                <span className="text-label text-[--color-accent] block mb-2">{pillar.number}</span>
                <h3 className="font-display text-2xl text-[--color-text] font-light mb-3 group-hover:text-[--color-accent] transition-colors">
                  {pillar.title}
                </h3>
                <p className="font-body font-light text-[--color-muted] text-sm leading-relaxed">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-24 p-12 border border-[rgba(0,184,217,0.2)] bg-[radial-gradient(ellipse_at_center,rgba(0,184,217,0.08)_0%,transparent_70%)] text-center">
          <span className="text-label text-[--color-accent] block mb-3">BESPOKE INQUIRY</span>
          <h2 className="font-display text-display-sm text-[--color-text] font-light mb-6">
            Have a custom space in mind?
          </h2>
          <p className="font-body font-light text-[--color-muted] max-w-lg mx-auto mb-8 text-sm leading-relaxed">
            Our design team provides initial spatial renderings, structural calculations, and equipment specifications tailored to your floor plan.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
              BOOK A DESIGN CONSULTATION →
            </Link>
            <Link href="/services" className="btn-ghost inline-flex" data-cursor="VIEW">
              EXPLORE SERVICES →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

