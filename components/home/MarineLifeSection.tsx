'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { FEATURED_SPECIES } from '@/lib/data/species';

const DIFFICULTY_COLORS = {
  Beginner: 'var(--color-accent)',
  Intermediate: 'var(--color-gold)',
  Expert: '#E87070',
};

export function MarineLifeSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = FEATURED_SPECIES[activeIndex];

  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'var(--color-secondary)' }}
      aria-labelledby="marine-life-heading"
    >
      {/* Background accent */}
      <div
        className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 80% 50%, rgba(11,32,40,0.8) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — Heading & species selector */}
          <div>
            <SectionHeading
              id="marine-life-heading"
              label="Marine Life"
              heading={['Exotic', 'Marine Life']}
              subheading="Curated inhabitants for extraordinary underwater environments."
            />

            {/* Species selector */}
            <div className="mt-12 space-y-1">
              {FEATURED_SPECIES.map((species, i) => (
                <button
                  key={species.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left px-0 py-4 border-b transition-all duration-300 group ${
                    i === activeIndex
                      ? 'border-[--color-accent]'
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
                  }`}
                  data-cursor="EXPLORE"
                  aria-pressed={i === activeIndex}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-label text-[--color-muted] mb-1 block">
                        {species.scientificName}
                      </span>
                      <span
                        className={`font-body font-light transition-colors duration-300 ${
                          i === activeIndex
                            ? 'text-[--color-text]'
                            : 'text-[--color-muted] group-hover:text-[--color-text]'
                        }`}
                        style={{ fontSize: '1.0625rem' }}
                      >
                        {species.name}
                      </span>
                    </div>
                    <span
                      className={`text-label transition-all duration-300 ${
                        i === activeIndex
                          ? 'text-[--color-accent] translate-x-0 opacity-100'
                          : 'text-[--color-muted] -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`}
                    >
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <ScrollReveal delay={0.2} className="mt-10">
              <Link
                href="/marine-life"
                className="btn-ghost inline-flex"
                data-cursor="EXPLORE"
              >
                VIEW ALL SPECIES
                <span className="text-[--color-accent]">→</span>
              </Link>
            </ScrollReveal>
          </div>

          {/* Right — Species showcase */}
          <div className="relative">
            {FEATURED_SPECIES.map((species, i) => (
              <div
                key={species.id}
                className={`transition-all duration-700 ${
                  i === activeIndex
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                }`}
              >
                {/* Image */}
                <div
                  className="relative overflow-hidden mb-6"
                  style={{ aspectRatio: '4/5', maxHeight: '520px' }}
                  data-cursor="EXPLORE"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={species.image}
                    alt={species.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                  {/* Overlay gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(2,7,11,0.8) 0%, transparent 50%)',
                    }}
                  />
                  {/* Availability badge */}
                  <div className="absolute top-4 right-4">
                    <span className="text-label text-[--color-text] bg-[rgba(0,0,0,0.5)] px-3 py-1.5 backdrop-blur-sm">
                      {species.availability.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Species info */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-display-sm text-[--color-text] font-light">
                        {species.name}
                      </h3>
                      <p className="font-body text-[--color-muted] italic" style={{ fontSize: '0.875rem' }}>
                        {species.scientificName}
                      </p>
                    </div>
                    <Link
                      href={`/marine-life/${species.id}`}
                      className="text-label text-[--color-accent] hover:text-[--color-cyan] transition-colors mt-1"
                      data-cursor="EXPLORE"
                    >
                      ENQUIRE →
                    </Link>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                    <div>
                      <span className="text-label text-[--color-muted] block mb-1">SIZE</span>
                      <span className="font-body text-[--color-text] text-sm">{species.size}</span>
                    </div>
                    <div>
                      <span className="text-label text-[--color-muted] block mb-1">TEMPERAMENT</span>
                      <span className="font-body text-[--color-text] text-sm">{species.temperament}</span>
                    </div>
                    <div>
                      <span className="text-label text-[--color-muted] block mb-1">DIFFICULTY</span>
                      <span
                        className="font-body text-sm"
                        style={{ color: DIFFICULTY_COLORS[species.difficulty] }}
                      >
                        {species.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
