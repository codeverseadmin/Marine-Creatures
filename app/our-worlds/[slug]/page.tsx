import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PROJECTS } from '@/lib/data/projects';
import { BeforeAfterSlider } from '@/components/ui/BeforeAfterSlider';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.id === slug);
  if (!project) return {};
  return {
    title: `${project.title} — Our Worlds`,
    description: project.description,
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = PROJECTS.find((p) => p.id === slug);
  if (!project) notFound();

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Full-screen hero image */}
      <div className="relative h-screen overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 container-max pb-16">
          <span className="text-label text-[--color-accent] block mb-2">PROJECT {project.number}</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">{project.title}</h1>
          <p className="font-body font-light text-[--color-muted] mt-2">{project.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container-max pt-16 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Main content */}
          <div className="lg:col-span-7">
            <Link
              href="/our-worlds"
              className="text-label text-[--color-muted] hover:text-[--color-accent] transition-colors mb-10 flex items-center gap-2"
              data-cursor="EXPLORE"
            >
              ← OUR WORLDS
            </Link>


            <p className="font-body font-light text-[--color-muted] leading-loose" style={{ fontSize: '1.0625rem' }}>
              {project.description}
            </p>

            {/* Before/After (if available) */}
            {project.beforeImage && project.afterImage && (
              <div className="mt-12">
                <h2 className="font-display text-display-sm text-[--color-text] font-light mb-6">
                  The Transformation
                </h2>
                <div style={{ height: '400px' }} className="relative">
                  <BeforeAfterSlider
                    beforeSrc={project.beforeImage}
                    afterSrc={project.afterImage}
                    beforeAlt={`${project.title} — before`}
                    afterAlt={`${project.title} — after`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 lg:col-start-9">
            <div className="sticky top-24">
              {/* Project details */}
              <div className="p-6 border border-[rgba(255,255,255,0.08)] mb-6">
                <h3 className="text-label text-[--color-accent] mb-6">PROJECT DETAILS</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-label text-[--color-muted] block mb-1">CATEGORY</span>
                    <span className="font-body text-[--color-text] text-sm">{project.category}</span>
                  </div>
                  <div>
                    <span className="text-label text-[--color-muted] block mb-1">LOCATION</span>
                    <span className="font-body text-[--color-text] text-sm">{project.location}</span>
                  </div>
                  {project.tankSize && (
                    <div>
                      <span className="text-label text-[--color-muted] block mb-1">TANK SIZE</span>
                      <span className="font-body text-[--color-text] text-sm">{project.tankSize}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-label text-[--color-muted] block mb-2">SERVICES</span>
                    <div className="flex flex-wrap gap-2">
                      {project.services.map((s) => (
                        <span
                          key={s}
                          className="text-label text-[--color-muted] px-2 py-1 border border-[rgba(255,255,255,0.08)]"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href="/contact"
                className="btn-primary w-full flex justify-center"
                data-cursor="ENTER"
              >
                START A SIMILAR PROJECT →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
