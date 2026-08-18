'use client';

import React, { useState } from 'react';
import { SITE_CONFIG } from '@/lib/config';

export function BookingForm({ defaultService = 'installation' }: { defaultService?: string }) {
  const [serviceType, setServiceType] = useState<string>(defaultService);
  const [spaceType, setSpaceType] = useState<string>('Residential Penthouse / Villa');
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
      <div className="rounded-2xl p-8 sm:p-12 border border-[rgba(0,184,217,0.4)] bg-[rgba(7,21,28,0.8)] backdrop-blur-md text-center shadow-2xl">
        <span className="text-4xl block mb-4">🐠</span>
        <span className="text-label text-[--color-accent] tracking-[0.3em] block mb-2">
          CONSULTATION REGISTERED
        </span>
        <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-4">
          Thank you, {name || 'Client'}.
        </h3>
        <p className="font-body text-xs text-[--color-muted] max-w-md mx-auto leading-relaxed mb-8">
          Our Senior Marine Engineering Director will contact you within 24 hours at <strong className="text-white">{phone || email}</strong> to review your architectural blueprints and schedule the on-site survey for {preferredDate || 'your project'}.
        </p>

        <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.6)] max-w-md mx-auto mb-8 text-xs text-left space-y-2">
          <div className="flex justify-between">
            <span className="text-[--color-muted]">Requested Service:</span>
            <span className="text-[--color-accent] font-medium capitalize">{serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--color-muted]">Space & Dimensions:</span>
            <span className="text-white">{spaceType} ({tankSize})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[--color-muted]">Location:</span>
            <span className="text-white">{location || 'Pending confirmation'}</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=Hi%20Marine%20Creatures,%20I%20have%20booked%20a%20${serviceType}%20consultation`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs"
          >
            CHAT ON WHATSAPP NOW →
          </a>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-ghost text-xs"
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
      className="rounded-2xl p-6 sm:p-10 border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl shadow-2xl space-y-8"
    >
      {/* 1. Service Selection Tabs */}
      <div>
        <label className="text-label text-[--color-accent] tracking-wider block mb-3">
          1. SELECT DESIRED SERVICE
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'installation', label: '🛠️ New Installation', sub: 'Complete turn-key commission' },
            { id: 'renovation', label: '🔄 Tank Renovation', sub: 'Algae, scratches & LED retrofit' },
            { id: 'maintenance', label: '💧 Marine Concierge', sub: 'Ongoing weekly/monthly care' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceType(s.id)}
              className={`p-4 rounded-xl border text-left transition-all ${
                serviceType === s.id
                  ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] shadow-[0_0_20px_rgba(0,184,217,0.2)]'
                  : 'border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.5)] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              <span className="font-body text-xs font-semibold text-white block mb-1">
                {s.label}
              </span>
              <span className="text-[10px] text-[--color-muted] block">{s.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Space & Tank Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="text-label text-[--color-muted] block mb-2">SPACE / PROPERTY TYPE</label>
          <select
            value={spaceType}
            onChange={(e) => setSpaceType(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[--color-accent]"
          >
            <option value="Residential Penthouse / Villa">Residential Penthouse / Villa</option>
            <option value="Luxury Hotel & Hospitality">Luxury Hotel & Hospitality</option>
            <option value="Corporate HQ & Executive Boardroom">Corporate HQ & Executive Boardroom</option>
            <option value="Superyacht Marine Setup">Superyacht Marine Setup</option>
            <option value="Private Clinic / Lounge">Private Clinic / Lounge</option>
          </select>
        </div>

        <div>
          <label className="text-label text-[--color-muted] block mb-2">APPROXIMATE TANK SIZE</label>
          <select
            value={tankSize}
            onChange={(e) => setTankSize(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[--color-accent]"
          >
            <option value="Compact (Under 1.2m / Up to 300L)">Compact (Under 1.2m / Up to 300L)</option>
            <option value="Mid-Range (1.5m – 2.5m / 400L – 1,000L)">Mid-Range (1.5m – 2.5m / 400L – 1,000L)</option>
            <option value="Monumental Architectural (3m – 6m / 2,000L – 10,000L)">Monumental Architectural (3m – 6m / 2,000L – 10,000L)</option>
            <option value="Custom Curved Cylinder or Room Divider">Custom Curved Cylinder or Room Divider</option>
          </select>
        </div>
      </div>

      {/* 3. Contact & Date Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="text-label text-[--color-muted] block mb-2">YOUR FULL NAME *</label>
          <input
            type="text"
            required
            placeholder="Lord / Lady / Mr. / Ms. Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent]"
          />
        </div>

        <div>
          <label className="text-label text-[--color-muted] block mb-2">PHONE / WHATSAPP NUMBER *</label>
          <input
            type="tel"
            required
            placeholder="+44 7000 000000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent]"
          />
        </div>

        <div>
          <label className="text-label text-[--color-muted] block mb-2">EMAIL ADDRESS *</label>
          <input
            type="email"
            required
            placeholder="client@luxuryestate.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent]"
          />
        </div>

        <div>
          <label className="text-label text-[--color-muted] block mb-2">CITY / LOCATION *</label>
          <input
            type="text"
            required
            placeholder="London, Monaco, Dubai, etc."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent]"
          />
        </div>
      </div>

      {/* 4. Preferred Target Date & Special Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="text-label text-[--color-muted] block mb-2">PREFERRED CONSULTATION DATE</label>
          <input
            type="date"
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[--color-accent]"
          />
        </div>

        <div>
          <label className="text-label text-[--color-muted] block mb-2">SPECIAL ARCHITECTURAL NOTES</label>
          <textarea
            rows={2}
            placeholder="Describe your vision, existing tank issues, or interior architect coordination..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg p-3 text-xs text-white placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent] resize-none"
          />
        </div>
      </div>

      {/* Submit Button & Direct Contact Line */}
      <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[--color-muted]">
          <span>Direct Hotline: </span>
          <a href={`tel:${SITE_CONFIG.phone}`} className="text-[--color-accent] hover:underline font-medium">
            {SITE_CONFIG.phone}
          </a>
        </div>

        <button
          type="submit"
          className="btn-primary w-full sm:w-auto px-8 py-3.5 text-xs tracking-widest uppercase font-semibold"
        >
          CONFIRM CONSULTATION BOOKING →
        </button>
      </div>
    </form>
  );
}
