import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Marine Marketplace — Living Reef Specimens & Precision Equipment',
  description:
    'Discover quarantine-certified marine fish, NemoLight smart LED fixtures, aquacultured corals, living micro-fauna, and precision reef equipment curated for discerning aquarists.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/marketplace`,
  },
  openGraph: {
    title: 'Marine Marketplace — Living Reef Specimens & Precision Equipment',
    description:
      'Quarantine-certified marine specimens, Nemo LED lights, and professional life-support equipment with live arrival guarantee.',
    url: `${SITE_CONFIG.url}/marketplace`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'Marine Marketplace — Marine Creatures',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marine Marketplace — Living Reef Specimens & Precision Equipment',
    description:
      'Quarantine-certified marine specimens, Nemo LED lights, and precision life-support equipment.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
