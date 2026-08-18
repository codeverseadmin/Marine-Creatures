import type { Metadata } from 'next';
import Link from 'next/link';
import { FEATURED_PROJECTS, PROJECTS } from '@/lib/data/projects';

export const metadata: Metadata = {
  title: 'Our Worlds — Aquarium Portfolio',
  description:
    'Explore our portfolio of bespoke aquarium installations — residential, commercial and hospitality environments created by Marine Creatures.',
};

export default function OurWorldsPage() {
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
          alt="Marine Creatures Portfolio"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.1) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-14">
          <span className="text-label text-[--color-accent] block mb-4">PORTFOLIO</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Our Worlds.
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-3 max-w-lg" style={{ fontSize: '0.9375rem' }}>
            Bespoke aquarium environments created for extraordinary spaces.
          </p>
        </div>
      </div>

      {/* Projects */}
      <div className="container-max section">
        <div className="space-y-4">
          {PROJECTS.map((project, i) => (
            <Link
              key={project.id}
              href={`/our-worlds/${project.id}`}
              className="group grid grid-cols-1 md:grid-cols-12 gap-6 py-8 border-b border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,184,217,0.3)] transition-colors duration-300"
              data-cursor="VIEW PROJECT"
            >
              {/* Number */}
              <div className="md:col-span-1 flex items-center">
                <span className="text-label text-[--color-accent]">{project.number}</span>
              </div>

              {/* Image */}
              <div className="md:col-span-3 overflow-hidden" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  loading="lazy"
                />
              </div>

              {/* Info */}
              <div className="md:col-span-6 flex flex-col justify-center">
                <span className="text-label text-[--color-muted] block mb-2">{project.subtitle}</span>
                <h2 className="font-display text-display-sm text-[--color-text] font-light group-hover:text-[--color-accent] transition-colors duration-300">
                  {project.title}
                </h2>
                <p className="font-body font-light text-[--color-muted] text-sm mt-3 leading-relaxed max-w-md">
                  {project.description.slice(0, 120)}...
                </p>
              </div>

              {/* Arrow */}
              <div className="md:col-span-2 flex items-center justify-end">
                <span className="text-label text-[--color-muted] group-hover:text-[--color-accent] transition-all duration-300 group-hover:translate-x-2">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
