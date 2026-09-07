'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function DescentSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const depthMeterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        depthMeterRef.current,
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="section relative overflow-hidden border-b border-[rgba(255,255,255,0.06)]"
      style={{ background: 'linear-gradient(180deg, var(--color-primary) 0%, rgba(3,10,16,1) 100%)' }}
      aria-label="The descent — living ocean architecture"
    >
      {/* Background depth glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,184,217,0.08) 0%, rgba(2,7,11,0.95) 75%)',
        }}
        aria-hidden="true"
      />

      <div className="container-max relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Main Philosophy Typography */}
          <div ref={textRef} className="lg:col-span-8 space-y-3 sm:space-y-4">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block">
              THE MARINE CREATURES ETHOS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light leading-tight">
              We Don&apos;t Just Build Aquariums.<br />
              <em className="text-[--color-accent] italic">We Create Living Worlds.</em>
            </h2>
            <p className="font-body text-xs sm:text-sm md:text-base text-[--color-muted] font-light max-w-xl leading-relaxed">
              Every system is engineered from the ground up to replicate true oceanic biological balances — pairing cultured live rock and symbiotic clownfish with automated climate and spectrum controls.
            </p>
          </div>

          {/* Dynamic Depth & Specification Meter (Right side, well padded) */}
          <div ref={depthMeterRef} className="lg:col-span-4 flex flex-col items-start lg:items-end">
            <div className="p-6 sm:p-7 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-4 w-full max-w-sm shadow-xl glass-card-hover">
              <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[--color-accent] font-medium">BIOTOPE PARAMETER</span>
                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  STABLE
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[--color-muted] block mb-1">TARGET SALINITY</span>
                <span className="font-display text-2xl sm:text-3xl text-white font-light">1.025 SG</span>
              </div>
              <div className="flex justify-between text-xs text-[--color-muted] border-t border-[rgba(255,255,255,0.06)] pt-3">
                <span>Calcium: <strong className="text-white font-medium">450 ppm</strong></span>
                <span>Magnesium: <strong className="text-white font-medium">1350 ppm</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
