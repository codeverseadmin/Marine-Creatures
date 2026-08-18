// =============================================================================
// Marine Creatures — Portfolio Projects Data
// =============================================================================

export interface Project {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  category: 'Residential' | 'Commercial' | 'Hospitality' | 'Custom';
  location: string;
  image: string;
  beforeImage?: string;
  afterImage?: string;
  gallery?: string[];
  description: string;
  services: string[];
  tankSize?: string;
  featured?: boolean;
}

export const PROJECTS: Project[] = [
  {
    id: 'the-blue-living-room',
    number: '001',
    title: 'The Blue Living Room',
    subtitle: 'Residential / Reef',
    category: 'Residential',
    location: 'Private Residence',
    image: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1600&q=85',
    beforeImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85',
    afterImage: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1200&q=85',
    description:
      'A bespoke reef ecosystem designed around a contemporary residential interior. The 2.4-metre centrepiece aquarium integrates seamlessly into the living room architecture, creating a living wall that transforms the character of the entire space.',
    services: ['Custom Design', 'Aquascaping', 'Installation', 'Maintenance'],
    tankSize: '2,400 × 600 × 700mm',
    featured: true,
  },
  {
    id: 'the-ocean-lobby',
    number: '002',
    title: 'The Ocean Lobby',
    subtitle: 'Commercial / Display',
    category: 'Commercial',
    location: 'Corporate Headquarters',
    image: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=1600&q=85',
    description:
      'A statement installation for a premium corporate headquarters. A floor-to-ceiling column aquarium serves as the centrepiece of the reception area, creating an unforgettable first impression for clients and visitors.',
    services: ['Concept Design', 'Custom Structure', 'Aquascaping', 'Installation', 'Maintenance Program'],
    tankSize: 'Custom Column — 1,200 × 1,200 × 2,100mm',
    featured: true,
  },
  {
    id: 'reef-suite',
    number: '003',
    title: 'The Reef Suite',
    subtitle: 'Hospitality / Wellness',
    category: 'Hospitality',
    location: 'Boutique Hotel',
    image: 'https://images.unsplash.com/photo-1571752726703-5e7d1f6a986d?w=1600&q=85',
    description:
      'An immersive reef installation created for the signature wellness suite of a boutique hotel. The aquarium runs along the full length of one wall, designed to create a calming, meditative environment for guests.',
    services: ['Interior Collaboration', 'Custom Design', 'Reef Aquascaping', 'Installation'],
    tankSize: '3,600 × 500 × 600mm',
    featured: true,
  },
  {
    id: 'the-architect-study',
    number: '004',
    title: 'The Architect\'s Study',
    subtitle: 'Residential / Minimal',
    category: 'Residential',
    location: 'Private Residence',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',

    description:
      'A precision-designed minimal aquascape for a private architectural practice. The aquarium reflects the owner\'s design sensibility — clean lines, considered composition, and deliberate restraint.',
    services: ['Design Consultation', 'Minimalist Aquascaping', 'Installation', 'Maintenance'],
    tankSize: '1,800 × 500 × 500mm',
    featured: false,
  },
];

export const FEATURED_PROJECTS = PROJECTS.filter((p) => p.featured);
