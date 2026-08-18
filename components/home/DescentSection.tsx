'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function DescentSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pinnedRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);
  const line4Ref = useRef<HTMLDivElement>(null);
  const fishRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      gsap.set([line1Ref.current, line2Ref.current, line3Ref.current, line4Ref.current], {
        opacity: 1, y: 0,
      });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=180%',
        pin: pinnedRef.current,
        scrub: 1.2,
        anticipatePin: 1,
      },
    });

    // Phase 1: ENTER THE OCEAN
    tl.fromTo(line1Ref.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.25 });
    tl.fromTo(line2Ref.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.25 }, '-=0.1');

    // Fish passes through
    tl.fromTo(
      fishRef.current,
      { x: '-10%', opacity: 0, scale: 0.9 },
      { x: '110%', opacity: 1, scale: 1.1, duration: 0.6, ease: 'power1.inOut' },
      0.3
    );

    // Fade out first text
    tl.to([line1Ref.current, line2Ref.current], { opacity: 0, y: -25, duration: 0.2 }, 0.55);

    // Phase 2: WE CREATE LIVING WORLDS
    tl.fromTo(line3Ref.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.3 }, 0.7);
    tl.fromTo(line4Ref.current, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.3 }, 0.8);

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.vars.trigger === section) st.kill();
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ background: 'var(--color-primary)', height: '280vh' }}
      aria-label="The descent — our philosophy"
    >
      <div
        ref={pinnedRef}
        className="sticky top-0 h-screen flex flex-col justify-center overflow-hidden"
      >
        {/* Background depth glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,184,217,0.06) 0%, rgba(2,7,11,0.95) 75%)',
          }}
          aria-hidden="true"
        />

        {/* Dynamic Depth Meter (Right side) */}
        <div className="absolute right-8 md:right-16 top-1/2 -translate-y-1/2 z-20 pointer-events-none hidden sm:flex flex-col items-end gap-2 border-r border-[rgba(255,255,255,0.1)] pr-4">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[--color-accent] font-medium">BATHYMETRIC DEPTH</span>
          <span className="font-display text-2xl text-[--color-text] font-light">
            1,200<span className="text-xs text-[--color-muted] ml-1">METERS</span>
          </span>
          <span className="text-[9px] tracking-[0.2em] uppercase text-[--color-muted]">MESOPELAGIC TWILIGHT ZONE</span>
        </div>

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: `${Math.random() * 60}%`,
                animationDuration: `${6 + Math.random() * 8}s`,
                animationDelay: `${Math.random() * 6}s`,
                opacity: 0,
                animationName: 'particle-drift',
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>

        {/* Fish silhouette */}
        <div
          ref={fishRef}
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-0 z-0"
          aria-hidden="true"
          style={{ left: '-10%' }}
        >
          <svg width="220" height="90" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="40" rx="80" ry="25" fill="rgba(0,184,217,0.12)" />
            <ellipse cx="95" cy="40" rx="65" ry="18" fill="rgba(0,184,217,0.08)" />
            <path d="M180 30L200 15L200 55L180 40" fill="rgba(0,184,217,0.09)" />
            <circle cx="165" cy="38" r="3.5" fill="rgba(0,184,217,0.2)" />
          </svg>
        </div>

        {/* Typography — Phase 1 */}
        <div className="container-max relative z-10">
          <div>
            <div className="mb-4">
              <span className="text-label text-[--color-accent]">THE DESCENT</span>
            </div>
            <div className="overflow-hidden mb-1">
              <div ref={line1Ref} className="font-display text-display-lg text-[--color-text] font-light italic" style={{ opacity: 0 }}>
                Enter
              </div>
            </div>
            <div className="overflow-hidden">
              <div ref={line2Ref} className="font-display text-display-lg text-[--color-text] font-light" style={{ opacity: 0 }}>
                The Ocean.
              </div>
            </div>
          </div>

          {/* Typography — Phase 2 */}
          <div className="absolute top-0 left-0 right-0 container-max">
            <div className="overflow-hidden mb-1">
              <div ref={line3Ref} className="font-display text-display-lg text-[--color-text] font-light" style={{ opacity: 0 }}>
                We Don&apos;t Just
              </div>
            </div>
            <div className="overflow-hidden mb-1">
              <div className="font-display text-display-lg text-[--color-text] font-light" style={{ opacity: 0 }} ref={line4Ref}>
                Build Aquariums.
              </div>
            </div>
            <div className="mt-6">
              <div
                className="font-display italic text-display-md text-[--color-accent] font-light"
                style={{ opacity: 0 }}
                ref={(el) => {
                  if (el) {
                    gsap.to(el, {
                      opacity: 1,
                      scrollTrigger: {
                        trigger: el,
                        start: 'top 80%',
                        once: true,
                      },
                    });
                  }
                }}
              >
                We Create Living Worlds.
              </div>
            </div>
          </div>
        </div>

        {/* Decorative light beam */}
        <div
          className="absolute bottom-0 left-1/3 w-px h-1/3 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,184,217,0.3), transparent)',
          }}
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

