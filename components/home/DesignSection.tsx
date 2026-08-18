'use client';

import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const PROCESS_STEPS = [
  { step: '01', label: 'Discover', desc: 'We listen to your vision, study your space and understand your lifestyle.' },
  { step: '02', label: 'Design', desc: 'We create a bespoke design concept tailored to your architecture and aesthetic.' },
  { step: '03', label: 'Aquascape', desc: 'Our aquascapers craft the underwater environment with precision and artistry.' },
  { step: '04', label: 'Install', desc: 'Expert installation with minimal disruption to your home or business.' },
];

export function DesignSection() {
  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'var(--color-primary)' }}
      aria-labelledby="design-heading"
    >
      <div className="container-max">
        {/* Large image — luxury interior */}
        <ScrollReveal className="relative mb-16 overflow-hidden" style={{ aspectRatio: '16/7' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1920&q=85"
            alt="Luxury aquarium integrated into a contemporary interior"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, rgba(2,7,11,0.8) 0%, transparent 50%, rgba(2,7,11,0.3) 100%)',
            }}
          />
          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center container-max">
            <div>
              <span className="text-label text-[--color-accent] block mb-4">AQUARIUM DESIGN</span>
              <h2
                id="design-heading"
                className="font-display text-display-lg text-[--color-text] font-light"
              >
                Your Space.
                <br />
                <em>Our Ocean.</em>
              </h2>
            </div>
          </div>
        </ScrollReveal>

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <ScrollReveal>
            <p className="font-body font-light text-[--color-muted] leading-relaxed" style={{ fontSize: '1.0625rem' }}>
              Bespoke aquarium environments designed around your architecture, lifestyle and vision. Every project begins with a conversation — and ends with a living piece of the ocean permanently woven into your space.
            </p>
            <div className="mt-10">
              <Link
                href="/aquarium-design"
                className="btn-primary inline-flex"
                data-cursor="ENTER"
              >
                START A PROJECT
                <span className="text-[--color-primary]">→</span>
              </Link>
            </div>
          </ScrollReveal>

          {/* Process steps */}
          <div className="space-y-0">
            {PROCESS_STEPS.map((item, i) => (
              <ScrollReveal
                key={item.step}
                delay={i * 0.1}
                className="flex gap-8 py-6 border-b border-[rgba(255,255,255,0.06)] last:border-0"
              >
                <span className="text-label text-[--color-accent] shrink-0 mt-1">{item.step}</span>
                <div>
                  <h3 className="font-display text-display-sm text-[--color-text] font-light mb-2">
                    {item.label}
                  </h3>
                  <p className="font-body font-light text-[--color-muted] text-sm leading-relaxed">
                    {item.desc}
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
