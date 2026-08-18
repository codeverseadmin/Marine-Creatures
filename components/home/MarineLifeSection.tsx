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

            {/* Species selector with mini image avatars */}
            <div className="mt-12 space-y-2">
              {FEATURED_SPECIES.map((species, i) => (
                <button
                  key={species.id}
                  onClick={() => setActiveIndex(i)}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all duration-300 group flex items-center justify-between gap-4 ${
                    i === activeIndex
                      ? 'border-[--color-accent] bg-[rgba(0,184,217,0.06)] shadow-[0_4px_20px_rgba(0,184,217,0.12)]'
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.18)] bg-[rgba(7,21,28,0.3)]'
                  }`}
                  data-cursor="EXPLORE"
                  aria-pressed={i === activeIndex}
                >
                  <div className="flex items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={species.image}
                      alt={species.name}
                      className="w-12 h-12 rounded object-cover border border-[rgba(255,255,255,0.1)]"
                      loading="lazy"
                    />
                    <div>
                      <span className="text-[10px] tracking-widest text-[--color-accent] block">
                        {species.scientificName}
                      </span>
                      <span
                        className={`font-body font-medium transition-colors duration-300 ${
                          i === activeIndex
                            ? 'text-[--color-text]'
                            : 'text-[--color-muted] group-hover:text-[--color-text]'
                        }`}
                        style={{ fontSize: '1rem' }}
                      >
                        {species.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold"
                      style={{
                        background: 'rgba(2,7,11,0.6)',
                        color: DIFFICULTY_COLORS[species.difficulty],
                        border: `1px solid ${DIFFICULTY_COLORS[species.difficulty]}40`,
                      }}
                    >
                      {species.difficulty}
                    </span>
                    <span
                      className={`text-sm transition-all duration-300 ${
                        i === activeIndex
                          ? 'text-[--color-accent] translate-x-0 opacity-100 font-bold'
                          : 'text-[--color-muted] -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                      }`}
                    >
                      →
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <ScrollReveal delay={0.2} className="mt-8">
              <Link
                href="/marine-life"
                className="btn-primary inline-flex"
                data-cursor="EXPLORE"
              >
                VIEW FULL 2026 SPECIMEN CATALOG
                <span className="text-[--color-primary]">→</span>
              </Link>
            </ScrollReveal>
          </div>

          {/* Right — Species showcase */}
          <div className="relative">
            {FEATURED_SPECIES.map((species, i) => (
              <div
                key={species.id}
                className={`transition-all duration-500 rounded-xl p-5 border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-md shadow-2xl ${
                  i === activeIndex
                    ? 'opacity-100 translate-y-0 relative z-10'
                    : 'opacity-0 translate-y-4 absolute inset-0 pointer-events-none'
                }`}
              >
                {/* Image */}
                <div
                  className="relative rounded-lg overflow-hidden mb-6"
                  style={{ aspectRatio: '16/11' }}
                  data-cursor="EXPLORE"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={species.image}
                    alt={species.name}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.04]"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                  {/* Overlay gradient */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(2,7,11,0.85) 0%, transparent 60%)',
                    }}
                  />
                  {/* Availability badge */}
                  <div className="absolute top-4 right-4">
                    <span className="text-[10px] tracking-widest uppercase font-semibold text-[--color-text] bg-[rgba(2,7,11,0.8)] border border-[rgba(0,184,217,0.4)] px-3 py-1.5 backdrop-blur-md rounded">
                      {species.availability.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Species info */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-display text-2xl text-[--color-text] font-light">
                        {species.name}
                      </h3>
                      <p className="font-body text-[--color-accent] italic text-xs tracking-wider">
                        {species.scientificName}
                      </p>
                    </div>
                    <Link
                      href={`/marine-life/${species.id}`}
                      className="px-3 py-1 text-xs tracking-wider uppercase rounded bg-[--color-accent] text-[--color-primary] font-semibold hover:bg-[--color-cyan] transition-colors"
                      data-cursor="EXPLORE"
                    >
                      DETAILS →
                    </Link>
                  </div>

                  {/* Species description snippet */}
                  <p className="font-body text-[--color-muted] text-xs leading-relaxed mb-4">
                    {species.description}
                  </p>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)] text-center">
                    <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                      <span className="text-[10px] tracking-widest text-[--color-muted] block mb-1">ADULT SIZE</span>
                      <span className="font-body text-[--color-text] text-xs font-medium">{species.size}</span>
                    </div>
                    <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                      <span className="text-[10px] tracking-widest text-[--color-muted] block mb-1">TEMPERAMENT</span>
                      <span className="font-body text-[--color-text] text-xs font-medium">{species.temperament}</span>
                    </div>
                    <div className="p-2 rounded bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                      <span className="text-[10px] tracking-widest text-[--color-muted] block mb-1">CARE TIER</span>
                      <span
                        className="font-body text-xs font-semibold"
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
