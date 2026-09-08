'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { NAV_LINKS, SITE_CONFIG } from '@/lib/config';
import { MobileMenu } from './MobileMenu';
import { useCart } from '@/lib/context/CartContext';
import { useTheme } from '@/lib/context/ThemeContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useOrder } from '@/lib/context/OrderContext';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const { cartCount, setIsCartOpen, cartIconBouncing } = useCart();
  const { spectrum, toggleSpectrum } = useTheme();
  const { wishlistCount, setIsWishlistOpen } = useWishlist();
  const { setIsTrackingOpen } = useOrder();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Hide customer navbar completely on admin console and invoice pages
  if (pathname.startsWith('/admin') || pathname.startsWith('/invoice')) {
    return null;
  }

  return (
    <>
      <header
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || pathname !== '/'
            ? 'bg-[rgba(2,7,11,0.88)] backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] shadow-lg shadow-black/40'
            : 'bg-gradient-to-b from-[rgba(2,7,11,0.7)] to-transparent'
        }`}
        aria-label="Main navigation"
      >
        <div className="container-max">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left — Wordmark */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              aria-label="Marine Creatures — Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.15)] bg-white/95 flex-shrink-0 group-hover:border-[--color-accent] transition-all shadow-sm">
                <Image
                  src="/logo.jpg"
                  alt="Marine Creatures"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <span className="text-[12px] xs:text-[13px] sm:text-sm md:text-base text-white tracking-[0.12em] sm:tracking-[0.18em] group-hover:text-[--color-accent] transition-colors duration-300 font-body font-bold whitespace-nowrap">
                {SITE_CONFIG.name.toUpperCase()}
              </span>
            </Link>

            {/* Center — Nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-3 lg:gap-6 xl:gap-8 shrink min-w-0" aria-label="Primary navigation">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link relative py-1 text-xs tracking-widest whitespace-nowrap transition-colors duration-300 ${
                      isActive ? 'text-[--color-accent] font-medium' : 'text-[--color-muted] hover:text-[--color-text]'
                    }`}
                    data-cursor="VIEW"
                  >
                    {link.label.toUpperCase()}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[--color-accent] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right — Actions: Spectrum Switch + Wishlist + Cart + Track + Hamburger */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Dual-Spectrum Lighting Switch */}
              <button
                onClick={toggleSpectrum}
                className="h-10 px-2.5 sm:px-3 rounded-xl border border-white/10 bg-[rgba(7,21,28,0.75)] hover:border-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition-all text-white active:scale-95 shadow-sm"
                title={`Current spectrum: ${spectrum === 'actinic' ? 'Actinic Moonlight' : 'Sunlit Reef'}. Tap to switch.`}
                aria-label="Toggle reef lighting spectrum"
              >
                <span>{spectrum === 'actinic' ? '🌙' : '☀️'}</span>
                <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-slate-300">
                  {spectrum === 'actinic' ? 'Actinic' : 'Sunlit'}
                </span>
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="relative h-10 w-10 sm:w-auto sm:px-3 rounded-xl border border-white/10 bg-[rgba(7,21,28,0.75)] hover:border-rose-400 text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
                aria-label={`Wishlist (${wishlistCount} items)`}
                title="Open Wishlist"
              >
                <span className="text-xs sm:text-sm">❤️</span>
                <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-slate-300 font-medium">
                  SAVED
                </span>
                {wishlistCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center -mr-0.5 shadow-md">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Bag Button */}
              <button
                id="navbar-cart-btn"
                onClick={() => setIsCartOpen(true)}
                className={`relative h-10 sm:h-11 px-3 sm:px-3.5 rounded-xl border border-[rgba(255,255,255,0.14)] bg-[rgba(7,21,28,0.75)] hover:border-[--color-accent] active:scale-95 text-white transition-all duration-300 flex items-center gap-2 shadow-sm ${
                  cartIconBouncing
                    ? 'scale-110 border-[--color-accent] shadow-[0_0_20px_rgba(0,184,217,0.9)] bg-[rgba(0,184,217,0.25)]'
                    : ''
                }`}
                aria-label={`Shopping Bag (${cartCount} items)`}
              >
                <span className="text-sm">🛒</span>
                <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[--color-muted] font-medium">
                  BAG
                </span>
                {cartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[--color-accent] text-[--color-primary] font-bold text-[10px] flex items-center justify-center -mr-0.5 shadow-md animate-scale-pop">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Track Order Button */}
              <button
                onClick={() => setIsTrackingOpen(true)}
                className="hidden lg:flex items-center gap-1.5 h-10 px-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 text-xs font-semibold tracking-wider uppercase transition-all active:scale-95 shadow-sm"
                title="Track Live Order Dispatch"
              >
                <span>📦</span>
                <span>TRACK</span>
              </button>

              <Link
                href="/services"
                className="hidden xl:flex items-center gap-1 px-4 py-2.5 rounded-xl border border-[--color-accent] text-xs font-semibold text-[--color-accent] hover:bg-[rgba(0,184,217,0.1)] active:scale-95 transition-all whitespace-nowrap"
                data-cursor="ENTER"
              >
                BOOK SERVICE
              </Link>

              {/* Hamburger (Mobile / Tablet) with crisp high-visibility SVG */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border border-white/20 bg-[rgba(7,21,28,0.85)] hover:border-cyan-400 active:scale-95 transition-all shrink-0 text-white shadow-sm"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                data-cursor="MENU"
              >
                {menuOpen ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                )}
              </button>
            </div>


          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
