'use client';

import React from 'react';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';
import { SITE_CONFIG } from '@/lib/config';

export function ServicesBookingSection() {
  return (
    <section className="section bg-[var(--color-secondary)] border-t border-[rgba(255,255,255,0.06)] relative overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(0,184,217,0.12) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="container-max relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block mb-2 sm:mb-3">
            MASTER ENGINEERING &amp; ECOSYSTEM RESTORATION
          </span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-[--color-text] font-light mb-3 sm:mb-4">
            Installation &amp; Renovation Services
          </h2>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            From new architectural commissions to revitalizing troubled existing aquariums, our certified biological team delivers turnkey excellence across India.
          </p>
        </div>

        {/* 2 Flagship Service Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 mb-12 sm:mb-16">
          {/* Card 1: Installation Service */}
          <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.65)] p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-2xl flex flex-col justify-between glass-card-hover">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <span className="text-[11px] uppercase font-semibold text-[--color-accent] bg-[rgba(0,184,217,0.12)] px-3 py-1 rounded-xl border border-[rgba(0,184,217,0.3)]">
                  Turnkey Commission
                </span>
                <span className="text-xs sm:text-sm text-[--color-muted]">
                  From <strong className="text-white">₹1,85,000</strong>
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-3">
                Bespoke Aquarium Installation
              </h3>
              <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed mb-6">
                Complete architectural delivery including floor load engineering, Schedule 80 concealed plumbing, automated water change plant rooms, biological live rock scaping, and quarantined livestock acclimation.
              </p>

              {/* Photo */}
              <div className="rounded-2xl overflow-hidden mb-6 relative border border-[rgba(255,255,255,0.08)]" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85"
                  alt="Aquarium Installation"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Inclusions */}
              <ul className="space-y-2.5 text-xs sm:text-sm text-[--color-muted] mb-8">
                <li className="flex items-center gap-2.5">
                  <span className="text-[--color-accent] font-bold">✓</span>
                  <span className="text-white font-light">OptiWhite™ Monolithic Glass / Thermoformed Acrylic</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[--color-accent] font-bold">✓</span>
                  <span className="text-white font-light">IoT Controlled NemoLight &amp; Silent DC Return Pumps</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[--color-accent] font-bold">✓</span>
                  <span className="text-white font-light">10-Year Structural Zero-Leak Guarantee</span>
                </li>
              </ul>
            </div>

            <Link
              href="/services#booking-portal"
              className="btn-primary w-full text-center block text-xs tracking-wider uppercase font-semibold py-4 rounded-2xl shadow-xl active:scale-[0.98] transition-transform"
            >
              BOOK NEW INSTALLATION CONSULTATION →
            </Link>
          </div>

          {/* Card 2: Renovation & Revival Service */}
          <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.65)] p-6 sm:p-8 md:p-10 backdrop-blur-xl shadow-2xl flex flex-col justify-between glass-card-hover">
            <div>
              <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                <span className="text-[11px] uppercase font-semibold text-[--color-gold] bg-[rgba(201,168,76,0.12)] px-3 py-1 rounded-xl border border-[rgba(201,168,76,0.3)]">
                  Ecosystem Revival
                </span>
                <span className="text-xs sm:text-sm text-[--color-muted]">
                  From <strong className="text-white">₹45,000</strong>
                </span>
              </div>

              <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-3">
                Aquarium Renovation &amp; Restoration
              </h3>
              <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed mb-6">
                Restore troubled, cloudy, algae-ridden, or scratched aquariums to crystal-clear brilliance. We safely house your fish, polish acrylic/glass, replace outdated filtration, and re-scape with fresh biological rock.
              </p>

              {/* Interactive Before/After Transformation Slider */}
              <div className="rounded-2xl overflow-hidden mb-6 relative border border-[rgba(255,255,255,0.08)]" style={{ height: '240px' }}>
                <BeforeAfterSlider
                  beforeSrc="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=85"
                  afterSrc="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85"
                  beforeAlt="Neglected aquarium before renovation"
                  afterAlt="Pristine living reef after Marine Creatures renovation"
                />
              </div>

              {/* Inclusions */}
              <ul className="space-y-2.5 text-xs sm:text-sm text-[--color-muted] mb-8">
                <li className="flex items-center gap-2.5">
                  <span className="text-[--color-gold] font-bold">✓</span>
                  <span className="text-white font-light">Zero-Loss Livestock Relocation &amp; Safe Holding</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[--color-gold] font-bold">✓</span>
                  <span className="text-white font-light">Diamond Glass Polishing &amp; Scratch Removal</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[--color-gold] font-bold">✓</span>
                  <span className="text-white font-light">Upgrading to High-PAR NemoLight LED Technology</span>
                </li>
              </ul>
            </div>

            <Link
              href="/services#booking-portal"
              className="btn-ghost w-full text-center block text-xs tracking-wider uppercase font-semibold py-4 rounded-2xl border-[--color-gold] text-[--color-gold] hover:bg-[rgba(201,168,76,0.15)] active:scale-[0.98] transition-all"
            >
              REQUEST RENOVATION QUOTE &amp; AUDIT →
            </Link>
          </div>
        </div>

        {/* Direct Contact Bar */}
        <div className="rounded-2xl p-5 sm:p-7 border border-[rgba(0,184,217,0.25)] bg-[rgba(0,184,217,0.05)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">📞</span>
            <div>
              <span className="text-white font-medium block">Prefer to speak directly with our Senior Biologist?</span>
              <span className="text-[--color-muted] text-xs">Available Monday–Saturday for bespoke advice across India</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <a href={`tel:${SITE_CONFIG.phone}`} className="text-[--color-accent] hover:underline font-bold text-sm">
              {SITE_CONFIG.phone}
            </a>
            <span className="text-[--color-muted] hidden sm:inline">|</span>
            <a
              href="https://wa.me/919330436603?text=Hi%20Marine%20Creatures,%20I%20would%20like%20to%20inquire%20about%20your%20installation%20and%20renovation%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-2.5 px-5 rounded-xl active:scale-95"
            >
              WHATSAPP CHAT ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
