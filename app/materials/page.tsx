import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Materials — Premium Reef & Aquascaping Materials',
  description:
    'Premium aquarium materials, reef structures, substrates and equipment curated by Marine Creatures for extraordinary aquarium environments.',
};

const CATEGORIES = [
  {
    name: 'Sustainably Sourced Live Rock',
    tag: 'BIOLOGICAL FOUNDATION',
    desc: 'Deep-cured biological live rock seeded with beneficial nitrifying microflora, coralline algae, and micro-crustaceans.',
    specs: ['Ultra-porous surface area', 'Pre-quarantined & pest-free', 'Natural calcium carbonate base'],
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
  },
  {
    name: 'Handcrafted Ceramic Reef Architecture',
    tag: 'CUSTOM SCULPTING',
    desc: 'Inert ceramic branch and plate formations kiln-fired to provide dramatic overhangs, swim-through caves, and coral frag perches.',
    specs: ['100% silicate and phosphate free', 'Custom height & spread design', 'Optimal waterflow dynamics'],
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80',

  },
  {
    name: 'Bahamian Aragonite Substrates',
    tag: 'NATURAL BUFFERING',
    desc: 'Pure oolitic aragonite sand grains providing continuous pH stabilization and calcium buffering while preventing detritus traps.',
    specs: ['0.5mm – 1.2mm grain selection', 'Natural oceanic luminosity', 'Benthic creature friendly'],
    image: 'https://images.unsplash.com/photo-1543721513-e83f95e6fdc4?w=800&q=80',
  },
  {
    name: 'Precision Life Support Equipment',
    tag: 'ENGINEERING & AUTOMATION',
    desc: 'Commercial-grade DC needle-wheel skimmers, full-spectrum LED / T5 hybrid illumination, and laboratory peristaltic dosing pumps.',
    specs: ['Near-zero audible dB footprint', 'Cloud telemetry & alerts', 'Medical grade componentry'],
    image: 'https://images.unsplash.com/photo-1612629808341-9de2462b1b8b?w=800&q=80',
  },
];

export default function MaterialsPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '65vh', minHeight: '480px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1920&q=85"
          alt="Marine Materials"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">REVEALED IN PURITY</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            The Raw Beauty<br /><em>of the Reef.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-lg leading-relaxed" style={{ fontSize: '0.9375rem' }}>
            Only the purest, laboratory-tested substrates, handcrafted reef ceramics, and surgical-grade life support hardware make it into a Marine Creatures environment.
          </p>
        </div>
      </div>

      {/* Materials Grid */}
      <div className="container-max section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="group border border-[rgba(255,255,255,0.06)] p-8 bg-[rgba(7,21,28,0.4)] hover:border-[rgba(0,184,217,0.3)] transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
                <span className="text-label text-[--color-accent] block mb-2">{cat.tag}</span>
                <h2 className="font-display text-2xl text-[--color-text] font-light mb-3 group-hover:text-[--color-accent] transition-colors">
                  {cat.name}
                </h2>
                <p className="font-body font-light text-[--color-muted] text-sm leading-relaxed mb-6">
                  {cat.desc}
                </p>
              </div>

              {/* Specs */}
              <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] space-y-2">
                {cat.specs.map((spec) => (
                  <div key={spec} className="flex items-center gap-2 text-xs text-[--color-muted]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[--color-accent] shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Material Inquiries */}
        <div className="mt-20 p-12 border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.3)] text-center">
          <span className="text-label text-[--color-accent] block mb-3">CUSTOM SOURCING</span>
          <h2 className="font-display text-display-sm text-[--color-text] font-light mb-4">
            Need Custom Sized Reef Structures or Rare Specimens?
          </h2>
          <p className="font-body font-light text-[--color-muted] max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            We curate bespoke rockscapes, custom ceramic formations, and specialized equipment packages for private aquarists and commercial developments worldwide.
          </p>
          <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
            ENQUIRE ABOUT MATERIALS →
          </Link>
        </div>
      </div>
    </div>
  );
}

