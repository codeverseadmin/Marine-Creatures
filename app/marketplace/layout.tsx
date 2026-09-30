import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marine Marketplace — Living Reef Specimens & Precision Equipment',
  description:
    'Discover quarantine-certified marine fish, aquacultured SPS/LPS corals, living micro-fauna, and precision reef equipment curated for discerning aquarists.',
  openGraph: {
    title: 'Marine Marketplace — Living Reef Specimens & Precision Equipment',
    description:
      'Quarantine-certified marine specimens and professional life-support equipment with live arrival guarantee.',
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
