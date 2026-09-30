'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';

// Device-adaptive particle counts per CTO spec:
// max 15 on mobile (≤768px), max 40 on desktop
const PARTICLE_COUNT_MOBILE = 15;
const PARTICLE_COUNT_DESKTOP = 40;

function Particles() {
  const [mounted, setMounted] = React.useState(false);
  const [count, setCount] = React.useState(PARTICLE_COUNT_DESKTOP);
  const [isVisible, setIsVisible] = React.useState(true);
  const [prefersReduced, setPrefersReduced] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setMounted(true);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setPrefersReduced(reduced);
    if (reduced) return;

    // Detect device and apply adaptive particle count (max 15 mobile, max 40 desktop)
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    setCount(isMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP);

    // Viewport-aware particle pause/resume via IntersectionObserver
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Pre-generate stable particle attributes to avoid hydration/re-render jitter
  const particles = React.useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${(i * 137.5) % 100}%`,
      bottom: `${5 + (i * 17) % 45}%`,
      size: `${1 + (i % 3) * 0.75}px`,
      duration: `${8 + (i % 7) * 2}s`,
      delay: `${(i * 0.6) % 8}s`,
    }));
  }, [count]);

  if (!mounted || prefersReduced) return null;

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.size,
            height: p.size,
            animationDuration: p.duration,
            animationDelay: p.delay,
            opacity: 0,
            animationName: 'particle-drift',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationPlayState: isVisible ? 'running' : 'paused',
          }}
        />
      ))}
    </div>
  );
}

function LightRays() {
  const rays = [
    { left: '15%', rotate: '-8deg', width: '180px', delay: 1.0 },
    { left: '35%', rotate: '-2deg', width: '240px', delay: 1.2 },
    { left: '55%', rotate: '5deg', width: '200px', delay: 1.4 },
    { left: '72%', rotate: '12deg', width: '160px', delay: 1.1 },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {rays.map((ray, i) => (
        <div
          key={i}
          className="light-ray"
          id={`ray-${i}`}
          style={{
            left: ray.left,
            transform: `rotate(${ray.rotate})`,
            width: ray.width,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  // Mouse parallax
  const layer1Ref = useRef<HTMLDivElement>(null); // background
  const layer2Ref = useRef<HTMLDivElement>(null); // midground
  const layer3Ref = useRef<HTMLDivElement>(null); // foreground

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Animate light rays
    const rays = document.querySelectorAll('.light-ray');

    // Snappy, luxury master timeline (completes within 1.2s)
    const tl = gsap.timeline({ delay: 0.05 });

    if (!prefersReduced) {
      // 0.1s — light rays
      tl.to(
        rays,
        {
          opacity: 0.75,
          duration: 1.0,
          stagger: 0.1,
          ease: 'power2.out',
        },
        0.05
      );

      // 0.1s — background image reveal
      tl.fromTo(
        imageRef.current,
        { scale: 1.06, opacity: 0 },
        { scale: 1.0, opacity: 1, duration: 1.2, ease: 'power2.out' },
        0.05
      );

      // 0.2s — Wordmark
      tl.fromTo(
        wordmarkRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        0.2
      );

      // 0.3s — THE OCEAN
      const line1 = headingRef.current?.querySelector('.line-1') ?? null;
      const line2 = headingRef.current?.querySelector('.line-2') ?? null;
      if (line1) {
        tl.fromTo(
          line1,
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.7, ease: 'power3.out' },
          0.3
        );
      }

      // 0.45s — REIMAGINED.
      if (line2) {
        tl.fromTo(
          line2,
          { y: '100%', opacity: 0 },
          { y: '0%', opacity: 1, duration: 0.7, ease: 'power3.out' },
          0.45
        );
      }

      // 0.6s — subheading
      tl.fromTo(
        subRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        0.6
      );

      // 0.75s — CTAs
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        0.75
      );

      // 0.9s — Scroll indicator
      tl.fromTo(
        scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power1.out' },
        0.9
      );

      // Fade initial overlay
      tl.to(
        overlayRef.current,
        { opacity: 0, duration: 0.8, ease: 'power1.out' },
        0.1
      );
    } else {

      // No animation — show everything immediately
      gsap.set([wordmarkRef.current, subRef.current, ctaRef.current, scrollRef.current], {
        opacity: 1,
        y: 0,
      });
      gsap.set(imageRef.current, { opacity: 1, scale: 1 });
      gsap.set(overlayRef.current, { opacity: 0 });
      if (headingRef.current) {
        const lines = headingRef.current.querySelectorAll('.heading-line-inner');
        gsap.set(lines, { y: '0%' });
      }
    }

    // Mouse parallax
    let ticking = false;
    const onMouseMove = (e: MouseEvent) => {
      if (ticking || prefersReduced) return;
      ticking = true;
      requestAnimationFrame(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;
        const dy = (e.clientY - cy) / cy;

        gsap.to(layer1Ref.current, {
          x: dx * -8,
          y: dy * -5,
          duration: 1.5,
          ease: 'power1.out',
        });
        gsap.to(layer2Ref.current, {
          x: dx * -15,
          y: dy * -10,
          duration: 1.5,
          ease: 'power1.out',
        });
        gsap.to(layer3Ref.current, {
          x: dx * 4,
          y: dy * 3,
          duration: 1.5,
          ease: 'power1.out',
        });
        ticking = false;
      });
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    return () => {
      tl.kill();
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden pt-24 pb-20 sm:pt-28 sm:pb-28 md:pt-32 md:pb-32"
      style={{ background: 'var(--color-primary)' }}
      aria-label="Hero — The Ocean Reimagined"
    >
      {/* Initial dark overlay (fades out during cinematic intro) */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-20 pointer-events-none"
        style={{ background: 'var(--color-primary)' }}
        aria-hidden="true"
      />

      {/* Layer 1 — Background ocean image */}
      <div ref={layer1Ref} className="absolute inset-0 z-0" aria-hidden="true">
        <div
          ref={imageRef}
          className="absolute inset-0 opacity-0 bg-cover bg-[center_35%] md:bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=90')`,
          }}
        />
        {/* Deep ocean vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(2,7,11,0.65) 0%, rgba(2,7,11,0.25) 45%, rgba(2,7,11,0.85) 85%, rgba(2,7,11,1) 100%)',
          }}
        />
      </div>

      {/* Layer 2 — Light rays */}
      <div ref={layer2Ref} className="absolute inset-0 z-1" aria-hidden="true">
        <LightRays />
      </div>

      {/* Layer 3 — Particles */}
      <div className="absolute inset-0 z-2" aria-hidden="true">
        <Particles />
      </div>

      {/* Accent glow — bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none z-3"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(0,184,217,0.12) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 container-max my-auto">
        {/* Subtle category line */}
        <div
          ref={wordmarkRef}
          className="mb-3 sm:mb-5 opacity-0"
        >
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] font-semibold text-[--color-accent] inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(0,184,217,0.08)] border border-[rgba(0,184,217,0.2)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-accent] animate-pulse" />
            EXOTIC MARINE LIFE &bull; BESPOKE AQUARIUMS
          </span>
        </div>

        {/* Main heading */}
        <h1 ref={headingRef} aria-label="The Ocean Reimagined">
          <div className="overflow-hidden mb-1 sm:mb-2">
            <div className="line-1 font-display text-display-xl text-[--color-text] font-light italic leading-[0.92]" style={{ transform: 'translateY(100%)' }}>
              The Ocean
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="line-2 font-display text-display-xl text-[--color-text] font-light leading-[0.92]" style={{ transform: 'translateY(100%)' }}>
              Reimagined.
            </div>
          </div>
        </h1>

        {/* Sub-content */}
        <div ref={subRef} className="mt-5 sm:mt-8 opacity-0 max-w-xl">
          <p className="font-body font-light text-[--color-muted] leading-relaxed text-sm sm:text-base md:text-lg">
            Captive-bred marine species, living coral reef ecosystems, and turnkey architectural aquarium installations for exceptional spaces across India.
          </p>
        </div>

        {/* Direct Actions */}
        <div ref={ctaRef} className="mt-7 sm:mt-10 opacity-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 max-w-md sm:max-w-none">
          <Link
            href="/marketplace"
            className="btn-primary text-xs tracking-wider uppercase font-semibold py-3.5 sm:py-4 px-7 sm:px-8 rounded-2xl shadow-2xl justify-center text-center active:scale-[0.98] transition-transform"
            data-cursor="EXPLORE"
          >
            EXPLORE MARKETPLACE →
          </Link>
          <Link
            href="/aquarium-design"
            className="btn-ghost text-xs tracking-wider uppercase font-semibold py-3.5 sm:py-4 px-7 sm:px-8 rounded-2xl border-[rgba(255,255,255,0.2)] hover:border-white text-white justify-center text-center active:scale-[0.98] transition-transform"
            data-cursor="DESIGN"
          >
            AQUARIUM DESIGN &amp; BUILD
          </Link>
        </div>
      </div>

      {/* Scroll indicator (Desktop only) */}
      <div
        ref={scrollRef}
        className="hidden md:flex absolute bottom-8 right-8 md:right-12 opacity-0 flex-col items-center gap-2 z-10"
        aria-hidden="true"
      >
        <span className="text-label text-[--color-muted] rotate-90 origin-center tracking-[0.2em]">SCROLL TO DESCEND</span>
        <div className="w-px h-12 bg-gradient-to-b from-transparent to-[--color-accent] animate-scroll-bounce" />
      </div>

      {/* Layer 3 ref — invisible spacer for parallax */}
      <div ref={layer3Ref} className="absolute inset-0 z-4 pointer-events-none" aria-hidden="true" />
    </section>

  );
}
