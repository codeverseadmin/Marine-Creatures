import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { DescentSection } from '@/components/home/DescentSection';
import { MarineLifeSection } from '@/components/home/MarineLifeSection';
import { DesignSection } from '@/components/home/DesignSection';
import { RenovationSection } from '@/components/home/RenovationSection';
import { ProcessSection } from '@/components/home/ProcessSection';
import { PortfolioSection } from '@/components/home/PortfolioSection';
import { MaintenanceSection } from '@/components/home/MaintenanceSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FinalCTA } from '@/components/home/FinalCTA';

export const metadata: Metadata = {
  title: 'Marine Creatures — Where The Ocean Becomes Art',
  description:
    'Premium marine aquarium design. Exotic marine life, bespoke aquariums and living underwater environments crafted for extraordinary spaces.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      {/* Moment 01 — Cinematic underwater hero */}
      <Hero />

      {/* Moment 02 — The descent into the ocean */}
      <DescentSection />

      {/* Moment 03 — Interactive marine species discovery */}
      <MarineLifeSection />

      {/* Aquarium design section */}
      <DesignSection />

      {/* Moment 04 — Before/after renovation transformation */}
      <RenovationSection />

      {/* Horizontal process section */}
      <ProcessSection />

      {/* Portfolio — Our Worlds */}
      <PortfolioSection />

      {/* Maintenance services */}
      <MaintenanceSection />

      {/* Stats + Testimonials */}
      <TestimonialsSection />

      {/* Moment 05 — Final CTA reveal */}
      <FinalCTA />
    </>
  );
}
