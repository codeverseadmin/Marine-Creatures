'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { MOBILE_NAV_LINKS, SITE_CONFIG } from '@/lib/config';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const overlay = overlayRef.current;
    const content = contentRef.current;
    const links = linksRef.current?.querySelectorAll('.mobile-nav-item');
    const actions = actionsRef.current?.children;
    if (!overlay || !content) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isOpen) {
      gsap.set(overlay, { display: 'flex' });
      if (!prefersReduced) {
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
        gsap.fromTo(
          content,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.45, ease: 'power3.out' }
        );
        if (links) {
          gsap.fromTo(
            links,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.1 }
          );
        }
        if (actions) {
          gsap.fromTo(
            actions,
            { opacity: 0, y: 15 },
            { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: 'power2.out', delay: 0.25 }
          );
        }
      } else {
        gsap.set(overlay, { opacity: 1 });
        gsap.set(content, { opacity: 1, y: 0 });
        if (links) gsap.set(links, { opacity: 1, x: 0 });
        if (actions) gsap.set(actions, { opacity: 1, y: 0 });
      }
    } else {
      if (!prefersReduced) {
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => gsap.set(overlay, { display: 'none' }),
        });
      } else {
        gsap.set(overlay, { display: 'none' });
      }
    }
  }, [isOpen]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[99995] hidden flex-col justify-between overflow-y-auto bg-[rgba(2,7,11,0.98)] backdrop-blur-2xl px-6 py-6 sm:px-10"
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      {/* Background aquatic ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #00D2F7 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div ref={contentRef} className="relative z-10 flex flex-col flex-1 max-w-lg mx-auto w-full justify-between">
        {/* Top Bar: Wordmark + Close Icon */}
        <div className="flex items-center justify-between pb-6 border-b border-[rgba(255,255,255,0.08)]">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[--color-accent] animate-pulse" />
            <span className="font-body text-xs font-semibold tracking-[0.25em] text-white">
              {SITE_CONFIG.name.toUpperCase()}
            </span>
          </Link>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] hover:border-[--color-accent] active:scale-95 text-white flex items-center justify-center transition-all"
            aria-label="Close navigation menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        {/* Quick Action Concierge Chips */}
        <div ref={actionsRef} className="grid grid-cols-2 gap-2.5 py-6">
          <Link
            href="/marketplace"
            onClick={onClose}
            className="p-3.5 rounded-xl border border-[rgba(0,184,217,0.3)] bg-[rgba(0,184,217,0.08)] hover:bg-[rgba(0,184,217,0.15)] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">🛍️</span>
              <span className="text-[10px] text-[--color-accent] font-semibold tracking-wider">STORE</span>
            </div>
            <span className="text-xs font-medium text-white">Marketplace</span>
          </Link>

          <Link
            href="/services"
            onClick={onClose}
            className="p-3.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[--color-accent] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">🔧</span>
              <span className="text-[10px] text-[--color-muted] font-semibold tracking-wider">BOOKING</span>
            </div>
            <span className="text-xs font-medium text-white">Services &amp; Setup</span>
          </Link>

          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Marine Creatures! I would like to inquire about your marine life, bespoke aquariums, and services.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex flex-col justify-between col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">💬</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">WHATSAPP</span>
            </div>
            <span className="text-xs font-medium text-white">Live Concierge Chat</span>
          </a>

          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="p-3.5 rounded-xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-white transition-all flex flex-col justify-between col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-base">📞</span>
              <span className="text-[10px] text-[--color-muted] font-semibold tracking-wider">DIRECT CALL</span>
            </div>
            <span className="text-xs font-medium text-white">{SITE_CONFIG.phone}</span>
          </a>
        </div>

        {/* Primary Nav Links */}
        <nav className="flex-1 py-4 space-y-1" aria-label="Mobile Navigation">
          <div ref={linksRef} className="space-y-1">
            {MOBILE_NAV_LINKS.map((link, idx) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`mobile-nav-item flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-[rgba(0,184,217,0.12)] border border-[rgba(0,184,217,0.3)] text-[--color-accent]'
                      : 'text-slate-200 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[11px] font-mono ${isActive ? 'text-[--color-accent]' : 'text-slate-500'}`}>
                      0{idx + 1}
                    </span>
                    <span className="font-display text-2xl font-light tracking-wide">
                      {link.label}
                    </span>
                  </div>
                  <span className={`text-sm ${isActive ? 'text-[--color-accent]' : 'text-slate-500'}`}>
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Drawer Footer with Safe Area */}
        <div className="pt-6 mt-4 border-t border-[rgba(255,255,255,0.08)] pb-safe flex flex-col gap-2 text-xs">
          <div className="flex justify-between items-center text-[--color-muted]">
            <span>{SITE_CONFIG.email}</span>
            <span className="text-[10px] uppercase tracking-widest text-[--color-accent]">NURTURED IN CODEVERSE</span>
          </div>
          <p className="font-display italic text-slate-400 text-sm text-center pt-2">
            Where The Ocean Becomes Art.
          </p>
        </div>
      </div>
    </div>
  );
}
