import type { Metadata } from 'next';
import Link from 'next/link';
import { SPECIES } from '@/lib/data/species';

export const metadata: Metadata = {
  title: 'Marine Life — Exotic Marine Species',
  description:
    'Discover our curated collection of exotic marine fish, corals and invertebrates. Premium marine life for extraordinary aquarium environments.',
};

const DIFFICULTY_COLORS = {
  Beginner: 'var(--color-accent)',
  Intermediate: 'var(--color-gold)',
  Expert: '#E87070',
};

export default function MarineLifePage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '50vh', minHeight: '400px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1920&q=85"
          alt="Marine Life at Marine Creatures"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.9) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-12">
          <span className="text-label text-[--color-accent] block mb-4">MARINE CREATURES</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Marine Life
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-3 max-w-lg" style={{ fontSize: '0.9375rem' }}>
            Curated exotic marine species for extraordinary aquarium environments.
          </p>
        </div>
      </div>

      {/* Species Grid */}
      <div className="container-max section">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SPECIES.map((species) => (
            <Link
              key={species.id}
              href={`/marine-life/${species.id}`}
              className="group block"
              data-cursor="EXPLORE"
            >
              <div className="overflow-hidden mb-4" style={{ aspectRatio: '4/5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={species.image}
                  alt={species.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  loading="lazy"
                />
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-label text-[--color-muted] block mb-1 italic">
                    {species.scientificName}
                  </span>
                  <h2 className="font-display text-display-sm text-[--color-text] font-light group-hover:text-[--color-accent] transition-colors duration-300">
                    {species.name}
                  </h2>
                </div>
                <span
                  className="text-label mt-1 px-2 py-1 border"
                  style={{
                    color: DIFFICULTY_COLORS[species.difficulty],
                    borderColor: DIFFICULTY_COLORS[species.difficulty],
                    opacity: 0.8,
                  }}
                >
                  {species.difficulty}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                <div>
                  <span className="text-label text-[--color-muted] block">SIZE</span>
                  <span className="font-body text-[--color-text] text-xs mt-0.5 block">{species.size}</span>
                </div>
                <div>
                  <span className="text-label text-[--color-muted] block">AVAILABILITY</span>
                  <span className="font-body text-[--color-accent] text-xs mt-0.5 block">{species.availability}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
