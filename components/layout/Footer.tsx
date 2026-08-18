import Link from 'next/link';
import { SITE_CONFIG, NAV_LINKS } from '@/lib/config';

export function Footer() {
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

      <div className="container-max pt-20 pb-12">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">
          {/* Brand column */}
          <div className="md:col-span-4">
            <Link href="/" className="text-label-lg text-[--color-text] tracking-[0.25em] hover:text-[--color-accent] transition-colors duration-300 block mb-6">
              MARINE CREATURES
            </Link>
            <p className="font-body font-light text-[--color-muted] text-sm leading-relaxed mb-6 max-w-xs">
              A premium marine design house creating living underwater environments for extraordinary spaces.
            </p>
            <span className="font-display italic text-[--color-muted] text-sm opacity-70">
              Where the Ocean Becomes Art.
            </span>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3 md:col-start-6">
            <h3 className="text-label text-[--color-accent] mb-6">SERVICES</h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-body font-light text-[--color-muted] text-sm hover:text-[--color-text] transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h3 className="text-label text-[--color-accent] mb-6">GET IN TOUCH</h3>
            <div className="space-y-3">
              <a
                href={`mailto:${SITE_CONFIG.email}`}
                className="font-body font-light text-[--color-muted] text-sm hover:text-[--color-text] transition-colors block"
              >
                {SITE_CONFIG.email}
              </a>
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="font-body font-light text-[--color-muted] text-sm hover:text-[--color-text] transition-colors block"
              >
                {SITE_CONFIG.phone}
              </a>
              <p className="font-body font-light text-[--color-muted] text-sm">
                {SITE_CONFIG.address}
              </p>
            </div>

            {/* WhatsApp CTA */}
            <a
              href="https://wa.me/919330436603?text=Hi%20Marine%20Creatures,%20I%20would%20like%20to%20inquire%20about%20your%20marine%20life,%20aquarium%20installations%20and%20renovation%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 text-label text-[--color-accent] hover:text-[--color-cyan] transition-colors duration-300"
              data-cursor="CHAT"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              CHAT ON WHATSAPP
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-8 border-t border-[rgba(255,255,255,0.06)] gap-4">
          <p className="text-label text-[--color-muted] flex items-center gap-2">
            <span>© {new Date().getFullYear()} Marine Creatures. All rights reserved.</span>
            <span>•</span>
            <span className="text-[--color-accent] font-medium tracking-wider">Nurtured in CODEVERSE</span>
          </p>
          <div className="flex items-center gap-6">
            <Link href="/about" className="text-label text-[--color-muted] hover:text-[--color-text] transition-colors">
              ABOUT
            </Link>
            <Link href="/contact" className="text-label text-[--color-muted] hover:text-[--color-text] transition-colors">
              CONTACT
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
