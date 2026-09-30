import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd } from '@/lib/seo/structuredData';
import { PRODUCTS } from '@/lib/data/products';

export const metadata: Metadata = {
  title: 'Marine Aquarium Lighting & Nemo LED Systems',
  description:
    'Comprehensive guide to marine aquarium lighting, coral fluorescence, and NemoLight Extreme II smart LED fixtures (E450, E600, E900, E1200). Compare models, tank lengths, and app control.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/marketplace/lighting`,
  },
  openGraph: {
    title: 'Marine Aquarium Lighting & Nemo LED Systems | Marine Creatures',
    description:
      'Explore precision marine lighting. Nemo Extreme Series II smart LEDs (E450, E600, E900, E1200) with 4-channel Bluetooth app control and sliding rim brackets.',
    url: `${SITE_CONFIG.url}/marketplace/lighting`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/images/products/nemo-extreme-led.jpg`,
        width: 1200,
        height: 800,
        alt: 'Nemo Extreme Series II Smart Marine LED Light Family',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marine Aquarium Lighting & Nemo LED Systems | Marine Creatures',
    description:
      'Compare Nemo E450, E600, E900, and E1200 app-controlled marine aquarium lights.',
    images: [`${SITE_CONFIG.url}/images/products/nemo-extreme-led.jpg`],
  },
};

const NEMO_MODELS = [
  {
    model: 'Nemo E450',
    slug: 'nemo-e450',
    tankLength: '45–60 cm (1.5 – 2.0 ft)',
    power: '24W',
    control: '2.4G Bluetooth App (iOS / Android)',
    channels: '4 Independent Spectrum Channels',
    material: 'Aircraft-Grade Anodized Aluminum',
    mounting: 'Extendable Sliding Rim Brackets (up to 12mm glass)',
    useCase: 'Nano marine tanks, LPS/Soft coral nano reefs, clownfish pairs',
    inStock: true,
  },
  {
    model: 'Nemo E600',
    slug: 'nemo-e600',
    tankLength: '60–80 cm (2.0 – 2.6 ft)',
    power: '36W',
    control: '2.4G Bluetooth App (iOS / Android)',
    channels: '4 Independent Spectrum Channels',
    material: 'Aircraft-Grade Anodized Aluminum',
    mounting: 'Extendable Sliding Rim Brackets (up to 12mm glass)',
    useCase: 'Standard 2ft to 2.5ft marine community and mixed reef setups',
    inStock: true,
  },
  {
    model: 'Nemo E900',
    slug: 'nemo-e900',
    tankLength: '90–110 cm (3.0 – 3.6 ft)',
    power: '60W',
    control: '2.4G Bluetooth App (iOS / Android)',
    channels: '4 Independent Spectrum Channels',
    material: 'Aircraft-Grade Anodized Aluminum',
    mounting: 'Extendable Sliding Rim Brackets (up to 12mm glass)',
    useCase: '3-foot display aquariums, vibrant coral gardens, active tangs',
    inStock: true,
  },
  {
    model: 'Nemo E1200',
    slug: 'nemo-e1200',
    tankLength: '120–140 cm (4.0 – 4.6 ft)',
    power: '72W',
    control: '2.4G Bluetooth App (iOS / Android)',
    channels: '4 Independent Spectrum Channels',
    material: 'Aircraft-Grade Anodized Aluminum',
    mounting: 'Extendable Sliding Rim Brackets (up to 12mm glass)',
    useCase: 'Full 4-foot luxury living reef partitions and large biotope tanks',
    inStock: true,
  },
];

export default function LightingCategoryPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Marketplace', url: '/marketplace' },
    { name: 'Aquarium Lighting', url: '/marketplace/lighting' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'NemoLight Extreme Series II Marine LED Lights',
    description:
      'Verified specifications for Nemo E450, E600, E900, and E1200 app-controlled marine aquarium fixtures.',
    itemListElement: NEMO_MODELS.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.model,
      url: `${SITE_CONFIG.url}/marketplace/${item.slug}`,
    })),
  };

  const otherLightingProducts = PRODUCTS.filter(
    (p) => p.category === 'lighting-tech' && p.id !== 'nemo-extreme-led'
  );

  return (
    <div
      style={{
        background: 'var(--color-primary, #02070B)',
        minHeight: '100vh',
      }}
      className="pb-28"
    >
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="container-max pt-24 sm:pt-28 pb-4">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-400 flex-wrap"
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.url} className="flex items-center gap-2">
              {index < breadcrumbs.length - 1 ? (
                <>
                  <Link
                    href={crumb.url}
                    className="hover:text-cyan-400 transition-colors"
                  >
                    {crumb.name}
                  </Link>
                  <span className="opacity-40">/</span>
                </>
              ) : (
                <span className="text-cyan-400 font-medium" aria-current="page">
                  {crumb.name}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Hero Header */}
      <header className="container-max py-8 sm:py-12 border-b border-white/10">
        <div className="max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium uppercase tracking-wider">
            Precision Photosynthetic Spectrum
          </div>
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-light leading-tight">
            Marine Aquarium Lighting &amp;{' '}
            <em className="text-cyan-400 not-italic font-normal">Nemo LEDs</em>
          </h1>
          <p className="font-body text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            Lighting is the biological heartbeat of a marine aquarium. Captive
            corals rely on symbiotic zooxanthellae algae that demand targeted
            photosynthetically active radiation (PAR) spanning actinic blue,
            violet, and daylight spectrums. Explore the app-controlled NemoLight
            Extreme Series II and discover the exact model engineered for your
            tank dimensions.
          </p>
        </div>
      </header>

      {/* Technical Foundations Section */}
      <section className="container-max py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-display text-lg">
              01
            </div>
            <h2 className="text-white font-medium text-lg">
              Photosynthesis &amp; Coral Health
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Zooxanthellae inside coral tissue absorb light energy primarily
              between 420nm and 460nm (violet and deep royal blue). Balanced
              marine lighting fuels calcification and stimulates natural
              pigment fluorescence without promoting nuisance brown algae.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-display text-lg">
              02
            </div>
            <h2 className="text-white font-medium text-lg">
              Smartphone App Control
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              The Nemo Extreme Series II connects via 2.4G Bluetooth to iOS and
              Android devices. Hobbyists can program smooth 24-hour sunrise,
              midday peak, dusk, and lunar moonlight cycles to mirror real reef
              photoperiods.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-display text-lg">
              03
            </div>
            <h2 className="text-white font-medium text-lg">
              Thermal Engineering
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Crafted from extruded aircraft-grade aluminum, the unibody chassis
              acts as a passive heatsink. This silent thermal dissipation
              protects internal diodes without loud cooling fans that introduce
              vibration into living tanks.
            </p>
          </div>
        </div>
      </section>

      {/* Nemo Product Comparison Section */}
      <section className="container-max py-8 sm:py-12">
        <div className="mb-8 space-y-2">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-cyan-400 block">
            VERIFIED SPECIFICATION MATRIX
          </span>
          <h2 className="font-display text-2xl sm:text-4xl text-white font-light">
            Nemo Extreme Series II — Model Comparison
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Compare verified technical parameters across the 4 Nemo models to
            determine the proper fit for your tank span.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 shadow-2xl">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-slate-300 font-medium text-xs uppercase tracking-wider">
                <th className="py-4 px-4 sm:px-6">Model</th>
                <th className="py-4 px-4 sm:px-6">Recommended Tank Length</th>
                <th className="py-4 px-4 sm:px-6">Power Output</th>
                <th className="py-4 px-4 sm:px-6">Spectrum Channels</th>
                <th className="py-4 px-4 sm:px-6">Glass Fit</th>
                <th className="py-4 px-4 sm:px-6 text-right">Product Page</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {NEMO_MODELS.map((item) => (
                <tr
                  key={item.model}
                  className="hover:bg-cyan-500/[0.04] transition-colors"
                >
                  <td className="py-4 px-4 sm:px-6 font-semibold text-white">
                    <Link
                      href={`/marketplace/${item.slug}`}
                      className="text-cyan-400 hover:underline"
                    >
                      {item.model}
                    </Link>
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-slate-200">
                    {item.tankLength}
                  </td>
                  <td className="py-4 px-4 sm:px-6 font-mono text-cyan-300">
                    {item.power}
                  </td>
                  <td className="py-4 px-4 sm:px-6">{item.channels}</td>
                  <td className="py-4 px-4 sm:px-6 text-slate-400 text-xs">
                    Up to 12 mm
                  </td>
                  <td className="py-4 px-4 sm:px-6 text-right">
                    <Link
                      href={`/marketplace/${item.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-all"
                    >
                      View Specs &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Model Cards Grid */}
      <section className="container-max py-10 sm:py-16">
        <h2 className="font-display text-2xl sm:text-3xl text-white font-light mb-8">
          Explore Nemo Lighting Fixtures
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {NEMO_MODELS.map((m) => (
            <div
              key={m.model}
              className="p-6 rounded-2xl border border-white/10 bg-slate-900/70 flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition-all group"
            >
              <div className="space-y-3">
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-white/5">
                  <Image
                    src="/images/products/nemo-extreme-led.jpg"
                    alt={`${m.model} smart marine aquarium LED light`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[11px] font-mono bg-black/70 text-cyan-300 border border-cyan-500/30">
                    {m.power}
                  </div>
                </div>
                <h3 className="text-white font-medium text-lg">{m.model}</h3>
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-200">Tank Fit:</strong>{' '}
                  {m.tankLength}
                </p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {m.useCase}
                </p>
              </div>

              <div className="pt-3 border-t border-white/10">
                <Link
                  href={`/marketplace/${m.slug}`}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold py-2 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
                >
                  View {m.model} Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Alternative Lighting Solutions */}
      {otherLightingProducts.length > 0 && (
        <section className="container-max py-8 sm:py-12 border-t border-white/10">
          <h2 className="font-display text-2xl sm:text-3xl text-white font-light mb-6">
            Complementary Marine Lighting Fixtures
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherLightingProducts.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-white/10 bg-slate-900/50 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-mono">
                    {p.brand || 'Marine Lighting'}
                  </span>
                  <h3 className="text-white font-medium text-base">{p.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {p.shortDesc}
                  </p>
                </div>
                <Link
                  href={`/marketplace/${p.id}`}
                  className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                >
                  Explore Specifications &rarr;
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Internal Linking to Services & Engineering */}
      <section className="container-max py-12 sm:py-16 border-t border-white/10">
        <div className="p-8 sm:p-12 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/20 space-y-6">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">
              ARCHITECTURAL INTEGRATION &amp; RETROFITS
            </span>
            <h2 className="font-display text-2xl sm:text-4xl text-white font-light">
              Upgrading Existing Aquarium Lighting?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              If your current marine setup relies on outdated, power-hungry
              metal halides or aging fluorescent tubes, our senior curators
              provide custom LED spectrum retrofits through our{' '}
              <Link
                href="/renovation"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                Aquarium Renovation &amp; Revival
              </Link>{' '}
              program. For new residences, explore our turnkey{' '}
              <Link
                href="/aquarium-design"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                Bespoke Aquarium Design
              </Link>{' '}
              services.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all"
            >
              Consult a Marine Lighting Specialist
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 hover:border-white/40 text-white font-medium text-sm transition-all"
            >
              Browse Full Marketplace Catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
