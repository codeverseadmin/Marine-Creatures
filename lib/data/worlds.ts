import { connectToDatabase } from '@/lib/mongodb';
import CaseStudyModel from '@/models/CaseStudy';
import ClientProjectModel from '@/models/ClientProject';

export interface DefaultCaseStudySeed {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  projectId: string;
  space: string;
  clientContext: string;
  scale: string;
  aquariumVolume: string;
  aquariumType: string;
  biome: string;
  image: string;
  gallery: Array<{ url: string; caption?: string; alt?: string }>;
  beforeAfter?: {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
    caption?: string;
  };
  imageStatus: 'VERIFIED' | 'NEEDS_REVIEW' | 'FALLBACK';
  designIntent: string;
  materials: string[];
  engineering: string[];
  marineWorld: {
    biome: string;
    livestock: string;
    corals: string;
  };
  introduction: string;
  challenge: string;
  concept: string;
  architecture: string;
  execution: string;
  transformation: string;
  conclusion: string;
  result: string;
  status: 'published';
  published: boolean;
  publishedAt: Date;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
}

export const INITIAL_CLIENT_PROJECTS = [
  {
    id: 'CP-2025-001',
    projectName: 'The Alipore Penthouse Monolith',
    status: 'completed',
    installationStatus: 'completed',
    aquariumVolume: '7800L',
    aquariumType: 'Dual-Sided Monolithic Cast Acrylic',
    biome: 'Indo-Pacific Shallow Coral Atoll',
    designStyle: 'Architectural Partition',
    materials: [
      '90mm Monolithic Thermoformed Cast Acrylic viewing panels',
      'Italian Calacatta marble cladding with zero-vibration expansion joints',
      'Marine-grade 316 structural stainless steel space frame with anti-corrosive powder finish',
      'Acoustic-grade decoupling isolation mats beneath foundational plinth',
    ],
    equipment: [
      'Concealed sub-level life-support plant room operating below 24dB acoustic threshold',
      'Dual titanium heat-exchange chillers with remote outdoor heat dissipation',
      'Automated 120-liter daily reverse osmosis water-change robotics',
      'Cloud IoT telemetry with continuous spectrophotometric water chemistry logging',
    ],
    marineLifeNotes: 'Schooling Threadfin Anthias, Blue-Throat Triggerfish, Captive-Bred Ocellaris pairs. Cultured Australian Acropora and Euphyllia fields.',
    installationDetails: 'Crane hoisted 90mm monolithic acrylic through 14th floor penthouse terrace. Commissioned with Studio Morphogenesis.',
    city: 'Kolkata',
    siteType: 'residential',
    // Sensitive private client details kept isolated in private collection
    privateAddress: 'Alipore Park Road, Kolkata 700027',
    clientName: 'Confidential Private Collector',
    clientPhone: '+91 98300 00000',
    clientEmail: 'vip.alipore@client-private.marinecreatures.internal',
    projectStartDate: new Date('2024-03-15'),
    projectCompletionDate: new Date('2025-01-20'),
    internalNotes: 'VIP Concierge tier 1 care contract active. Weekly Wednesday automated parameter auditing and live coral feeding.',
    estimatedBudget: 8500000,
    caseStudyId: 'alipore-penthouse-monolith',
    internalGallery: [
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
    ],
    isArchived: false,
  },
  {
    id: 'CP-2024-002',
    projectName: 'The Sector V Corporate Sanctuary',
    status: 'completed',
    installationStatus: 'completed',
    aquariumVolume: '4200L',
    aquariumType: 'Panoramic 360° Cylindrical Coral Column',
    biome: 'Pelagic Reef & Open Surge Zone',
    designStyle: 'Central Rotunda Column',
    materials: [
      'Seamless Cylindrical High-Molecular Polymer (80mm thickness)',
      'Acoustic damping rubber mounts dampening all floor-borne resonance',
      'Brushed titanium trim and concealed maintenance access hatch',
      'Custom Bahamian aragonite sand bed with anaerobic nitrate reduction zones',
    ],
    equipment: [
      'Central vortex overflow weir eliminating surface organic films silently',
      'Variable sine-wave DC pumps mimicking natural pelagic oceanic swell',
      'Architectural LED matrix synchronized to outdoor solar angles and lunar cycles',
      'Integrated ozone injection and UV sterilizer for laboratory water purity',
    ],
    marineLifeNotes: 'Schooling Blue Chromis, Yellow Tangs, Flame Angels, Cleaner Shrimp colonies. Hardy SPS corals and large polyp stony corals.',
    installationDetails: 'Installed within circular executive boardroom rotunda over weekend shutdown window to avoid corporate disruption.',
    city: 'Kolkata',
    siteType: 'commercial',
    privateAddress: 'Sector V, Salt Lake City, Kolkata 700091',
    clientName: 'Apex Energy Holdings HQ Facilities',
    clientPhone: '+91 98301 11111',
    clientEmail: 'facilities@apexenergy-private.marinecreatures.internal',
    projectStartDate: new Date('2024-01-10'),
    projectCompletionDate: new Date('2024-08-14'),
    internalNotes: 'Enterprise maintenance agreement. Bi-weekly night shifts for servicing life support plant room.',
    estimatedBudget: 4800000,
    caseStudyId: 'sector-v-corporate-sanctuary',
    internalGallery: [
      'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?w=1600&q=85',
    ],
    isArchived: false,
  },
  {
    id: 'CP-2024-003',
    projectName: 'The Ballygunge Heritage Villa Reef',
    status: 'completed',
    installationStatus: 'completed',
    aquariumVolume: '3200L',
    aquariumType: 'Integrated Architectural Glass Enclosure',
    biome: 'Deep Oceanic Lagoon & Invertebrate Haven',
    designStyle: 'Heritage Millwork Integration',
    materials: [
      'OptiWhite™ German Low-Iron Glass with 99.2% photonic transmission',
      'Custom cantilevered steel frame distributing 3,500kg directly to foundation pillars',
      'Vapor-barrier sealed cabinetry enclosure with active dehumidification extraction',
      'Zero-leak silicone manifold with double O-ring union valves',
    ],
    equipment: [
      'Active micro-climate ventilation preventing timber expansion or humidity buildup',
      'Ultra-precise multi-channel automated dosing system for trace mineral stability',
      'Triple-stage biological fluidized sand filter and biological nutrient export',
      'Emergency UPS battery backup providing 48 hours of autonomous life support during power cuts',
    ],
    marineLifeNotes: 'Captive-Bred Mandarin Dragonets, Orchid Dottybacks, High-Fin Gobies, Red Pistol Shrimp. Rare Scolymia australis, Acanthophyllia gardens.',
    installationDetails: 'Structurally decoupled from 100-year-old historic Burmese teak millwork. Reinforced foundation sub-pillars.',
    city: 'Kolkata',
    siteType: 'residential',
    privateAddress: 'Ballygunge Circular Road, Kolkata 700019',
    clientName: 'Heritage Villa Estate Trust',
    clientPhone: '+91 98302 22222',
    clientEmail: 'heritage@villa-private.marinecreatures.internal',
    projectStartDate: new Date('2023-11-01'),
    projectCompletionDate: new Date('2024-05-18'),
    internalNotes: 'Concierge priority care. High sensitivity to timber preservation and low-noise vibration profiles.',
    estimatedBudget: 3900000,
    caseStudyId: 'ballygunge-heritage-villa-reef',
    internalGallery: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=85',
    ],
    isArchived: false,
  },
];

export const INITIAL_CASE_STUDIES: DefaultCaseStudySeed[] = [
  {
    id: 'alipore-penthouse-monolith',
    slug: 'alipore-penthouse-monolith',
    title: 'The Alipore Penthouse Monolith',
    subtitle: 'Dual-Sided Architectural Living Partition',
    eyebrow: 'CASE STUDY 01',
    projectId: 'CP-2025-001',
    space: 'Private Penthouse Residence, Alipore, Kolkata',
    clientContext: 'Commissioned in collaboration with Studio Morphogenesis • Completed 2025',
    scale: '7,800 Liters / 2,060 Gallons • 4.8m (L) × 1.8m (H)',
    aquariumVolume: '7,800 Liters',
    aquariumType: 'Custom Monolithic Cast Acrylic',
    biome: 'Indo-Pacific Shallow Coral Atoll',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
        caption: 'Dual-sided living ocean threshold viewed from grand reception salon',
        alt: 'Alipore Penthouse Monolith living reef threshold',
      },
      {
        url: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=1600&q=85',
        caption: 'Australian Acropora and schooling Anthias illuminated by simulated sun rays',
        alt: 'SPS coral garden in Alipore penthouse',
      },
    ],
    beforeAfter: {
      beforeImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80',
      afterImage: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=85',
      beforeLabel: 'Concrete Shell & Partition Void',
      afterLabel: '7,800L Living Coral Monolith',
      caption: 'Transformation of the structural division between reception and private library into a luminescent living marine threshold.',
    },
    imageStatus: 'VERIFIED',
    designIntent:
      'The client sought a floor-to-ceiling living ocean threshold between the grand reception salon and the private library. The structure needed to provide visual connection without acoustic leakage, allowing sunlight to refract through coral crests into both chambers.',
    materials: [
      '90mm Monolithic Thermoformed Cast Acrylic viewing panels',
      'Italian Calacatta marble cladding with zero-vibration expansion joints',
      'Marine-grade 316 structural stainless steel space frame with anti-corrosive powder finish',
      'Acoustic-grade decoupling isolation mats beneath foundational plinth',
    ],
    engineering: [
      'Concealed sub-level life-support plant room operating below 24dB acoustic threshold',
      'Dual titanium heat-exchange chillers with remote outdoor heat dissipation',
      'Automated 120-liter daily reverse osmosis water-change robotics',
      'Cloud IoT telemetry with continuous spectrophotometric water chemistry logging',
    ],
    marineWorld: {
      biome: 'Indo-Pacific Shallow Coral Atoll',
      livestock: 'Schooling Threadfin Anthias, Blue-Throat Triggerfish, Captive-Bred Ocellaris pairs',
      corals: 'Cultured Australian Acropora millepora, branching Montipora, and Euphyllia torch fields',
    },
    introduction:
      'Spanning 4.8 meters across a high-altitude penthouse in Alipore, this installation represents the pinnacle of residential aquatic engineering. Commissioned as the central architectural axis of the residence.',
    challenge:
      'Balancing a structural load of over 9 metric tons on the 14th floor while isolating all mechanical vibrations, resonance, and acoustic signatures from the adjacent reading sanctuary.',
    concept:
      'A monolithic living partition where cast acrylic transparency merges with natural light to create dynamic oceanic illumination throughout the daytime living spaces.',
    architecture:
      'Fully concealed subterranean life support plumbing, dual isolated titanium exchangers, and custom Calacatta marble casing designed with thermal expansion joints.',
    execution:
      'Twelve-month collaborative deployment with Studio Morphogenesis including specialized crane rigging, precision acrylic bonding, and twelve-week prophylactic biological cycling.',
    transformation:
      'From a stark void in the floor plate to a thriving, biodiverse Indo-Pacific barrier reef supporting over 120 coral colonies and delicate pelagic fish.',
    conclusion:
      'The Alipore Penthouse Monolith stands as a world-class demonstration of living marine architecture integrated seamlessly into ultra-luxury living.',
    result:
      'A breathtaking centerpiece with crystal-clear 360-degree clarity. Zero odor, condensation, or mechanical hum within the living quarters. Maintained weekly under Marine Creatures VIP Concierge care with 100% biological survival rate.',
    status: 'published',
    published: true,
    publishedAt: new Date('2025-01-25'),
    featured: true,
    seoTitle: 'The Alipore Penthouse Monolith — Architectural Living Reef | Marine Creatures',
    seoDescription:
      'Explore the 7,800-liter dual-sided architectural living reef partition commissioned for a private luxury penthouse in Alipore, Kolkata. Engineered by Marine Creatures.',
  },
  {
    id: 'sector-v-corporate-sanctuary',
    slug: 'sector-v-corporate-sanctuary',
    title: 'The Sector V Corporate Sanctuary',
    subtitle: 'Panoramic 360° Cylindrical Coral Column',
    eyebrow: 'CASE STUDY 02',
    projectId: 'CP-2024-002',
    space: 'Executive Boardroom & International Reception, Salt Lake, Kolkata',
    clientContext: 'Apex Energy Holdings HQ • Completed 2024',
    scale: '4,200 Liters / 1,110 Gallons • 2.4m Diameter × 2.2m Height',
    aquariumVolume: '4,200 Liters',
    aquariumType: 'Seamless Cylindrical Polymer',
    biome: 'Pelagic Reef & Open Surge Zone',
    image: 'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?w=1600&q=85',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?w=1600&q=85',
        caption: 'Cylindrical 360-degree viewing rotunda in the corporate boardroom',
        alt: 'Sector V Corporate Sanctuary cylindrical coral aquarium',
      },
    ],
    beforeAfter: {
      beforeImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
      afterImage: 'https://images.unsplash.com/photo-1520255870062-bd79d3865de7?w=1200&q=85',
      beforeLabel: 'Standard Corporate Rotunda',
      afterLabel: 'Panoramic Living Marine Rotunda',
      caption: 'Replacing standard office interior architecture with a panoramic cylindrical living ocean sanctuary.',
    },
    imageStatus: 'VERIFIED',
    designIntent:
      'Engineered to soothe executive cognitive fatigue and make an unforgettable first impression on international delegates. The cylindrical form allows unobstructed viewing from every angle in the circular boardroom rotunda.',
    materials: [
      'Seamless Cylindrical High-Molecular Polymer (80mm thickness)',
      'Acoustic damping rubber mounts dampening all floor-borne resonance',
      'Brushed titanium trim and concealed maintenance access hatch',
      'Custom Bahamian aragonite sand bed with anaerobic nitrate reduction zones',
    ],
    engineering: [
      'Central vortex overflow weir eliminating surface organic films silently',
      'Variable sine-wave DC pumps mimicking natural pelagic oceanic swell',
      'Architectural LED matrix synchronized to outdoor solar angles and lunar cycles',
      'Integrated ozone injection and UV sterilizer for laboratory water purity',
    ],
    marineWorld: {
      biome: 'Pelagic Reef & Open Surge Zone',
      livestock: 'Schooling Blue Chromis, Yellow Tangs, Flame Angels, Cleaner Shrimp colonies',
      corals: 'Hardy SPS corals, pulsing Xenias, and large Polyp stony corals',
    },
    introduction:
      'Positioned at the epicenter of Apex Energy Holdings global headquarters in Salt Lake Sector V, this 4,200-liter cylindrical column redefines corporate architecture.',
    challenge:
      'Creating a central vortex life-support system with zero visible equipment or wiring, maintaining pristine optical clarity for 360-degree viewing.',
    concept:
      'A vertical marine vortex echoing natural pelagic upwellings, fostering calm cognitive focus for boardroom deliberations.',
    architecture:
      'Seamless curved polymer construction with sub-floor central drain hydraulics and synchronized lunar lighting curves.',
    execution:
      'Installed over a 72-hour weekend shutdown window to avoid any disruption to ongoing multinational corporate operations.',
    transformation:
      'A previously static corporate atrium converted into an internationally acclaimed conversation centerpiece and living artwork.',
    conclusion:
      'Combines enterprise-grade operational stability with effortless executive tranquility.',
    result:
      'Delivered on-time without disruption to corporate operations. Requires zero executive management or maintenance; autonomously monitored via our digital health dashboard with emergency physical dispatch protocol.',
    status: 'published',
    published: true,
    publishedAt: new Date('2024-08-20'),
    featured: true,
    seoTitle: 'The Sector V Corporate Sanctuary — Cylindrical Marine Aquarium | Marine Creatures',
    seoDescription:
      'The 4,200-liter panoramic 360° cylindrical marine aquarium engineered for corporate executive headquarters in Salt Lake Sector V, Kolkata.',
  },
  {
    id: 'ballygunge-heritage-villa-reef',
    slug: 'ballygunge-heritage-villa-reef',
    title: 'The Ballygunge Heritage Villa Reef',
    subtitle: 'Integrated Living Coral Reef in Historic Millwork',
    eyebrow: 'CASE STUDY 03',
    projectId: 'CP-2024-003',
    space: 'Heritage Colonial Bungalow, Ballygunge, Kolkata',
    clientContext: 'Private Collector Residence • Completed 2024',
    scale: '3,200 Liters / 845 Gallons • 3.2m (L) × 1.2m (H)',
    aquariumVolume: '3,200 Liters',
    aquariumType: 'OptiWhite Low-Iron Architectural Glass',
    biome: 'Deep Oceanic Lagoon & Invertebrate Haven',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=85',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=85',
        caption: 'Deep oceanic lagoon integrated within antique teak paneling',
        alt: 'Ballygunge Heritage Villa living reef aquarium',
      },
    ],
    beforeAfter: {
      beforeImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80',
      afterImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85',
      beforeLabel: 'Antique Millwork Alcove',
      afterLabel: 'Protected Micro-Climate Reef',
      caption: 'Preserving centenarian Burmese teak paneling while inserting an autonomous, zero-humidity living coral ecosystem.',
    },
    imageStatus: 'VERIFIED',
    designIntent:
      'Integrating modern marine life-support into century-old Burmese teak paneling without causing moisture damage or structural deflection to the historic property framework.',
    materials: [
      'OptiWhite™ German Low-Iron Glass with 99.2% photonic transmission',
      'Custom cantilevered steel frame distributing 3,500kg directly to foundation pillars',
      'Vapor-barrier sealed cabinetry enclosure with active dehumidification extraction',
      'Zero-leak silicone manifold with double O-ring union valves',
    ],
    engineering: [
      'Active micro-climate ventilation preventing timber expansion or humidity buildup',
      'Ultra-precise multi-channel automated dosing system for trace mineral stability',
      'Triple-stage biological fluidized sand filter and biological nutrient export',
      'Emergency UPS battery backup providing 48 hours of autonomous life support during power cuts',
    ],
    marineWorld: {
      biome: 'Deep Oceanic Lagoon & Invertebrate Haven',
      livestock: 'Captive-Bred Mandarin Dragonets, Orchid Dottybacks, High-Fin Gobies, Red Pistol Shrimp',
      corals: 'Rare Scolymia australis, Acanthophyllia, Blastomussa, and Ricordea Florida gardens',
    },
    introduction:
      'Set within a colonial heritage residence in Ballygunge, this 3,200-liter biotope represents the delicate marriage between antique architecture and modern marine technology.',
    challenge:
      'Eliminating all ambient humidity, condensation, and weight stress to preserve historic 100-year-old Burmese teak woodwork.',
    concept:
      'A hermetically sealed living micro-climate with external extraction, allowing ultra-delicate deep lagoon species to flourish within an antique setting.',
    architecture:
      'Independent structural cantilever transferring entire dynamic loads to subterranean foundation pillars, completely bypassing surrounding historic millwork.',
    execution:
      'Surgically recessed cabinetry with dual vapor-barrier membranes, silent extraction conduits, and integrated emergency battery power reserves.',
    transformation:
      'A classic study transformed into a quiet marine sanctuary without modifying or endangering historical architectural fabric.',
    conclusion:
      'Proof that advanced marine life support can exist harmoniously within delicate historic conservation parameters.',
    result:
      'Seamless juxtaposition of heritage architecture and contemporary living marine science. The century-old timber remains untouched and completely dry while housing an thriving exotic ecosystem.',
    status: 'published',
    published: true,
    publishedAt: new Date('2024-05-24'),
    featured: true,
    seoTitle: 'The Ballygunge Heritage Villa Reef — Living Coral Case Study | Marine Creatures',
    seoDescription:
      'A 3,200-liter bespoke marine reef seamlessly embedded into century-old Burmese teak paneling in Ballygunge, Kolkata.',
  },
];

/**
 * Migration & Seeding utility to ensure initial portfolio data exists in MongoDB.
 * Safe and idempotent: only seeds if collections are empty.
 */
export async function ensureWorldsSeeded(): Promise<void> {
  await connectToDatabase();

  const caseStudyCount = await CaseStudyModel.countDocuments({});
  if (caseStudyCount === 0) {
    console.log('[WorldsCMS] Seeding initial case studies...');
    for (const item of INITIAL_CASE_STUDIES) {
      await CaseStudyModel.findOneAndUpdate(
        { id: item.id },
        { $setOnInsert: item },
        { upsert: true, new: true }
      );
    }
    console.log('[WorldsCMS] Initial case studies seeded successfully.');
  }

  const projectCount = await ClientProjectModel.countDocuments({});
  if (projectCount === 0) {
    console.log('[WorldsCMS] Seeding initial client projects...');
    for (const item of INITIAL_CLIENT_PROJECTS) {
      await ClientProjectModel.findOneAndUpdate(
        { id: item.id },
        { $setOnInsert: item },
        { upsert: true, new: true }
      );
    }
    console.log('[WorldsCMS] Initial client projects seeded successfully.');
  }
}
