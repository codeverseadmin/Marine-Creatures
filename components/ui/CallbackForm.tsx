'use client';

import React, { useState } from 'react';
import { SITE_CONFIG } from '@/lib/config';

export function CallbackForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [callTime, setCallTime] = useState('Immediate / ASAP');
  const [interest, setInterest] = useState('New Aquarium Installation');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleWhatsAppDirect = () => {
    const message = `Hi Marine Creatures! I would like to request a callback.\n\n• Name: ${name || 'Client'}\n• Phone: ${phone}\n• Preferred Time: ${callTime}\n• Requirement: ${interest}\n\nPlease reach out to me.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919330436603?text=${encoded}`, '_blank');
  };

  if (submitted) {
    return (
      <div className="rounded-2xl p-8 sm:p-10 border border-[rgba(0,184,217,0.4)] bg-[rgba(5,15,22,0.95)] backdrop-blur-2xl text-center shadow-2xl space-y-4 max-w-lg mx-auto">
        <span className="text-4xl block animate-bounce">📞</span>
        <span className="text-xs text-[--color-accent] tracking-[0.25em] uppercase font-semibold block">
          CALLBACK REQUEST RECEIVED
        </span>
        <h3 className="font-display text-2xl text-white font-light">
          Thank you, {name || 'Valued Client'}.
        </h3>
        <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
          Our Senior Biological Specialist will call you at <strong className="text-white">{phone}</strong> during your preferred window ({callTime}).
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3">
          <button
            onClick={handleWhatsAppDirect}
            className="btn-primary text-xs py-3 px-6 rounded-xl flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>CONNECT ON WHATSAPP NOW</span>
          </button>
          <button
            onClick={() => setSubmitted(false)}
            className="btn-ghost text-xs py-3 px-6 rounded-xl"
          >
            NEW REQUEST
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl p-6 sm:p-10 border border-[rgba(255,255,255,0.12)] bg-[rgba(3,10,16,0.85)] backdrop-blur-2xl shadow-2xl max-w-2xl mx-auto text-left"
    >
      <div className="text-center mb-8">
        <span className="text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-2">
          DIRECT BIOLOGIST ASSISTANCE
        </span>
        <h3 className="font-display text-2xl sm:text-3xl text-white font-light">
          Request A Quick Call Back
        </h3>
        <p className="font-body text-xs text-[--color-muted] mt-1">
          Leave your contact details and our senior curator will phone you directly.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        {/* Name */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Your Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rahul Sharma / Dr. Roy"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Phone / WhatsApp Number *
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. +91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
          />
        </div>

        {/* Preferred Time */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Preferred Callback Time
          </label>
          <select
            value={callTime}
            onChange={(e) => setCallTime(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[rgba(5,15,22,0.95)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] cursor-pointer"
          >
            <option value="Immediate / ASAP">⚡ Immediate / ASAP</option>
            <option value="Morning (9:00 AM – 12:00 PM)">Morning (9:00 AM – 12:00 PM)</option>
            <option value="Afternoon (12:00 PM – 4:00 PM)">Afternoon (12:00 PM – 4:00 PM)</option>
            <option value="Evening (4:00 PM – 8:00 PM)">Evening (4:00 PM – 8:00 PM)</option>
          </select>
        </div>

        {/* Interest */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-2">
            Primary Requirement
          </label>
          <select
            value={interest}
            onChange={(e) => setInterest(e.target.value)}
            className="w-full h-12 px-4 rounded-xl bg-[rgba(5,15,22,0.95)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] cursor-pointer"
          >
            <option value="New Aquarium Installation">New Aquarium Installation</option>
            <option value="Aquarium Renovation & Revival">Aquarium Renovation &amp; Revival</option>
            <option value="Marine Life & Rare Corals">Marine Life &amp; Rare Corals</option>
            <option value="NemoLight / Lighting Equipment">NemoLight / Lighting Equipment</option>
            <option value="Maintenance / Water Care">Maintenance / Water Care</option>
          </select>
        </div>
      </div>

      <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[11px] text-[--color-muted] text-center sm:text-left">
          🔒 Zero spam. Direct confidential call from our senior marine biologist.
        </span>

        <button
          type="submit"
          className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-lg shrink-0"
        >
          REQUEST CALL BACK →
        </button>
      </div>
    </form>
  );
}
