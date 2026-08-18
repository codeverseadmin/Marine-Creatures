export interface ServiceOffering {
  id: string;
  name: string;
  badge?: string;
  priceStartingFrom: string;
  shortDesc: string;
  description: string;
  inclusions: string[];
  stages: { step: string; title: string; desc: string }[];
  guarantees: string[];
  image: string;
}

export const SERVICES_DATA: ServiceOffering[] = [
  {
    id: 'installation',
    name: 'Bespoke Aquarium Installation',
    badge: 'Turnkey Commission',
    priceStartingFrom: '£1,850',
    shortDesc: 'Complete architectural installation from structural load analysis to plumbing, lighting automation, aquascaping, and live ecosystem cycling.',
    description: 'Our senior marine engineers and biological curators handle every facet of your new aquarium project. We collaborate directly with your interior architects, structural engineers, and contractors to ensure precision delivery with concealed Schedule 80 plumbing, automated salt-water change stations, and whisper-silent plant rooms.',
    inclusions: [
      'Structural Floor Load & Spatial Acoustic Analysis',
      'OptiWhite™ Glass or Thermoformed Acrylic Delivery & Placement',
      'Schedule 80 Concealed Sump Plumbing & High-Flow Closed Loops',
      'Living Bio-Rock Scaping & Bahamian Aragonite Substrate Bedding',
      'Full System Automation (IoT Lighting, Wavemakers, Dosing Pumps)',
      '14-Day Automated Biological Cycling & Water Chemical Balancing',
      'Hand-Selected Quarantined Livestock Introduction',
    ],
    stages: [
      { step: '01', title: 'Architectural Discovery', desc: 'Site inspection, plumbing routing, structural assessment, and biotope selection.' },
      { step: '02', title: 'Fabrication & Pre-Plumbing', desc: 'Custom tank manufacture, CNC cabinetry framing, and dry-fit testing.' },
      { step: '03', title: 'On-Site Commissioning', desc: 'Delivery, placement, acoustic dampening, and waterproof sealing.' },
      { step: '04', title: 'Living Aquascaping', desc: 'Sculpting bio-active live rock structures and seeding bacterial cultures.' },
      { step: '05', title: 'Ecosystem Introduction', desc: 'Acclimation of hand-paired clownfish, corals, and invertebrates.' },
    ],
    guarantees: [
      '10-Year Monolithic Tank Structural Seal Warranty',
      '3-Year Complete Hardware & Electronics Coverage',
      '100% Zero-Leak Plumbing Guarantee',
      '30-Day Livestock Health & Stability Protection',
    ],
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=85',
  },
  {
    id: 'renovation',
    name: 'Aquarium Renovation & Revival',
    badge: 'Ecosystem Rescue',
    priceStartingFrom: '£650',
    shortDesc: 'Breathe new life into cloudy, scratched, algae-covered, or outdated aquariums with modern LED retrofits and biological resets.',
    description: 'Transform an existing, neglected, or troubled aquarium into a pristine centerpiece without replacing the entire setup. We specialize in glass scratch removal, deep bio-cleaning, plumbing re-engineering, upgrading outdated metal halide lights to NemoLight LED spectra, and revitalizing declining coral reefs.',
    inclusions: [
      'Water Chemistry Diagnostic & Toxic Compound Lab Panel',
      'Temporary Livestock Holding & Safe Quarantine Facility',
      'Full Algae, Cyanobacteria & Phosphate Eradication',
      'Optical Acrylic / Glass Diamond Polishing & Scratch Removal',
      'Modern Silent DC Pump & NemoLight LED Spectrum Retrofitting',
      'New Biological Live Rock Sculpting & Aragonite Replacement',
      'Re-Commissioning with Biological Stability Certification',
    ],
    stages: [
      { step: '01', title: 'Health Diagnostic', desc: 'Water testing and comprehensive equipment performance audit.' },
      { step: '02', title: 'Safe Livestock Relocation', desc: 'Temporary housing of your fish and corals in climate-controlled tanks.' },
      { step: '03', title: 'Deep Restoration', desc: 'Chemical flush, glass scratch polishing, and substrate overhaul.' },
      { step: '04', title: 'Hardware Modernization', desc: 'Installation of silent DC pumps, energy-efficient LEDs, and smart controllers.' },
      { step: '05', title: 'Re-Introduction', desc: 'Gradual acclimation of healthy livestock into a revitalized sanctuary.' },
    ],
    guarantees: [
      '100% Zero-Loss Livestock Relocation Protocol',
      'Crystal-Clear Optical Glass Restoration',
      'Energy Efficiency Improvement of up to 40%',
      'Free 30-Day Post-Renovation Monitoring',
    ],
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1200&q=85',
  },
  {
    id: 'maintenance',
    name: 'White-Glove Marine Concierge',
    badge: 'Ongoing Care',
    priceStartingFrom: '£280 / Month',
    shortDesc: 'Routine weekly or bi-weekly visits by certified marine biologists to keep your ecosystem pristine, balanced, and thriving 365 days a year.',
    description: 'Enjoy the beauty of an extraordinary living ocean without the complexity of maintenance. Our dedicated specialists handle water changes using laboratory-grade RO/DI and Red Sea salt, filter media replacements, dosing calibrations, coral grooming, and livestock wellness checks.',
    inclusions: [
      'Bi-Weekly Water Chemical Testing (Ca, Mg, dKH, NO3, PO4, Salinity)',
      'Pre-Mixed Laboratory Grade RO/DI Salt Water Changes',
      'Filter Pad, Carbon, GFO & Protein Skimmer Maintenance',
      'Glass & Acrylic Cleaning with Scratch-Proof Velvet Blades',
      'Coral Fragging, Algae Management & Sandbed Siphoning',
      'Automatic Dosing Reservoir Top-Off & Replenishment',
      '24/7 Priority Emergency Rapid-Response Hotline',
    ],
    stages: [
      { step: '01', title: 'Baseline Testing', desc: 'Recording historical parameter trends and establishing optimal targets.' },
      { step: '02', title: 'Scheduled Care Visits', desc: 'Discreet, seamless service conducted at your preferred hours.' },
      { step: '03', title: 'Digital Health Reports', desc: 'Real-time parameter logging delivered straight to your smartphone.' },
    ],
    guarantees: [
      '2-Hour Emergency On-Site Response Window',
      'Free Livestock Replacement for Monitored Tanks',
      'Direct Biologist WhatsApp Support Channel',
    ],
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1200&q=85',
  },
];
