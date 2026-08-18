'use client';

import { useState } from 'react';
import Link from 'next/link';

const STEPS = [
  {
    id: 1,
    question: 'What do you need?',
    options: ['New Aquarium', 'Renovation', 'Installation', 'Marine Life', 'Materials', 'Maintenance', 'Other'],
    type: 'multi' as const,
  },
  {
    id: 2,
    question: 'About your space',
    options: ['Residential', 'Office', 'Restaurant', 'Hotel', 'Commercial', 'Other'],
    type: 'single' as const,
  },
  {
    id: 3,
    question: 'Aquarium size',
    options: ['Under 1m', '1–2m', '2–3m', '3m+', 'Custom / Unsure'],
    type: 'single' as const,
  },
  {
    id: 4,
    question: 'Your location',
    placeholder: 'City, Country',
    type: 'text' as const,
  },
  {
    id: 5,
    question: 'Tell us your vision',
    placeholder: 'Describe your space, your existing aquarium (if any), and what you hope to achieve...',
    type: 'textarea' as const,
  },
];

export default function ContactPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [textVal, setTextVal] = useState('');

  const current = STEPS[step];

  const handleOption = (option: string) => {
    if (!current) return;
    if (current.type === 'multi') {
      const prev = (answers[current.id] as string[]) || [];
      const next = prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option];
      setAnswers({ ...answers, [current.id]: next });
    } else {
      setAnswers({ ...answers, [current.id]: option });
      setTimeout(() => setStep((s) => s + 1), 300);
    }
  };

  const handleNext = () => {
    if (current) {
      setAnswers({ ...answers, [current.id]: textVal });
    }
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
      setTextVal('');
    } else {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center"
        style={{ background: 'var(--color-primary)' }}
      >
        <span className="text-label text-[--color-accent] block mb-6">THANK YOU</span>
        <h1 className="font-display text-display-md text-[--color-text] font-light mb-6">
          Your Conversation<br />Has Begun.
        </h1>
        <p className="font-body font-light text-[--color-muted] max-w-md leading-relaxed mb-10" style={{ fontSize: '0.9375rem' }}>
          We have received your enquiry and will be in touch within 24 hours to begin the conversation about your aquarium.
        </p>
        <Link href="/" className="btn-ghost inline-flex" data-cursor="ENTER">
          RETURN HOME →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-primary)' }}
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=70"
          alt=""
          className="w-full h-full object-cover opacity-5"
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="container-max pt-40 md:pt-48 pb-12">
          <span className="text-label text-[--color-accent] block mb-4">BEGIN THE CONVERSATION</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Start A Project
          </h1>
        </div>


        {/* Progress */}
        <div className="container-max mb-10">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-px flex-1 transition-all duration-500"
                style={{
                  background: i <= step ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
                }}
              />
            ))}
          </div>
          <p className="text-label text-[--color-muted] mt-2">
            STEP {step + 1} OF {STEPS.length}
          </p>
        </div>

        {/* Question */}
        <div className="container-max flex-1">
          {current && (
            <div>
              <h2 className="font-display text-display-sm text-[--color-text] font-light mb-10">
                {current.question}
              </h2>

              {/* Options */}
              {(current.type === 'single' || current.type === 'multi') && current.options && (
                <div className="flex flex-wrap gap-3 mb-10">
                  {current.options.map((option) => {
                    const isSelected =
                      current.type === 'multi'
                        ? ((answers[current.id] as string[]) || []).includes(option)
                        : answers[current.id] === option;
                    return (
                      <button
                        key={option}
                        onClick={() => handleOption(option)}
                        className={`px-6 py-3 border transition-all duration-300 font-body font-light text-sm ${
                          isSelected
                            ? 'border-[--color-accent] text-[--color-accent] bg-[rgba(0,184,217,0.05)]'
                            : 'border-[rgba(255,255,255,0.12)] text-[--color-muted] hover:border-[rgba(255,255,255,0.3)] hover:text-[--color-text]'
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Text input */}
              {current.type === 'text' && (
                <input
                  type="text"
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  placeholder={current.placeholder}
                  className="w-full max-w-lg bg-transparent border-b border-[rgba(255,255,255,0.2)] text-[--color-text] font-body font-light py-3 focus:outline-none focus:border-[--color-accent] transition-colors placeholder:text-[--color-muted] mb-10"
                  style={{ fontSize: '1.0625rem' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                />
              )}

              {/* Textarea */}
              {current.type === 'textarea' && (
                <textarea
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  placeholder={current.placeholder}
                  rows={5}
                  className="w-full max-w-2xl bg-transparent border border-[rgba(255,255,255,0.1)] text-[--color-text] font-body font-light p-4 focus:outline-none focus:border-[--color-accent] transition-colors placeholder:text-[--color-muted] mb-10 resize-none"
                  style={{ fontSize: '0.9375rem' }}
                />
              )}

              {/* Navigation */}
              <div className="flex items-center gap-6">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="text-label text-[--color-muted] hover:text-[--color-text] transition-colors"
                  >
                    ← BACK
                  </button>
                )}

                {(current.type === 'multi' ||
                  current.type === 'text' ||
                  current.type === 'textarea') && (
                  <button
                    onClick={handleNext}
                    className="btn-primary"
                    data-cursor="ENTER"
                  >
                    {step === STEPS.length - 1
                      ? 'BEGIN THE CONVERSATION →'
                      : 'CONTINUE →'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="container-max py-8 mt-auto border-t border-[rgba(255,255,255,0.06)]">
          <p className="text-label text-[--color-muted]">
            Prefer to talk? &nbsp;
            <a
              href="mailto:surajshasmal04@gmail.com"
              className="text-[--color-accent] hover:text-[--color-cyan] transition-colors"
            >
              surajshasmal04@gmail.com
            </a>
            &nbsp;•&nbsp;
            <a
              href="https://wa.me/919330436603?text=Hi%20Marine%20Creatures,%20I%20would%20like%20to%20start%20a%20project."
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--color-accent] hover:text-white transition-colors"
            >
              +91 93304 36603 (WhatsApp)
            </a>
          </p>
        </div>


      </div>
    </div>
  );
}
