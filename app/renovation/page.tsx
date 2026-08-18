import type { Metadata } from 'next';
import Link from 'next/link';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';

export const metadata: Metadata = {
  title: 'Aquarium Renovation — Revive Your Aquarium',
  description:
    "Don't replace it — revive it. Marine Creatures provides complete aquarium renovation services to transform neglected aquariums into premium living environments.",
};

export default function RenovationPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '60vh', minHeight: '440px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1920&q=85"
          alt="Aquarium Renovation"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,7,11,0.1) 0%, rgba(2,7,11,0.95) 100%)' }} />
        <div className="container-max relative z-10 pb-14">
          <span className="text-label text-[--color-accent] block mb-4">SERVICE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Don&apos;t Replace It.<br /><em>Revive It.</em>
          </h1>
        </div>
      </div>

      <div className="container-max section">
        {/* Before/After */}
        <div className="mb-20" style={{ height: '500px' }}>
          <BeforeAfterSlider
            beforeSrc="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85"
            afterSrc="https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1200&q=85"
            beforeAlt="Aquarium before renovation"
            afterAlt="Aquarium after Marine Creatures renovation"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="font-display text-display-sm text-[--color-text] font-light mb-6">
              The Problem
            </h2>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-4" style={{ fontSize: '0.9375rem' }}>
              Many aquariums begin with great intentions and gradually decline — poor water quality, overgrown algae, ageing equipment, uninspiring aquascape and struggling livestock.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose" style={{ fontSize: '0.9375rem' }}>
              The solution is not replacement. The solution is transformation.
            </p>
          </div>

          <div>
            <h2 className="font-display text-display-sm text-[--color-text] font-light mb-6">
              Our Approach
            </h2>
            <div className="space-y-4">
              {['Comprehensive site assessment', 'Full system evaluation and diagnosis', 'Water chemistry restoration', 'Equipment repair or replacement', 'Complete aquascape redesign', 'New livestock introduction', 'Ongoing maintenance programme'].map((item, i) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="text-label text-[--color-accent] shrink-0 mt-1">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-body text-[--color-muted] text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
            REQUEST A SITE ASSESSMENT →
          </Link>
        </div>
      </div>
    </div>
  );
}
