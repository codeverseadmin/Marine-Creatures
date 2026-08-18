import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — Beyond The Glass',
  description:
    'Marine Creatures is a premium marine design house creating extraordinary living underwater environments. Our story, philosophy and expertise.',
};

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '70vh', minHeight: '500px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1542496658-e33a6d0d4f17?w=1920&q=85"
          alt="Marine Creatures — About"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.1) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">OUR STORY</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Beyond<br /><em>The Glass.</em>
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container-max section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5">
            <p className="font-display text-display-sm text-[--color-text] font-light italic leading-relaxed mb-8">
              &ldquo;We Don&apos;t Just Build Aquariums. We Create Living Worlds.&rdquo;
            </p>
            <div className="accent-line mb-8" />
            <p className="font-body font-light text-[--color-muted] leading-loose mb-6" style={{ fontSize: '0.9375rem' }}>
              Marine Creatures is a premium marine design house dedicated to creating extraordinary living underwater environments. We believe that a great aquarium is more than a tank of water — it is a piece of living architecture that transforms the character of a space.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose" style={{ fontSize: '0.9375rem' }}>
              Our approach combines marine biology expertise, interior design sensibility and precision craftsmanship to create aquarium environments that are as beautiful as they are thriving.
            </p>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1570126618953-d437176e8c79?w=900&q=85"
              alt="Marine expertise"
              className="w-full object-cover mb-6"
              style={{ aspectRatio: '4/3' }}
              loading="lazy"
            />

            {/* Values */}
            <div className="grid grid-cols-2 gap-6">
              {[
                { title: 'Expertise', desc: 'Deep knowledge of marine biology, water chemistry and ecosystem design.' },
                { title: 'Craftsmanship', desc: 'Every aquarium built to the highest standards of construction and longevity.' },
                { title: 'Design', desc: 'Aesthetics driven by architecture, interior design and marine beauty.' },
                { title: 'Service', desc: 'A relationship that continues long after installation day.' },
              ].map((v) => (
                <div key={v.title} className="p-5 border border-[rgba(255,255,255,0.06)]">
                  <h3 className="font-display text-[--color-accent] font-light mb-2">{v.title}</h3>
                  <p className="font-body font-light text-[--color-muted] text-xs leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 pt-16 border-t border-[rgba(255,255,255,0.06)] text-center">
          <h2 className="font-display text-display-md text-[--color-text] font-light mb-6">
            Ready to Begin?
          </h2>
          <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
            START A PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}
