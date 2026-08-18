'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PROJECTS } from '@/lib/data/projects';

const CATEGORIES = ['All Projects', 'Residential', 'Commercial', 'Hospitality'];

export default function OurWorldsPage() {
  const [activeCat, setActiveCat] = useState('All Projects');

  const filteredProjects = PROJECTS.filter((p) => {
    if (activeCat === 'All Projects') return true;
    return p.category.toLowerCase() === activeCat.toLowerCase();
  });

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '65vh', minHeight: '480px' }}
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
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">PORTFOLIO & COMMISSION ARCHIVE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Our Worlds.
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-lg leading-relaxed" style={{ fontSize: '0.9375rem' }}>
            A curated archive of living underwater environments designed and engineered for private estates, flagship corporate spaces, and luxury resorts.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="container-max pt-12 pb-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`px-5 py-2.5 text-xs font-body tracking-wider uppercase transition-all duration-300 border ${
                activeCat === cat
                  ? 'border-[--color-accent] text-[--color-accent] bg-[rgba(0,184,217,0.08)]'
                  : 'border-[rgba(255,255,255,0.1)] text-[--color-muted] hover:border-[rgba(255,255,255,0.3)] hover:text-white'
              }`}
              style={{ cursor: 'none' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div className="container-max section">
        <div className="space-y-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              href={`/our-worlds/${project.id}`}
              className="group grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-8 border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.3)] hover:border-[rgba(0,184,217,0.4)] transition-all duration-300"
              data-cursor="VIEW PROJECT"
            >
              {/* Number */}
              <div className="md:col-span-1 flex items-center">
                <span className="text-label text-[--color-accent] font-body text-base">{project.number}</span>
              </div>

              {/* Image */}
              <div className="md:col-span-4 overflow-hidden relative" style={{ aspectRatio: '16/10' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  loading="lazy"
                />
                <span className="absolute bottom-3 left-3 text-[10px] px-2.5 py-1 bg-[rgba(2,7,11,0.8)] border border-[rgba(255,255,255,0.15)] text-[--color-accent] backdrop-blur-sm">
                  {project.category.toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="md:col-span-5 flex flex-col justify-center">
                <span className="text-label text-[--color-muted] block mb-2">{project.location}</span>
                <h2 className="font-display text-2xl md:text-3xl text-[--color-text] font-light group-hover:text-[--color-accent] transition-colors duration-300 mb-3">
                  {project.title}
                </h2>
                <p className="font-body font-light text-[--color-muted] text-sm leading-relaxed max-w-lg mb-4">
                  {project.description.slice(0, 140)}...
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.services.map((s) => (
                    <span key={s} className="text-[10px] text-[--color-muted] px-2 py-0.5 border border-[rgba(255,255,255,0.06)]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="md:col-span-2 flex items-center justify-end">
                <span className="btn-ghost text-xs group-hover:border-[--color-accent] group-hover:text-[--color-accent] transition-all duration-300">
                  VIEW CASE STUDY →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Custom Project CTA */}
        <div className="mt-20 p-12 border border-[rgba(0,184,217,0.2)] bg-[radial-gradient(ellipse_at_center,rgba(0,184,217,0.08)_0%,transparent_70%)] text-center">
          <span className="text-label text-[--color-accent] block mb-3">COMMISSIONS</span>
          <h2 className="font-display text-display-sm text-[--color-text] font-light mb-4">
            Commission a bespoke underwater world.
          </h2>
          <p className="font-body font-light text-[--color-muted] max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            From initial architectural feasibility to complete lifecycle care, we realize extraordinary private and commercial aquatic spaces.
          </p>
          <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
            START YOUR PROJECT →
          </Link>
        </div>
      </div>
    </div>
  );
}

