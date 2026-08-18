import type { Metadata } from 'next';
import { SERVICES_DATA } from '@/lib/data/services';
import { BookingForm } from '@/components/services/BookingForm';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Services & Booking — Aquarium Installation & Renovation',
  description:
    'Book bespoke luxury aquarium installation, living coral reef renovation, and white-glove marine concierge services with Marine Creatures.',
};

export default function ServicesPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero Header */}
      <div className="relative pt-44 md:pt-52 pb-16 border-b border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div

          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,184,217,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="container-max relative z-10">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-3">
            MASTER ENGINEERING &amp; BIOLOGICAL SERVICES
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-light mb-4">
            Installation &amp;<br /><em>Renovation Services.</em>
          </h1>
          <p className="font-body text-sm sm:text-base text-[--color-muted] max-w-2xl leading-relaxed">
            Whether you are commissioning a monumental architectural living reef or revitalizing an existing troubled setup, our senior marine curators deliver perfection.
          </p>
        </div>
      </div>

      {/* Services Showcase Cards */}
      <div className="container-max py-20 space-y-20">
        {SERVICES_DATA.map((service) => (
          <div
            key={service.id}
            id={service.id}
            className="rounded-3xl border border-[rgba(255,255,255,0.1)] bg-[rgba(5,15,22,0.85)] p-8 sm:p-12 md:p-14 backdrop-blur-2xl shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
          >
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs uppercase tracking-widest font-semibold text-[--color-accent] bg-[rgba(0,184,217,0.12)] px-3.5 py-1.5 rounded-lg border border-[rgba(0,184,217,0.3)]">
                  {service.badge}
                </span>
                <span className="text-sm text-[--color-muted]">
                  Starting From: <strong className="text-white text-base">{service.priceStartingFrom}</strong>
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl text-white font-light">
                {service.name}
              </h2>

              <p className="font-body text-sm text-[--color-muted] leading-relaxed">
                {service.description}
              </p>

              {/* Inclusions */}
              <div className="pt-2">
                <span className="text-xs uppercase tracking-wider text-[--color-accent] font-semibold block mb-4">
                  INCLUDED IN SERVICE
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
                  {service.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-[--color-accent] font-bold">✓</span>
                      <span>{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Protocol Stages */}
              <div className="pt-4">
                <span className="text-xs uppercase tracking-wider text-[--color-accent] font-semibold block mb-4">
                  5-STAGE EXECUTION PROTOCOL
                </span>
                <div className="space-y-3">
                  {service.stages.map((st) => (
                    <div
                      key={st.step}
                      className="p-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(2,7,11,0.5)] flex items-start gap-4 text-xs sm:text-sm"
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
              <div className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-2xl" style={{ aspectRatio: '16/10' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.6)] space-y-4">
                <span className="text-xs uppercase tracking-widest text-[--color-accent] font-semibold block">
                  COMMISSION GUARANTEES
                </span>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
                  {service.guarantees.map((g, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="text-emerald-400">🛡️</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#booking-portal"
                className="btn-primary w-full text-center block text-xs tracking-wider uppercase font-semibold py-4 rounded-xl shadow-xl"
              >
                SCHEDULE {service.name.toUpperCase()} →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Form Section */}
      <div id="booking-portal" className="container-max pb-36 pt-8">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-3">
            ONLINE RESERVATION &amp; SITE SURVEY
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light mb-3">
            Book Your Consultation
          </h2>
          <p className="font-body text-sm text-[--color-muted]">
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

