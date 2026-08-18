// =============================================================================
// Marine Creatures — Business Configuration
// Replace placeholders with real data before launch
// =============================================================================

export const SITE_CONFIG = {
  name: 'Marine Creatures',
  tagline: 'Where The Ocean Becomes Art.',
  description:
    'Marine Creatures is a premium marine design house creating living underwater environments. Exotic marine life, bespoke aquariums and complete ecosystem design for extraordinary spaces.',
  url: 'https://marinecreatures.com',
  whatsapp: '+1234567890', // REPLACE with real number
  email: 'hello@marinecreatures.com', // REPLACE with real email
  phone: '+1 (000) 000-0000', // REPLACE with real phone
  address: 'Your City, Country', // REPLACE with real address
  instagram: 'https://instagram.com/marinecreatures',
  facebook: 'https://facebook.com/marinecreatures',
};

export const STATS = [
  { value: 'XX+', label: 'Aquariums Created' },
  { value: 'XX+', label: 'Marine Species' },
  { value: 'XX', label: 'Projects Completed' },
  { value: 'XX', label: 'Years of Expertise' },
];

export const NAV_LINKS = [
  { label: 'Marine Life', href: '/marine-life' },
  { label: 'Materials', href: '/materials' },
  { label: 'Aquarium Design', href: '/aquarium-design' },
  { label: 'Installation', href: '/installation' },
  { label: 'Renovation', href: '/renovation' },
  { label: 'Our Worlds', href: '/our-worlds' },
];

export const MOBILE_NAV_LINKS = [
  ...NAV_LINKS,
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
