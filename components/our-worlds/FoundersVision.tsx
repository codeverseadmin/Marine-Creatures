'use client';

import React from 'react';
import Image from 'next/image';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function FoundersVision() {
  return (
    <section
      id="founders-vision"
      aria-labelledby="founder-headline"
      className="relative overflow-hidden rounded-3xl border border-white/10 my-16 sm:my-24"
      style={{
        background: 'linear-gradient(180deg, #020609 0%, #06151C 50%, #020609 100%)',
      }}
    >
      {/* Restrained ambient luxury lighting */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-[140px] pointer-events-none opacity-20"
        style={{ background: '#69E7EA' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-[160px] pointer-events-none opacity-15"
        style={{ background: '#C9AD78' }}
        aria-hidden="true"
      />

      {/* Subtle top luminous divider line */}
      <div
        className="h-[1px] w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #C9AD78 30%, #69E7EA 70%, transparent)',
        }}
        aria-hidden="true"
      />

      <div className="p-6 sm:p-10 lg:p-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* ── Left Column: Editorial Founder Portrait ────────────────── */}
          <div className="lg:col-span-5 flex justify-center">
            <ScrollReveal direction="up" delay={0.1} className="w-full max-w-md lg:max-w-none">
              <div className="relative group">
                {/* Champagne / Soft Aqua framing halo */}
                <div
                  className="absolute -inset-1 rounded-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, #C9AD78, #06151C 50%, #69E7EA)',
                  }}
                  aria-hidden="true"
                />

                {/* Portrait Container */}
                <div className="relative rounded-2xl overflow-hidden border border-[#C9AD78]/30 bg-[#020609] shadow-2xl aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
                  <Image
                    src="/images/founder/suraj-shasmal.jpg"
                    alt="Suraj Shasmal, Founder of Marine Creatures"
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 50vw, 420px"
                    priority
                    className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-[1.02]"
                  />

                  {/* Restrained cinematic dark vignette */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(2,6,9,0.05) 0%, rgba(2,6,9,0.2) 60%, rgba(2,6,9,0.85) 100%)',
                    }}
                    aria-hidden="true"
                  />

                  {/* Floating Identity Badge (Mobile/Desktop subtle anchor) */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 pointer-events-none">
                    <div className="inline-block px-3 py-1.5 rounded-lg border border-[#C9AD78]/30 bg-[#020609]/80 backdrop-blur-md">
                      <span
                        className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] block font-semibold"
                        style={{ color: '#C9AD78' }}
                      >
                        SURAJ SHASMAL
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-slate-300 tracking-wider block">
                        Founder, Marine Creatures
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* ── Right Column: The Founder's Vision Narrative ─────────── */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <ScrollReveal direction="up" delay={0.2}>
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="w-8 h-[1px]"
                  style={{ background: '#C9AD78' }}
                  aria-hidden="true"
                />
                <span
                  className="text-xs font-mono uppercase tracking-[0.25em] font-semibold block"
                  style={{ color: '#C9AD78' }}
                >
                  THE MIND BEHIND THE WORLD
                </span>
              </div>

              {/* Headline */}
              <h2
                id="founder-headline"
                className="font-display text-2xl sm:text-4xl lg:text-5xl text-white font-light tracking-wide leading-tight"
              >
                A VISION THAT GOES BEYOND AQUARIUMS.
              </h2>
            </ScrollReveal>

            {/* Narrative Body */}
            <ScrollReveal direction="up" delay={0.3} className="space-y-4 text-slate-300 font-light font-body text-sm sm:text-base leading-relaxed">
              <p className="text-white font-normal text-base sm:text-lg">
                Every great creation begins with a vision.
              </p>
              <p>
                Marine Creatures was built on a passion for the extraordinary beauty of marine life and the belief that an aquarium can be much more than a collection of fish and materials.
              </p>
              <p className="font-display italic text-lg sm:text-xl text-[#69E7EA]">
                It can become a living work of art.
              </p>
              <p>
                Through thoughtful design, attention to detail and a commitment to quality, we aim to bring extraordinary underwater environments into everyday spaces.
              </p>
            </ScrollReveal>

            {/* Founder Sign-off & Brand Signature */}
            <ScrollReveal direction="up" delay={0.4} className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h3 className="font-display text-xl sm:text-2xl text-white tracking-wider font-light">
                  SURAJ SHASMAL
                </h3>
                <p
                  className="text-xs uppercase tracking-[0.18em] font-medium mt-0.5"
                  style={{ color: '#C9AD78' }}
                >
                  Founder, Marine Creatures
                </p>
              </div>

              {/* Closing Brand Line */}
              <div className="text-left sm:text-right">
                <span
                  className="text-xs sm:text-sm font-mono tracking-[0.2em] font-semibold block uppercase"
                  style={{ color: '#69E7EA' }}
                >
                  BRINGING OCEAN AT YOUR DOORSTEP.
                </span>
              </div>
            </ScrollReveal>

          </div>

        </div>
      </div>

      {/* Subtle bottom luminous divider line */}
      <div
        className="h-[1px] w-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #69E7EA 30%, #C9AD78 70%, transparent)',
        }}
        aria-hidden="true"
      />
    </section>
  );
}

