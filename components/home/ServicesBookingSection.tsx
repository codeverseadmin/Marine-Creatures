'use client';

import React from 'react';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';
import { SITE_CONFIG } from '@/lib/config';

export function ServicesBookingSection() {
  return (
    <section className="section bg-[var(--color-secondary)] border-t border-[rgba(255,255,255,0.06)] relative overflow-hidden">
      <div className="container-max">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-label text-[--color-accent] tracking-[0.3em] block mb-3">
            MASTER ENGINEERING &amp; ECOSYSTEM RESTORATION
          </span>
          <h2 className="font-display text-display-md text-[--color-text] font-light">
            Installation &amp; Renovation Services
          </h2>
          <p className="font-body text-xs text-[--color-muted] mt-3 leading-relaxed">
            From new architectural commissions to revitalizing troubled existing aquariums, our certified biological team delivers turnkey excellence.
          </p>
        </div>

        {/* 2 Flagship Service Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Card 1: Installation Service */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-semibold text-[--color-accent] bg-[rgba(0,184,217,0.12)] px-3 py-1 rounded border border-[rgba(0,184,217,0.3)]">
                  Turnkey Commission
                </span>
                <span className="text-xs text-[--color-muted]">
                  From <strong className="text-white">₹1,85,000</strong>
                </span>
              </div>

              <h3 className="font-display text-2xl text-white font-light mb-3">
                Bespoke Aquarium Installation
              </h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed mb-6">
                Complete architectural delivery including floor load engineering, Schedule 80 concealed plumbing, automated water change plant rooms, biological live rock scaping, and quarantined livestock acclimation.
              </p>

              {/* Photo */}
              <div className="rounded-xl overflow-hidden mb-6 relative" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85"
                  alt="Aquarium Installation"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Inclusions */}
              <ul className="space-y-2 text-xs text-[--color-muted] mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-[--color-accent]">✓</span>
                  <span className="text-white">OptiWhite™ Monolithic Glass / Thermoformed Acrylic</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[--color-accent]">✓</span>
                  <span className="text-white">IoT Controlled NemoLight &amp; Silent DC Return Pumps</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[--color-accent]">✓</span>
                  <span className="text-white">10-Year Structural Zero-Leak Guarantee</span>
                </li>
              </ul>
            </div>

            <Link
              href="/services#booking-portal"
              className="btn-primary w-full text-center block text-xs py-3.5"
            >
              BOOK NEW INSTALLATION CONSULTATION →
            </Link>
          </div>

          {/* Card 2: Renovation & Revival Service */}
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] p-8 backdrop-blur-md shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-semibold text-[--color-gold] bg-[rgba(201,168,76,0.12)] px-3 py-1 rounded border border-[rgba(201,168,76,0.3)]">
                  Ecosystem Revival
                </span>
                <span className="text-xs text-[--color-muted]">
                  From <strong className="text-white">₹45,000</strong>
                </span>
              </div>

              <h3 className="font-display text-2xl text-white font-light mb-3">
                Aquarium Renovation &amp; Restoration
              </h3>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed mb-6">
                Restore troubled, cloudy, algae-ridden, or scratched aquariums to crystal-clear brilliance. We safely house your fish, polish acrylic/glass, replace outdated filtration, and re-scape with fresh biological rock.
              </p>

              {/* Interactive Before/After Transformation Slider */}
              <div className="rounded-xl overflow-hidden mb-6 relative" style={{ height: '220px' }}>
                <BeforeAfterSlider
                  beforeSrc="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=85"
                  afterSrc="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85"
                  beforeAlt="Neglected aquarium before renovation"
                  afterAlt="Pristine living reef after Marine Creatures renovation"
                />
              </div>

              {/* Inclusions */}
              <ul className="space-y-2 text-xs text-[--color-muted] mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-[--color-gold]">✓</span>
                  <span className="text-white">Zero-Loss Livestock Relocation &amp; Safe Holding</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[--color-gold]">✓</span>
                  <span className="text-white">Diamond Glass Polishing &amp; Scratch Removal</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[--color-gold]">✓</span>
                  <span className="text-white">Upgrading to High-PAR NemoLight LED Technology</span>
                </li>
              </ul>
            </div>

            <Link
              href="/services#booking-portal"
              className="btn-ghost w-full text-center block text-xs py-3.5 border-[--color-gold] text-[--color-gold] hover:bg-[rgba(201,168,76,0.15)]"
            >
              REQUEST RENOVATION QUOTE &amp; AUDIT →
            </Link>
          </div>
        </div>

        {/* Direct Contact Bar */}
        <div className="rounded-xl p-6 border border-[rgba(0,184,217,0.25)] bg-[rgba(0,184,217,0.04)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-xl">📞</span>
            <div>
              <span className="text-white font-medium block">Prefer to speak directly with our Senior Biologist?</span>
              <span className="text-[--color-muted]">Available Monday–Saturday for bespoke advice across India</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href={`tel:${SITE_CONFIG.phone}`} className="text-[--color-accent] hover:underline font-bold">
              {SITE_CONFIG.phone}
            </a>
            <span className="text-[--color-muted]">|</span>
            <a
              href="https://wa.me/919330436603?text=Hi%20Marine%20Creatures,%20I%20would%20like%20to%20inquire%20about%20your%20installation%20and%20renovation%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-2 px-4"
            >
              WHATSAPP CHAT ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
