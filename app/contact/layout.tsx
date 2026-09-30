import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Bespoke Inquiry & Concierge — Private Consultations | Marine Creatures',
  description:
    'Schedule a bespoke architectural consultation with Marine Creatures. Discuss custom residential and commercial aquariums, site surveys, or marine specimens in Kolkata and across India.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/contact`,
  },
  openGraph: {
    title: 'Bespoke Inquiry & Concierge — Marine Creatures',
    description:
      'Private consultations for custom luxury aquariums, technical installations, and biological curation.',
    url: `${SITE_CONFIG.url}/contact`,
    siteName: SITE_CONFIG.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: `${SITE_CONFIG.url}/og-image.jpg`,
        width: 1024,
        height: 1024,
        alt: 'Contact Marine Creatures Concierge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bespoke Inquiry & Concierge | Marine Creatures',
    description:
      'Schedule a bespoke consultation for custom marine aquariums and rare specimens.',
    images: [`${SITE_CONFIG.url}/og-image.jpg`],
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
