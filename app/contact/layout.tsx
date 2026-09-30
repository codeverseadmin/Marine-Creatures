import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bespoke Inquiry & Concierge — Private Consultations',
  description:
    'Schedule a bespoke architectural consultation with Marine Creatures. Discuss custom residential and commercial aquariums, site surveys, or marine specimens.',
  openGraph: {
    title: 'Bespoke Inquiry & Concierge — Marine Creatures',
    description:
      'Private consultations for custom luxury aquariums, technical installations, and biological curation.',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
