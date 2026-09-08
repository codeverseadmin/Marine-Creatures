'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { MOBILE_NAV_LINKS, SITE_CONFIG } from '@/lib/config';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useOrder } from '@/lib/context/OrderContext';

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
  const { wishlistCount, setIsWishlistOpen } = useWishlist();
  const { setIsTrackingOpen } = useOrder();

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
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
        gsap.fromTo(
          content,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
        );
        if (links) {
          gsap.fromTo(
            links,
            { opacity: 0, x: -15 },
            { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: 'power2.out', delay: 0.08 }
          );
        }
        if (actions) {
          gsap.fromTo(
            actions,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out', delay: 0.2 }
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
          duration: 0.25,
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
      className="fixed inset-0 z-[99995] hidden flex-col overflow-y-auto bg-[rgba(2,7,11,0.96)] backdrop-blur-2xl px-5 py-5 sm:px-8 touch-momentum"
      aria-hidden={!isOpen}
      role="dialog"
      aria-modal="true"
      aria-label="Navigation Menu"
    >
      {/* Background aquatic ambient glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #00D2F7 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div ref={contentRef} className="relative z-10 flex flex-col flex-1 max-w-lg mx-auto w-full justify-between pb-10">
        {/* Top Bar: Wordmark + Close Icon */}
        <div className="flex items-center justify-between pb-5 border-b border-[rgba(255,255,255,0.08)]">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[--color-accent] animate-pulse" />
            <span className="font-body text-xs font-semibold tracking-[0.25em] text-white">
              {SITE_CONFIG.name.toUpperCase()}
            </span>
          </Link>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-2xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] hover:border-[--color-accent] active:scale-95 text-white flex items-center justify-center transition-all"
            aria-label="Close navigation menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        {/* Quick Action Concierge Chips */}
        <div ref={actionsRef} className="grid grid-cols-2 gap-3 py-6">
          <Link
            href="/marketplace"
            onClick={onClose}
            className="p-3.5 rounded-2xl border border-[rgba(0,184,217,0.3)] bg-[rgba(0,184,217,0.08)] hover:bg-[rgba(0,184,217,0.16)] transition-all flex flex-col justify-between active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">🛍️</span>
              <span className="text-[10px] text-[--color-accent] font-semibold tracking-wider">STORE</span>
            </div>
            <span className="text-xs font-medium text-white">Marketplace</span>
          </Link>

          <Link
            href="/services"
            onClick={onClose}
            className="p-3.5 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[--color-accent] transition-all flex flex-col justify-between active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">⚡</span>
              <span className="text-[10px] text-[--color-muted] font-semibold tracking-wider">BOOKING</span>
            </div>
            <span className="text-xs font-medium text-white">Services &amp; Setup</span>
          </Link>

          <button
            onClick={() => {
              onClose();
              setIsWishlistOpen(true);
            }}
            className="p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all flex flex-col justify-between active:scale-[0.98] text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">❤️</span>
              <span className="text-[10px] text-rose-400 font-semibold tracking-wider">
                {wishlistCount > 0 ? `${wishlistCount} SAVED` : 'WISHLIST'}
              </span>
            </div>
            <span className="text-xs font-medium text-white">Saved Specimens</span>
          </button>

          <button
            onClick={() => {
              onClose();
              setIsTrackingOpen(true);
            }}
            className="p-3.5 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all flex flex-col justify-between active:scale-[0.98] text-left"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">📦</span>
              <span className="text-[10px] text-cyan-400 font-semibold tracking-wider">LIVE TELEMETRY</span>
            </div>
            <span className="text-xs font-medium text-white">Track Orders</span>
          </button>

          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Marine Creatures! I would like to inquire about your marine life, bespoke aquariums, and services.')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-all flex flex-col justify-between col-span-2 sm:col-span-1 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">💬</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">WHATSAPP</span>
            </div>
            <span className="text-xs font-medium text-white">Live Concierge Chat</span>
          </a>

          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="p-3.5 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-white transition-all flex flex-col justify-between col-span-2 sm:col-span-1 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xl">📞</span>
              <span className="text-[10px] text-[--color-muted] font-semibold tracking-wider">DIRECT HOTLINE</span>
            </div>
            <span className="text-xs font-medium text-white">{SITE_CONFIG.phone}</span>
          </a>
        </div>

        {/* Primary Nav Links */}
        <nav className="flex-1 py-3 space-y-1.5" aria-label="Mobile Navigation">
          <div ref={linksRef} className="space-y-1.5">
            {MOBILE_NAV_LINKS.map((link, idx) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`mobile-nav-item flex items-center justify-between py-3.5 px-4 rounded-2xl transition-all duration-200 active:scale-[0.99] ${
                    isActive
                      ? 'bg-[rgba(0,184,217,0.12)] border border-[rgba(0,184,217,0.3)] text-[--color-accent]'
                      : 'text-slate-200 hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className={`text-xs font-mono ${isActive ? 'text-[--color-accent]' : 'text-slate-500'}`}>
                      0{idx + 1}
                    </span>
                    <span className="font-display text-2xl sm:text-3xl font-light tracking-wide">
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
        <div className="pt-6 mt-6 border-t border-[rgba(255,255,255,0.08)] pb-safe flex flex-col gap-3 text-xs">
          <div className="flex justify-between items-center text-[--color-muted]">
            <span>{SITE_CONFIG.email}</span>
            <span className="text-[10px] uppercase tracking-widest text-[--color-accent]">BRINGING OCEAN AT YOUR DOOR STEP</span>
          </div>
          {/* Founded by */}
          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            <span>Founded by</span>
            <a
              href={SITE_CONFIG.founderLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[--color-accent] font-semibold underline underline-offset-2 decoration-[rgba(0,184,217,0.4)] hover:text-white hover:decoration-white transition-colors"
            >
              {SITE_CONFIG.founder}
            </a>
          </p>
          {/* Social quick links */}
          <div className="flex items-center gap-3">
            <a
              href={SITE_CONFIG.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[--color-muted] hover:text-[#1877F2] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Facebook</span>
            </a>
            <span className="text-slate-700">•</span>
            <a
              href={SITE_CONFIG.googleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[--color-muted] hover:text-[#EA4335] transition-colors"
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Find Us on Maps</span>
            </a>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <p className="font-display italic text-slate-400 text-sm">
              Bringing ocean at your door step
            </p>
            <Link
              href="/admin"
              onClick={onClose}
              className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-white/10 hover:border-cyan-400/40 bg-white/5"
            >
              <span>🔒 Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

