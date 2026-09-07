'use client';

import { useState, useEffect } from 'react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { STATS } from '@/lib/config';
import { TESTIMONIALS } from '@/lib/data/testimonials';

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const active = TESTIMONIALS[activeIndex];

  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'var(--color-secondary)' }}
      aria-labelledby="testimonials-heading"
    >
      {/* Accent light */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: '600px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(0,184,217,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="container-max relative z-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12 sm:mb-16 pb-12 sm:pb-16 border-b border-[rgba(255,255,255,0.06)]">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1} className="text-center md:text-left">
              <div className="font-display text-3xl sm:text-4xl md:text-5xl text-[--color-accent] font-light mb-1.5 sm:mb-2">
                {stat.value}
              </div>
              <div className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[--color-muted] font-medium">{stat.label}</div>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto text-center" aria-live="polite">
          <div className="mb-6 sm:mb-8">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent]">
              WHAT OUR CLIENTS SAY
            </span>
          </div>

          <div
            key={activeIndex}
            className="transition-all duration-700"
            style={{ animation: 'fade-up 0.7s ease-out' }}
          >
            <blockquote>
              <p className="font-display text-2xl sm:text-3xl md:text-4xl text-[--color-text] font-light italic leading-relaxed mb-6 sm:mb-8">
                &ldquo;{active.quote}&rdquo;
              </p>
              <footer>
                <div className="accent-line mx-auto mb-4" />
                <cite className="not-italic">
                  <span className="text-sm sm:text-base font-body tracking-wider uppercase text-[--color-text] font-semibold block mb-1">
                    {active.author}
                  </span>
                  <span className="text-xs text-[--color-muted]">
                    {active.project}
                  </span>
                </cite>
              </footer>
            </blockquote>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-2.5 mt-8 sm:mt-10" role="tablist" aria-label="Testimonials">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`transition-all duration-300 py-2 ${
                  i === activeIndex
                    ? 'w-10 h-1.5 bg-[--color-accent] rounded-full'
                    : 'w-3.5 h-1.5 bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)] rounded-full'
                }`}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
