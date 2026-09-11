export interface BannerSlide {
  id: string;
  badge: string;
  badgeColor?: string;
  title: string;
  subtitle: string;
  desc?: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  isActive: boolean;
  priority: number;
}

export const DEFAULT_BANNERS: BannerSlide[] = [
  {
    id: 'banner-clownfish-arrival',
    badge: 'NEW CAPTIVE-BRED DROP',
    badgeColor: 'var(--color-accent)',
    title: 'Snowflake & Picasso Clownfish Pairs',
    subtitle: 'Acclimated, Quarantined & Ready for Dispatch',
    desc: 'Bonded pairs raised in closed-loop aquaculture. 100% reef safe with 100% Live Arrival Guaranteed across all Indian pin codes.',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=85',
    ctaText: 'SHOP LIVE SPECIMENS →',
    ctaLink: '/marketplace?category=marine-life',
    secondaryCtaText: 'CARE GUIDE',
    secondaryCtaLink: '/marketplace/designer-clownfish-pair',
    isActive: true,
    priority: 1,
  },
  {
    id: 'banner-nemolight-lighting',
    badge: 'FEATURED LIGHTING TECH',
    badgeColor: '#00D2F7',
    title: 'NemoLight Aqua Marine High-PAR Fixtures',
    subtitle: 'Full Spectrum Coral Growth & Smart App Control',
    desc: 'Ultra-slim unibody aircraft aluminium chassis with whisper-quiet convection cooling and sunrise-to-sunset circadian programming.',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
    ctaText: 'EXPLORE LIGHTING →',
    ctaLink: '/marketplace?category=lighting-tech',
    secondaryCtaText: 'VIEW SPECS',
    secondaryCtaLink: '/marketplace/nemolight-aqua-marine-led',
    isActive: true,
    priority: 2,
  },
  {
    id: 'banner-bespoke-installation',
    badge: 'BESPOKE ARCHITECTURE',
    badgeColor: '#C7A76C',
    title: 'Living Underwater Sanctuaries For Private Estates',
    subtitle: 'From Concept Rendering to Nitrogen Cycling',
    desc: 'Bespoke closed-loop filtration, museum-grade OptiWhite™ glass, and scheduled biological concierge care tailored to your floor plan.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1600&q=85',
    ctaText: 'BOOK ARCHITECTURAL SURVEY →',
    ctaLink: '/services#booking-portal',
    secondaryCtaText: 'EXPLORE SERVICES',
    secondaryCtaLink: '/services',
    isActive: true,
    priority: 3,
  },
  {
    id: 'banner-aquarium-renovation',
    badge: 'REVIVAL & RESTORATION',
    badgeColor: '#34D399',
    title: "Don't Replace It. Revive Your Existing Aquarium.",
    subtitle: 'Complete Algae Eradication, Polishing & Coral Restock',
    desc: 'Turn around tired or clouded setups into vibrant, low-maintenance living centerpieces within 48 hours.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=85',
    ctaText: 'REQUEST TANK ASSESSMENT →',
    ctaLink: '/renovation',
    isActive: true,
    priority: 4,
  },
];
