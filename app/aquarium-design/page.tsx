import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Aquarium Design — Bespoke Marine Environments',
  description:
    'Bespoke aquarium design for residential and commercial spaces. Marine Creatures creates living underwater environments tailored to your architecture and vision.',
};

export default function AquariumDesignPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '60vh', minHeight: '440px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1920&q=85"
          alt="Bespoke Aquarium Design"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,7,11,0.1) 0%, rgba(2,7,11,0.95) 100%)' }} />
        <div className="container-max relative z-10 pb-14">
          <span className="text-label text-[--color-accent] block mb-4">SERVICE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">Aquarium<br />Design</h1>
        </div>
      </div>

      <div className="container-max section">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <p className="font-display text-display-sm text-[--color-text] font-light italic leading-relaxed mb-8">
              Your Space. Our Ocean.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-6" style={{ fontSize: '0.9375rem' }}>
              Every Marine Creatures aquarium begins with your architecture. We study your space, understand your lifestyle and create a design concept that integrates seamlessly — visually, structurally and functionally.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-10" style={{ fontSize: '0.9375rem' }}>
              From intimate display tanks to room-defining installations, every project is conceived, designed and built around your unique vision.
            </p>
            <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
              START A PROJECT →
            </Link>
          </div>
          <div className="space-y-6">
            {['Residential Aquariums', 'Commercial Installations', 'Hospitality Projects', 'Custom Architecture Integration', 'Aquascape Design', 'Ecosystem Curation'].map((item, i) => (
              <div key={item} className="flex items-center gap-4 py-4 border-b border-[rgba(255,255,255,0.06)]">
                <span className="text-label text-[--color-accent]">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-body text-[--color-text] font-light">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
