import type { Metadata } from 'next';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';
import { SITE_CONFIG } from '@/lib/config';
import { generateBreadcrumbJsonLd, generateServiceJsonLd } from '@/lib/seo/structuredData';

export const metadata: Metadata = {
  title: 'Aquarium Renovation & Biological Restoration',
  description:
    'Turn troubled, scratched, or algae-covered aquariums into pristine living centerpieces. Glass scratch removal, silent DC pump & NemoLight LED retrofits, and zero-livestock-loss protocol.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/renovation`,
  },
  openGraph: {
    title: 'Aquarium Renovation & Biological Restoration | Marine Creatures',
    description:
      'Revive your existing aquarium without tearing down cabinetry. Optical glass polishing, nitrogen recycling, and Nemo LED retrofitting.',
    url: `${SITE_CONFIG.url}/renovation`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'Aquarium Renovation & Restoration — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aquarium Renovation & Restoration | Marine Creatures',
    description:
      'Transform troubled aquariums into pristine marine centerpieces without tearing down cabinetry.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

const PILLARS = [
  {
    title: 'Millwork & Glass Preservation',
    description: 'Keep your custom architectural cabinetry, wall insets, and structural glass intact.',
    icon: (
      <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Zero Livestock Loss Protocol',
    description: 'Existing fish and corals are carefully housed in mobile, climate-controlled staging pods during restoration.',
    icon: (
      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'Whisper-Quiet Life Support',
    description: 'Antiquated pumps and leaking joints replaced with sound-damped DC variable flow under 28 decibels.',
    icon: (
      <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
      </svg>
    ),
  },
  {
    title: 'Museum-Grade Optical Clarity',
    description: 'Complete eradication of cyanobacteria, hair algae, and yellowing organics for diamond-pure reef water.',
    icon: (
      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
];

const DIMENSIONS = [
  {
    step: '01',
    title: 'Biological Restoration',
    subtitle: 'Micro-Biome Reset & Detoxification',
    description:
      'We eradicate chronic nuisance dinoflagellates, cyanobacteria, and bubble algae without harsh synthetic biocides. Live rock is biochemically rejuvenated and inoculated with diverse nitrifying strains to establish resilient biological stability.',
  },
  {
    step: '02',
    title: 'Life Support Modernization',
    subtitle: 'Whisper-Quiet Filtration & Plumbing',
    description:
      'We strip out failing sumps and corroded unions. In their place, we engineer schedule-80 silicone manifold plumbing, high-efficiency DC protein skimmers, auto-top-off reservoirs, and titanium climate-control chillers.',
  },
  {
    step: '03',
    title: 'Spectrum & Hydrodynamic Tuning',
    subtitle: 'Target PAR & Turbulent Flow',
    description:
      'Legacy metal halides or yellowed LED arrays are replaced with architectural multi-channel spectrum fixtures calibrated for SPS/LPS pigmentation. Smart gyre pumps eliminate dead zones and mimic natural pelagic ocean surge.',
  },
  {
    step: '04',
    title: 'Resculpted Living Aquascape',
    subtitle: 'Architectural Negative Space',
    description:
      'We rebuild congested rock piles into contemporary cantilevered structures, natural swim-through caverns, and terraced coral plates that maximize water circulation while providing secure territories for marine specimens.',
  },
];

const PROTOCOL_STEPS = [
  {
    num: '01',
    title: 'Forensic Site Audit',
    details: 'Digital water spectrometry, glass scratch depth analysis, silicone seal integrity, and electrical load diagnostics performed at your premises.',
  },
  {
    num: '02',
    title: 'Safe Livestock Staging',
    details: 'Valuable fish and corals are carefully transferred to our mobile, temperature and aeration-controlled holding pods on-site.',
  },
  {
    num: '03',
    title: 'Structural Rebirth & Plumbing',
    details: 'Precision glass scratch polishing, complete plumbing rebuild, modern sump installation, and architectural aquascaping.',
  },
  {
    num: '04',
    title: 'Acclimation & Handover',
    details: 'Gradual re-introduction of acclimated livestock, parameter fine-tuning, and handover with optional weekly white-glove concierge upkeep.',
  },
];

const METRICS = [
  { value: '48h', label: 'Average Turnaround', detail: 'Plumbing & sump replacement with minimal disruption' },
  { value: '99.8%', label: 'Specimen Survival', detail: 'Safe on-site staging & acclimation protocol' },
  { value: '30-Day', label: 'Stability Warranty', detail: 'Guaranteed parameter support following handover' },
  { value: 'Zero', label: 'Millwork Impact', detail: 'Existing cabinetry and architectural walls preserved' },
];

export default function RenovationPage() {
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    'Hello Marine Creatures, I would like to consult on an aquarium renovation for my existing tank.'
  )}`;

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Renovation', url: '/renovation' },
  ];

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);
  const serviceJsonLd = generateServiceJsonLd({
    name: 'Aquarium Renovation & Biological Ecosystem Revival',
    description:
      'Comprehensive restoration of existing troubled marine aquariums. Glass polishing, algae eradication, silent DC pump and NemoLight LED retrofits.',
    url: '/renovation',
    serviceType: 'AquariumRenovationService',
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
            Renovation
          </span>
        </nav>
      </div>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '65vh', minHeight: '460px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1920&q=85"
          alt="Aquarium Renovation & Restoration"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.8) 70%, rgba(2,7,11,1) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-12 sm:pb-16">
          <span className="text-label text-[--color-accent] block mb-3">
            AQUARIUM RESTORATION &amp; TRANSFORMATION
          </span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light max-w-4xl leading-tight">
            Don&apos;t Replace It.<br />
            <em className="font-normal text-cyan-300">Revive It.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] leading-relaxed max-w-2xl mt-4 text-sm sm:text-base md:text-lg">
            We take troubled, neglected, or declining aquariums and transform them into living architectural centerpieces — without tearing out custom cabinetry or dismantling your space.
          </p>
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <Link href="/contact?service=renovation" className="btn-primary inline-flex items-center gap-2">
              <span>SCHEDULE FORENSIC ASSESSMENT</span>
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-xs tracking-wider uppercase transition-all"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>SEND TANK PHOTOS ON WHATSAPP</span>
            </a>
          </div>
        </div>
      </div>

      <div className="container-max pt-14 pb-32">
        {/* ── 4 Core Pillars Strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm hover:border-cyan-400/30 transition-colors"
            >
              <div className="mb-3">{pillar.icon}</div>
              <h3 className="font-display text-sm font-semibold text-white mb-1.5">{pillar.title}</h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed">{pillar.description}</p>
            </div>
          ))}
        </div>

        {/* ── Interactive Transformation Showcase ─────────────────────────── */}
        <div className="mb-24">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-label text-[--color-accent] block mb-2">BEFORE &amp; AFTER</span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light">
              Witness the Architectural Rebirth
            </h2>
            <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-2">
              Slide horizontally to inspect the difference between an uncalibrated, declining aquarium and an engineered Marine Creatures living reef.
            </p>
          </div>

          <div className="h-[320px] sm:h-[440px] md:h-[540px] rounded-3xl overflow-hidden border border-[rgba(255,255,255,0.12)] shadow-2xl relative mb-6">
            <BeforeAfterSlider
              beforeSrc="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85"
              afterSrc="https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1200&q=85"
              beforeAlt="Aquarium before renovation with overgrown algae and imbalanced water"
              afterAlt="Aquarium after Marine Creatures renovation with thriving corals and crystal water"
            />
          </div>

          {/* Transformation Comparative Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold block mb-2">
                COMMON SYMPTOMS BEFORE INTERVENTION
              </span>
              <ul className="space-y-1.5 text-xs text-[--color-muted]">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">×</span>
                  <span>Chronic hair algae, cyanobacteria, or brown diatom film smothering rockwork</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">×</span>
                  <span>Scratched viewing panels, yellowed lighting, and failing pump hydraulics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">×</span>
                  <span>High nitrate/phosphate levels causing recurring coral and fish losses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">×</span>
                  <span>Noisy, vibrating sump pumps disrupting residential peace</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.03]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-2">
                ENGINEERED TRANSFORMATION BY MARINE CREATURES
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Museum-grade water clarity through multi-phase biological and carbon polish</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Precision scratch polishing on glass and clean silicone joints</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Whisper-quiet DC variable pumps operating below 28dB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400 font-bold">✓</span>
                  <span>Resculpted architectural aquascape with thriving SPS/LPS coral specimens</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── 4 Dimensions of Renovation ──────────────────────────────────── */}
        <div className="mb-24">
          <div className="max-w-2xl mb-12">
            <span className="text-label text-[--color-accent] block mb-2">OUR CAPABILITIES</span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light">
              The Four Dimensions of Renovation
            </h2>
            <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-2 leading-relaxed">
              We look beyond cosmetic fixes. True restoration requires balancing water chemistry, structural hydraulics, photonic spectrum, and biological colonization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DIMENSIONS.map((dim) => (
              <div
                key={dim.step}
                className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all relative overflow-hidden"
              >
                <span className="text-3xl font-display font-light text-cyan-400/20 absolute top-6 right-6">
                  {dim.step}
                </span>
                <span className="text-label text-[--color-accent] block mb-1">{dim.subtitle}</span>
                <h3 className="font-display text-xl text-white font-medium mb-3">{dim.title}</h3>
                <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
                  {dim.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Turnkey 4-Stage Protocol ────────────────────────────────────── */}
        <div className="mb-24 p-8 sm:p-12 rounded-3xl border border-white/10 bg-[rgba(3,10,16,0.7)] backdrop-blur-xl">
          <div className="max-w-2xl mb-10">
            <span className="text-label text-[--color-accent] block mb-2">TURNKEY EXECUTION</span>
            <h2 className="font-display text-display-sm text-white font-light">
              The 4-Stage Renovation Protocol
            </h2>
            <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-2">
              Every tank renovation follows an exacting protocol designed to protect your home and prevent specimen shock.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROTOCOL_STEPS.map((st) => (
              <div key={st.num} className="space-y-3">
                <span className="text-2xl font-mono text-cyan-400 font-light block">
                  {st.num}
                </span>
                <h4 className="font-display text-base text-white font-medium">{st.title}</h4>
                <p className="font-body text-xs text-[--color-muted] leading-relaxed">{st.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Key Metrics & Guarantee ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] text-center"
            >
              <div className="font-display text-3xl sm:text-4xl text-cyan-300 font-light mb-1">
                {m.value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-white mb-1">
                {m.label}
              </div>
              <div className="text-[11px] text-[--color-muted] leading-tight">{m.detail}</div>
            </div>
          ))}
        </div>

        {/* ── Final Conversion Callout ────────────────────────────────────── */}
        <div className="rounded-3xl border border-cyan-400/30 bg-gradient-to-b from-cyan-950/20 to-[rgba(3,13,20,0.95)] p-8 sm:p-14 text-center max-w-3xl mx-auto shadow-2xl space-y-6">
          <span className="text-label text-cyan-400 block">ON-SITE FORENSIC ASSESSMENT</span>
          <h2 className="font-display text-display-sm text-white font-light">
            Bring Your Aquarium Back to Life.
          </h2>
          <p className="font-body text-xs sm:text-base text-[--color-muted] leading-relaxed max-w-xl mx-auto">
            Book an on-site diagnostic inspection with Founder Suraj Shasmal. We analyze water parameters, assess existing equipment, and provide a fixed-scope restoration blueprint.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/contact?service=renovation"
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
            >
              <span>BOOK FORENSIC AUDIT</span>
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
              <span>CHAT WITH FOUNDER ON WHATSAPP</span>
            </a>
          </div>
          <p className="text-[11px] text-[--color-muted]">
            No obligation. Confidential site survey for private residences, luxury offices, and hospitality venues.
          </p>
        </div>
      </div>
    </div>
  );
}
