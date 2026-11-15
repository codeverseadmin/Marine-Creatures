import type { Metadata } from 'next';
import Link from 'next/link';
import { SERVICES_DATA } from '@/lib/data/services';
import { BookingForm } from '@/components/services/BookingForm';
import { SITE_CONFIG } from '@/lib/config';
import {
  generateBreadcrumbJsonLd,
  generateServiceJsonLd,
  generateFaqJsonLd,
} from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Marine Aquarium Services, Installation & Maintenance',
  description:
    'Comprehensive marine aquarium engineering services: turnkey installations, living marine reef renovations, and white-glove biological concierge maintenance by certified marine curators.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/services`,
  },
  openGraph: {
    title: 'Marine Aquarium Services, Installation & Maintenance | Marine Creatures',
    description:
      'Turnkey luxury aquarium installation, biological renovation, and ongoing marine concierge maintenance.',
    url: `${SITE_CONFIG.url}/services`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'Marine Aquarium Services — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marine Aquarium Services | Marine Creatures',
    description:
      'Turnkey luxury aquarium installation, biological renovation, and ongoing marine concierge maintenance.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const SERVICES_FAQS = [
  {
    question: 'How frequently should a luxury marine aquarium be maintained?',
    answer:
      'We recommend scheduled care visits every 14 days (bi-weekly) for living coral reef systems, or weekly for densely stocked predator setups. Routine care includes pre-mixed 0-TDS RO/DI and probiotic salt water changes, testing alkalinity, calcium, magnesium, nitrate, and phosphate, replacing chemical adsorption media, and cleaning protein skimmers.',
  },
  {
    question: 'What are the confirmed starting prices for Marine Creatures services?',
    answer:
      'Turnkey bespoke marine aquarium installations start from ₹35,000 INR. Aquarium renovation, glass scratch polishing, and biological revivals start from ₹15,000 INR. Ongoing White-Glove Marine Concierge maintenance subscriptions start from ₹18,500 / month INR.',
  },
  {
    question: 'Which areas do Marine Creatures service for on-site aquarium care?',
    answer:
      'Marine Creatures provides direct on-site installation, renovation, and concierge maintenance throughout the Kolkata Metropolitan Area (including Alipore, Ballygunge, Salt Lake / Sector V, New Town, Southern Avenue, and Park Street) and across West Bengal. Specialized architectural consultations are also available for luxury projects across Eastern India.',
  },
  {
    question: 'What is included in an on-site forensic diagnostic assessment?',
    answer:
      'During an on-site assessment, Founder Suraj Shasmal inspects structural load distribution, tests water chemistry across 7 critical parameters, analyzes existing pump flow dynamics and acoustic dampening, checks electrical grounding, and delivers a fixed-scope engineering blueprint.',
  },
  {
    question: 'What emergency support does Marine Creatures provide for clients?',
    answer:
      'All concierge maintenance clients receive 24/7 priority emergency response support with an on-site arrival window for sudden equipment failures, power disruptions, or life-support malfunctions.',
  },
];

export default function ServicesPage() {
  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Services', url: '/services' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const installationServiceJsonLd = generateServiceJsonLd({
    name: 'Turnkey Marine Aquarium Installation & Commissioning',
    description:
      'Architectural living reef installations tailored to your interior space. Includes precision structural planning, Schedule 80 plumbing, and biological commissioning. Starts from ₹35,000.',
    url: '/installation',
    serviceType: 'AquariumInstallationService',
    startingPrice: 35000,
    priceCurrency: 'INR',
    priceDescription: 'Starting baseline price for turnkey bespoke marine aquarium installation',
  });
  const renovationServiceJsonLd = generateServiceJsonLd({
    name: 'Aquarium Renovation & Biological Restoration',
    description:
      'Complete ecosystem revival without replacing your cabinetry or tank. Features optical glass scratch removal, silent DC filtration upgrades, and zero-loss livestock relocation. Starts from ₹15,000.',
    url: '/renovation',
    serviceType: 'AquariumRenovationService',
    startingPrice: 15000,
    priceCurrency: 'INR',
    priceDescription: 'Starting baseline price for marine aquarium renovation and revival',
  });
  const faqJsonLd = generateFaqJsonLd(SERVICES_FAQS);

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(installationServiceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(renovationServiceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Visual Breadcrumbs */}
      <div className="container-max pt-24 sm:pt-28 pb-2">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-slate-400"
        >
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Home
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-cyan-400 font-medium" aria-current="page">
            Services
          </span>
        </nav>
      </div>
      {/* Hero Header */}
      <div className="relative pt-28 sm:pt-36 md:pt-44 pb-12 sm:pb-20 border-b border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,184,217,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="container-max relative z-10">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-2 sm:mb-3">
            MASTER ENGINEERING &amp; BIOLOGICAL SERVICES
          </span>
          <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-white font-light mb-3 sm:mb-4">
            Installation &amp;<br /><em>Renovation Services.</em>
          </h1>
          <p className="font-body text-base md:text-lg text-[--color-muted] max-w-2xl leading-relaxed">
            Whether you are commissioning a monumental architectural living reef or revitalizing an existing troubled setup, our senior marine curators deliver perfection.
          </p>
        </div>
      </div>

      {/* Services Showcase Cards */}
      <div className="container-max py-12 sm:py-20 space-y-12 sm:space-y-20">
        {SERVICES_DATA.map((service) => (
          <div
            key={service.id}
            id={service.id}
            className="rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[rgba(5,15,22,0.85)] p-6 sm:p-10 md:p-14 backdrop-blur-2xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start glass-card-hover"
          >
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-5 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <span className="text-xs uppercase tracking-widest font-semibold text-[--color-accent] bg-[rgba(0,184,217,0.12)] px-3.5 py-1.5 rounded-xl border border-[rgba(0,184,217,0.3)]">
                  {service.badge}
                </span>
                <span className="text-xs sm:text-sm text-[--color-muted]">
                  Starting From: <strong className="text-white text-sm sm:text-base">{service.priceStartingFrom}</strong>
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-4xl text-white font-light">
                {service.name}
              </h2>

              <p className="font-body text-base sm:text-lg text-[--color-muted] leading-relaxed">
                {service.description}
              </p>

              {/* Inclusions */}
              <div className="pt-2">
                <span className="text-xs uppercase tracking-wider text-[--color-accent] font-semibold block mb-3.5">
                  INCLUDED IN SERVICE
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
                  {service.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg
                        className="w-4 h-4 text-[--color-accent] shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Protocol Stages */}
              <div className="pt-4">
                <span className="text-xs uppercase tracking-wider text-[--color-accent] font-semibold block mb-3.5">
                  5-STAGE EXECUTION PROTOCOL
                </span>
                <div className="space-y-3">
                  {service.stages.map((st) => (
                    <div
                      key={st.step}
                      className="p-4 sm:p-5 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(2,7,11,0.5)] flex items-start gap-4 text-xs sm:text-sm"
                    >
                      <span className="text-xs font-semibold text-[--color-accent] tracking-wider shrink-0 mt-0.5">
                        {st.step}
                      </span>
                      <div>
                        <span className="text-white font-medium block">{st.title}</span>
                        <span className="text-xs text-[--color-muted] mt-0.5 block">{st.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Photo & Guarantees */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-3xl overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-2xl" style={{ aspectRatio: '16/10' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.6)] space-y-4">
                <span className="text-xs uppercase tracking-widest text-[--color-accent] font-semibold block">
                  COMMISSION GUARANTEES
                </span>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  {service.guarantees.map((g, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <svg
                        className="w-4 h-4 text-emerald-400 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#booking-portal"
                className="btn-primary w-full text-center block text-xs tracking-wider uppercase font-semibold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform"
              >
                SCHEDULE {service.name.toUpperCase()} →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* ── Frequently Asked Questions (Answer Engine Optimization) ────────── */}
      <div className="container-max pb-20">
        <div className="pt-16 border-t border-[rgba(255,255,255,0.08)]">
          <div className="max-w-3xl mb-12">
            <span className="text-label text-[--color-accent] block mb-2">
              SERVICE POLICIES &amp; PRICING SPECIFICATIONS
            </span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light">
              Frequently Asked Service Questions
            </h2>
            <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-2">
              Authoritative answers regarding maintenance frequency, baseline installation and renovation pricing, and emergency coverage across Kolkata.
            </p>
          </div>

          <div className="space-y-4 max-w-4xl">
            {SERVICES_FAQS.map((faq, idx) => (
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

      {/* Booking Form Section */}
      <div id="booking-portal" className="container-max pb-28 sm:pb-36 pt-8">
        <div className="mb-10 sm:mb-14 text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-2 sm:mb-3">
            ONLINE RESERVATION &amp; SITE SURVEY
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light mb-3">
            Book Your Consultation
          </h2>
          <p className="font-body text-base sm:text-lg text-[--color-muted]">
            Fill in your property details below to reserve an engineering consultation with our senior biological curators.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <BookingForm />
        </div>
      </div>
    </div>
  );
}

