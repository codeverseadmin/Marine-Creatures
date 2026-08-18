import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — Beyond The Glass',
  description:
    'Marine Creatures is a premium marine design house creating extraordinary living underwater environments. Our story, philosophy and expertise.',
};

const VALUES = [
  { title: 'Marine Biology Expertise', desc: 'In-house marine biologists ensuring ideal water chemistry, symbiotic coral pairings, and healthy livestock longevity.' },
  { title: 'Master Craftsmanship', desc: 'Precision cabinetry, concealed Schedule 80 plumbing, and monolithic viewing panels engineered for decades of reliability.' },
  { title: 'Architectural Harmony', desc: 'Aesthetic designs developed in synergy with luxury interior palettes, custom lighting moods, and spatial acoustics.' },
  { title: 'Lifecycle Concierge', desc: 'Dedicated 24/7 water monitoring, routine automated salt-water exchange, and white-glove ongoing care.' },
];

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '70vh', minHeight: '520px' }}
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
          <span className="text-label text-[--color-accent] block mb-4">OUR STORY & HERITAGE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Beyond<br /><em>The Glass.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-lg leading-relaxed" style={{ fontSize: '0.9375rem' }}>
            We believe an aquarium is never just a vessel of water — it is a living, breathing architectural sanctuary that elevates the human spirit.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-max section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-24">
          <div className="lg:col-span-5">
            <p className="font-display text-display-sm text-[--color-text] font-light italic leading-relaxed mb-8">
              &ldquo;We Don&apos;t Just Build Aquariums. We Create Living Worlds.&rdquo;
            </p>
            <div className="accent-line mb-8" />
            <p className="font-body font-light text-[--color-muted] leading-loose mb-6" style={{ fontSize: '0.9375rem' }}>
              Founded on the belief that marine beauty should be experienced in its purest, most authentic form, Marine Creatures unites marine biology, fluid dynamics, and luxury architectural design.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-8" style={{ fontSize: '0.9375rem' }}>
              Every installation we deliver is completely custom-engineered — ensuring healthy ecosystems that flourish effortlessly while offering a transcendent visual focal point.
            </p>
            <div className="grid grid-cols-2 gap-4 border-t border-[rgba(255,255,255,0.06)] pt-6">
              <div>
                <span className="font-display text-3xl text-[--color-accent] block">15+</span>
                <span className="text-label text-[--color-muted]">YEARS IN OCEAN DESIGN</span>
              </div>
              <div>
                <span className="font-display text-3xl text-[--color-accent] block">200+</span>
                <span className="text-label text-[--color-muted]">WORLDS DELIVERED</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1570126618953-d437176e8c79?w=900&q=85"
              alt="Marine expertise"
              className="w-full object-cover mb-8 border border-[rgba(255,255,255,0.06)]"
              style={{ aspectRatio: '16/10' }}
              loading="lazy"
            />

            {/* Values */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {VALUES.map((v) => (
                <div key={v.title} className="p-6 border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)]">
                  <h3 className="font-display text-lg text-[--color-accent] font-light mb-2">{v.title}</h3>
                  <p className="font-body font-light text-[--color-muted] text-xs leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 pt-16 border-t border-[rgba(255,255,255,0.06)] text-center">
          <h2 className="font-display text-display-md text-[--color-text] font-light mb-6">
            Ready to Begin Your Commission?
          </h2>
          <p className="font-body font-light text-[--color-muted] max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Contact our senior consultants to schedule an exploratory session and architectural review.
          </p>
          <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
            START A PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}

