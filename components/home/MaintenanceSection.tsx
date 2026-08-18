'use client';

import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const SERVICES = [
  {
    num: '01',
    title: 'Water Care',
    desc: 'Regular testing and balancing of salinity, pH, alkalinity, calcium and magnesium.',
  },
  {
    num: '02',
    title: 'Filtration',
    desc: 'Filter media replacement, skimmer cleaning and flow optimisation.',
  },
  {
    num: '03',
    title: 'Aquascaping',
    desc: 'Algae management, coral trimming and aquascape maintenance.',
  },
  {
    num: '04',
    title: 'Livestock Care',
    desc: 'Health monitoring, feeding schedules and compatibility management.',
  },
  {
    num: '05',
    title: 'System Optimisation',
    desc: 'Equipment health checks, lighting adjustments and system calibration.',
  },
  {
    num: '06',
    title: 'Regular Maintenance',
    desc: 'Scheduled visits to ensure your aquarium remains pristine.',
  },
];

export function MaintenanceSection() {
  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'var(--color-primary)' }}
      aria-labelledby="maintenance-heading"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1612629808341-9de2462b1b8b?w=1920&q=80"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, var(--color-primary) 40%, rgba(2,7,11,0.6) 100%)',
          }}
        />
      </div>

      <div className="container-max relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Left */}
          <div>
            <SectionHeading
              id="maintenance-heading"
              label="Maintenance"
              heading={['Keep The', 'Ocean Alive.']}
              subheading="Professional aquarium care programmes designed to keep your ecosystem thriving and visually exceptional."
            />

            <ScrollReveal delay={0.2} className="mt-10">
              <Link
                href="/contact"
                className="btn-primary inline-flex"
                data-cursor="ENTER"
              >
                BOOK AQUARIUM CARE
                <span className="text-[--color-primary]">→</span>
              </Link>
            </ScrollReveal>

            {/* Decorative water-line animation */}
            <div className="mt-16 hidden md:block" aria-hidden="true">
              <svg width="100%" height="40" viewBox="0 0 400 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M0 20 Q50 5 100 20 Q150 35 200 20 Q250 5 300 20 Q350 35 400 20"
                  stroke="rgba(0,184,217,0.3)"
                  strokeWidth="1"
                  fill="none"
                  style={{
                    strokeDasharray: 600,
                    strokeDashoffset: 600,
                    animation: 'wave-line 2s ease-out 0.5s forwards',
                  }}
                />
                <path
                  d="M0 25 Q60 10 120 25 Q180 40 240 25 Q300 10 360 25 Q390 32 400 27"
                  stroke="rgba(0,184,217,0.15)"
                  strokeWidth="1"
                  fill="none"
                  style={{
                    strokeDasharray: 600,
                    strokeDashoffset: 600,
                    animation: 'wave-line 2s ease-out 0.9s forwards',
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Right — services */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
            {SERVICES.map((service, i) => (
              <ScrollReveal
                key={service.num}
                delay={i * 0.07}
                className="flex gap-4 p-5 border-b border-r-0 sm:border-r border-[rgba(255,255,255,0.06)] last:border-b-0"
              >
                <span className="text-label text-[--color-accent] shrink-0">{service.num}</span>
                <div>
                  <h3 className="font-body text-[--color-text] font-light mb-1" style={{ fontSize: '0.9375rem' }}>
                    {service.title}
                  </h3>
                  <p className="font-body text-[--color-muted] text-xs leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
