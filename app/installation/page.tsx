import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE_CONFIG } from '@/lib/config';
import {
  generateBreadcrumbJsonLd,
  generateServiceJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Turnkey Marine Aquarium Installation & Commissioning',
  description:
    'Professional marine aquarium installation by Marine Creatures. Structural floor load assessment, Schedule 80 plumbing, automated cycling, and livestock acclimation.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/installation`,
  },
  openGraph: {
    title: 'Turnkey Marine Aquarium Installation & Commissioning | Marine Creatures',
    description:
      'Precision architectural aquarium engineering from site assessment to biological handover.',
    url: `${SITE_CONFIG.url}/installation`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'Aquarium Installation — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Turnkey Marine Aquarium Installation | Marine Creatures',
    description:
      'Professional marine aquarium installation and life-support commissioning.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const STAGES = [
  {
    step: '01',
    title: 'Site Engineering & Floor Load Verification',
    desc: 'Structural engineer review for live weight load distribution (often 1,000kg+ per cubic meter), electrical isolation, and plumbing access channels.',
  },
  {
    step: '02',
    title: 'Cabinetry & Monolithic Tank Positioning',
    desc: 'Laser-leveled structural steel framing, anti-vibration neoprene bedding, and crane or robotic placement of acrylic/glass viewing panels.',
  },
  {
    step: '03',
    title: 'Precision Sump & Life Support Plumbing',
    desc: 'High-flow, whisper-quiet Schedule 80 PVC hard-plumbing with true union check valves, dual BeanAnimal overflow drains, and emergency backups.',
  },
  {
    step: '04',
    title: 'Reverse Osmosis Hydration & Salt Mixing',
    desc: 'Purified 0-TDS water production, laboratory grade reef salt synthesis, and thermal stabilization before any biological introduction.',
  },
  {
    step: '05',
    title: 'Aquascaping & Nitrogen Cycling',
    desc: 'Artistic underwater terrain sculpting followed by bio-augmentation to cultivate healthy beneficial bacteria colonies.',
  },
  {
    step: '06',
    title: 'Acclimation & VIP Client Handover',
    desc: 'Drip acclimation of quarantined marine life, IoT app pairing, and tailored operational orientation for your staff or household.',
  },
];

const INSTALLATION_FAQS = [
  {
    question: 'What happens during a new marine aquarium installation?',
    answer:
      'A new marine aquarium installation by Marine Creatures follows an exacting 6-stage architectural protocol: (1) Site engineering & live floor load assessment, (2) Laser-leveled cabinetry and monolithic tank positioning, (3) Acoustic-damped Schedule 80 PVC sump hard-plumbing with dual fail-safe BeanAnimal drains, (4) Zero-TDS reverse osmosis hydration and laboratory-grade reef salt synthesis, (5) Artistic living rock aquascaping and nitrogen cycle bacterial augmentation, and (6) Quarantined livestock introduction and smart IoT smartphone automation.',
  },
  {
    question: 'What affects the cost of a new marine aquarium installation?',
    answer:
      'Turnkey marine aquarium installations at Marine Creatures start from ₹35,000 for standard custom systems. The overall project cost is governed by tank dimensions and water volume, optical glass clarity (OptiWhite low-iron vs thermoformed monolithic acrylic), filtration complexity (DC variable-speed protein skimmers, auto-top-off, titanium chillers), smart app-controlled LED lighting intensity, and the rarity of quarantined livestock selected.',
  },
  {
    question: 'How long does the marine nitrogen cycling process take before introducing fish?',
    answer:
      'Biological nitrogen cycling typically takes 10 to 14 days under our bio-augmentation protocol. We inoculate the tank with live nitrifying bacteria strains and monitor ammonia (NH3) and nitrite (NO2) until both reach 0.0 ppm, ensuring safe conditions before any delicate marine species or corals are introduced.',
  },
  {
    question: 'What preparations should customers complete before installation day?',
    answer:
      'Before our white-glove installation crew arrives, ensure that the chosen installation site has verified structural floor load capacity (often exceeding 1,000 kg per cubic meter of water), two dedicated 15A/16A grounded electrical power points on a separate circuit breaker, clear transit corridors from entry to the placement zone, and access to a clean freshwater inlet for reverse osmosis filtration.',
  },
  {
    question: 'How are marine fish and corals quarantined before introduction?',
    answer:
      'All living marine specimens are acclimated and monitored in our specialized aquaculture quarantine facility in Kolkata for a minimum of 14 to 21 days. We verify active feeding, prophylactic pathogen screening, and optimal osmotic adaptation before VIP client delivery and drip acclimation.',
  },
];

export default function InstallationPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Installation', url: '/installation' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const serviceJsonLd = generateServiceJsonLd({
    name: 'Turnkey Marine Aquarium Installation & Life Support Commissioning',
    description:
      'Complete architectural marine aquarium installation including Schedule 80 plumbing, OptiWhite glass placement, automated cycling, and biological introduction. Turnkey projects start from ₹35,000.',
    url: '/installation',
    serviceType: 'AquariumInstallationService',
    startingPrice: 35000,
    priceCurrency: 'INR',
    priceDescription: 'Starting baseline price for turnkey bespoke marine aquarium installation',
  });
  const faqJsonLd = generateFaqJsonLd(INSTALLATION_FAQS);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
            Installation
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
          src="https://images.unsplash.com/photo-1612629808341-9de2462b1b8b?w=1920&q=85"
          alt="Aquarium Installation"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">ENGINEERING EXCELLENCE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Precision<br /><em>Installation.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-lg leading-relaxed" style={{ fontSize: '0.9375rem' }}>
            From structural load distribution to acoustic dampening, our engineering protocols ensure flawless installation with zero compromise.
          </p>
        </div>
      </div>

      {/* Process Section */}
      <div className="container-max pt-16 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">

          <div className="lg:col-span-5">
            <span className="text-label text-[--color-accent] block mb-3">OUR PROTOCOL</span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light leading-snug mb-4">
              Flawless execution at every millimeter.
            </h2>
            <div className="p-4 mb-6 rounded-xl border border-cyan-500/20 bg-cyan-950/20">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                CONFIRMED BASELINE PRICING
              </span>
              <span className="text-xl sm:text-2xl font-light text-white block">
                Starting from ₹35,000
              </span>
              <span className="text-[11px] text-[--color-muted] mt-1 block">
                Turnkey architectural installations scaled to your interior space and water volume.
              </span>
            </div>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-6" style={{ fontSize: '0.9375rem' }}>
              Marine installations require a rare synthesis of heavy civil engineering, delicate marine biochemistry, and immaculate architectural finish.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-8" style={{ fontSize: '0.9375rem' }}>
              Our dedicated white-glove installation crew ensures that every pipe, sensor, and cable is completely concealed while remaining effortlessly serviceable.
            </p>
            <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
              SCHEDULE A SITE INSPECTION →
            </Link>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {STAGES.map((stage) => (
              <div
                key={stage.step}
                className="p-6 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,184,217,0.3)] transition-colors duration-300 bg-[rgba(7,21,28,0.4)] flex gap-6"
              >
                <span className="text-label text-[--color-accent] shrink-0 font-body text-base mt-0.5">
                  {stage.step}
                </span>
                <div>
                  <h3 className="font-display text-xl text-[--color-text] font-light mb-2">
                    {stage.title}
                  </h3>
                  <p className="font-body font-light text-[--color-muted] text-xs leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Guarantee Banner */}
        <div className="p-10 border border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.6)] grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <span className="font-display text-3xl text-[--color-accent] block mb-2">100%</span>
            <span className="text-label text-[--color-muted]">LEAK-TESTED UNDER PRESSURE</span>
          </div>
          <div>
            <span className="font-display text-3xl text-[--color-accent] block mb-2">24/7</span>
            <span className="text-label text-[--color-muted]">EMERGENCY PROTOCOL SUPPORT</span>
          </div>
          <div>
            <span className="font-display text-3xl text-[--color-accent] block mb-2">10-YR</span>
            <span className="text-label text-[--color-muted]">STRUCTURAL SEAM WARRANTY</span>
          </div>
        </div>

        {/* ── Frequently Asked Questions (Answer Engine Optimization) ────────── */}
        <div className="mt-20 pt-16 border-t border-[rgba(255,255,255,0.08)]">
          <div className="max-w-3xl mb-12">
            <span className="text-label text-[--color-accent] block mb-2">
              EXPERT CONSULTATION &amp; SPECIFICATIONS
            </span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light">
              Frequently Asked Installation Questions
            </h2>
            <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-2">
              Everything you need to know about our turnkey architectural marine installations, structural requirements, and biological commissioning.
            </p>
          </div>

          <div className="space-y-4 max-w-4xl">
            {INSTALLATION_FAQS.map((faq, idx) => (
              <details
                key={idx}
                className="group p-6 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)] open:bg-[rgba(7,21,28,0.8)] open:border-cyan-500/30 transition-all duration-200"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none text-base sm:text-lg font-light text-[--color-text] group-hover:text-cyan-300">
                  <span className="pr-4">{faq.question}</span>
                  <span className="text-cyan-400 text-xl font-mono shrink-0 transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 font-body font-light text-xs sm:text-sm text-[--color-muted] leading-relaxed border-t border-[rgba(255,255,255,0.05)] pt-4">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

