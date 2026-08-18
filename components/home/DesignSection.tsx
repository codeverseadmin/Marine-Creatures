'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const FORM_FACTORS = [
  {
    id: 'monolith',
    name: 'Penthouse Monolith',
    dimensions: '4.8m (L) × 1.8m (H) × 0.9m (D)',
    volume: '7,800 Liters / 2,060 Gal',
    material: 'Monolithic Thermoformed Cast Acrylic (90mm)',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
    desc: 'Seamless architectural wall integration with concealed life-support plant room and automated water-change robotics.',

  },
  {
    id: 'divider',
    name: 'Panoramic Room Divider',
    dimensions: '3.6m (L) × 1.4m (H) × 0.8m (D)',
    volume: '4,000 Liters / 1,050 Gal',
    material: 'OptiWhite™ Low-Iron German Glass (25mm)',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85',
    desc: 'Dual-sided living ocean corridor connecting grand salon and dining galleries with 360-degree coral topography.',
  },
  {
    id: 'cylinder',
    name: '360° Column Sanctuary',
    dimensions: '2.2m (Ø) × 2.6m (H)',
    volume: '9,800 Liters / 2,590 Gal',
    material: 'Seamless Cylindrical Polymer',
    image: 'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?w=1200&q=85',
    desc: 'Centerpiece spiral marine column featuring schooling chromis, anthias, and living Indo-Pacific soft corals.',
  },
];

const PROCESS_STEPS = [
  { step: '01', label: 'Architectural Discovery', desc: 'Structural load analysis, interior acoustic mapping, and daylight alignment studies.' },
  { step: '02', label: 'Parametric 3D Engineering', desc: 'Bespoke hydrodynamic CFD simulations, sump layout, and filtration plant schematics.' },
  { step: '03', label: 'Living Aquascape Artistry', desc: 'Handcrafted ceramic live rock archways, Bahamian aragonite, and cultured coral placement.' },
  { step: '04', label: 'White-Glove Commissioning', desc: 'Clean installation, automated ecosystem balance, and introduction of quarantined specimen.' },
];

export function DesignSection() {
  const [activeForm, setActiveForm] = useState(0);
  const current = FORM_FACTORS[activeForm];

  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'var(--color-primary)' }}
      aria-labelledby="design-heading"
    >
      <div className="container-max">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <SectionHeading
            id="design-heading"
            label="Bespoke Architecture"
            heading={['Your Space.', 'Our Ocean.']}
            subheading="Monumental custom marine sanctuaries engineered for private residences, superyachts, and corporate headquarters."
          />
          <Link
            href="/aquarium-design"
            className="btn-primary inline-flex shrink-0 self-start md:self-auto"
            data-cursor="ENTER"
          >
            START AN ARCHITECTURAL BRIEF
            <span className="text-[--color-primary]">→</span>
          </Link>
        </div>

        {/* Interactive Form Factor Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20 items-stretch">
          {/* Left tabs */}
          <div className="lg:col-span-4 flex flex-col justify-between gap-3">
            <div className="space-y-3">
              <span className="text-label text-[--color-accent] block mb-2">SELECT CONFIGURATION</span>
              {FORM_FACTORS.map((form, i) => (
                <button
                  key={form.id}
                  onClick={() => setActiveForm(i)}
                  className={`w-full text-left p-5 rounded-lg border transition-all duration-300 ${
                    i === activeForm
                      ? 'border-[--color-accent] bg-[rgba(0,184,217,0.08)] shadow-[0_4px_20px_rgba(0,184,217,0.15)]'
                      : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] bg-[rgba(7,21,28,0.4)]'
                  }`}
                  data-cursor="ENTER"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-display text-lg text-[--color-text] font-light">{form.name}</span>
                    <span className={`text-xs ${i === activeForm ? 'text-[--color-accent]' : 'text-[--color-muted]'}`}>0{i + 1}</span>
                  </div>
                  <span className="text-xs text-[--color-muted] font-body block">{form.dimensions}</span>
                </button>
              ))}
            </div>

            {/* Quick spec summary card */}
            <div className="p-5 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(2,7,11,0.6)]">
              <span className="text-[10px] uppercase tracking-widest text-[--color-accent] block mb-2">ENGINEERING SPECIFICATION</span>
              <p className="font-body text-xs text-[--color-muted] leading-relaxed mb-3">{current.desc}</p>
              <div className="text-[11px] text-[--color-text] border-t border-[rgba(255,255,255,0.06)] pt-2">
                <span className="text-[--color-muted]">Material: </span>{current.material}
              </div>
            </div>
          </div>

          {/* Right image preview */}
          <div className="lg:col-span-8 relative rounded-xl overflow-hidden min-h-[380px] lg:min-h-[460px] border border-[rgba(255,255,255,0.08)] shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image}
              alt={current.name}
              className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,7,11,0.9)] via-[rgba(2,7,11,0.2)] to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-label text-[--color-accent] block mb-1">CAPACITY & VOLUME</span>
                <span className="font-display text-2xl text-[--color-text] font-light">{current.volume}</span>
              </div>
              <Link
                href="/aquarium-design"
                className="btn-ghost text-xs"
                data-cursor="ENTER"
              >
                REQUEST CUSTOM BLUEPRINT →
              </Link>
            </div>
          </div>
        </div>

        {/* 4-Step Engineering Protocol */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 border-t border-[rgba(255,255,255,0.06)]">
          {PROCESS_STEPS.map((item, i) => (
            <ScrollReveal
              key={item.step}
              delay={i * 0.08}
              className="p-6 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.3)] hover:border-[rgba(0,184,217,0.3)] transition-colors duration-300"
            >
              <span className="text-label text-[--color-accent] block mb-3">{item.step}</span>
              <h3 className="font-display text-lg text-[--color-text] font-light mb-2">
                {item.label}
              </h3>
              <p className="font-body font-light text-[--color-muted] text-xs leading-relaxed">
                {item.desc}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

