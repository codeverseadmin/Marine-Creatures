'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_CONFIG } from '@/lib/config';
import { useCatalog } from '@/lib/context/CatalogContext';

// ── Service & Space options ──────────────────────────────────────────────────
const SERVICE_OPTIONS = [
  { id: 'new_aquarium', label: 'New Custom Aquarium', desc: 'Bespoke turnkey living reef setup', icon: '🐠' },
  { id: 'renovation', label: 'Tank Renovation & Care', desc: 'Revitalize an existing aquarium', icon: '🔧' },
  { id: 'marine_life', label: 'Rare Livestock & Corals', desc: 'Acclimated fish, SPS/LPS, anemones', icon: '🐡' },
  { id: 'installation', label: 'Turnkey Installation', desc: 'Plumbing, sumps, electrical & stands', icon: '🏗️' },
  { id: 'maintenance', label: 'White-Glove Maintenance', desc: 'Scheduled water chemistry & upkeep', icon: '🛠️' },
  { id: 'equipment', label: 'Equipment & Reef Salts', desc: 'Apex, skimmers, lights & dosing', icon: '🧪' },
  { id: 'other', label: 'General Consultation', desc: 'Custom advisory or architectural survey', icon: '💬' },
];

const SPACE_OPTIONS = [
  { id: 'residence', label: 'Private Residence / Villa', icon: '🏡' },
  { id: 'office', label: 'Corporate Office / Boardroom', icon: '🏢' },
  { id: 'restaurant', label: 'Restaurant / Lounge / Cafe', icon: '🍽️' },
  { id: 'hotel', label: 'Hotel / Resort / Spa', icon: '🏨' },
  { id: 'commercial', label: 'Other Commercial Space', icon: '🏬' },
];

const SIZE_OPTIONS = [
  { id: 'nano', label: 'Nano (< 2 ft / < 150L)', icon: '🐚' },
  { id: 'medium', label: 'Medium (2–4 ft / 200–600L)', icon: '🐠' },
  { id: 'large', label: 'Large (4–6 ft / 700–1,500L)', icon: '🦈' },
  { id: 'monumental', label: 'Monumental (6+ ft / 2,000L+)', icon: '🌊' },
  { id: 'custom', label: 'Custom / Need Guidance', icon: '🤔' },
];

export default function ContactPage() {
  const { addInquiry } = useCatalog();

  // Form State
  const [step, setStep] = useState(0); // 0: Services, 1: Space & Size, 2: Client Details
  const [selectedServices, setSelectedServices] = useState<string[]>(['New Custom Aquarium']);
  const [selectedSpace, setSelectedSpace] = useState<string>('Private Residence / Villa');
  const [selectedSize, setSelectedSize] = useState<string>('Medium (2–4 ft / 200–600L)');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [vision, setVision] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryId, setInquiryId] = useState('');
  const [waUrl, setWaUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  // Service toggle helper
  const toggleService = (label: string) => {
    setSelectedServices((prev) =>
      prev.includes(label)
        ? prev.length > 1
          ? prev.filter((s) => s !== label)
          : prev
        : [...prev, label]
    );
  };

  // Submission handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, '');
    const cleanCity = city.trim();

    if (!cleanName) {
      setValidationError('Please enter your full name');
      return;
    }

    if (cleanPhone.length < 10) {
      setValidationError('Please enter a valid 10-digit mobile number');
      return;
    }

    setValidationError('');
    setSubmitting(true);

    const generatedId = `INQ-${Date.now().toString().slice(-6)}`;
    setInquiryId(generatedId);

    const serviceStr = selectedServices.join(', ');
    const noteContent = `Space: ${selectedSpace} | Size: ${selectedSize} | Vision: ${vision.trim() || 'Turnkey luxury consultation requested'}`;

    // 1. Save to context & server DB via addInquiry
    try {
      addInquiry({
        type: 'custom_quote',
        name: cleanName,
        phone: cleanPhone,
        serviceType: serviceStr,
        spaceType: selectedSpace,
        tankSize: selectedSize,
        location: cleanCity || 'India',
        notes: noteContent,
      });
    } catch (err) {
      console.warn('Error saving inquiry:', err);
    }

    // 2. Prepare structured WhatsApp message
    const waMessage =
      `🌊 *NEW CONSULTATION INQUIRY — MARINE CREATURES* 🌊\n` +
      `*Inquiry ID:* #${generatedId}\n\n` +
      `👤 *CLIENT DETAILS:*\n` +
      `• *Name:* ${cleanName}\n` +
      `• *Phone:* +91 ${cleanPhone}\n` +
      `• *City:* ${cleanCity || 'Not specified'}\n\n` +
      `🐠 *PROJECT SCOPE:*\n` +
      `• *Requirements:* ${serviceStr}\n` +
      `• *Space Type:* ${selectedSpace}\n` +
      `• *Aquarium Scale:* ${selectedSize}\n\n` +
      `✨ *VISION & NOTES:*\n` +
      `${vision.trim() || 'Turnkey advisory requested'}\n\n` +
      `📍 _Submitted via Marine Creatures Mobile Portal_`;

    const cleanAdminPhone = SITE_CONFIG.whatsapp.replace(/\D/g, '');
    const targetWaUrl = `https://wa.me/${cleanAdminPhone}?text=${encodeURIComponent(waMessage)}`;
    setWaUrl(targetWaUrl);

    // 3. Open WhatsApp in new window/tab
    try {
      window.open(targetWaUrl, '_blank');
    } catch {
      // Fallback handled in success screen
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  // ── Success State Screen ──────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen pt-24 pb-36 px-4 sm:px-6 flex flex-col items-center justify-center text-center bg-[#02070b]">
        <div className="max-w-lg w-full rounded-3xl border border-emerald-400/30 bg-[rgba(3,13,20,0.95)] backdrop-blur-2xl p-6 sm:p-10 shadow-2xl space-y-6">
          {/* Animated Success Badge */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400/50 flex items-center justify-center">
            <span className="text-4xl sm:text-5xl animate-bounce">🐠</span>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-[#02070b] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-emerald-400 font-semibold block mb-2">
              Inquiry Registered • #{inquiryId}
            </span>
            <h1 className="font-display text-2xl sm:text-4xl text-white font-light mb-3">
              Your Consultation<br />Has Begun.
            </h1>
            <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
              Founder <strong className="text-white">Suraj Shasmal</strong> has received your project parameters. Direct WhatsApp conversation should open automatically.
            </p>
          </div>

          {/* Quick Details Recap */}
          <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-left text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[--color-muted]">Client:</span>
              <span className="font-semibold text-white">{name} (+91 {phone})</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[--color-muted]">Location:</span>
              <span className="text-slate-200">{city || 'India'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-[--color-muted]">Services:</span>
              <span className="text-cyan-300 truncate max-w-[200px]">{selectedServices.join(', ')}</span>
            </div>
          </div>

          {/* WhatsApp Action Buttons */}
          <div className="space-y-3 pt-2">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <span>💬</span>
                <span>OPEN WHATSAPP CHAT AGAIN</span>
              </a>
            )}

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold text-xs tracking-wider uppercase transition-all"
            >
              ← RETURN TO STORE
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02070b] text-[--color-text]">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 pt-20 sm:pt-24 md:pt-28 pb-32 sm:pb-36 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <span className="text-[11px] sm:text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-2">
            BESPOKE AQUARIUM CONCIERGE
          </span>
          <h1 className="font-display text-3xl sm:text-5xl font-light text-white leading-tight mb-3">
            Connect with the Curators.
          </h1>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
            Direct access to Founder <strong className="text-slate-200">Suraj Shasmal</strong> for living reef commissions, tank renovations, rare marine livestock, and white-glove maintenance.
          </p>
        </div>

        {/* ── Mobile Instant Action Strip ─────────────────────────────────── */}
        <div className="md:hidden grid grid-cols-2 gap-2.5 mb-6">
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Suraj! I would like to consult with you regarding a marine aquarium project.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold active:scale-95 transition-transform"
          >
            <span className="text-xl">💬</span>
            <div className="text-left">
              <span className="block text-[10px] text-emerald-400/80 font-mono uppercase tracking-wider">Fastest Reply</span>
              <span>WhatsApp Suraj</span>
            </div>
          </a>

          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="flex items-center gap-2.5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold active:scale-95 transition-transform"
          >
            <span className="text-xl">📞</span>
            <div className="text-left">
              <span className="block text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider">Direct Studio</span>
              <span>Call +91 93304</span>
            </div>
          </a>
        </div>

        {/* ── Main 2-Column Grid (Laptop) / Single Card (Mobile) ───────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── Left Column: Founder Concierge Card (Desktop & Tablet) ────── */}
          <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-[rgba(3,10,16,0.8)] backdrop-blur-xl p-6 space-y-6 shadow-xl">
              {/* Founder Header */}
              <div className="flex items-center gap-4 border-b border-white/10 pb-5">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-cyan-400/40 bg-white/95 shrink-0 shadow-md">
                  <Image
                    src="/logo.jpg"
                    alt="Suraj Shasmal — Marine Creatures"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain p-1"
                  />
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono font-semibold block">
                    FOUNDER &amp; AQUARIST
                  </span>
                  <h3 className="font-display text-xl text-white font-medium">
                    Suraj Shasmal
                  </h3>
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Online Now • Replies in ~5 mins</span>
                  </p>
                </div>
              </div>

              {/* Studio Info Details */}
              <div className="space-y-3.5 text-xs text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-base text-cyan-400">📍</span>
                  <div>
                    <span className="text-[11px] text-[--color-muted] block">Aquaculture Studio</span>
                    <a
                      href={SITE_CONFIG.googleMaps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
                    >
                      {SITE_CONFIG.address} <span className="text-cyan-400">↗</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-base text-emerald-400">💬</span>
                  <div>
                    <span className="text-[11px] text-[--color-muted] block">WhatsApp Concierge</span>
                    <a
                      href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 font-mono font-medium"
                    >
                      +91 93304 36603
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-base text-cyan-400">✉️</span>
                  <div>
                    <span className="text-[11px] text-[--color-muted] block">Email Inquiries</span>
                    <a
                      href={`mailto:${SITE_CONFIG.email}`}
                      className="text-slate-200 hover:text-white transition-colors"
                    >
                      {SITE_CONFIG.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-base text-amber-400">⏰</span>
                  <div>
                    <span className="text-[11px] text-[--color-muted] block">Studio Operating Hours</span>
                    <span className="text-slate-300">Mon – Sun: 10:00 AM – 9:00 PM IST</span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-400/20 text-[11px] text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <span>🛡️</span>
                  <span>Marine Creatures Assurance</span>
                </div>
                <ul className="space-y-1 text-slate-400 list-disc list-inside">
                  <li>Personally curated by Suraj Shasmal</li>
                  <li>30-day biological quarantine protocols</li>
                  <li>Nationwide climate-controlled logistics</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Right Column: Interactive Consultation Builder ─────────────── */}
          <div className="lg:col-span-8">
            <div className="rounded-3xl border border-white/10 bg-[rgba(3,10,16,0.85)] backdrop-blur-xl shadow-2xl overflow-hidden">
              
              {/* Sticky Step Header on Mobile/Desktop */}
              <div className="sticky top-16 md:top-20 z-20 bg-[rgba(3,10,16,0.95)] backdrop-blur-md border-b border-white/10 px-5 sm:px-8 py-4">
                {/* Progress bar */}
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${((step + 1) / 3) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold flex items-center justify-center border border-cyan-400/30">
                      {step + 1}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
                      {step === 0 && 'Select Requirements'}
                      {step === 1 && 'Space & Scale'}
                      {step === 2 && 'Your Details & WhatsApp'}
                    </span>
                  </div>

                  {step > 0 && (
                    <button
                      onClick={() => setStep((s) => s - 1)}
                      className="flex items-center gap-1 text-xs text-[--color-muted] hover:text-white transition-colors py-1 px-2.5 rounded-lg active:scale-95"
                    >
                      <span>← Back</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Step Content Container */}
              <div className="p-5 sm:p-8">
                
                {/* ── STEP 1: Services Selection ───────────────────────────── */}
                {step === 0 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
                        What can we craft for you?
                      </h2>
                      <p className="text-xs text-[--color-muted]">
                        Select one or more services you are considering.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SERVICE_OPTIONS.map((opt) => {
                        const isSelected = selectedServices.includes(opt.label);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleService(opt.label)}
                            className={`p-4 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] flex items-start gap-3 relative ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.2)]'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <span className="text-2xl shrink-0 mt-0.5">{opt.icon}</span>
                            <div className="flex-1 pr-6">
                              <span className={`text-sm font-semibold block ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                {opt.label}
                              </span>
                              <span className="text-[11px] text-[--color-muted] leading-tight block mt-0.5">
                                {opt.desc}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-xs">
                                ✓
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Step 1 Next Button (In-Flow) */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        disabled={selectedServices.length === 0}
                        className={`w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl ${
                          selectedServices.length > 0
                            ? 'btn-primary'
                            : 'bg-white/10 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        NEXT: SPACE &amp; DIMENSIONS →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Space & Size Selection ───────────────────────── */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
                        Where will this ecosystem live?
                      </h2>
                      <p className="text-xs text-[--color-muted]">
                        Select property type and intended scale.
                      </p>
                    </div>

                    {/* Space Type Selector */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-2.5">
                        Property / Setting
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SPACE_OPTIONS.map((sp) => {
                          const isSelected = selectedSpace === sp.label;
                          return (
                            <button
                              key={sp.id}
                              type="button"
                              onClick={() => setSelectedSpace(sp.label)}
                              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] flex items-center gap-3 ${
                                isSelected
                                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300 font-semibold'
                                  : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                              }`}
                            >
                              <span className="text-xl">{sp.icon}</span>
                              <span className="text-xs">{sp.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Aquarium Scale Selector */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-2.5">
                        Aquarium Scale / Dimensions
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SIZE_OPTIONS.map((sz) => {
                          const isSelected = selectedSize === sz.label;
                          return (
                            <button
                              key={sz.id}
                              type="button"
                              onClick={() => setSelectedSize(sz.label)}
                              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] flex items-center gap-3 ${
                                isSelected
                                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300 font-semibold'
                                  : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                              }`}
                            >
                              <span className="text-xl">{sz.icon}</span>
                              <span className="text-xs">{sz.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2 Navigation (In-Flow) */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="btn-primary w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl"
                      >
                        NEXT: YOUR DETAILS &amp; WHATSAPP →
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Client Details & WhatsApp Consultation ───────── */}
                {step === 2 && (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl sm:text-2xl text-white font-light mb-1">
                        Direct Concierge Dispatch
                      </h2>
                      <p className="text-xs text-[--color-muted]">
                        Founder Suraj Shasmal will receive your inquiry and connect with you on WhatsApp.
                      </p>
                    </div>

                    {validationError && (
                      <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-400/40 text-rose-300 text-xs flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-1.5">
                        Your Full Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="flex items-center rounded-2xl border border-white/15 bg-white/[0.04] focus-within:border-cyan-400 transition-colors px-4 py-3">
                        <span className="text-slate-400 text-base mr-3">👤</span>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Verma"
                          className="w-full bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Number */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-1.5">
                        WhatsApp Phone Number <span className="text-rose-400">*</span>
                      </label>
                      <div className="flex items-center rounded-2xl border border-white/15 bg-white/[0.04] focus-within:border-emerald-400 transition-colors overflow-hidden">
                        <div className="flex items-center gap-1.5 px-3.5 py-3 bg-white/5 border-r border-white/10 shrink-0">
                          <span className="text-base">🇮🇳</span>
                          <span className="text-xs text-slate-300 font-mono font-medium">+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile number"
                          className="w-full px-4 py-3 bg-transparent text-white text-sm font-mono placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-400/90 mt-1.5 px-1 flex items-center gap-1">
                        <span>💬</span>
                        <span>Suraj will connect directly to this number via WhatsApp</span>
                      </p>
                    </div>

                    {/* City */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-1.5">
                        City / Location
                      </label>
                      <div className="flex items-center rounded-2xl border border-white/15 bg-white/[0.04] focus-within:border-cyan-400 transition-colors px-4 py-3">
                        <span className="text-slate-400 text-base mr-3">📍</span>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="e.g. Kolkata, Bengaluru, Mumbai..."
                          className="w-full bg-transparent text-white text-sm placeholder:text-slate-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Vision / Notes */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-1.5">
                        Project Vision / Specific Species <span className="text-[--color-muted] font-normal">(Optional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={vision}
                        onChange={(e) => setVision(e.target.value)}
                        placeholder="Tell us about your room layout, desired coral styles, favorite fish, or target timeline..."
                        className="w-full rounded-2xl border border-white/15 bg-white/[0.04] p-3.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* Recap Box */}
                    <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 text-xs text-slate-300 space-y-1">
                      <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <span>📋</span>
                        <span>Consultation Summary:</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        {selectedServices.join(', ')} • {selectedSpace} • {selectedSize}
                      </div>
                    </div>

                    {/* Final Action Button (In-Flow) */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98]"
                      >
                        {submitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            <span>CONNECTING TO SURAJ…</span>
                          </>
                        ) : (
                          <>
                            <span className="text-base">💬</span>
                            <span>SUBMIT &amp; START WHATSAPP CONSULTATION →</span>
                          </>
                        )}
                      </button>
                      <p className="text-[10px] text-[--color-muted] text-center mt-2.5">
                        Records inquiry &amp; directly opens WhatsApp with Founder Suraj Shasmal
                      </p>
                    </div>
                  </form>
                )}

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
