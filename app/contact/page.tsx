'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/config';
import { useCatalog } from '@/lib/context/CatalogContext';

// ── Service & Space options with Accessible SVG Icons ────────────────────────
const SERVICE_OPTIONS = [
  {
    id: 'new_aquarium',
    label: 'New Custom Aquarium',
    desc: 'Bespoke turnkey living reef setup',
    icon: (
      <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'renovation',
    label: 'Tank Renovation & Care',
    desc: 'Revitalize an existing aquarium',
    icon: (
      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    id: 'marine_life',
    label: 'Rare Livestock & Corals',
    desc: 'Acclimated fish, SPS/LPS, anemones',
    icon: (
      <svg className="w-5 h-5 text-cyan-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
      </svg>
    ),
  },
  {
    id: 'installation',
    label: 'Turnkey Installation',
    desc: 'Plumbing, sumps, electrical & stands',
    icon: (
      <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    id: 'maintenance',
    label: 'White-Glove Maintenance',
    desc: 'Scheduled water chemistry & upkeep',
    icon: (
      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    id: 'equipment',
    label: 'Equipment & Reef Salts',
    desc: 'Apex, skimmers, lights & dosing',
    icon: (
      <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'General Consultation',
    desc: 'Custom advisory or architectural survey',
    icon: (
      <svg className="w-5 h-5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

const SPACE_OPTIONS = [
  {
    id: 'residence',
    label: 'Private Residence / Villa',
    icon: (
      <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'office',
    label: 'Corporate Office / Boardroom',
    icon: (
      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'restaurant',
    label: 'Restaurant / Lounge / Cafe',
    icon: (
      <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'hotel',
    label: 'Hotel / Resort / Spa',
    icon: (
      <svg className="w-5 h-5 text-cyan-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    ),
  },
  {
    id: 'commercial',
    label: 'Other Commercial Space',
    icon: (
      <svg className="w-5 h-5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const SIZE_OPTIONS = [
  {
    id: 'nano',
    label: 'Nano (< 2 ft / < 150L)',
    icon: (
      <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="6" y="8" width="12" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'medium',
    label: 'Medium (2–4 ft / 200–600L)',
    icon: (
      <svg className="w-5 h-5 text-cyan-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="4" y="6" width="16" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'large',
    label: 'Large (4–6 ft / 700–1,500L)',
    icon: (
      <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: 'monumental',
    label: 'Monumental (6+ ft / 2,000L+)',
    icon: (
      <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7M4 18h3" />
      </svg>
    ),
  },
  {
    id: 'custom',
    label: 'Custom / Need Guidance',
    icon: (
      <svg className="w-5 h-5 text-slate-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
];

function ContactPageInner() {
  const { addInquiry } = useCatalog();
  const searchParams = useSearchParams();

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

  // Handle URL Query Parameter intent routing
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam === 'renovation') {
      setSelectedServices(['Tank Renovation & Care']);
    } else if (serviceParam === 'new_aquarium' || serviceParam === 'aquarium_design' || serviceParam === 'design') {
      setSelectedServices(['New Custom Aquarium']);
    } else if (serviceParam === 'maintenance') {
      setSelectedServices(['White-Glove Maintenance']);
    } else if (serviceParam === 'marine_life' || serviceParam === 'livestock') {
      setSelectedServices(['Rare Livestock & Corals']);
    }
  }, [searchParams]);

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
      `📍 _Submitted via Marine Creatures Concierge Portal_`;

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
          {/* Animated Success Badge with SVG Checkmark */}
          <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400/50 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#02070b] flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              Founder <strong className="text-white">Suraj Shasmal</strong> has received your project parameters. A direct WhatsApp conversation should open automatically.
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
                <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
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

      <div className="relative z-10 pt-24 sm:pt-28 pb-12 sm:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-8">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block mb-1.5">
            BESPOKE AQUARIUM CONCIERGE
          </span>
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl font-light text-white leading-tight mb-2">
            Connect with the Curators.
          </h1>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed max-w-lg mx-auto">
            Direct access to Founder <strong className="text-slate-200">Suraj Shasmal</strong> for living reef commissions, tank renovations, rare marine livestock, and white-glove maintenance.
          </p>
        </div>

        {/* ── Mobile Instant Action Strip ─────────────────────────────────── */}
        <div className="md:hidden grid grid-cols-2 gap-2 mb-5">
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Suraj! I would like to consult with you regarding a marine aquarium project.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <div className="text-left">
              <span className="block text-[9px] text-emerald-400/80 font-mono uppercase tracking-wider">Fastest Reply</span>
              <span className="text-xs">WhatsApp Suraj</span>
            </div>
          </a>

          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <div className="text-left">
              <span className="block text-[9px] text-cyan-400/80 font-mono uppercase tracking-wider">Direct Studio</span>
              <span className="text-xs">Call +91 93304</span>
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
                  <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
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
                  <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
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
                  <svg className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
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
                  <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="text-[11px] text-[--color-muted] block">Studio Operating Hours</span>
                    <span className="text-slate-300">Mon – Sun: 10:00 AM – 9:00 PM IST</span>
                  </div>
                </div>
              </div>

              {/* Guarantees */}
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-400/20 text-[11px] text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
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
              
              {/* Step Header */}
              <div className="border-b border-white/10 px-5 sm:px-8 py-4 bg-white/[0.02]">
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-3">
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
              <div className="p-4 sm:p-6 md:p-8">
                
                {/* ── STEP 1: Services Selection ───────────────────────────── */}
                {step === 0 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <h2 className="font-display text-lg sm:text-2xl text-white font-light mb-1">
                        What can we craft for you?
                      </h2>
                      <p className="text-xs text-[--color-muted]">
                        Select one or more services you are considering.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {SERVICE_OPTIONS.map((opt) => {
                        const isSelected = selectedServices.includes(opt.label);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleService(opt.label)}
                            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] flex items-center sm:items-start gap-2.5 sm:gap-3 relative ${
                              isSelected
                                ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_20px_rgba(0,184,217,0.2)]'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                            }`}
                          >
                            <span className="p-1 rounded-lg bg-white/5 shrink-0">{opt.icon}</span>
                            <div className="flex-1 pr-5">
                              <span className={`text-xs sm:text-sm font-semibold block ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                                {opt.label}
                              </span>
                              <span className="text-[10px] sm:text-[11px] text-[--color-muted] leading-tight block mt-0.5">
                                {opt.desc}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                                <svg className="w-2.5 h-2.5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
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
                        className={`w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl ${
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
                              <span className="p-1 rounded-lg bg-white/5">{sp.icon}</span>
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
                              <span className="p-1 rounded-lg bg-white/5">{sz.icon}</span>
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
                        <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{validationError}</span>
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-1.5">
                        Your Full Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="flex items-center rounded-2xl border border-white/15 bg-white/[0.04] focus-within:border-cyan-400 transition-colors px-4 py-3">
                        <svg className="w-4 h-4 text-slate-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
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
                      <p className="text-[10px] text-emerald-400/90 mt-1.5 px-1 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>Suraj will connect directly to this number via WhatsApp</span>
                      </p>
                    </div>

                    {/* City */}
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-300 block mb-1.5">
                        City / Location
                      </label>
                      <div className="flex items-center rounded-2xl border border-white/15 bg-white/[0.04] focus-within:border-cyan-400 transition-colors px-4 py-3">
                        <svg className="w-4 h-4 text-slate-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
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
                        <svg className="w-4 h-4 text-cyan-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
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
                            <svg className="w-4 h-4 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
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

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#02070b]" />}>
      <ContactPageInner />
    </Suspense>
  );
}
