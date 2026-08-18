'use client';

import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';

const STAGES = [
  { label: 'Assess', desc: 'Comprehensive evaluation of your existing aquarium.' },
  { label: 'Restore', desc: 'Deep clean, repair and system restoration.' },
  { label: 'Redesign', desc: 'Fresh aquascape and livestock selection.' },
  { label: 'Rebuild', desc: 'Installation and full system commissioning.' },
  { label: 'Reveal', desc: 'Your aquarium, reimagined.' },
];

export function RenovationSection() {
  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'var(--color-secondary)' }}
      aria-labelledby="renovation-heading"
    >
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left content */}
          <div>
            <SectionHeading
              id="renovation-heading"
              label="Renovation"
              heading={["Don't Replace It.", 'Revive It.']}
              subheading="Transform your neglected aquarium into a premium living environment. We assess, restore, redesign and rebuild."
            />

            {/* Stages */}
            <div className="mt-10 flex flex-wrap gap-3">
              {STAGES.map((stage, i) => (
                <ScrollReveal key={stage.label} delay={i * 0.08}>
                  <div className="group relative px-4 py-3 border border-[rgba(255,255,255,0.08)] hover:border-[--color-accent] transition-colors duration-300">
                    <span className="text-label text-[--color-accent] block mb-1">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="font-body text-[--color-text] text-sm">{stage.label}</span>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={0.4} className="mt-10">
              <Link
                href="/renovation"
                className="btn-primary inline-flex"
                data-cursor="ENTER"
              >
                REVIVE MY AQUARIUM
                <span className="text-[--color-primary]">→</span>
              </Link>
            </ScrollReveal>
          </div>

          {/* Right — Before/After slider */}
          <ScrollReveal className="relative" style={{ height: '500px' }}>
            <BeforeAfterSlider
              beforeSrc="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85"
              afterSrc="https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1200&q=85"
              beforeAlt="Aquarium before renovation"
              afterAlt="Aquarium after premium renovation by Marine Creatures"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
