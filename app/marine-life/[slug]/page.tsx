import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SPECIES } from '@/lib/data/species';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return SPECIES.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const species = SPECIES.find((s) => s.id === slug);
  if (!species) return {};
  return {
    title: `${species.name} — Marine Life`,
    description: species.description,
  };
}

const DIFFICULTY_COLORS = {
  Beginner: 'var(--color-accent)',
  Intermediate: 'var(--color-gold)',
  Expert: '#E87070',
};

export default async function SpeciesDetailPage({ params }: Props) {
  const { slug } = await params;
  const species = SPECIES.find((s) => s.id === slug);
  if (!species) notFound();

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left — Large image */}
        <div className="relative lg:sticky lg:top-0 lg:h-screen overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={species.image}
            alt={species.name}
            className="w-full h-full object-cover"
            style={{ minHeight: '50vh' }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(2,7,11,0.7) 0%, transparent 60%)',
            }}
          />
          <div className="absolute bottom-8 left-8">
            <span
              className="text-label px-3 py-1.5 border"
              style={{
                color: DIFFICULTY_COLORS[species.difficulty],
                borderColor: DIFFICULTY_COLORS[species.difficulty],
              }}
            >
              {species.difficulty}
            </span>
          </div>
        </div>

        {/* Right — Content */}
        <div className="px-8 md:px-12 pt-36 md:pt-44 pb-28" style={{ background: 'var(--color-secondary)' }}>
          <Link
            href="/marine-life"
            className="text-label text-[--color-muted] hover:text-[--color-accent] transition-colors mb-8 flex items-center gap-2"
            data-cursor="EXPLORE"
          >
            ← MARINE LIFE
          </Link>



          <span className="text-label text-[--color-muted] italic block mb-2">
            {species.scientificName}
          </span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light mb-8">
            {species.name}
          </h1>

          {/* Availability */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 border border-[rgba(0,184,217,0.3)] bg-[rgba(0,184,217,0.05)]">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-accent)' }} />
            <span className="text-label text-[--color-accent]">{species.availability.toUpperCase()}</span>
          </div>

          {/* Description */}
          <p className="font-body font-light text-[--color-muted] leading-relaxed mb-10" style={{ fontSize: '0.9375rem' }}>
            {species.description}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 pb-8 mb-8 border-b border-[rgba(255,255,255,0.06)]">
            {[
              { label: 'Size', value: species.size },
              { label: 'Temperament', value: species.temperament },
              { label: 'Diet', value: species.diet },
              { label: 'Water Type', value: species.waterType },
            ].map((stat) => (
              <div key={stat.label}>
                <span className="text-label text-[--color-muted] block mb-1">{stat.label.toUpperCase()}</span>
                <span className="font-body text-[--color-text] text-sm">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <Link
            href="/contact"
            className="btn-primary inline-flex w-full justify-center"
            data-cursor="ENTER"
          >
            ENQUIRE ABOUT AVAILABILITY
            <span className="text-[--color-primary]">→</span>
          </Link>

          {/* Note */}
          <p className="text-label text-[--color-muted] text-center mt-4 opacity-60">
            All marine livestock is subject to availability, seasonal supply and applicable regulations.
          </p>
        </div>
      </div>
    </div>
  );
}
