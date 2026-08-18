'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS, SITE_CONFIG } from '@/lib/config';
import { MobileMenu } from './MobileMenu';
import { useCart } from '@/lib/context/CartContext';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const { cartCount, setIsCartOpen, cartIconBouncing } = useCart();


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
              className="text-label-lg text-[--color-text] tracking-[0.25em] hover:text-[--color-accent] transition-colors duration-300 font-body flex items-center gap-2"
              aria-label="Marine Creatures — Home"
            >
              <span>{SITE_CONFIG.name.toUpperCase()}</span>
            </Link>

            {/* Center — Nav links (tablet & desktop) */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-8" aria-label="Primary navigation">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`nav-link relative py-1 text-xs tracking-widest transition-colors duration-300 ${
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

            {/* Right — Cart + CTA + hamburger */}
            <div className="flex items-center gap-3">
              {/* Shopping Bag Button */}
              <button
                id="navbar-cart-btn"
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2.5 rounded-lg border border-[rgba(255,255,255,0.12)] bg-[rgba(7,21,28,0.7)] hover:border-[--color-accent] text-white transition-all duration-300 flex items-center gap-2 ${
                  cartIconBouncing
                    ? 'scale-125 border-[--color-accent] shadow-[0_0_20px_rgba(0,184,217,0.9)] bg-[rgba(0,184,217,0.2)]'
                    : ''
                }`}
                aria-label={`Shopping Bag (${cartCount} items)`}
              >
                <span className="text-sm">🛒</span>
                <span className="hidden sm:inline text-[11px] uppercase tracking-wider text-[--color-muted]">
                  BAG
                </span>
                {cartCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[--color-accent] text-[--color-primary] font-bold text-[10px] flex items-center justify-center -mr-1 shadow-md animate-scale-pop">
                    {cartCount}
                  </span>
                )}
              </button>

              <Link
                href="/services"
                className="hidden lg:inline-flex items-center gap-1 btn-ghost text-xs py-2 px-4 border-[--color-accent] text-[--color-accent] hover:bg-[rgba(0,184,217,0.1)]"
                data-cursor="ENTER"
              >
                BOOK SERVICE
              </Link>


              {/* Hamburger (Mobile / Tablet) */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-[5px] p-2 border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)]"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                data-cursor="MENU"
              >
                <span
                  className={`block w-5 h-0.5 bg-[--color-text] transition-all duration-300 ${
                    menuOpen ? 'rotate-45 translate-y-[7px]' : ''
                  }`}
                />
                <span
                  className={`block h-0.5 bg-[--color-text] transition-all duration-300 ${
                    menuOpen ? 'opacity-0 w-0' : 'w-3.5'
                  }`}
                />
                <span
                  className={`block w-5 h-0.5 bg-[--color-text] transition-all duration-300 ${
                    menuOpen ? '-rotate-45 -translate-y-[7px]' : ''
                  }`}
                />
              </button>
            </div>


          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
