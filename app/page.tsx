import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { MarketplaceShowcase } from '@/components/home/MarketplaceShowcase';
import { ServicesBookingSection } from '@/components/home/ServicesBookingSection';
import { DescentSection } from '@/components/home/DescentSection';
import { DesignSection } from '@/components/home/DesignSection';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { FinalCTA } from '@/components/home/FinalCTA';

export const metadata: Metadata = {
  title: 'Marine Creatures — Luxury Marine Marketplace & Bespoke Services',
  description:
    'Official marketplace for captive-bred marine life, NemoLight LED fixtures, Real Reef rock, Red Sea salt, and bespoke aquarium installation & renovation services.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      {/* 01. Hero with instant search & quick action pills */}
      <Hero />

      {/* 02. Marketplace Category Hubs & Trending Products */}
      <MarketplaceShowcase />

      {/* 03. Installation & Renovation Services with Before/After Showcase */}
      <ServicesBookingSection />

      {/* 04. Engineering Ethos & Water Parameters */}
      <DescentSection />

      {/* 05. Bespoke Architectural Aquarium Configurations */}
      <DesignSection />

      {/* 06. Client Reviews & Trust Metrics */}
      <TestimonialsSection />

      {/* 07. Final Booking & Concierge CTA */}
      <FinalCTA />
    </>
  );
}
