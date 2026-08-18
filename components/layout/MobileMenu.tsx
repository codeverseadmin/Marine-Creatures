'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { MOBILE_NAV_LINKS, SITE_CONFIG } from '@/lib/config';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const links = linksRef.current?.querySelectorAll('a');
    if (!overlay || !links) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isOpen) {
      gsap.set(overlay, { display: 'flex' });
      if (!prefersReduced) {
        gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        gsap.fromTo(
          links,
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.2 }
        );
      } else {
        gsap.set(overlay, { opacity: 1 });
        gsap.set(links, { opacity: 1, y: 0 });
      }
    } else {
      if (!prefersReduced) {
        gsap.to(links, { opacity: 0, y: -20, duration: 0.3, stagger: 0.04, ease: 'power2.in' });
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.4,
          delay: 0.2,
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
      className="fixed inset-0 z-40 hidden flex-col justify-center px-8 md:px-16"
      style={{ background: 'rgba(2,7,11,0.97)' }}
      aria-hidden={!isOpen}
    >
      {/* Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle animate-particle-drift"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 20}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 6}s`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Close area */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-label-lg text-[--color-muted] hover:text-[--color-text] transition-colors"
        aria-label="Close menu"
      >
        CLOSE
      </button>

      {/* Wordmark */}
      <div className="mb-12">
        <span className="text-label text-[--color-accent] tracking-[0.3em]">
          {SITE_CONFIG.name.toUpperCase()}
        </span>
      </div>

      {/* Nav Links */}
      <div ref={linksRef} className="flex flex-col gap-4">
        {MOBILE_NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="font-display text-display-sm text-[--color-text] hover:text-[--color-accent] transition-colors duration-300 leading-none"
          >
            {link.label}
          </Link>
        ))}
      </div>


      {/* Bottom */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
        <div>
          <p className="text-label text-[--color-muted] mb-1">GET IN TOUCH</p>
          <p className="text-label-lg text-[--color-text]">hello@marinecreatures.com</p>
        </div>
        <span className="text-label text-[--color-muted]">WHERE THE OCEAN BECOMES ART.</span>
      </div>
    </div>
  );
}
