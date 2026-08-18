import type { Metadata } from 'next';
import Link from 'next/link';
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
      <div className="relative pt-32 pb-16 border-b border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,184,217,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="container-max relative z-10">
          <span className="text-label text-[--color-accent] tracking-[0.3em] block mb-3">
            MASTER ENGINEERING & BIOLOGICAL SERVICES
          </span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Installation &amp;<br /><em>Renovation Services.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-xl leading-relaxed text-sm">
            Whether you are commissioning a monumental architectural living reef or revitalizing an existing troubled setup, our senior marine curators deliver perfection.
          </p>
        </div>
      </div>

      {/* Services Showcase Cards */}
      <div className="container-max py-16 space-y-16">
        {SERVICES_DATA.map((service, index) => (
          <div
            key={service.id}
            id={service.id}
            className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] p-6 md:p-10 backdrop-blur-md shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
          >
            {/* Left Content */}
            <div className="lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-widest font-semibold text-[--color-accent] bg-[rgba(0,184,217,0.12)] px-3 py-1 rounded border border-[rgba(0,184,217,0.3)]">
                  {service.badge}
                </span>
                <span className="text-xs text-[--color-muted]">
                  Starting From: <strong className="text-white text-sm">{service.priceStartingFrom}</strong>
                </span>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl text-[--color-text] font-light mb-4">
                {service.name}
              </h2>

              <p className="font-body text-xs text-[--color-muted] leading-relaxed mb-8">
                {service.description}
              </p>

              {/* Inclusions */}
              <div className="mb-8">
                <span className="text-label text-[--color-accent] block mb-3">INCLUDED IN SERVICE</span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[--color-muted]">
                  {service.inclusions.map((inc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[--color-accent] font-bold">✓</span>
                      <span className="text-white/90">{inc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Protocol Stages */}
              <div>
                <span className="text-label text-[--color-accent] block mb-3">5-STAGE EXECUTION PROTOCOL</span>
                <div className="space-y-3">
                  {service.stages.map((st) => (
                    <div
                      key={st.step}
                      className="p-3 rounded-lg border border-[rgba(255,255,255,0.04)] bg-[rgba(2,7,11,0.4)] flex items-start gap-4 text-xs"
                    >
                      <span className="text-label text-[--color-accent] shrink-0 mt-0.5">{st.step}</span>
                      <div>
                        <span className="text-white font-medium block">{st.title}</span>
                        <span className="text-[11px] text-[--color-muted]">{st.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Photo & Guarantees */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] shadow-lg" style={{ aspectRatio: '16/10' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(2,7,11,0.6)] space-y-3">
                <span className="text-[10px] uppercase tracking-widest text-[--color-accent] block">
                  COMMISSION GUARANTEES
                </span>
                <ul className="space-y-2 text-xs text-[--color-muted]">
                  {service.guarantees.map((g, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-emerald-400">🛡️</span>
                      <span className="text-white">{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href="#booking-portal"
                className="btn-primary w-full text-center block text-xs py-3.5"
              >
                SCHEDULE {service.name.toUpperCase()} →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Form Section */}
      <div id="booking-portal" className="container-max pb-24">
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <span className="text-label text-[--color-accent] tracking-[0.3em] block mb-2">
            ONLINE RESERVATION &amp; SITE SURVEY
          </span>
          <h2 className="font-display text-display-sm text-[--color-text] font-light">
            Book Your Consultation
          </h2>
          <p className="font-body text-xs text-[--color-muted] mt-2">
            Fill in your property details below to reserve an engineering consultation with our senior biological curators.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <BookingForm />
        </div>

        {/* Direct Contact Hotline Bar */}
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)]">
            <span className="text-label text-[--color-accent] block mb-1">CALL US DIRECTLY</span>
            <a href={`tel:${SITE_CONFIG.phone}`} className="font-body text-sm text-white hover:text-[--color-accent]">
              {SITE_CONFIG.phone}
            </a>
          </div>

          <div className="p-5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)]">
            <span className="text-label text-[--color-accent] block mb-1">WHATSAPP CONCIERGE</span>
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-sm text-[--color-accent] hover:underline"
            >
              Chat with a Biologist ↗
            </a>
          </div>

          <div className="p-5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)]">
            <span className="text-label text-[--color-accent] block mb-1">EMAIL INQUIRIES</span>
            <a href={`mailto:${SITE_CONFIG.email}`} className="font-body text-sm text-white hover:text-[--color-accent]">
              {SITE_CONFIG.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
