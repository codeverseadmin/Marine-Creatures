import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installation — Professional Aquarium Installation',
  description: 'Expert aquarium installation by Marine Creatures. Precision engineering for residential, commercial and hospitality environments.',
};

export default function InstallationPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <div className="relative flex items-end overflow-hidden" style={{ height: '55vh', minHeight: '400px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1612629808341-9de2462b1b8b?w=1920&q=85" alt="Aquarium Installation" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,7,11,0.1) 0%, rgba(2,7,11,0.95) 100%)' }} />
        <div className="container-max relative z-10 pb-14">
          <span className="text-label text-[--color-accent] block mb-4">SERVICE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">Installation</h1>
        </div>
      </div>
      <div className="container-max section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-8" style={{ fontSize: '0.9375rem' }}>
              Professional aquarium installation demands precision engineering, deep technical knowledge and respect for your space. Marine Creatures handles every aspect of the installation process — from structural preparation to livestock introduction.
            </p>
            <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">REQUEST CONSULTATION →</Link>
          </div>
          <div className="space-y-4">
            {['Site preparation and structural assessment', 'Plumbing and filtration installation', 'Electrical and lighting systems', 'Aquascape construction', 'System commissioning and cycling', 'Livestock introduction', 'Client handover and training'].map((item, i) => (
              <div key={item} className="flex items-start gap-3 py-3 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-label text-[--color-accent] shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-body text-[--color-text] text-sm font-light">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
