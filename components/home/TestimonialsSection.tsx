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
          background: 'radial-gradient(ellipse, rgba(0,184,217,0.05) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="container-max relative z-10">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20 pb-20 border-b border-[rgba(255,255,255,0.06)]">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.1} className="text-center md:text-left">
              <div className="font-display text-display-md text-[--color-accent] font-light mb-2">
                {stat.value}
              </div>
              <div className="text-label text-[--color-muted]">{stat.label.toUpperCase()}</div>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonial */}
        <div className="max-w-3xl mx-auto text-center" aria-live="polite">
          <div className="mb-8">
            <span className="text-label text-[--color-accent]">WHAT OUR CLIENTS SAY</span>
          </div>

          <div
            key={activeIndex}
            className="transition-all duration-700"
            style={{ animation: 'fade-up 0.7s ease-out' }}
          >
            <blockquote>
              <p className="font-display text-display-sm text-[--color-text] font-light italic leading-relaxed mb-8">
                &ldquo;{active.quote}&rdquo;
              </p>
              <footer>
                <div className="accent-line mx-auto mb-4" />
                <cite className="not-italic">
                  <span className="text-label-lg text-[--color-text] block mb-1">
                    {active.author}
                  </span>
                  <span className="text-label text-[--color-muted]">
                    {active.project}
                  </span>
                </cite>
              </footer>
            </blockquote>
          </div>

          {/* Indicators */}
          <div className="flex justify-center gap-3 mt-10" role="tablist" aria-label="Testimonials">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`transition-all duration-300 ${
                  i === activeIndex
                    ? 'w-8 h-px bg-[--color-accent]'
                    : 'w-4 h-px bg-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.4)]'
                }`}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Testimonial ${i + 1}`}
                style={{ cursor: 'none' }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
