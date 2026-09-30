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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-accent]" aria-hidden="true">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-300" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-400" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400" aria-hidden="true">
                <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8l1 12a2 2 0 002 2h8a2 2 0 002-2L19 8M10 12v4M14 12v4" />
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-400" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider">WHATSAPP</span>
            </div>
            <span className="text-xs font-medium text-white">Live Concierge Chat</span>
          </a>

          <a
            href={`tel:${SITE_CONFIG.phone}`}
            className="p-3.5 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-white transition-all flex flex-col justify-between col-span-2 sm:col-span-1 active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-1.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[--color-muted]" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
              </svg>
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
          {/* Credits */}
          <div className="flex flex-col gap-1">
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
            <p className="text-[11px] text-slate-600 flex items-center gap-1">
              <span>Developed by</span>
              <a
                href={SITE_CONFIG.developerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 font-semibold underline underline-offset-2 decoration-slate-600 hover:text-white hover:decoration-white transition-colors"
              >
                {SITE_CONFIG.developer}
              </a>
            </p>
          </div>
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
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

