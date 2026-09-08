'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/config';

export function FounderConciergePill() {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Hide on admin page and invoice pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/invoice')) return null;

  const handleOpenWhatsApp = (customIntent?: string) => {
    let contextMessage = 'Hi Suraj! I am browsing the Marine Creatures portal and would like to consult with you directly.';
    if (pathname.includes('/marketplace')) {
      contextMessage = 'Hi Suraj! I am currently viewing your livestock marketplace and need guidance on specimen compatibility and quarantine.';
    } else if (pathname.includes('/aquarium-design') || pathname.includes('/services')) {
      contextMessage = 'Hi Suraj! I am interested in a turnkey luxury aquarium design / renovation project for my property.';
    }

    if (customIntent) {
      contextMessage += ` Specifically regarding: ${customIntent}`;
    }

    const url = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(contextMessage)}`;
    window.open(url, '_blank');
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[99980] flex flex-col items-end">
      {/* Expanded Luxury Concierge Card */}
      {isExpanded && (
        <div className="mb-3 w-80 sm:w-88 rounded-3xl border border-cyan-400/30 bg-[rgba(3,10,16,0.96)] backdrop-blur-2xl p-5 shadow-2xl space-y-4 animate-scale-pop select-none">
          <div className="flex items-start justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-cyan-400/40 bg-white/95 shrink-0 shadow-md">
                <Image
                  src="/logo.jpg"
                  alt="Suraj Shasmal"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain p-1"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Suraj Shasmal</span>
                  <span className="text-[10px] text-cyan-400 font-mono font-normal">Founder</span>
                </h4>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Online Now • Replies in ~5 mins</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-slate-400 hover:text-white p-1 text-sm"
              aria-label="Close concierge"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-normal">
            &ldquo;Every living reef we build is an architectural masterpiece. Connect with me directly for custom tank sizing, exotic specimen quarantine, or express air cargo dispatch.&rdquo;
          </p>

          {/* Quick Choice Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => handleOpenWhatsApp('Turnkey Architectural Aquarium Setup')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-slate-200 hover:text-cyan-300 text-left flex items-center justify-between transition-colors"
            >
              <span>🏛️ Custom Aquarium Consultation</span>
              <span className="text-slate-500">→</span>
            </button>

            <button
              onClick={() => handleOpenWhatsApp('Rare Specimen Availability & Quarantine Video')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/10 text-xs text-slate-200 hover:text-cyan-300 text-left flex items-center justify-between transition-colors"
            >
              <span>🐠 Live Fish &amp; Coral Compatibility</span>
              <span className="text-slate-500">→</span>
            </button>

            <button
              onClick={() => handleOpenWhatsApp()}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <span>💬</span>
              <span>Open WhatsApp with Suraj</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Concierge Pill Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group h-12 sm:h-13 px-3.5 sm:px-4 rounded-full border border-cyan-400/40 bg-[rgba(3,11,18,0.92)] hover:bg-slate-950 text-white backdrop-blur-xl shadow-2xl flex items-center gap-2.5 sm:gap-3 transition-all duration-300 active:scale-95 hover:border-cyan-300"
        aria-label="Chat with Founder Suraj Shasmal"
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-white/95 shrink-0">
          <Image
            src="/logo.jpg"
            alt="Suraj Shasmal"
            width={32}
            height={32}
            className="w-full h-full object-contain p-0.5"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-pulse" />
        </div>

        <div className="text-left leading-tight hidden xs:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white tracking-wide">Suraj Shasmal</span>
            <span className="text-[10px] text-cyan-400 font-medium">Founder</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-medium block">
            Online • Replies in 5m
          </span>
        </div>

        <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-sm font-bold shadow-md shrink-0">
          💬
        </span>
      </button>
    </div>
  );
}
