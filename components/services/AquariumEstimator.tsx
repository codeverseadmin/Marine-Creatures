'use client';

import React, { useState } from 'react';
import { SITE_CONFIG } from '@/lib/config';
import { useCatalog } from '@/lib/context/CatalogContext';

interface ConfigOptions {
  type: 'reef' | 'predator' | 'jellyfish' | 'architectural';
  scale: 'compact' | 'medium' | 'grand' | 'monumental';
  material: 'optiwhite' | 'acrylic';
  techLevel: 'smart' | 'titanium' | 'ultra-iot';
}

const TANK_TYPES = [
  {
    id: 'reef',
    name: 'Living Coral Reef',
    subtitle: 'LPS & SPS Coral Ecosystem with Symbiotic Fish',
    basePrice: 185000,
    icon: '🪸',
    badge: 'Most Popular',
  },
  {
    id: 'predator',
    name: 'Pelagic & Exotic Marine',
    subtitle: 'Lionfish, Moray Eels & Large Angelfish',
    basePrice: 220000,
    icon: '🦈',
    badge: 'Dramatic Impact',
  },
  {
    id: 'jellyfish',
    name: 'Moon Jellyfish Kreisel',
    subtitle: 'Laminar flow circular flow tank with RGB illumination',
    basePrice: 260000,
    icon: '🪼',
    badge: 'Ultra Modern',
  },
  {
    id: 'architectural',
    name: 'Bespoke Room Divider / Wall',
    subtitle: 'Custom dual-sided architectural integration',
    basePrice: 380000,
    icon: '🏛️',
    badge: 'Luxury Signature',
  },
];

const SCALES = [
  {
    id: 'compact',
    label: '3.5ft / 300 Litres',
    desc: 'Ideal for luxury bedroom or executive study',
    multiplier: 1.0,
    dimensions: '105cm × 55cm × 55cm',
  },
  {
    id: 'medium',
    label: '5.0ft / 650 Litres',
    desc: 'Perfect statement centerpiece for living rooms',
    multiplier: 1.6,
    dimensions: '150cm × 65cm × 65cm',
  },
  {
    id: 'grand',
    label: '7.0ft / 1,200 Litres',
    desc: 'Grand luxury scale for villas & luxury penthouses',
    multiplier: 2.5,
    dimensions: '210cm × 75cm × 75cm',
  },
  {
    id: 'monumental',
    label: '10ft+ / 2,500L+ Monolith',
    desc: 'Commercial lobbies, hotel suites & luxury estates',
    multiplier: 4.2,
    dimensions: '300cm+ × 90cm × 90cm',
  },
];

const MATERIALS = [
  {
    id: 'optiwhite',
    label: 'Museum OptiWhite™ Glass',
    desc: '99% light transmission low-iron ultra-clear glass with diamond-polished beveled edges.',
    addon: 0,
  },
  {
    id: 'acrylic',
    label: 'Seamless Cast Acrylic Monolith',
    desc: '17x stronger than glass, zero optical refraction, capable of curved seamless corners.',
    addon: 45000,
  },
];

const TECH_TIERS = [
  {
    id: 'smart',
    label: 'Smart Sump & Flow',
    desc: 'Silent DC pumps, automatic top-off, LED full spectrum fixtures, and protein skimmer.',
    addon: 0,
  },
  {
    id: 'titanium',
    label: 'Titanium Climate & Auto-Dose',
    desc: 'Includes corrosion-proof titanium chiller, 4-head Wi-Fi dosing pump & UV sterilizer.',
    addon: 65000,
  },
  {
    id: 'ultra-iot',
    label: 'Autonomous IoT Cloud Ecosystem',
    desc: 'Continuous live pH/salinity telemetry, auto water change, remote cloud alert app & backup UPS.',
    addon: 135000,
  },
];

export function AquariumEstimator() {
  const { addInquiry } = useCatalog();
  const [config, setConfig] = useState<ConfigOptions>({
    type: 'reef',
    scale: 'medium',
    material: 'optiwhite',
    techLevel: 'smart',
  });

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Dynamic price calculation
  const currentType = TANK_TYPES.find((t) => t.id === config.type) || TANK_TYPES[0];
  const currentScale = SCALES.find((s) => s.id === config.scale) || SCALES[1];
  const currentMaterial = MATERIALS.find((m) => m.id === config.material) || MATERIALS[0];
  const currentTech = TECH_TIERS.find((tt) => tt.id === config.techLevel) || TECH_TIERS[0];

  const estimatedPrice = Math.round(
    currentType.basePrice * currentScale.multiplier + currentMaterial.addon + currentTech.addon
  );

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addInquiry({
        type: 'estimator_lead',
        name: clientName.trim() || 'Valued Client',
        phone: clientPhone.trim(),
        email: '',
        serviceType: `Bespoke Build: ${currentType.name} (${currentScale.label})`,
        spaceType: `Material: ${currentMaterial.label} | Tech: ${currentTech.label}`,
        tankSize: currentScale.dimensions,
        location: clientCity.trim(),
        notes: `Estimated Budget: ₹${estimatedPrice.toLocaleString('en-IN')}`,
        preferredDate: 'Immediate Consultation',
      });
    } catch (err) {
      console.error('Error recording estimator lead:', err);
    }
    setSubmitted(true);
  };

  const generateWhatsAppMessage = () => {
    const text = `Hi Marine Creatures! I used your Interactive Aquarium Configurator for my property:\n\n*Aquarium Spec:* ${currentType.name}\n*Scale:* ${currentScale.label} (${currentScale.dimensions})\n*Viewing Material:* ${currentMaterial.label}\n*Tech Tier:* ${currentTech.label}\n*Estimated Budget:* ₹${estimatedPrice.toLocaleString('en-IN')}\n*Location:* ${clientCity || 'India'}\n*Name:* ${clientName || 'Client'}\n\nI would like to schedule an architectural consultation and site survey.`;
    return encodeURIComponent(text);
  };

  const handleWhatsAppDirect = () => {
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${generateWhatsAppMessage()}`, '_blank');
  };

  return (
    <div className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(6,20,29,0.85)] backdrop-blur-2xl p-5 sm:p-8 md:p-12 shadow-2xl space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[--color-accent] animate-pulse" />
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent]">
              INTERACTIVE BESPOKE CONFIGURATOR
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-white font-light">
            Architectural Aquarium Estimator
          </h2>
          <p className="text-xs sm:text-sm text-[--color-muted] mt-1 max-w-xl">
            Configure your custom living marine environment and get an immediate specification breakdown and investment estimate.
          </p>
        </div>

        {/* Live dynamic estimate badge */}
        <div className="bg-[rgba(0,184,217,0.1)] border border-[rgba(0,184,217,0.3)] rounded-2xl p-4 sm:p-5 text-right shrink-0">
          <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[--color-muted] block font-medium">
            Turnkey Project Estimate
          </span>
          <span className="font-display text-2xl sm:text-3xl md:text-4xl text-[--color-accent] font-light">
            ₹{estimatedPrice.toLocaleString('en-IN')}*
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">
            Includes installation, living rock &amp; life support
          </span>
        </div>
      </div>

      {/* Step 1: Ecosystem Type */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-[0.2em] font-semibold text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[--color-accent] text-[--color-primary] text-[10px] font-bold flex items-center justify-center">1</span>
          Select Marine Ecosystem Vision
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {TANK_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setConfig({ ...config, type: t.id as ConfigOptions['type'] })}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative active:scale-98 flex flex-col justify-between ${
                config.type === t.id
                  ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,16,0.6)] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              <div>
                <span className="text-2xl block mb-2">{t.icon}</span>
                <span className="text-[10px] uppercase font-semibold text-[--color-accent] block mb-1">
                  {t.badge}
                </span>
                <h4 className="font-display text-base text-white font-medium">{t.name}</h4>
                <p className="text-[11px] text-[--color-muted] mt-1 leading-snug">{t.subtitle}</p>
              </div>
              <span className="text-[10px] text-slate-400 block mt-3 pt-2 border-t border-white/5">
                Base from ₹{t.basePrice.toLocaleString('en-IN')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Scale & Dimension */}
      <div className="space-y-3">
        <label className="text-xs uppercase tracking-[0.2em] font-semibold text-white flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[--color-accent] text-[--color-primary] text-[10px] font-bold flex items-center justify-center">2</span>
          Choose Scale &amp; Space Footprint
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {SCALES.map((s) => (
            <button
              key={s.id}
              onClick={() => setConfig({ ...config, scale: s.id as ConfigOptions['scale'] })}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 active:scale-98 flex flex-col justify-between ${
                config.scale === s.id
                  ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,16,0.6)] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              <div>
                <h4 className="font-display text-base text-white font-medium">{s.label}</h4>
                <span className="text-[10px] font-mono text-[--color-accent] block mt-0.5">{s.dimensions}</span>
                <p className="text-[11px] text-[--color-muted] mt-1.5 leading-snug">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Material & Technology */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Material Selection */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.2em] font-semibold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[--color-accent] text-[--color-primary] text-[10px] font-bold flex items-center justify-center">3</span>
            Viewing Glass / Acrylic
          </label>
          <div className="space-y-2.5">
            {MATERIALS.map((m) => (
              <button
                key={m.id}
                onClick={() => setConfig({ ...config, material: m.id as ConfigOptions['material'] })}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-98 ${
                  config.material === m.id
                    ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] shadow-[0_0_15px_rgba(0,184,217,0.2)]'
                    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,16,0.6)] hover:border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-display text-sm text-white font-medium">{m.label}</span>
                  {m.addon > 0 && (
                    <span className="text-[10px] text-[--color-accent] font-medium">+₹{m.addon.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <p className="text-[11px] text-[--color-muted] leading-relaxed">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Tech Tier Selection */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-[0.2em] font-semibold text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[--color-accent] text-[--color-primary] text-[10px] font-bold flex items-center justify-center">4</span>
            Filtration &amp; IoT Automation
          </label>
          <div className="space-y-2.5">
            {TECH_TIERS.map((tt) => (
              <button
                key={tt.id}
                onClick={() => setConfig({ ...config, techLevel: tt.id as ConfigOptions['techLevel'] })}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-98 ${
                  config.techLevel === tt.id
                    ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] shadow-[0_0_15px_rgba(0,184,217,0.2)]'
                    : 'border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,16,0.6)] hover:border-[rgba(255,255,255,0.2)]'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-display text-sm text-white font-medium">{tt.label}</span>
                  {tt.addon > 0 && (
                    <span className="text-[10px] text-[--color-accent] font-medium">+₹{tt.addon.toLocaleString('en-IN')}</span>
                  )}
                </div>
                <p className="text-[11px] text-[--color-muted] leading-relaxed">{tt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Box & Direct Action */}
      <div className="p-5 sm:p-7 rounded-2xl border border-[rgba(255,255,255,0.12)] bg-gradient-to-r from-[rgba(7,21,28,0.95)] via-[rgba(3,10,16,0.98)] to-[rgba(7,21,28,0.95)] space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[--color-accent] font-semibold block mb-1">
              CUSTOM SPECIFICATION SUMMARY
            </span>
            <div className="text-xs sm:text-sm text-white flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-medium text-[--color-accent]">{currentType.name}</span>
              <span className="text-slate-600">•</span>
              <span>{currentScale.label}</span>
              <span className="text-slate-600">•</span>
              <span>{currentMaterial.label}</span>
              <span className="text-slate-600">•</span>
              <span>{currentTech.label}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleWhatsAppDirect}
              className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-xs font-semibold uppercase tracking-wider text-slate-950 flex items-center justify-center gap-2 shadow-lg transition-transform"
            >
              <span>💬</span>
              <span>SEND SPEC TO WHATSAPP</span>
            </button>
          </div>
        </div>

        {/* Client Fast Lead Submission */}
        {submitted ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 text-center">
            ✓ Thank you, {clientName || 'Client'}. Your customized specification has been saved. Our master marine engineer will contact you shortly.
          </div>
        ) : (
          <form onSubmit={handleLeadSubmit} className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Your Name"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent]"
            />
            <input
              type="tel"
              placeholder="Phone / WhatsApp Number"
              required
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent]"
            />
            <input
              type="text"
              placeholder="City (e.g. Mumbai, Delhi, Bengaluru)"
              required
              value={clientCity}
              onChange={(e) => setClientCity(e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent]"
            />
            <button
              type="submit"
              className="btn-primary text-xs h-11 px-4 rounded-xl uppercase tracking-wider font-semibold active:scale-95 transition-transform"
            >
              REQUEST SITE SURVEY →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
