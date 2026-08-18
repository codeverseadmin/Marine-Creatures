export interface Product {
  id: string;
  name: string;
  scientificName?: string;
  brand?: string;
  category: 'marine-life' | 'lighting-tech' | 'rock-sand' | 'salt-chemistry' | 'hardware';
  categoryLabel: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  badge?: string;
  inStock: boolean;
  stockCount: number;
  images: string[];
  shortDesc: string;
  description: string;
  deliveryInfo: {
    estimatedDays: string;
    shippingMethod: string;
    guaranteeText: string;
  };
  careGuide?: {
    temperature: string;
    salinity: string;
    ph: string;
    diet?: string;
    temperament?: string;
    minimumTankSize?: string;
    reefSafe?: boolean;
    acclimationSteps: string[];
  };
  installationGuide?: {
    difficulty: 'Plug & Play' | 'Moderate' | 'Advanced';
    estimatedTime: string;
    mountingType?: string;
    steps: string[];
    includedInBox: string[];
  };
  specifications: Record<string, string>;
  recommendedPairings?: string[];
}

export const PRODUCTS: Product[] = [
  // 1. MARINE LIFE
  {
    id: 'designer-clownfish-pair',
    name: 'Snowflake Ocellaris Clownfish (Bonded Pair)',
    scientificName: 'Amphiprion ocellaris',
    category: 'marine-life',
    categoryLabel: 'Marine Life',
    price: 185.00,
    originalPrice: 220.00,
    rating: 4.9,
    reviewsCount: 38,
    badge: 'Popular Pair',
    inStock: true,
    stockCount: 6,
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: 'Captive-bred bonded pair with vivid white patterns. Peaceful and 100% reef safe.',
    description: 'Our Snowflake Ocellaris Clownfish pairs are captive-bred in closed-loop aquaculture systems. Bonded for immediate harmony in your aquarium, they display striking contrasting white patterns with deep orange accents.',
    deliveryInfo: {
      estimatedDays: 'Next-Day Delivery',
      shippingMethod: 'Oxygenated Insulated Thermal Pod Courier',
      guaranteeText: '100% Live Arrival Guaranteed',
    },
    careGuide: {
      temperature: '24°C – 26°C (75°F – 79°F)',
      salinity: '1.024 – 1.026 SG',
      ph: '8.1 – 8.4',
      diet: 'Marine Flakes, Mysis Shrimp & Pellets',
      temperament: 'Peaceful & Hardy',
      minimumTankSize: '80 Liters (20 Gal)',
      reefSafe: true,
      acclimationSteps: [
        'Float sealed transport bag in tank for 20 minutes.',
        'Drip acclimate at 2–3 drops per second for 45 minutes.',
        'Check salinity match before gently transferring fish with a net.',
      ],
    },
    specifications: {
      'Adult Size': '7.5 – 9.0 cm',
      'Breeding': 'Captive Bred & Quarantined',
      'Lifespan': '12+ Years in healthy reefs',
    },
    recommendedPairings: ['rose-bubble-tip-anemone', 'nemolight-aqua-marine-led'],
  },
  {
    id: 'emperor-angelfish-juvenile',
    name: 'Emperor Angelfish (Show Juvenile)',
    scientificName: 'Pomacanthus imperator',
    category: 'marine-life',
    categoryLabel: 'Marine Life',
    price: 240.00,
    rating: 5.0,
    reviewsCount: 19,
    badge: 'Showpiece',
    inStock: true,
    stockCount: 3,
    images: [
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1000&q=85',
    ],
    shortDesc: 'Regal circular blue and white patterning that morphs into brilliant gold adult stripes.',
    description: 'The Emperor Angelfish is the centerpiece of large marine displays. This show-grade juvenile exhibits hypnotic concentric blue-and-white rings that gradually transform into horizontal gold and sapphire lines.',
    deliveryInfo: {
      estimatedDays: 'Next-Day AM Priority',
      shippingMethod: 'Heated Oxygen-Charged Transporter',
      guaranteeText: 'Live Arrival Guaranteed',
    },
    careGuide: {
      temperature: '24°C – 26.5°C',
      salinity: '1.025 SG',
      ph: '8.2 – 8.4',
      diet: 'Sponge-based formulas, chopped krill, nori algae',
      temperament: 'Semi-aggressive showpiece',
      minimumTankSize: '650 Liters (175 Gal)',
      reefSafe: false,
      acclimationSteps: [
        'Drip acclimate over 60 minutes in dim lighting.',
        'Offer fortified mysis shrimp after settling.',
      ],
    },
    specifications: {
      'Adult Size': '30 – 38 cm',
      'Origin': 'Red Sea (Certified Sustainable)',
      'Care Level': 'Expert / Advanced',
    },
    recommendedPairings: ['real-reef-live-rock-20kg', 'nyos-quantum-160-skimmer'],
  },
  {
    id: 'pacific-blue-tang',
    name: 'Pacific Blue Regal Tang (Dory)',
    scientificName: 'Paracanthurus hepatus',
    category: 'marine-life',
    categoryLabel: 'Marine Life',
    price: 135.00,
    originalPrice: 155.00,
    rating: 4.8,
    reviewsCount: 52,
    badge: 'Popular',
    inStock: true,
    stockCount: 8,
    images: [
      'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: 'Vibrant royal blue body with bright yellow tail. Energetic open-water swimmer.',
    description: 'Renowned worldwide for its vivid royal blue coloration and active swimming behavior. Fully conditioned to seaweed grazing and pellet feeds.',
    deliveryInfo: {
      estimatedDays: 'Next-Day Delivery',
      shippingMethod: 'Insulated Climate Pod',
      guaranteeText: '100% Live Arrival Guaranteed',
    },
    careGuide: {
      temperature: '24°C – 26°C',
      salinity: '1.025 SG',
      ph: '8.1 – 8.4',
      diet: 'Herbivore — Daily Nori Seaweed & Spirulina',
      temperament: 'Peaceful & Active',
      minimumTankSize: '400 Liters (100 Gal)',
      reefSafe: true,
      acclimationSteps: [
        'Drip acclimate in dim lighting for 45 minutes.',
        'Provide ample live rock caves for shelter.',
      ],
    },
    specifications: {
      'Adult Size': '20 – 25 cm',
      'Reef Safety': '100% Safe with Corals',
    },
    recommendedPairings: ['designer-clownfish-pair', 'nemolight-aqua-marine-led'],
  },
  {
    id: 'rose-bubble-tip-anemone',
    name: 'Ultra Rose Bubble Tip Anemone (RBTA)',
    scientificName: 'Entacmaea quadricolor',
    category: 'marine-life',
    categoryLabel: 'Marine Life',
    price: 110.00,
    rating: 4.9,
    reviewsCount: 27,
    badge: 'Host Anemone',
    inStock: true,
    stockCount: 5,
    images: [
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: 'Vibrant neon pink bulbous tentacles; the ideal natural symbiotic host for clownfish.',
    description: 'An extraordinary centerpiece invertebrate featuring glowing rose-red bulbous tentacles under actinic spectrum lighting.',
    deliveryInfo: {
      estimatedDays: 'Next-Day Priority',
      shippingMethod: 'Oxygenated Aquatic Thermal Pod',
      guaranteeText: 'Live Arrival Guaranteed',
    },
    careGuide: {
      temperature: '25°C – 26°C',
      salinity: '1.025 SG',
      ph: '8.2 – 8.4',
      diet: 'Photosynthetic; supplemental mysis weekly',
      temperament: 'Semi-mobile until anchored in rock',
      minimumTankSize: '120 Liters (30 Gal)',
      reefSafe: true,
      acclimationSteps: [
        'Drip acclimate over 60 minutes.',
        'Turn off high water flow for 2 hours while anemone foot attaches.',
      ],
    },
    specifications: {
      'Lighting': 'Moderate to High PAR (150–250)',
      'Water Flow': 'Gentle to Medium',
    },
    recommendedPairings: ['designer-clownfish-pair'],
  },

  // 2. LIGHTING & TECH
  {
    id: 'nemolight-aqua-marine-led',
    name: 'NemoLight Aqua Marine Ultra-Spectral LED (72W / 90W Pro)',
    brand: 'NemoLight Professional',
    category: 'lighting-tech',
    categoryLabel: 'Lighting & Tech',
    price: 345.00,
    originalPrice: 395.00,
    rating: 5.0,
    reviewsCount: 84,
    badge: 'Flagship Light',
    inStock: true,
    stockCount: 14,
    images: [
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: 'Full-spectrum coral growth lighting with automated sunrise, sunset cycles and iOS/Android app.',
    description: 'The NemoLight Aqua Marine Spectrum Series delivers optimal PAR output calibrated specifically for photosynthesis in delicate SPS/LPS corals and glowing anemones. Features ultra-slim aluminum unibody housing with whisper-quiet passive cooling.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Express Tracked',
      shippingMethod: 'Reinforced Flight Box Courier',
      guaranteeText: '3-Year Replacement Warranty',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '15 Minutes',
      mountingType: 'Adjustable Rim Mount Included',
      steps: [
        'Attach anodized aluminum bracket to tank rim.',
        'Connect waterproof 24V power supply.',
        'Download NemoLight App to configure 24h sunrise/sunset lighting schedule.',
      ],
      includedInBox: ['NemoLight Fixture', 'Rim Mounting Arm', 'Power Supply', 'Setup Guide'],
    },
    specifications: {
      'Power': '72W / 90W Peak',
      'Coverage': 'Up to 90cm × 60cm (36" × 24")',
      'PAR Output': 'Peak 480 µmol/m²/s @ 30cm depth',
      'Warranty': '3 Years Direct Warranty',
    },
    recommendedPairings: ['designer-clownfish-pair', 'real-reef-live-rock-20kg'],
  },
  {
    id: 'radion-xr30-pro-g6',
    name: 'EcoTech Radion XR30 Pro G6 Reef Fixture',
    brand: 'EcoTech Marine',
    category: 'lighting-tech',
    categoryLabel: 'Lighting & Tech',
    price: 899.00,
    rating: 4.9,
    reviewsCount: 61,
    badge: 'Pro Lighting',
    inStock: true,
    stockCount: 5,
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1000&q=85',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1000&q=85',
    ],
    shortDesc: 'HEI2 optical system with 126-degree light spread and Mobius smartphone control.',
    description: 'The pinnacle of reef lighting technology. The Radion G6 Pro expands light dispersion to 126 degrees, eliminating hot spots and providing uniform shimmer.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Tracked Courier',
      shippingMethod: 'Express Courier',
      guaranteeText: '2-Year Manufacturer Warranty',
    },
    installationGuide: {
      difficulty: 'Moderate',
      estimatedTime: '25 Minutes',
      steps: [
        'Mount with RMS Single Arm or Hanging Kit.',
        'Pair with Mobius mobile app via Bluetooth.',
        'Select pre-configured CoralLab growth profile.',
      ],
      includedInBox: ['Radion G6 Unit', 'Power Cable', 'Documentation'],
    },
    specifications: {
      'Max Power': '215 Watts',
      'Control': 'Mobius App (iOS / Android)',
    },
    recommendedPairings: ['nyos-quantum-160-skimmer'],
  },

  // 3. ROCK & SAND
  {
    id: 'real-reef-live-rock-20kg',
    name: 'Real Reef™ Biological Live Rock (20kg Box)',
    brand: 'Real Reef Aquascaping',
    category: 'rock-sand',
    categoryLabel: 'Rock & Sand',
    price: 245.00,
    originalPrice: 280.00,
    rating: 5.0,
    reviewsCount: 94,
    badge: 'Zero Pest',
    inStock: true,
    stockCount: 18,
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: '100% pest-free bio-active cultured rock pigmented in natural purple coralline algae.',
    description: 'Crafted from 100% natural calcium carbonate and pre-cured with non-toxic natural coralline pigmentation. Contains zero unwanted pests (no aiptasia, mantis shrimp, or flatworms) and is ready for immediate aquascaping.',
    deliveryInfo: {
      estimatedDays: '1-3 Business Days',
      shippingMethod: 'Heavy Freight Courier',
      guaranteeText: '100% Pest-Free Guarantee',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '30 Minutes',
      steps: [
        'Rinse in fresh salt water or RO/DI water to clear transit dust.',
        'Assemble desired reef formations using hydraulic cement or marine epoxy.',
        'Place directly into aquarium.',
      ],
      includedInBox: ['Mixed assortment of arches, shelves, caves, and base rocks (Total 20kg / 44 lbs)'],
    },
    specifications: {
      'Weight': '20 kg (44.1 lbs)',
      'Material': 'Natural Calcium Carbonate matrix',
    },
    recommendedPairings: ['bahamian-aragonite-live-sand-10kg', 'red-sea-coral-pro-salt'],
  },
  {
    id: 'bahamian-aragonite-live-sand-10kg',
    name: 'Bahamian Oolitic Aragonite Live Sand (10kg Bag)',
    brand: 'CaribSea Ocean Direct',
    category: 'rock-sand',
    categoryLabel: 'Rock & Sand',
    price: 48.00,
    rating: 4.9,
    reviewsCount: 76,
    inStock: true,
    stockCount: 25,
    images: [
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=85',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85',
    ],
    shortDesc: 'Pristine white live sand containing millions of beneficial marine nitrifying bacteria.',
    description: 'Packed live directly from Caribbean reefs with pure seawater to accelerate aquarium cycling and stabilize pH at 8.2–8.4.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Standard Courier',
      shippingMethod: 'Heavy Sealed Pouch',
      guaranteeText: 'Live Bacteria Viability Guaranteed',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '10 Minutes',
      steps: [
        'Do NOT rinse to preserve live beneficial bacteria.',
        'Distribute evenly across bottom glass to 2.5cm–5cm bed depth.',
      ],
      includedInBox: ['10kg Live Sand Bag'],
    },
    specifications: {
      'Grain Size': '0.5 – 1.2 mm (Soft on bottom dwellers)',
      'Weight': '10 kg (22 lbs)',
    },
    recommendedPairings: ['real-reef-live-rock-20kg'],
  },

  // 4. SALTS & WATER CARE
  {
    id: 'red-sea-coral-pro-salt',
    name: 'Red Sea Coral Pro Salt (22kg Bucket / 660 Liters)',
    brand: 'Red Sea Marine',
    category: 'salt-chemistry',
    categoryLabel: 'Salts & Chemistry',
    price: 88.00,
    originalPrice: 98.00,
    rating: 5.0,
    reviewsCount: 142,
    badge: 'Reef Standard',
    inStock: true,
    stockCount: 30,
    images: [
      'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: 'Balanced ratios of Calcium, Magnesium, and Carbonates for optimal coral growth.',
    description: 'Formulated specifically for accelerated coral growth and vibrant polyp extension in reef aquariums. Contains balanced ratios of Foundation Elements (Ca 450ppm, Mg 1350ppm, dKH 12.0) with zero nitrates or phosphates.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Fast Dispatch',
      shippingMethod: 'Sealed Heavy Bucket Courier',
      guaranteeText: 'Factory Sealed Batch',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '15 Minutes',
      steps: [
        'Always add salt into RO/DI water (never water onto salt).',
        'Mix 38.2 grams per Liter of water for 1.025 SG.',
        'Aerate with pump for 15 minutes until clear.',
      ],
      includedInBox: ['22kg Sealed Bucket with measuring scoop'],
    },
    specifications: {
      'Yield': 'Up to 660 Liters (175 Gallons)',
      'Calcium (Ca)': '450 ppm ± 15 ppm',
      'Magnesium (Mg)': '1,350 ppm ± 30 ppm',
    },
    recommendedPairings: ['nemolight-aqua-marine-led'],
  },

  // 5. HARDWARE & SKIMMERS
  {
    id: 'nyos-quantum-160-skimmer',
    name: 'Nyos® Quantum 160 Protein Skimmer',
    brand: 'Nyos Marine Germany',
    category: 'hardware',
    categoryLabel: 'Hardware & Skimmers',
    price: 520.00,
    rating: 5.0,
    reviewsCount: 45,
    badge: 'German Precision',
    inStock: true,
    stockCount: 7,
    images: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: 'Engineered in Germany with Hybrid Wheel technology for whisper-quiet protein skimming.',
    description: 'The Nyos Quantum 160 sets the standard for silent protein skimming. Its transparent Clear-View body and needle-wheel impeller strip organic waste and dissolved toxins before they break down.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Tracked Courier',
      shippingMethod: 'Reinforced Foam Box',
      guaranteeText: '2-Year Manufacturer Warranty',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '15 Minutes',
      steps: [
        'Place in sump chamber with constant water depth of 20cm–22cm.',
        'Plug in pump and set foam level at base of collection cup.',
      ],
      includedInBox: ['Quantum 160 Skimmer', 'Quantum 3.0 Pump', 'Silencer'],
    },
    specifications: {
      'Tank Size': '250 – 1,000 Liters (65 – 260 Gal)',
      'Power': '18 Watts',
      'Noise': '< 28 dB (Whisper Silent)',
    },
    recommendedPairings: ['red-sea-coral-pro-salt'],
  },
];
