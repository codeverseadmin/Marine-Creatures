'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';

// Number of particles in the hero background
const PARTICLE_COUNT = 60;

function Particles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: `${5 + Math.random() * 40}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            animationDuration: `${8 + Math.random() * 12}s`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: 0,
            animationName: 'particle-drift',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
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
  const headingRef = useRef<HTMLDivElement>(null);
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
      className="relative min-h-screen flex flex-col justify-end overflow-hidden"
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
          className="absolute inset-0 opacity-0"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1920&q=85')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
          }}
        />
        {/* Deep ocean vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(2,7,11,0.5) 0%, rgba(2,7,11,0.1) 40%, rgba(2,7,11,0.6) 80%, rgba(2,7,11,1) 100%)',
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
          background: 'radial-gradient(ellipse at center bottom, rgba(0,184,217,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 container-max pb-16 md:pb-24">
        {/* Wordmark & Live Depth Meter */}
        <div
          ref={wordmarkRef}
          className="mb-8 opacity-0 flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4 max-w-4xl"
        >
          <span className="text-label text-[--color-accent] tracking-[0.3em] font-medium">
            MARINE CREATURES ARCHITECTURE
          </span>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(0,184,217,0.08)] border border-[rgba(0,184,217,0.25)] text-[10px] tracking-widest text-[--color-accent]">
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-accent] animate-ping" />
            <span>DEPTH: 000m // SURFACE REEF</span>
          </div>
        </div>

        {/* Main heading */}
        <div ref={headingRef} aria-label="The Ocean Reimagined">
          <div className="overflow-hidden mb-1">
            <div className="line-1 font-display text-display-xl text-[--color-text] font-light italic leading-[0.88]" style={{ transform: 'translateY(100%)' }}>
              The Ocean
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="line-2 font-display text-display-xl text-[--color-text] font-light leading-[0.88]" style={{ transform: 'translateY(100%)' }}>
              Reimagined.
            </div>
          </div>
        </div>

        {/* Sub-content & Trust Badges */}
        <div ref={subRef} className="mt-8 opacity-0 max-w-2xl">
          <p className="text-label text-[--color-muted] tracking-[0.2em] mb-3">
            EXOTIC MARINE LIFE &nbsp;/&nbsp; BESPOKE AQUARIUMS &nbsp;/&nbsp; LIVING ECOSYSTEMS
          </p>
          <p className="font-body font-light text-[--color-muted] leading-relaxed mb-6" style={{ fontSize: '0.9375rem' }}>
            Museum-grade marine life habitats, bespoke architectural aquariums, and autonomous living reef ecosystems tailored for the world&apos;s most distinguished residences and estates.
          </p>

          {/* Quick trust metrics */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 text-[10px] tracking-widest uppercase rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-[--color-text]">
              ✦ OptiWhite™ Monolithic Glass
            </span>
            <span className="px-3 py-1 text-[10px] tracking-widest uppercase rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-[--color-text]">
              ✦ Symbiotic Coral Biotopes
            </span>
            <span className="px-3 py-1 text-[10px] tracking-widest uppercase rounded border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-[--color-accent]">
              ✦ 24/7 Marine Biology Concierge
            </span>
          </div>
        </div>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-wrap items-center gap-5 mt-10 opacity-0">
          <Link
            href="/marine-life"
            className="btn-primary"
            data-cursor="EXPLORE"
          >
            EXPLORE MARINE LIFE
            <span className="text-[--color-primary]">→</span>
          </Link>
          <Link
            href="/aquarium-design"
            className="btn-ghost"
            data-cursor="ENTER"
          >
            DESIGN YOUR AQUARIUM
            <span className="text-[--color-accent]">→</span>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        ref={scrollRef}
        className="absolute bottom-8 right-8 md:right-12 opacity-0 flex flex-col items-center gap-2 z-10"
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
