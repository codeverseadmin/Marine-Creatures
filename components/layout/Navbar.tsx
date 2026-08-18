'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { NAV_LINKS, SITE_CONFIG } from '@/lib/config';
import { MobileMenu } from './MobileMenu';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled
            ? 'bg-[rgba(2,7,11,0.92)] backdrop-blur-md border-b border-[rgba(255,255,255,0.06)]'
            : 'bg-transparent'
        }`}
        aria-label="Main navigation"
      >
        <div className="container-max">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Left — Wordmark */}
            <Link
              href="/"
              className="text-label-lg text-[--color-text] tracking-[0.25em] hover:text-[--color-accent] transition-colors duration-300 font-body"
              aria-label="Marine Creatures — Home"
            >
              {SITE_CONFIG.name.toUpperCase()}
            </Link>

            {/* Center — Nav links (desktop) */}
            <nav className="hidden lg:flex items-center gap-8" aria-label="Primary navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link"
                  data-cursor="VIEW"
                >
                  {link.label.toUpperCase()}
                </Link>
              ))}
            </nav>

            {/* Right — CTA + hamburger */}
            <div className="flex items-center gap-6">
              <Link
                href="/contact"
                className="hidden md:inline-flex items-center gap-2 btn-ghost text-xs"
                data-cursor="ENTER"
              >
                CONTACT
                <span className="text-[--color-accent]">→</span>
              </Link>

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex flex-col gap-[5px] p-2 group"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                style={{ cursor: 'none' }}
              >
                <span
                  className={`block w-6 h-px bg-[--color-text] transition-all duration-300 ${
                    menuOpen ? 'rotate-45 translate-y-[6px]' : ''
                  }`}
                />
                <span
                  className={`block h-px bg-[--color-text] transition-all duration-300 ${
                    menuOpen ? 'opacity-0 w-0' : 'w-4'
                  }`}
                />
                <span
                  className={`block w-6 h-px bg-[--color-text] transition-all duration-300 ${
                    menuOpen ? '-rotate-45 -translate-y-[6px]' : ''
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
