'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/config';

// ── Step definitions ────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 1,
    emoji: '🐠',
    question: "What are you looking for?",
    hint: 'Pick all that apply',
    options: [
      { label: 'New Aquarium', icon: '🪸' },
      { label: 'Renovation', icon: '🔧' },
      { label: 'Installation', icon: '🏗️' },
      { label: 'Marine Life', icon: '🐡' },
      { label: 'Materials & Equipment', icon: '🧪' },
      { label: 'Maintenance Plan', icon: '🛠️' },
      { label: 'Other', icon: '💬' },
    ],
    type: 'multi' as const,
  },
  {
    id: 2,
    emoji: '🏠',
    question: 'What kind of space?',
    hint: 'Choose one',
    options: [
      { label: 'Residential Home', icon: '🏡' },
      { label: 'Office / Corporate', icon: '🏢' },
      { label: 'Restaurant / Cafe', icon: '🍽️' },
      { label: 'Hotel / Resort', icon: '🏨' },
      { label: 'Other Commercial', icon: '🏬' },
    ],
    type: 'single' as const,
  },
  {
    id: 3,
    emoji: '📐',
    question: 'Aquarium size in mind?',
    hint: 'Approximate is fine',
    options: [
      { label: 'Under 1 ft', icon: '🐚' },
      { label: '1–2 ft', icon: '🐠' },
      { label: '2–4 ft', icon: '🦈' },
      { label: '4 ft+', icon: '🌊' },
      { label: 'Custom / Not sure', icon: '🤔' },
    ],
    type: 'single' as const,
  },
  {
    id: 4,
    emoji: '👤',
    question: 'Your name',
    placeholder: 'e.g. Rahul Verma',
    type: 'text' as const,
  },
  {
    id: 5,
    emoji: '📱',
    question: 'WhatsApp number',
    placeholder: '10-digit mobile number',
    type: 'phone' as const,
  },
  {
    id: 6,
    emoji: '📍',
    question: 'Your city',
    placeholder: 'e.g. Bengaluru, Mumbai...',
    type: 'text' as const,
  },
  {
    id: 7,
    emoji: '✨',
    question: 'Your vision',
    placeholder: 'Describe your space, dream setup, or anything you want Suraj to know...',
    type: 'textarea' as const,
  },
];

export default function ContactPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [textVal, setTextVal] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [animDir, setAnimDir] = useState<'fwd' | 'back'>('fwd');
  const [visible, setVisible] = useState(true);

  const current = STEPS[step];
  const progress = ((step) / STEPS.length) * 100;

  // Animate step transitions
  const transitionTo = (nextStep: number, dir: 'fwd' | 'back') => {
    setAnimDir(dir);
    setVisible(false);
    setTimeout(() => {
      setStep(nextStep);
      setTextVal('');
      setVisible(true);
    }, 180);
  };

  const handleOption = (option: string) => {
    if (!current) return;
    if (current.type === 'multi') {
      const prev = (answers[current.id] as string[]) || [];
      const next = prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option];
      setAnswers({ ...answers, [current.id]: next });
    } else {
      setAnswers({ ...answers, [current.id]: option });
      setTimeout(() => transitionTo(step + 1, 'fwd'), 250);
    }
  };

  const canProceed = () => {
    if (!current) return false;
    if (current.type === 'multi') {
      return ((answers[current.id] as string[]) || []).length > 0;
    }
    if (current.type === 'text' || current.type === 'phone') {
      return textVal.trim().length > 0;
    }
    if (current.type === 'textarea') return true; // optional
    return !!answers[current.id];
  };

  const handleNext = async () => {
    if (!current) return;
    const updated = { ...answers, [current.id]: textVal || answers[current.id] || '' };
    setAnswers(updated);

    if (step < STEPS.length - 1) {
      transitionTo(step + 1, 'fwd');
    } else {
      // Submit
      setSubmitting(true);
      const services = Array.isArray(updated[1]) ? (updated[1] as string[]).join(', ') : String(updated[1] || '');
      const space = String(updated[2] || '');
      const size = String(updated[3] || '');
      const name = String(updated[4] || '');
      const phone = String(updated[5] || '').replace(/\D/g, '');
      const city = String(updated[6] || '');
      const vision = String(updated[7] || textVal || '');

      // Save to DB
      fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'VIP Client Inquiry',
          phone: phone || 'Not provided',
          serviceType: services || 'General Inquiry',
          notes: `Space: ${space} | Size: ${size} | City: ${city} | Vision: ${vision}`,
        }),
      }).catch((e) => console.warn('Inquiry save error:', e));

      // Also open WhatsApp to Suraj
      const waMessage = `🌊 *NEW PROJECT INQUIRY — MARINE CREATURES*\n\n👤 *Name:* ${name}\n📱 *Phone:* +91 ${phone}\n📍 *City:* ${city}\n\n🐠 *Services Needed:* ${services}\n🏠 *Space Type:* ${space}\n📐 *Tank Size:* ${size}\n\n✨ *Vision / Notes:*\n${vision || 'Not specified'}`;
      const waUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');

      setSubmitting(false);
      setSubmitted(true);
    }
  };

  // ── Success Screen ───────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pb-24 md:pb-0" style={{ background: 'var(--color-primary)' }}>
        {/* Animated success circle */}
        <div className="relative mb-8">
          <div className="w-28 h-28 rounded-full bg-emerald-500/15 border-2 border-emerald-400/40 flex items-center justify-center">
            <span className="text-5xl">🐠</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-emerald-500 border-4 border-[var(--color-primary)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <span className="text-[11px] uppercase tracking-[0.3em] text-emerald-400 font-semibold mb-4 block">Inquiry Received</span>
        <h1 className="font-display text-3xl sm:text-5xl text-[--color-text] font-light mb-4 leading-tight">
          Your Conversation<br />Has Begun.
        </h1>
        <p className="font-body font-light text-[--color-muted] max-w-sm leading-relaxed mb-4 text-sm">
          Suraj will connect with you on WhatsApp shortly. Expect a reply within a few hours.
        </p>

        {/* Pulsing WhatsApp indicator */}
        <div className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/25 mb-10">
          <span className="relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 top-0 left-0"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <span className="text-sm font-semibold text-emerald-300">WhatsApp opening now…</span>
        </div>

        <Link href="/" className="btn-primary inline-flex text-xs py-3.5 px-8 rounded-2xl">
          BACK TO HOME →
        </Link>
      </div>
    );
  }

  const selectedMulti = (answers[current?.id || 0] as string[]) || [];
  const isMultiStep = current?.type === 'multi';
  const isTextStep = current?.type === 'text' || current?.type === 'phone' || current?.type === 'textarea';
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-primary)' }}>

      {/* Subtle ocean bg */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=60"
          alt=""
          className="w-full h-full object-cover opacity-[0.04]"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── Sticky Top Progress Bar ────────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-[rgba(2,7,11,0.92)] backdrop-blur-md border-b border-[rgba(255,255,255,0.07)]">
          {/* Thin progress line */}
          <div className="h-0.5 w-full bg-[rgba(255,255,255,0.07)]">
            <div
              className="h-full bg-[--color-accent] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between px-5 sm:px-8 py-3.5">
            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="flex items-center gap-1">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i < step
                        ? 'w-2 h-2 bg-emerald-500'
                        : i === step
                        ? 'w-3 h-2 bg-[--color-accent]'
                        : 'w-2 h-2 bg-[rgba(255,255,255,0.15)]'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] text-[--color-muted] font-semibold uppercase tracking-wider">
                {step + 1} / {STEPS.length}
              </span>
            </div>

            {/* Back button in header on mobile */}
            {step > 0 && (
              <button
                onClick={() => transitionTo(step - 1, 'back')}
                className="flex items-center gap-1.5 text-[11px] text-[--color-muted] hover:text-white active:scale-95 transition-all py-1 px-2 rounded-lg"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Back
              </button>
            )}
          </div>
        </div>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <div
          className={`flex-1 px-5 sm:px-8 pt-8 pb-36 md:pb-16 transition-all duration-180 ${
            visible ? 'opacity-100 translate-y-0' : animDir === 'fwd' ? 'opacity-0 translate-y-4' : 'opacity-0 -translate-y-4'
          }`}
          style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}
        >
          {current && (
            <div>
              {/* Step emoji + question */}
              <div className="mb-7">
                <span className="text-4xl block mb-4">{current.emoji}</span>
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-[--color-text] font-light leading-tight mb-1.5">
                  {current.question}
                </h2>
                {'hint' in current && current.hint && (
                  <p className="text-[11px] text-[--color-muted] uppercase tracking-wider font-semibold">
                    {current.hint}
                  </p>
                )}
              </div>

              {/* ── Options (single / multi) ──────────────────────────── */}
              {(current.type === 'single' || current.type === 'multi') && current.options && (
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {current.options.map((opt) => {
                    const isSelected =
                      current.type === 'multi'
                        ? selectedMulti.includes(opt.label)
                        : answers[current.id] === opt.label;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleOption(opt.label)}
                        className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border text-left transition-all duration-200 active:scale-95 ${
                          isSelected
                            ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] shadow-[0_0_20px_rgba(0,184,217,0.2)]'
                            : 'border-[rgba(255,255,255,0.1)] bg-[rgba(7,21,28,0.5)] hover:border-[rgba(255,255,255,0.25)] hover:bg-[rgba(7,21,28,0.8)]'
                        }`}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <span className={`text-xs font-semibold leading-snug ${isSelected ? 'text-[--color-accent]' : 'text-slate-200'}`}>
                          {opt.label}
                        </span>
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[--color-accent] flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Text input ───────────────────────────────────────── */}
              {current.type === 'text' && (
                <div className="mb-8">
                  <input
                    type="text"
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    placeholder={current.placeholder}
                    autoFocus
                    className="w-full h-14 px-4 rounded-2xl bg-[rgba(7,21,28,0.7)] border border-[rgba(255,255,255,0.12)] text-white text-base placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                  />
                </div>
              )}

              {/* ── Phone input ──────────────────────────────────────── */}
              {current.type === 'phone' && (
                <div className="mb-8">
                  <div className="flex items-center gap-0 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.12)] bg-[rgba(7,21,28,0.7)] focus-within:border-[--color-accent] transition-colors">
                    <div className="flex items-center gap-2 px-4 py-4 border-r border-[rgba(255,255,255,0.1)] shrink-0">
                      <span className="text-base">🇮🇳</span>
                      <span className="text-sm text-[--color-muted] font-mono">+91</span>
                    </div>
                    <input
                      type="tel"
                      value={textVal}
                      onChange={(e) => setTextVal(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={current.placeholder}
                      autoFocus
                      maxLength={10}
                      className="flex-1 h-14 px-4 bg-transparent text-white text-base placeholder:text-slate-500 focus:outline-none font-mono"
                      onKeyDown={(e) => e.key === 'Enter' && canProceed() && handleNext()}
                    />
                  </div>
                  <p className="text-[11px] text-[--color-muted] mt-2 px-1">
                    💬 Suraj will reply on WhatsApp at this number
                  </p>
                </div>
              )}

              {/* ── Textarea ─────────────────────────────────────────── */}
              {current.type === 'textarea' && (
                <div className="mb-8">
                  <textarea
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    placeholder={current.placeholder}
                    rows={5}
                    autoFocus
                    className="w-full px-4 py-4 rounded-2xl bg-[rgba(7,21,28,0.7)] border border-[rgba(255,255,255,0.12)] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] transition-colors resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-[--color-muted] mt-2 px-1 italic">
                    Optional — skip if you'd rather talk directly
                  </p>
                </div>
              )}

              {/* Continue button (multi-select only — single auto-advances) */}
              {isMultiStep && (
                <button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all active:scale-[0.98] ${
                    canProceed()
                      ? 'btn-primary shadow-xl'
                      : 'bg-[rgba(255,255,255,0.06)] text-[--color-muted] border border-[rgba(255,255,255,0.08)] cursor-not-allowed'
                  }`}
                >
                  CONTINUE →
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Fixed Bottom CTA (text / phone / textarea steps) ──────────── */}
        {isTextStep && (
          <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-6 pt-3 bg-gradient-to-t from-[rgba(2,7,11,1)] via-[rgba(2,7,11,0.95)] to-transparent md:relative md:bg-none md:px-8 md:pb-10">
            <button
              onClick={handleNext}
              disabled={submitting || (!canProceed() && !isLastStep)}
              className={`w-full max-w-[640px] mx-auto flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-bold tracking-wider uppercase transition-all active:scale-[0.98] shadow-2xl ${
                canProceed() || isLastStep
                  ? 'btn-primary'
                  : 'bg-[rgba(255,255,255,0.06)] text-[--color-muted] border border-[rgba(255,255,255,0.08)] cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending…</span>
                </>
              ) : isLastStep ? (
                <>
                  <span>💬</span>
                  <span>SEND & OPEN WHATSAPP →</span>
                </>
              ) : (
                <span>CONTINUE →</span>
              )}
            </button>
          </div>
        )}

        {/* ── Quick contact strip (bottom of scrollable area) ──────────── */}
        <div className="relative z-10 border-t border-[rgba(255,255,255,0.06)] px-5 sm:px-8 py-5 pb-24 md:pb-6 bg-[rgba(2,7,11,0.5)]">
          <p className="text-[11px] text-[--color-muted] text-center">
            Prefer instant contact?{' '}
            <a
              href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Suraj! I would like to discuss a marine aquarium project.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors"
            >
              WhatsApp Suraj directly →
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
