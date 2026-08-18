'use client';

import React, { useState } from 'react';
import { SITE_CONFIG } from '@/lib/config';

export function BookingForm({ defaultService = 'installation' }: { defaultService?: string }) {
  const [serviceType, setServiceType] = useState<string>(defaultService);
  const [spaceType, setSpaceType] = useState<string>('Residential Penthouse / Private Estate');
  const [tankSize, setTankSize] = useState<string>('1.5m – 2.5m (400L – 1,000L)');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="rounded-3xl p-10 md:p-16 border border-[rgba(0,184,217,0.4)] bg-[rgba(5,15,22,0.95)] backdrop-blur-2xl text-center shadow-2xl space-y-6">
        <span className="text-5xl block">🐠</span>
        <span className="text-xs text-[--color-accent] tracking-[0.3em] uppercase font-semibold block">
          CONSULTATION REGISTERED
        </span>
        <h3 className="font-display text-3xl md:text-4xl text-white font-light">
          Thank you, {name || 'Client'}.
        </h3>
        <p className="font-body text-sm sm:text-base text-[--color-muted] max-w-lg mx-auto leading-relaxed">
          Our Senior Marine Engineering Director will contact you within 24 hours at <strong className="text-white">{phone || email}</strong> to review your specifications and schedule the on-site survey.
        </p>

        <div className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.7)] max-w-lg mx-auto text-sm text-left space-y-3">
          <div className="flex justify-between">
            <span className="text-[--color-muted]">Requested Service:</span>
            <span className="text-[--color-accent] font-medium capitalize">{serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--color-muted]">Property &amp; Scale:</span>
            <span className="text-white">{spaceType} ({tankSize})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--color-muted]">Target Location:</span>
            <span className="text-white">{location || 'Pending confirmation'}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=Hi%20Marine%20Creatures,%20I%20have%20booked%20a%20${serviceType}%20consultation`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-4 px-8 rounded-xl"
          >
            CHAT ON WHATSAPP NOW →
          </a>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-ghost text-xs py-4 px-8 rounded-xl"
          >
            BOOK ANOTHER SERVICE
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl p-8 sm:p-12 md:p-16 border border-[rgba(255,255,255,0.1)] bg-[rgba(5,15,22,0.9)] backdrop-blur-2xl shadow-2xl"
    >
      {/* SECTION 1: Service Selection */}
      <div className="pb-10 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-[--color-accent] text-[--color-primary] font-bold text-xs flex items-center justify-center">
            01
          </span>
          <div>
            <h3 className="text-base font-medium text-white">
              Select Desired Service
            </h3>
            <p className="text-xs text-[--color-muted]">
              Choose the bespoke engineering or biological service required
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              id: 'installation',
              title: 'New Installation',
              desc: 'Architectural aquarium design, concealed plumbing, live rock aquascaping & ecosystem cycling.',
              tag: 'From £1,850',
            },
            {
              id: 'renovation',
              title: 'Tank Renovation',
              desc: 'Algae eradication, glass scratch polishing, silent pump & high-PAR NemoLight LED retrofitting.',
              tag: 'From £650',
            },
            {
              id: 'maintenance',
              title: 'Marine Concierge',
              desc: 'Bi-weekly water chemical lab testing, salt water changes & 24/7 priority emergency response.',
              tag: 'From £280 / Mo',
            },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceType(s.id)}
              className={`p-6 rounded-2xl border-2 text-left transition-all duration-300 flex flex-col justify-between min-h-[190px] ${
                serviceType === s.id
                  ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] shadow-[0_0_30px_rgba(0,184,217,0.25)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              <div>
                <h4 className="font-display text-lg text-white font-medium mb-2">
                  {s.title}
                </h4>
                <p className="font-body text-xs text-[--color-muted] leading-relaxed mb-4">
                  {s.desc}
                </p>
              </div>
              <span className="text-xs font-semibold text-[--color-accent] tracking-wider pt-2 border-t border-[rgba(255,255,255,0.06)] block">
                {s.tag}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: Space & Scale Details */}
      <div className="py-10 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-[--color-accent] text-[--color-primary] font-bold text-xs flex items-center justify-center">
            02
          </span>
          <div>
            <h3 className="text-base font-medium text-white">
              Space &amp; Scale Specifications
            </h3>
            <p className="text-xs text-[--color-muted]">
              Specify your property environment and estimated aquarium scale
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              Property / Space Type
            </label>
            <select
              value={spaceType}
              onChange={(e) => setSpaceType(e.target.value)}
              className="w-full h-14 px-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all cursor-pointer"
            >
              <option value="Residential Penthouse / Private Estate">Residential Penthouse / Private Estate</option>
              <option value="Luxury Hotel & Hospitality Lounge">Luxury Hotel &amp; Hospitality Lounge</option>
              <option value="Corporate HQ & Executive Suite">Corporate HQ &amp; Executive Suite</option>
              <option value="Superyacht Marine Installation">Superyacht Marine Installation</option>
              <option value="Private Clinic / Wellness Center">Private Clinic / Wellness Center</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              Approximate Tank Scale
            </label>
            <select
              value={tankSize}
              onChange={(e) => setTankSize(e.target.value)}
              className="w-full h-14 px-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all cursor-pointer"
            >
              <option value="Compact (Under 1.2m / Up to 300 Liters)">Compact (Under 1.2m / Up to 300 Liters)</option>
              <option value="Mid-Range (1.5m – 2.5m / 400L – 1,000 Liters)">Mid-Range (1.5m – 2.5m / 400L – 1,000 Liters)</option>
              <option value="Monumental Architectural (3m – 6m / 2,000L – 10,000L)">Monumental Architectural (3m – 6m / 2,000L – 10,000L)</option>
              <option value="Custom Curved Cylinder or In-Wall Room Divider">Custom Curved Cylinder or In-Wall Room Divider</option>
            </select>
          </div>
        </div>
      </div>

      {/* SECTION 3: Contact Information */}
      <div className="py-10 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-[--color-accent] text-[--color-primary] font-bold text-xs flex items-center justify-center">
            03
          </span>
          <div>
            <h3 className="text-base font-medium text-white">
              Contact Information
            </h3>
            <p className="text-xs text-[--color-muted]">
              Where our senior marine curator should reach you
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lord / Lady / Mr. / Ms. Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              Phone / WhatsApp Number *
            </label>
            <input
              type="tel"
              required
              placeholder="e.g. +44 7911 123456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-14 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="client@luxuryestate.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              City / Country Location *
            </label>
            <input
              type="text"
              required
              placeholder="London, Monaco, Dubai, Geneva, etc."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-14 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: Scheduling & Vision */}
      <div className="py-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-8 rounded-lg bg-[--color-accent] text-[--color-primary] font-bold text-xs flex items-center justify-center">
            04
          </span>
          <div>
            <h3 className="text-base font-medium text-white">
              Preferred Date &amp; Scope
            </h3>
            <p className="text-xs text-[--color-muted]">
              Tell us your timing and aesthetic vision
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              Preferred Consultation Date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full h-14 px-5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 block mb-3">
              Project Notes &amp; Scope
            </label>
            <textarea
              rows={2}
              placeholder="Describe your aesthetic vision, architectural constraints, or existing setup issues..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* Submit CTA & Direct Hotline */}
      <div className="pt-8 border-t border-[rgba(255,255,255,0.1)] flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="text-sm text-[--color-muted]">
          <span>Direct Biological Hotline: </span>
          <a href={`tel:${SITE_CONFIG.phone}`} className="text-white hover:text-[--color-accent] font-medium ml-1">
            {SITE_CONFIG.phone}
          </a>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto h-14 px-10 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-widest hover:bg-white transition-all shadow-xl"
        >
          CONFIRM CONSULTATION BOOKING →
        </button>
      </div>
    </form>
  );
}
