'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  {
    num: '01',
    title: 'Discover',
    image: 'https://images.unsplash.com/photo-1542496658-e33a6d0d4f17?w=800&q=80',
    desc: 'A discovery conversation to understand your space, your vision and your lifestyle. We listen before we design.',
  },
  {
    num: '02',
    title: 'Parametric Engineering',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=800&q=80',
    desc: '3D modeling of aquarium structure, weight load distribution and hydrodynamic simulations.',
  },
  {
    num: '03',
    title: 'Build',
    image: 'https://images.unsplash.com/photo-1612629808341-9de2462b1b8b?w=800&q=80',
    desc: 'Custom aquarium construction using premium materials. Every component selected for longevity and performance.',
  },
  {
    num: '04',
    title: 'Install',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80',
    desc: 'Professional installation with minimal disruption. Your home or business remains our priority throughout.',
  },
  {
    num: '05',
    title: 'Introduce Life',
    image: 'https://images.unsplash.com/photo-1570126618953-d437176e8c79?w=800&q=80',
    desc: 'Carefully selected marine life is introduced in stages, ensuring a stable and thriving ecosystem.',
  },
  {
    num: '06',
    title: 'Maintain',
    image: 'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=800&q=80',
    desc: 'Ongoing maintenance programmes to keep your ocean alive, healthy and visually exceptional.',
  },
];

export function ProcessSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || window.innerWidth < 768) return;

    const totalWidth = track.scrollWidth - track.clientWidth;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: -totalWidth,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: `+=${totalWidth + window.innerHeight}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ background: 'var(--color-primary)' }}
      aria-labelledby="process-heading"
    >
      {/* =========================================================================
          DESKTOP VIEW (>= 768px): Pinned Cinematic Horizontal Scroll
         ========================================================================= */}
      <div className="hidden md:flex min-h-screen flex-col justify-center">
        {/* Heading */}
        <div className="container-max pt-24 pb-12 shrink-0">
          <SectionHeading
            id="process-heading"
            label="Our Process"
            heading={['From Idea', 'To Ocean.']}
          />
        </div>

        {/* Horizontal track */}
        <div className="overflow-hidden flex-1 flex items-center">
          <div
            ref={trackRef}
            className="flex gap-8 px-8 md:px-24 pb-8"
            style={{ width: 'max-content' }}
          >
            {STAGES.map((stage) => (
              <div
                key={stage.num}
                className="shrink-0 w-72 md:w-80"
              >
                {/* Image */}
                <div className="overflow-hidden mb-6 rounded-xl border border-[rgba(255,255,255,0.08)]" style={{ aspectRatio: '3/4', maxHeight: '320px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stage.image}
                    alt={stage.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Line */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-display-sm font-display font-light text-[--color-accent]">{stage.num}</span>
                  <div className="h-px flex-1 bg-[rgba(255,255,255,0.1)]" />
                </div>

                {/* Title */}
                <h3 className="font-display text-display-sm text-[--color-text] font-light mb-3">
                  {stage.title}
                </h3>

                {/* Desc */}
                <p className="font-body font-light text-[--color-muted] text-sm leading-relaxed">
                  {stage.desc}
                </p>
              </div>
            ))}

            {/* End card */}
            <div className="shrink-0 w-72 md:w-80 flex items-center justify-center">
              <div className="text-center">
                <div
                  className="font-display text-display-md text-[--color-text] font-light italic mb-4"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Living Art.
                </div>
                <div className="accent-line mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MOBILE VIEW (< 768px): Smooth Vertical Step-by-Step Timeline
         ========================================================================= */}
      <div className="md:hidden py-20">
        <div className="container-max">
          <SectionHeading
            label="Our Process"
            heading={['From Idea', 'To Ocean.']}
            subheading="Six meticulous stages of engineering and marine biology to create your living sanctuary."
          />

          <div className="mt-12 relative">
            {/* Vertical timeline spine */}
            <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-[--color-accent] via-[rgba(0,184,217,0.3)] to-transparent" />

            <div className="space-y-10">
              {STAGES.map((stage, idx) => (
                <ScrollReveal
                  key={stage.num}
                  delay={idx * 0.05}
                  className="relative pl-14"
                >
                  {/* Timeline node */}
                  <div className="absolute left-3.5 top-1 -translate-x-1/2 w-6 h-6 rounded-full bg-[var(--color-primary)] border-2 border-[--color-accent] flex items-center justify-center shadow-[0_0_10px_rgba(0,184,217,0.5)]">
                    <div className="w-2 h-2 rounded-full bg-[--color-accent]" />
                  </div>

                  {/* Card Content */}
                  <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-md p-5 shadow-xl">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs uppercase font-mono font-bold tracking-widest text-[--color-accent]">
                        PHASE {stage.num}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl text-white font-light mb-3">
                      {stage.title}
                    </h3>

                    {/* Image */}
                    <div className="rounded-xl overflow-hidden mb-4 border border-[rgba(255,255,255,0.06)]" style={{ aspectRatio: '16/9' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={stage.image}
                        alt={stage.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <p className="font-body text-xs sm:text-sm text-[--color-muted] font-light leading-relaxed">
                      {stage.desc}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Living Art mobile outro badge */}
            <div className="mt-12 text-center p-8 rounded-2xl border border-[rgba(0,184,217,0.2)] bg-[rgba(0,184,217,0.04)]">
              <span className="font-display text-2xl text-[--color-accent] italic block mb-2">
                Living Art.
              </span>
              <p className="text-xs text-[--color-muted]">
                Engineered for lifetime stability and breathtaking beauty.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
