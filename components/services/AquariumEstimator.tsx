'use client';

import React, { useState } from 'react';
import { SITE_CONFIG } from '@/lib/config';
import { useCatalog } from '@/lib/context/CatalogContext';

// ── World Builder Dimensions ──────────────────────────────────────────────────

interface WorldConfig {
  space: string;
  form: string;
  material: string;
  biome: string;
  marineLife: string;
  system: string;
  scale: string;
}

const SPACES = [
  {
    id: 'villa',
    label: 'Private Villa / Estate',
    desc: 'Grand salon or double-height foyer centerpiece with dedicated sub-floor life support.',
    icon: (
      <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'penthouse',
    label: 'Luxury Penthouse',
    desc: 'Engineered weight-distribution framing for high-rise residences with panoramic views.',
    icon: (
      <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'corporate',
    label: 'Corporate Headquarters',
    desc: 'Executive boardroom or reception showcase projecting stability, prestige, and calm.',
    icon: (
      <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'hospitality',
    label: 'Hospitality & Dining',
    desc: 'High-traffic luxury restaurants, boutique hotel lobbies, or private members clubs.',
    icon: (
      <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

const FORMS = [
  {
    id: 'wall-inset',
    label: 'Custom Wall Inset',
    desc: 'Flush architectural integration recessed cleanly into structural or partition walls.',
    basePrice: 220000,
  },
  {
    id: 'freestanding',
    label: 'Freestanding Monolith',
    desc: '3-sided or 4-sided panoramic viewing with bespoke Italian lacquer or hardwood cabinetry.',
    basePrice: 185000,
  },
  {
    id: 'divider',
    label: 'Dual-Sided Room Divider',
    desc: 'See-through living ocean partition separating living, dining, or lounge spaces.',
    basePrice: 310000,
  },
  {
    id: 'curved',
    label: 'Curved Monolith Panorama',
    desc: 'Monumental seamless thermoformed acrylic curvature with zero corner seams.',
    basePrice: 390000,
  },
];

const MATERIALS = [
  {
    id: 'optiwhite',
    label: 'Museum OptiWhite™ Low-Iron Glass',
    desc: '99% light transmission with diamond-beveled edges, true color rendition, and maximum scratch resistance.',
    addon: 0,
  },
  {
    id: 'acrylic',
    label: 'Seamless Cast Acrylic Monolith',
    desc: '17x impact strength of glass, zero green refractive index, capable of seamless curved corners.',
    addon: 55000,
  },
];

const BIOMES = [
  {
    id: 'indo-pacific-reef',
    label: 'Indo-Pacific Living Coral Reef',
    desc: 'Flourishing photosynthetic SPS & LPS corals, symbiotic sea anemones, and macro-algae.',
    multiplier: 1.0,
  },
  {
    id: 'pelagic-predator',
    label: 'Pelagic Deep-Blue Predator Biotope',
    desc: 'High-current predatory biotope featuring moray eels, dwarf lionfish, and aggressive marine wrasses.',
    multiplier: 1.15,
  },
  {
    id: 'moon-jellyfish',
    label: 'Bioluminescent Moon Jellyfish Kreisel',
    desc: 'Laminar closed-loop circular water vortex with spectrum-controlled color illumination.',
    multiplier: 1.25,
  },
  {
    id: 'sps-sanctuary',
    label: 'Hard Coral (SPS) Ultra Sanctuary',
    desc: 'Ultra-low nutrient biotope tuned for Acropora, Montipora, and delicate reef-crest corals.',
    multiplier: 1.35,
  },
];

const MARINE_LIFE_SETS = [
  {
    id: 'clowns-anemones',
    label: 'Symbiotic Clownfish & Anemones',
    desc: 'Bonded pairs of Amphiprion ocellaris hosting in Bubble Tip Anemones (Entacmaea quadricolor).',
  },
  {
    id: 'schooling-tangs',
    label: 'Schooling Yellow Tangs & Anthias',
    desc: 'High-motion open-water schooling fish creating constant dynamic ocean rhythm.',
  },
  {
    id: 'rare-corals',
    label: 'Ultra Coral Collector Frags',
    desc: 'Torches, hammer corals, blastomussa, and glowing Australian acanthastrea colonies.',
  },
  {
    id: 'apex-predators',
    label: 'Apex Morays & Ribbon Eels',
    desc: 'Bold, dramatic solitary specimens suited for cavernous live rock scapes.',
  },
];

const SYSTEMS = [
  {
    id: 'smart-sump',
    label: 'Smart Silent Sump & Flow',
    desc: 'Ultra-quiet brushless DC return pumps, dual BeanAnimal overflow, and automated top-off.',
    addon: 0,
  },
  {
    id: 'titanium-climate',
    label: 'Titanium Climate & Automated Dosing',
    desc: 'Corrosion-proof titanium water chiller, UV biosecurity sterilizer, and 4-head Wi-Fi trace element dosing.',
    addon: 65000,
  },
  {
    id: 'autonomous-iot',
    label: 'Autonomous IoT Cloud Ecosystem',
    desc: 'Continuous live telemetry (salinity, pH, ORP, temp), cloud alerts, automated water changes, and backup UPS.',
    addon: 145000,
  },
];

const SCALES = [
  {
    id: 'compact',
    label: 'Executive (3.5 ft / ~320 Litres)',
    multiplier: 1.0,
    dimensions: '105cm × 55cm × 55cm',
  },
  {
    id: 'medium',
    label: 'Centerpiece (5.0 ft / ~650 Litres)',
    multiplier: 1.55,
    dimensions: '150cm × 65cm × 65cm',
  },
  {
    id: 'grand',
    label: 'Estate Grand (7.0 ft / ~1,300 Litres)',
    multiplier: 2.4,
    dimensions: '210cm × 75cm × 75cm',
  },
  {
    id: 'monumental',
    label: 'Monumental (10.0+ ft / ~2,800+ Litres)',
    multiplier: 3.8,
    dimensions: '300cm+ × 90cm × 90cm',
  },
];

export function AquariumEstimator() {
  const { addInquiry } = useCatalog();

  // Current Step: 0 to 6 (0: Space, 1: Form, 2: Material, 3: Biome, 4: Life, 5: System, 6: Your World)
  const [step, setStep] = useState(0);

  const [config, setConfig] = useState<WorldConfig>({
    space: SPACES[0].label,
    form: FORMS[0].label,
    material: MATERIALS[0].label,
    biome: BIOMES[0].label,
    marineLife: MARINE_LIFE_SETS[0].label,
    system: SYSTEMS[0].label,
    scale: SCALES[1].label,
  });

  // Client Details for Step 6 submission
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Dynamic Investment Calculation
  const selectedForm = FORMS.find((f) => f.label === config.form) || FORMS[0];
  const selectedMaterial = MATERIALS.find((m) => m.label === config.material) || MATERIALS[0];
  const selectedBiome = BIOMES.find((b) => b.label === config.biome) || BIOMES[0];
  const selectedSystem = SYSTEMS.find((s) => s.label === config.system) || SYSTEMS[0];
  const selectedScale = SCALES.find((sc) => sc.label === config.scale) || SCALES[1];

  const estimatedPrice = Math.round(
    selectedForm.basePrice * selectedScale.multiplier * selectedBiome.multiplier +
      selectedMaterial.addon +
      selectedSystem.addon
  );

  const stepLabels = [
    '01 SPACE',
    '02 FORM',
    '03 MATERIAL',
    '04 BIOME',
    '05 LIFE',
    '06 SYSTEM',
    '07 YOUR WORLD',
  ];

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      addInquiry({
        type: 'estimator_lead',
        name: clientName.trim() || 'Valued Client',
        phone: clientPhone.trim(),
        email: '',
        serviceType: `World Builder: ${config.form} (${config.scale})`,
        spaceType: `Space: ${config.space} | Biome: ${config.biome}`,
        tankSize: selectedScale.dimensions,
        location: clientCity.trim(),
        notes: `World Blueprint: Material: ${config.material} | Life: ${config.marineLife} | System: ${config.system} | Est: ₹${estimatedPrice.toLocaleString('en-IN')}`,
        preferredDate: 'Immediate Consultation',
      });
    } catch (err) {
      console.error('Error recording world builder lead:', err);
    }
    setSubmitted(true);
  };

  const generateWhatsAppMessage = () => {
    const text = `Hi Marine Creatures! I designed my living ocean environment via the World Builder:\n\n*SPACE:* ${config.space}\n*FORM:* ${config.form}\n*MATERIAL:* ${config.material}\n*BIOME:* ${config.biome}\n*MARINE LIFE:* ${config.marineLife}\n*SYSTEM:* ${config.system}\n*SCALE:* ${config.scale} (${selectedScale.dimensions})\n*ESTIMATED INVESTMENT:* ₹${estimatedPrice.toLocaleString('en-IN')}\n*LOCATION:* ${clientCity || 'India'}\n*CLIENT:* ${clientName || 'Private Client'}\n\nI would like to schedule a private architectural consultation with your marine curators.`;
    return encodeURIComponent(text);
  };

  const handleWhatsAppDirect = () => {
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${generateWhatsAppMessage()}`, '_blank');
  };

  return (
    <div
      id="world-builder"
      className="rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(6,20,29,0.9)] backdrop-blur-2xl p-5 sm:p-8 md:p-12 shadow-2xl space-y-8"
    >
      {/* Header & Live Turnkey Indicator */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[--color-accent] animate-pulse" />
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent]">
              THE ARCHITECTURAL WORLD BUILDER
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-4xl text-white font-light">
            Design Your Living Ocean
          </h2>
          <p className="text-xs sm:text-sm text-[--color-muted] mt-1 max-w-xl">
            A guided architectural journey from spatial context to living marine biodiversity and life-support automation.
          </p>
        </div>

        {/* Live Estimate Badge */}
        <div className="bg-[rgba(0,184,217,0.1)] border border-[rgba(0,184,217,0.3)] rounded-2xl p-4 sm:p-5 text-right shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-[--color-muted] block font-medium">
            Turnkey Investment Estimate
          </span>
          <span className="font-display text-2xl sm:text-4xl text-[--color-accent] font-light">
            ₹{estimatedPrice.toLocaleString('en-IN')}*
          </span>
          <span className="text-[9px] sm:text-[10px] text-slate-400 block mt-0.5">
            Turnkey: includes design, framing, livestock &amp; commissioning
          </span>
        </div>
      </div>

      {/* 7-Step Progression Tracker */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-[--color-muted]">
          <span className="text-[--color-accent] font-semibold">STAGE {step + 1} OF 7: {stepLabels[step]}</span>
          <span>{Math.round(((step + 1) / 7) * 100)}% CONFIGURED</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${((step + 1) / 7) * 100}%` }}
          />
        </div>

        {/* Step Indicator Pills */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pt-1">
          {stepLabels.map((lbl, idx) => (
            <button
              key={lbl}
              onClick={() => setStep(idx)}
              className={`px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider font-mono transition-all shrink-0 ${
                step === idx
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-semibold'
                  : idx < step
                  ? 'bg-white/5 text-slate-300 hover:bg-white/10'
                  : 'text-slate-600'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* ── STEP 0: SPACE ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
              01 Space — Where will this living world dwell?
            </h3>
            <p className="text-xs text-[--color-muted]">
              Select the architectural setting. Each environment has tailored load and acoustic requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {SPACES.map((sp) => {
              const isSelected = config.space === sp.label;
              return (
                <button
                  key={sp.id}
                  onClick={() => setConfig({ ...config, space: sp.label })}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] flex items-start gap-4 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    {sp.icon}
                  </div>
                  <div>
                    <h4 className={`text-base font-semibold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                      {sp.label}
                    </h4>
                    <p className="text-xs text-[--color-muted] mt-1 leading-relaxed">
                      {sp.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 1: FORM ──────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
              02 Form — Architectural Structure &amp; Geometry
            </h3>
            <p className="text-xs text-[--color-muted]">
              Choose how the viewing volume integrates into the physical architecture of the room.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {FORMS.map((fm) => {
              const isSelected = config.form === fm.label;
              return (
                <button
                  key={fm.id}
                  onClick={() => setConfig({ ...config, form: fm.label })}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <h4 className={`text-base font-semibold mb-1 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {fm.label}
                  </h4>
                  <p className="text-xs text-[--color-muted] leading-relaxed">
                    {fm.desc}
                  </p>
                  <span className="text-[10px] font-mono text-cyan-400/80 block mt-3 pt-2 border-t border-white/5">
                    Structure baseline: ₹{fm.basePrice.toLocaleString('en-IN')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Scale dimension selector for Form */}
          <div className="pt-4 border-t border-white/10">
            <label className="text-xs uppercase tracking-wider font-semibold text-slate-300 block mb-2.5">
              Select Scale Footprint
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {SCALES.map((sc) => {
                const isSelected = config.scale === sc.label;
                return (
                  <button
                    key={sc.id}
                    onClick={() => setConfig({ ...config, scale: sc.label })}
                    className={`p-3.5 rounded-xl border text-left text-xs transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 font-semibold'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="block font-medium">{sc.label}</span>
                    <span className="text-[10px] text-[--color-muted] font-mono mt-0.5 block">{sc.dimensions}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: MATERIAL ──────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
              03 Material — Viewing Medium
            </h3>
            <p className="text-xs text-[--color-muted]">
              Select museum-grade low-iron OptiWhite™ glass or monolithic cast acrylic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MATERIALS.map((mat) => {
              const isSelected = config.material === mat.label;
              return (
                <button
                  key={mat.id}
                  onClick={() => setConfig({ ...config, material: mat.label })}
                  className={`p-6 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <h4 className={`text-base font-semibold mb-1 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {mat.label}
                  </h4>
                  <p className="text-xs text-[--color-muted] leading-relaxed mt-1">
                    {mat.desc}
                  </p>
                  <span className="text-[10px] font-mono text-cyan-400/80 block mt-3 pt-2 border-t border-white/5">
                    {mat.addon === 0 ? 'Standard Specification' : `+ ₹${mat.addon.toLocaleString('en-IN')}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: BIOME ─────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
              04 Biome — Ecological Atmosphere
            </h3>
            <p className="text-xs text-[--color-muted]">
              Define the biological micro-climate and coral structure of your installation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BIOMES.map((bm) => {
              const isSelected = config.biome === bm.label;
              return (
                <button
                  key={bm.id}
                  onClick={() => setConfig({ ...config, biome: bm.label })}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <h4 className={`text-base font-semibold mb-1 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {bm.label}
                  </h4>
                  <p className="text-xs text-[--color-muted] leading-relaxed">
                    {bm.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 4: MARINE LIFE ───────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
              05 Marine Life — Curated Inhabitants
            </h3>
            <p className="text-xs text-[--color-muted]">
              Choose primary specimen pairings. All specimens arrive quarantine-certified and acclimated.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MARINE_LIFE_SETS.map((ls) => {
              const isSelected = config.marineLife === ls.label;
              return (
                <button
                  key={ls.id}
                  onClick={() => setConfig({ ...config, marineLife: ls.label })}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <h4 className={`text-base font-semibold mb-1 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {ls.label}
                  </h4>
                  <p className="text-xs text-[--color-muted] leading-relaxed">
                    {ls.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 5: SYSTEM ────────────────────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
              06 System — Life Support &amp; Automation Tier
            </h3>
            <p className="text-xs text-[--color-muted]">
              Select the degree of automated telemetry, climate chillers, and remote IoT monitoring.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SYSTEMS.map((sys) => {
              const isSelected = config.system === sys.label;
              return (
                <button
                  key={sys.id}
                  onClick={() => setConfig({ ...config, system: sys.label })}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div>
                    <h4 className={`text-base font-semibold mb-1 ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                      {sys.label}
                    </h4>
                    <p className="text-xs text-[--color-muted] leading-relaxed mt-1">
                      {sys.desc}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400/80 block mt-3 pt-2 border-t border-white/5">
                    {sys.addon === 0 ? 'Included' : `+ ₹${sys.addon.toLocaleString('en-IN')}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 6: YOUR WORLD (CONCEPTUAL SUMMARY & CONVERSION) ───────────── */}
      {step === 6 && (
        <div className="space-y-6">
          <div>
            <span className="text-[11px] uppercase tracking-widest text-[--color-accent] font-semibold block mb-1">
              CONCEPTUAL SPECIFICATION BLUEPRINT
            </span>
            <h3 className="font-display text-2xl sm:text-4xl text-white font-light">
              Your World — Ready for Curation
            </h3>
            <p className="text-xs sm:text-sm text-[--color-muted] mt-1">
              Review your bespoke world architecture below. Speak directly with Founder Suraj Shasmal to initiate spatial site surveying.
            </p>
          </div>

          {/* Blueprint Matrix Card */}
          <div className="rounded-3xl border border-cyan-400/30 bg-[rgba(3,10,16,0.85)] p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 block mb-0.5">
                  COMMISSION SPECIFICATION
                </span>
                <h4 className="font-display text-2xl text-white">
                  {config.form} &bull; {config.biome}
                </h4>
                <p className="text-xs text-[--color-muted] mt-0.5">
                  Intended Environment: <strong className="text-slate-200">{config.space}</strong>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Investment Guide</span>
                <span className="font-display text-2xl sm:text-3xl text-emerald-400 font-light">
                  ₹{estimatedPrice.toLocaleString('en-IN')}*
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-[--color-muted] uppercase block mb-0.5">Viewing Medium</span>
                <span className="font-semibold text-white">{config.material}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-[--color-muted] uppercase block mb-0.5">Scale &amp; Dimensions</span>
                <span className="font-semibold text-white">{config.scale}</span>
                <span className="text-[10px] text-[--color-muted] block font-mono mt-0.5">{selectedScale.dimensions}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-[10px] text-[--color-muted] uppercase block mb-0.5">Specimen Curation</span>
                <span className="font-semibold text-white">{config.marineLife}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 col-span-2 sm:col-span-3">
                <span className="text-[10px] text-[--color-muted] uppercase block mb-0.5">Life Support &amp; Automation</span>
                <span className="font-semibold text-white">{config.system}</span>
              </div>
            </div>

            {/* Direct Action Hub */}
            {submitted ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-xs text-center space-y-1">
                <strong className="block text-sm">Consultation Blueprint Received!</strong>
                <span>Our senior biological curators will review your space requirements and reach out via WhatsApp shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp Phone Number"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="City / Region"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="h-11 px-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-3.5 rounded-xl text-xs uppercase tracking-widest font-bold shadow-xl active:scale-[0.98]"
                  >
                    SUBMIT WORLD BLUEPRINT FOR REVIEW →
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsAppDirect}
                    className="flex-1 py-3.5 px-4 rounded-xl border border-emerald-400/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-semibold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>DIRECT WHATSAPP CONCIERGE</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Navigation Controls: Back & Next Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[rgba(255,255,255,0.08)]">
        <button
          type="button"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
            step === 0
              ? 'opacity-30 cursor-not-allowed text-slate-500'
              : 'text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
          }`}
        >
          ← PREVIOUS
        </button>

        {step < 6 ? (
          <button
            type="button"
            onClick={() => setStep(Math.min(6, step + 1))}
            className="btn-primary px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-lg active:scale-95"
          >
            NEXT: {stepLabels[step + 1].replace(/^\d+\s*/, '')} →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(0)}
            className="px-5 py-2.5 rounded-xl text-xs font-medium text-[--color-muted] hover:text-white bg-white/5 transition-all"
          >
            RECONFIGURE WORLD ↺
          </button>
        )}
      </div>
    </div>
  );
}
