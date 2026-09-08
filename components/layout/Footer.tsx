'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG, NAV_LINKS } from '@/lib/config';

export function Footer() {
  const pathname = usePathname();

  // Hide customer storefront footer on admin console
  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer
      className="relative overflow-hidden mt-20 border-t border-[rgba(255,255,255,0.1)] bg-[#010508]"
      aria-label="Site footer"
    >
      {/* Luminous accent line */}
      <div
        className="h-[2px] w-full"
        style={{ background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)' }}
      />

      <div className="container-max pt-16 sm:pt-20 pb-28 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8 mb-16">
          {/* Brand column with logo */}
          <div className="md:col-span-4">
            <Link href="/" className="flex items-center gap-3 mb-5 sm:mb-6 group" aria-label="Marine Creatures Home">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.12)] bg-white flex-shrink-0 group-hover:border-[--color-accent] transition-all shadow-md">
                <Image
                  src="/logo.jpg"
                  alt="Marine Creatures Logo"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-label-lg text-[--color-text] tracking-[0.2em] group-hover:text-[--color-accent] transition-colors duration-300 block font-body font-semibold">
                  MARINE CREATURES
                </span>
                <span className="text-[10px] text-[--color-muted] tracking-[0.08em] block mt-0.5">
                  {SITE_CONFIG.slogan}
                </span>
              </div>
            </Link>
            <p className="font-body font-light text-[--color-muted] text-xs sm:text-sm leading-relaxed mb-5 sm:mb-6 max-w-xs">
              A premium marine design house creating living underwater environments for extraordinary spaces across India.
            </p>
            {/* Social / Location links */}
            <div className="flex items-center gap-2.5">
              {/* Facebook */}
              <a
                href={SITE_CONFIG.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Marine Creatures on Facebook"
                className="w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-[#1877F2] hover:bg-[rgba(24,119,242,0.12)] text-[--color-muted] hover:text-[#1877F2] flex items-center justify-center transition-all active:scale-90"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              {/* Google Maps */}
              <a
                href={SITE_CONFIG.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Find Marine Creatures on Google Maps"
                className="w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-[#EA4335] hover:bg-[rgba(234,67,53,0.1)] text-[--color-muted] hover:text-[#EA4335] flex items-center justify-center transition-all active:scale-90"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </a>
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Marine Creatures! I would like to inquire about your marine life, aquariums, and services.')}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat on WhatsApp"
                className="w-9 h-9 rounded-xl border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-emerald-500 hover:bg-emerald-500/10 text-[--color-muted] hover:text-emerald-400 flex items-center justify-center transition-all active:scale-90"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links & Contact Columns — Side by Side on Mobile & Desktop */}
          <div className="grid grid-cols-2 gap-5 sm:gap-8 md:col-span-8 lg:col-span-7 lg:col-start-6">
            {/* Navigation (Explore) */}
            <div>
              <h3 className="text-label text-[--color-accent] mb-4 sm:mb-6">EXPLORE</h3>
              <ul className="space-y-2.5 sm:space-y-3">
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body font-light text-[--color-muted] text-xs sm:text-sm hover:text-[--color-text] transition-colors duration-300 block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact (Get In Touch) */}
            <div>
              <h3 className="text-label text-[--color-accent] mb-4 sm:mb-6">GET IN TOUCH</h3>
              <div className="space-y-3 text-xs sm:text-sm">
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="font-body font-light text-[--color-muted] hover:text-[--color-text] transition-colors flex items-start gap-1.5 sm:gap-2 group break-all text-[11px] sm:text-xs"
                >
                  <svg className="mt-0.5 flex-shrink-0 group-hover:text-[--color-accent] transition-colors" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <span>{SITE_CONFIG.email}</span>
                </a>
                <a
                  href={`tel:${SITE_CONFIG.phone}`}
                  className="font-body font-light text-[--color-muted] hover:text-[--color-text] transition-colors flex items-start gap-1.5 sm:gap-2 group text-[11px] sm:text-xs whitespace-nowrap"
                >
                  <svg className="mt-0.5 flex-shrink-0 group-hover:text-[--color-accent] transition-colors" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.7A2 2 0 012 1h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                  </svg>
                  <span>{SITE_CONFIG.phone}</span>
                </a>
                {/* Google Maps clickable address */}
                <a
                  href={SITE_CONFIG.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body font-light text-[--color-muted] hover:text-[--color-accent] transition-colors flex items-start gap-1.5 sm:gap-2 group text-[11px] sm:text-xs"
                >
                  <svg className="mt-0.5 flex-shrink-0 group-hover:text-[--color-accent] transition-colors" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  <span>{SITE_CONFIG.address} <span className="text-[--color-accent]">↗</span></span>
                </a>
                {/* Facebook quick link */}
                <a
                  href={SITE_CONFIG.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-body font-light text-[--color-muted] hover:text-[#1877F2] transition-colors flex items-start gap-1.5 sm:gap-2 group text-[11px] sm:text-xs"
                >
                  <svg className="mt-0.5 flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>
              </div>

              {/* WhatsApp CTA */}
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Marine Creatures! I would like to inquire about your marine life, aquarium installations and renovation services.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 mt-4 sm:mt-6 px-3.5 py-2 rounded-xl border border-[rgba(0,184,217,0.3)] bg-[rgba(0,184,217,0.06)] hover:bg-[rgba(0,184,217,0.15)] text-[10px] sm:text-xs text-[--color-accent] font-semibold tracking-wider active:scale-95 transition-all w-full sm:w-auto"
                data-cursor="CHAT"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>CHAT ON WHATSAPP</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 sm:pt-8 border-t border-[rgba(255,255,255,0.06)] gap-3 sm:gap-4 pb-safe">
          {/* Left — copyright + attribution */}
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-[--color-muted] flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>© {new Date().getFullYear()} Marine Creatures.</span>
              <span className="text-slate-700">•</span>
              <span className="text-[--color-accent] font-medium tracking-wider">
                {SITE_CONFIG.nurturedBy}
              </span>
            </p>
            <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-1.5">
              <span>Founded by</span>
              <a
                href={SITE_CONFIG.founderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[--color-accent] hover:text-white font-medium transition-colors underline underline-offset-2 decoration-[rgba(0,184,217,0.4)] hover:decoration-white"
              >
                {SITE_CONFIG.founder}
              </a>
            </p>
          </div>

          {/* Right — nav links */}
          <div className="flex items-center gap-5 sm:gap-6 text-xs">
            <Link href="/about" className="text-[--color-muted] hover:text-[--color-text] transition-colors">
              ABOUT
            </Link>
            <Link href="/contact" className="text-[--color-muted] hover:text-[--color-text] transition-colors">
              CONTACT
            </Link>
            <Link href="/marketplace" className="text-[--color-muted] hover:text-[--color-text] transition-colors">
              MARKETPLACE
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
