'use client';

import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { FEATURED_PROJECTS } from '@/lib/data/projects';

export function PortfolioSection() {
  return (
    <section
      className="section relative overflow-hidden"
      style={{ background: 'var(--color-secondary)' }}
      aria-labelledby="portfolio-heading"
    >
      <div className="container-max">
        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <SectionHeading
            id="portfolio-heading"
            label="Portfolio"
            heading={['Our', 'Worlds.']}
          />
          <ScrollReveal>
            <Link
              href="/our-worlds"
              className="btn-ghost inline-flex shrink-0"
              data-cursor="VIEW"
            >
              VIEW ALL PROJECTS
              <span className="text-[--color-accent]">→</span>
            </Link>
          </ScrollReveal>
        </div>

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {FEATURED_PROJECTS.map((project, i) => {
            // Asymmetric layout spans
            const spans = [
              'md:col-span-7 md:row-span-2',
              'md:col-span-5',
              'md:col-span-5',
              'md:col-span-12',
            ];
            const heights = ['md:h-[520px]', 'md:h-[250px]', 'md:h-[250px]', 'md:h-[360px]'];

            return (
              <ScrollReveal
                key={project.id}
                delay={i * 0.1}
                className={`group relative overflow-hidden ${spans[i] || 'md:col-span-6'}`}
              >
                <Link
                  href={`/our-worlds/${project.id}`}
                  className={`block relative overflow-hidden h-64 ${heights[i] || ''}`}
                  data-cursor="VIEW PROJECT"
                  aria-label={`View project: ${project.title}`}
                >
                  {/* Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                  />

                  {/* Overlay */}
                  <div
                    className="absolute inset-0 transition-opacity duration-500"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(2,7,11,0.9) 0%, rgba(2,7,11,0.2) 60%, transparent 100%)',
                    }}
                  />

                  {/* Category badge */}
                  <div className="absolute top-4 left-4">
                    <span className="text-label text-[--color-muted] bg-[rgba(2,7,11,0.6)] px-3 py-1.5 backdrop-blur-sm">
                      {project.category.toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="text-label text-[--color-accent] block mb-2">
                      PROJECT {project.number}
                    </span>
                    <h3 className="font-display text-display-sm text-[--color-text] font-light leading-tight">
                      {project.title}
                    </h3>
                    <p className="font-body text-[--color-muted] text-xs mt-1">
                      {project.subtitle}
                    </p>
                    <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                      <span className="text-label text-[--color-accent]">VIEW PROJECT</span>
                      <span className="text-[--color-accent]">→</span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
