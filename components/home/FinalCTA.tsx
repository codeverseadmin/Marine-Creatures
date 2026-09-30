'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CallbackForm } from '@/components/ui/CallbackForm';
export function FinalCTA() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [count, setCount] = useState(25);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const sectionRef = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReduced(reduced);
    if (reduced) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    setCount(isMobile ? 12 : 25);
  }, []);

  const particles = useState(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${(i * 137.5) % 100}%`,
      bottom: `${(i * 19) % 65}%`,
      duration: `${8 + (i % 5) * 2}s`,
      delay: `${(i * 0.7) % 8}s`,
    }));
  })[0];

  return (
    <section
      className="section relative flex flex-col justify-center overflow-hidden"
      style={{ background: 'var(--color-primary)' }}
      aria-labelledby="final-cta-heading"
    >
      {/* Background — deepening ocean */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=90"
          alt=""
          className="w-full h-full object-cover opacity-20"
          loading="lazy"
        />

        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, var(--color-primary) 0%, rgba(2,7,11,0.7) 50%, var(--color-primary) 100%)',
          }}
        />
      </div>

      {/* Particles — device-adaptive (max 12 mobile, 25 desktop) with reduced-motion support */}
      {mounted && !prefersReduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-1" aria-hidden="true">
          {particles.slice(0, count).map((p) => (
            <div
              key={p.id}
              className="particle"
              style={{
                left: p.left,
                bottom: p.bottom,
                animationDuration: p.duration,
                animationDelay: p.delay,
                opacity: 0,
                animationName: 'particle-drift',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Accent glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none z-1"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,184,217,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 container-max text-center">
        {/* Label */}
        <ScrollReveal className="mb-6 sm:mb-8">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent]">
            BEGIN THE CONVERSATION
          </span>
        </ScrollReveal>

        {/* Heading */}
        <ScrollReveal delay={0.1}>
          <h2
            id="final-cta-heading"
            className="font-display text-3xl sm:text-5xl md:text-6xl text-[--color-text] font-light leading-tight"
          >
            Let&apos;s Build
            <br />
            <em>Your Ocean.</em>
          </h2>
        </ScrollReveal>

        {/* Supporting text */}
        <ScrollReveal delay={0.2} className="mt-4 sm:mt-6">
          <p className="font-body font-light text-[--color-muted] max-w-lg mx-auto leading-relaxed text-xs sm:text-sm md:text-base">
            Tell us about your space, your existing aquarium or your vision. Every extraordinary aquarium begins with a single conversation.
          </p>
        </ScrollReveal>

        {/* Callback Form Embed */}
        <ScrollReveal delay={0.3} className="mt-8 sm:mt-12">
          <CallbackForm />
        </ScrollReveal>

        {/* Quick navigation CTAs */}
        <ScrollReveal delay={0.4} className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/services#booking-portal"
            className="text-xs uppercase tracking-wider text-[--color-accent] hover:text-white transition-colors"
          >
            Looking for comprehensive installation booking? Open Full Portal →
          </Link>
        </ScrollReveal>

        {/* Logo / wordmark reveal */}
        <ScrollReveal delay={0.5} className="mt-14 sm:mt-20">
          <div>
            <span className="text-[10px] sm:text-xs text-[--color-muted] tracking-[0.4em] uppercase block mb-2">
              MARINE CREATURES
            </span>
            <span className="font-display text-sm italic text-[--color-muted] opacity-60">
              Bringing ocean at your door step
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
