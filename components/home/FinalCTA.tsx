'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function FinalCTA() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
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

      {/* Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-1" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 60}%`,
              animationDuration: `${8 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 8}s`,
              opacity: 0,
              animationName: 'particle-drift',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

      {/* Accent glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none z-1"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,184,217,0.06) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 container-max text-center">
        {/* Label */}
        <ScrollReveal className="mb-10">
          <span className="text-label text-[--color-accent] tracking-[0.3em]">BEGIN THE CONVERSATION</span>
        </ScrollReveal>

        {/* Heading */}
        <ScrollReveal delay={0.1}>
          <h2
            id="final-cta-heading"
            className="font-display text-display-xl text-[--color-text] font-light leading-[0.9]"
          >
            Let&apos;s Build
            <br />
            <em>Your Ocean.</em>
          </h2>
        </ScrollReveal>

        {/* Supporting text */}
        <ScrollReveal delay={0.2} className="mt-8">
          <p className="font-body font-light text-[--color-muted] max-w-lg mx-auto leading-relaxed" style={{ fontSize: '1.0625rem' }}>
            Tell us about your space, your existing aquarium or your vision. Every extraordinary aquarium begins with a single conversation.
          </p>
        </ScrollReveal>

        {/* CTAs */}
        <ScrollReveal delay={0.3} className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/services#booking-portal"
            className="btn-primary"
            data-cursor="ENTER"
          >
            BOOK INSTALLATION / RENOVATION
            <span className="text-[--color-primary]">→</span>
          </Link>
          <Link
            href="/marketplace"
            className="btn-ghost"
            data-cursor="EXPLORE"
          >
            EXPLORE MARKETPLACE
            <span className="text-[--color-accent]">→</span>
          </Link>
        </ScrollReveal>


        {/* Logo / wordmark reveal */}
        <ScrollReveal delay={0.5} className="mt-20">
          <div>
            <span className="text-label text-[--color-muted] tracking-[0.4em] block mb-2">
              MARINE CREATURES
            </span>
            <span className="font-display text-sm italic text-[--color-muted] opacity-60">
              Where the Ocean Becomes Art.
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
