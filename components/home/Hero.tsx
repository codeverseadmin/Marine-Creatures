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

    // Master timeline
    const tl = gsap.timeline({ delay: 0.3 });

    if (!prefersReduced) {
      // 0.5s — particles appear (handled by CSS animation)
      // 1.0s — light rays
      tl.to(
        rays,
        {
          opacity: 0.7,
          duration: 1.5,
          stagger: 0.15,
          ease: 'power1.out',
        },
        0.8
      );

      // 1.5s — image reveal
      tl.fromTo(
        imageRef.current,
        { scale: 1.08, opacity: 0 },
        { scale: 1.02, opacity: 1, duration: 2.5, ease: 'power2.out' },
        1.3
      );

      // 2.5s — MARINE CREATURES wordmark
      tl.fromTo(
        wordmarkRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        2.3
      );

      // 3.0s — THE OCEAN
      const line1 = headingRef.current?.querySelector('.line-1') ?? null;
      const line2 = headingRef.current?.querySelector('.line-2') ?? null;
      if (line1) {
        tl.fromTo(
          line1,
          { y: '110%' },
          { y: '0%', duration: 1.0, ease: 'power3.out' },
          2.8
        );
      }

      // 3.4s — REIMAGINED.
      if (line2) {
        tl.fromTo(
          line2,
          { y: '110%' },
          { y: '0%', duration: 1.0, ease: 'power3.out' },
          3.2
        );
      }

      // 4.0s — subheading
      tl.fromTo(
        subRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        3.8
      );

      // 4.4s — CTA
      tl.fromTo(
        ctaRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        4.2
      );

      // 4.8s — Scroll indicator
      tl.fromTo(
        scrollRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6, ease: 'power1.out' },
        4.6
      );

      // Fade initial dark overlay
      tl.to(
        overlayRef.current,
        { opacity: 0, duration: 2.0, ease: 'power1.out' },
        1.0
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
        {/* Wordmark */}
        <div
          ref={wordmarkRef}
          className="mb-10 opacity-0"
        >
          <span className="text-label text-[--color-accent] tracking-[0.3em]">
            MARINE CREATURES
          </span>
        </div>

        {/* Main heading */}
        <div ref={headingRef} aria-label="The Ocean Reimagined">
          <div className="overflow-hidden mb-1">
            <div className="line-1 font-display text-display-xl text-[--color-text] font-light italic leading-[0.88]" style={{ transform: 'translateY(110%)' }}>
              The Ocean
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="line-2 font-display text-display-xl text-[--color-text] font-light leading-[0.88]" style={{ transform: 'translateY(110%)' }}>
              Reimagined.
            </div>
          </div>
        </div>

        {/* Sub-content */}
        <div ref={subRef} className="mt-8 opacity-0">
          {/* Subheading */}
          <p className="text-label text-[--color-muted] tracking-[0.2em] mb-2">
            EXOTIC MARINE LIFE &nbsp;/&nbsp; BESPOKE AQUARIUMS &nbsp;/&nbsp; LIVING ECOSYSTEMS
          </p>
          <p className="font-body font-light text-[--color-muted] max-w-md leading-relaxed mt-4 hidden md:block" style={{ fontSize: '0.9375rem' }}>
            Exotic marine life, bespoke aquariums and living underwater environments crafted for extraordinary spaces.
          </p>
        </div>

        {/* CTAs */}
        <div ref={ctaRef} className="flex flex-wrap items-center gap-4 mt-10 opacity-0">
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
