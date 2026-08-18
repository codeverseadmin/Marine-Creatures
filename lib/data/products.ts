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
    difficulty: 'Plug & Play' | 'Moderate' | 'Advanced Plumbing';
    estimatedTime: string;
    mountingType?: string;
    steps: string[];
    includedInBox: string[];
  };
  specifications: Record<string, string>;
  recommendedPairings?: string[]; // IDs of products
}

export const PRODUCTS: Product[] = [
  // ==========================================
  // 1. FISH & MARINE CREATURES
  // ==========================================
  {
    id: 'designer-clownfish-pair',
    name: 'Snowflake Ocellaris Clownfish (Bonded Pair)',
    scientificName: 'Amphiprion ocellaris var.',
    category: 'marine-life',
    categoryLabel: 'Marine Life',
    price: 185.00,
    originalPrice: 220.00,
    rating: 4.9,
    reviewsCount: 38,
    badge: 'Bestseller Pair',
    inStock: true,
    stockCount: 6,
    images: [
      'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1000&q=85',
    ],
    shortDesc: 'Hand-paired captive-bred designer clownfish known for symbiotic hosting in bubble tip anemones and vibrant contrasting white bands.',
    description: 'Our Snowflake Ocellaris Clownfish pairs are captive-bred in state-of-the-art closed-loop aquaculture systems. Bonded for immediate harmony in your aquarium, they display striking, high-contrast iridescent white patterns with deep orange and jet-black accents. 100% reef safe and conditioned to accept premium pellets and frozen mysis.',
    deliveryInfo: {
      estimatedDays: 'Next-Day Delivery',
      shippingMethod: 'Oxygenated Insulated Thermal Pod Courier',
      guaranteeText: '100% Live Arrival Guarantee (DOA Protected with 7-Day Stay-Alive Protocol)',
    },
    careGuide: {
      temperature: '24°C – 26°C (75°F – 79°F)',
      salinity: '1.024 – 1.026 SG',
      ph: '8.1 – 8.4',
      diet: 'Omnivore — Enjoys Marine Flakes, Mysis Shrimp & Spirulina Pellets',
      temperament: 'Peaceful & Hardy',
      minimumTankSize: '80 Liters / 20 Gallons',
      reefSafe: true,
      acclimationSteps: [
        'Float sealed transport bag in display sump for 20 minutes to equalize temperature.',
        'Transfer specimens to a sterile container and begin drip acclimation at 2–3 drops per second for 45 minutes.',
        'Test water salinity in the container to ensure exact match with your display tank (within ±0.001 SG).',
        'Gently transfer fish using a soft mesh specimen net. Discard all transport water.',
      ],
    },
    specifications: {
      'Adult Size': '7.5 – 9.0 cm (3.0 – 3.5 in)',
      'Breeding Status': 'Captive Bred & Quarantined',
      'Lifespan': '12 – 15 Years in healthy reef setups',
      'Coral Compatibility': '100% Reef Safe (Hosts Anemones & Torch Corals)',
    },
    recommendedPairings: ['rose-bubble-tip-anemone', 'nemolight-aqua-marine-led', 'red-sea-coral-pro-salt'],
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
    badge: 'Showpiece Specimen',
    inStock: true,
    stockCount: 3,
    images: [
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1000&q=85',
    ],
    shortDesc: 'Regal circular blue and white juvenile patterning that morphs into brilliant horizontal gold and sapphire adult stripes.',
    description: 'The Emperor Angelfish is universally regarded as the crown jewel of large marine displays. This show-grade juvenile exhibits hypnotic concentric blue-and-white rings that will gradually transform into vivid horizontal gold and sapphire lines with an iconic black mask.',
    deliveryInfo: {
      estimatedDays: 'Next-Day AM Priority',
      shippingMethod: 'Heated Oxygen-Charged Transporter',
      guaranteeText: 'Live Arrival Guaranteed with 30-day Marine Biologist Health Assurance',
    },
    careGuide: {
      temperature: '24°C – 26.5°C',
      salinity: '1.025 SG',
      ph: '8.2 – 8.4',
      diet: 'Omnivore with sponge-based angelfish formulas, chopped krill, and nori algae',
      temperament: 'Semi-aggressive / Dominant Showpiece',
      minimumTankSize: '650 Liters / 175 Gallons',
      reefSafe: false,
      acclimationSteps: [
        'Drip acclimate over 60 minutes in low-light quarantine environment.',
        'Offer fortified mysis shrimp soaked in garlic elixir after 2 hours.',
      ],
    },
    specifications: {
      'Adult Size': '30 – 38 cm (12 – 15 in)',
      'Origin': 'Red Sea & Indo-Pacific (Certified Sustainable)',
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
      'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1000&q=85',
    ],
    shortDesc: 'Electric royal blue body with yellow palette tail fin and bold black markings. Active open-water swimmer.',
    description: 'Renowned worldwide for its vibrant royal blue body, bright yellow caudal fin, and playful swimming personality. Fully conditioned to seaweed grazing and pellet feeds, this active tang adds non-stop kinetic motion to your living reef.',
    deliveryInfo: {
      estimatedDays: 'Next-Day Delivery',
      shippingMethod: 'Insulated Climate Pod',
      guaranteeText: '100% Live Arrival Guaranteed',
    },
    careGuide: {
      temperature: '24°C – 26°C',
      salinity: '1.025 SG',
      ph: '8.1 – 8.4',
      diet: 'Herbivore / Algae grazer (Requires daily Nori Seaweed clip)',
      temperament: 'Peaceful & Highly Active',
      minimumTankSize: '400 Liters / 100 Gallons',
      reefSafe: true,
      acclimationSteps: [
        'Drip acclimate in dim lighting for 45 minutes.',
        'Ensure plenty of live rock caves for nighttime resting.',
      ],
    },
    specifications: {
      'Adult Size': '20 – 25 cm (8 – 10 in)',
      'Reef Safety': '100% Safe with SPS & LPS Corals',
      'Dietary Need': 'High-fiber marine macroalgae & nori sheets',
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
    badge: 'Symbiotic Host',
    inStock: true,
    stockCount: 5,
    images: [
      'https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: 'Vibrant neon pink and fiery rose bulbous tentacles; the ideal natural host for all clownfish varieties.',
    description: 'An extraordinary centerpiece invertebrate featuring glowing rose-red bulbous tentacles under actinic spectrum lighting. Creates an authentic biological symbiosis with clownfish, offering endless interactive viewing pleasure.',
    deliveryInfo: {
      estimatedDays: 'Next-Day Priority',
      shippingMethod: 'Oxygenated Aquatic Thermal Pod',
      guaranteeText: 'Live Arrival Guaranteed',
    },
    careGuide: {
      temperature: '25°C – 26°C',
      salinity: '1.025 – 1.026 SG',
      ph: '8.2 – 8.4',
      diet: 'Photosynthetic (requires high PAR LED lighting); supplemental mysis weekly',
      temperament: 'Semi-mobile until anchored in rock crevice',
      minimumTankSize: '120 Liters / 30 Gallons',
      reefSafe: true,
      acclimationSteps: [
        'Float bag for 25 minutes, then drip acclimate over 60 minutes.',
        'Turn off powerheads/wavemakers for 2 hours while the anemone foot attaches to rockwork.',
      ],
    },
    specifications: {
      'Lighting Requirement': 'Moderate to High PAR (150–250 µmol/m²/s)',
      'Water Flow': 'Gentle to Medium indirect flow',
      'Host Species': 'All Amphiprion Clownfish',
    },
    recommendedPairings: ['designer-clownfish-pair', 'nemolight-aqua-marine-led'],
  },

  // ==========================================
  // 2. LIGHTING & ELECTRONICS
  // ==========================================
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
    badge: 'Client Favorite',
    inStock: true,
    stockCount: 14,
    images: [
      'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1000&q=85',
      'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1000&q=85',
    ],
    shortDesc: 'Full-spectrum coral growth lighting with automated sunrise, sunset, moonlight cycles, and iOS/Android smartphone control.',
    description: 'The NemoLight Aqua Marine Spectrum Series delivers optimal PAR output calibrated specifically for photosynthesis in delicate SPS, LPS corals, and glowing anemones. Features ultra-slim aircraft aluminum unibody housing with passive whisper-quiet cooling, custom spectrum channel mixing, and Bluetooth/WiFi app connectivity.',
    deliveryInfo: {
      estimatedDays: 'Dispatches in 24 Hours (Express 1-2 Days)',
      shippingMethod: 'Tracked Courier in Reinforced Foam Flight Box',
      guaranteeText: '3-Year Marine Grade Replacement Warranty',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '15 – 20 Minutes',
      mountingType: 'Adjustable Rim Mount & Ceiling Suspension Kit Included',
      steps: [
        'Unbox light fixture, power supply, and anodized aluminum mounting bracket.',
        'Secure bracket to rear or side glass rim (fits glass thickness 6mm to 25mm).',
        'Connect 24V waterproof DC power connector and plug into surge-protected outlet.',
        'Download the NemoLight App (iOS & Android) and scan fixture QR code for instant 24-hour sun cycle setup.',
      ],
      includedInBox: [
        'NemoLight Spectrum Fixture',
        'Universal Glass Edge Mounting Arm',
        'Stainless Steel Suspension Wire Kit',
        'MeanWell IP67 Power Supply',
        'Quick Setup Manual & App Guide',
      ],
    },
    specifications: {
      'Power Consumption': '72W (Standard) / 90W (Peak Spectrum)',
      'Dimensions': '60 cm × 12 cm × 1.8 cm',
      'Coverage Area': 'Up to 90 cm × 60 cm (36" × 24")',
      'PAR Output': 'Peak 480 µmol/m²/s @ 30cm depth',
      'Channels': 'UV, Royal Blue, Deep Blue, Cyan, 6500K Cold White, Deep Red',
      'Warranty': '3 Years Direct Replacement',
    },
    recommendedPairings: ['designer-clownfish-pair', 'rose-bubble-tip-anemone', 'real-reef-live-rock-20kg'],
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
    badge: 'Flagship Lighting',
    inStock: true,
    stockCount: 5,
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1000&q=85',
      'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1000&q=85',
    ],
    shortDesc: 'HEI2 optical system delivering 126.3-degree light spread with hyper-balanced color blending and Mobius control.',
    description: 'The pinnacle of reef lighting technology. The Radion G6 Pro expands light dispersion to an incredible 126 degrees, eliminating hot spots and creating uniform shimmer across wide luxury aquariums.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Tracked Courier',
      shippingMethod: 'Signature Express Shipping',
      guaranteeText: 'Manufacturer 2-Year Full Coverage',
    },
    installationGuide: {
      difficulty: 'Moderate',
      estimatedTime: '25 Minutes',
      steps: [
        'Mount using RMS Single Arm or Multi-Light Rail Kit.',
        'Pair with Mobius mobile app via Bluetooth.',
        'Select from pre-configured CoralLab growth profiles (AB+ spectrum recommended).',
      ],
      includedInBox: ['Radion XR30 Pro G6', 'Power Transformer', 'Power Cable', 'Documentation'],
    },
    specifications: {
      'Max Power': '215 Watts',
      'LED Clusters': '2 Multi-Diode Arrays (39 LEDs total)',
      'Dimensions': '30 cm × 18 cm × 3.9 cm',
      'Control Protocol': 'Mobius App (iOS / Android)',
    },
    recommendedPairings: ['nyos-quantum-160-skimmer', 'red-sea-coral-pro-salt'],
  },

  // ==========================================
  // 3. HARDSCAPE & LIVE ROCK
  // ==========================================
  {
    id: 'real-reef-live-rock-20kg',
    name: 'Real Reef™ Biological Premium Live Rock (20kg Box)',
    brand: 'Real Reef Aquascaping',
    category: 'rock-sand',
    categoryLabel: 'Rock & Sand',
    price: 245.00,
    originalPrice: 280.00,
    rating: 5.0,
    reviewsCount: 94,
    badge: 'Eco-Certified',
    inStock: true,
    stockCount: 18,
    images: [
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1000&q=85',
      'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1000&q=85',
    ],
    shortDesc: '100% pest-free bio-active cultured rock pigmented in natural purple coralline algae. Highly porous for beneficial bacteria colonization.',
    description: 'Crafted from 100% natural calcium carbonate and organic binders, Real Reef Rock is 100% eco-friendly and 0% wild-harvested. Pre-cured and infused with non-toxic natural coralline pigmentation, it contains zero unwanted hitchhikers (such as aiptasia, mantis shrimp, or flatworms) and is ready for immediate aquascaping.',
    deliveryInfo: {
      estimatedDays: '1-3 Business Days',
      shippingMethod: 'Heavy Freight Courier with Protective Bubble Cladding',
      guaranteeText: 'Zero Pest Guarantee',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '30 – 60 Minutes',
      steps: [
        'Rinse gently in fresh salt water or RO/DI water to clear packing dust.',
        'Assemble desired architectural formations using reef-safe hydraulic cement or marine epoxy putty.',
        'Place directly into the aquarium or sump filter.',
      ],
      includedInBox: ['Mixed assortment of arches, shelves, caves, and base rocks (Total 20kg / 44 lbs)'],
    },
    specifications: {
      'Weight': '20 kg / 44.1 lbs',
      'Material': 'Aragonite & Natural Calcium Carbonate matrix',
      'Pest Status': '100% Free of Aiptasia, Parasites, and Nuisance Algae',
      'Buffering': 'Naturally stabilizes pH at 8.2–8.4 and releases trace minerals',
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
      'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1000&q=85',
    ],
    shortDesc: 'Pristine Caribbean oolitic white sand containing millions of live nitrifying marine bacteria to accelerate aquarium cycling.',
    description: 'Packed live directly from the Caribbean seabed with pure seawater, this sugar-fine grain sand naturally maintains calcium and carbonate hardness while preventing toxic ammonia spikes in new setups.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Standard Courier',
      shippingMethod: 'Reinforced Sealed Heavy Bag',
      guaranteeText: 'Live Bacteria Viability Guaranteed',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '10 Minutes',
      steps: [
        'Do NOT wash or rinse (preserves beneficial live bacteria colonies).',
        'Distribute evenly across bottom glass to achieve a 2.5cm to 5cm (1-2 inch) natural bed depth.',
        'Slowly fill aquarium using a plate or bag to minimize sand disturbance.',
      ],
      includedInBox: ['10kg / 22 lbs Live Aragonite Sand in conditioned seawater pouch'],
    },
    specifications: {
      'Grain Size': '0.5 mm – 1.2 mm (Soft on bottom dwellers)',
      'Weight': '10 kg / 22 lbs',
      'Origin': 'Bahamas Banks (Ethically harvested)',
    },
    recommendedPairings: ['real-reef-live-rock-20kg', 'designer-clownfish-pair'],
  },

  // ==========================================
  // 4. SALTS & WATER CARE
  // ==========================================
  {
    id: 'red-sea-coral-pro-salt',
    name: 'Red Sea Coral Pro Salt (22kg Bucket / 660 Liters)',
    brand: 'Red Sea Marine',
    category: 'salt-chemistry',
    categoryLabel: 'Salt & Chemistry',
    price: 88.00,
    originalPrice: 98.00,
    rating: 5.0,
    reviewsCount: 142,
    badge: 'Reef Standard',
    inStock: true,
    stockCount: 30,
    images: [
      'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1000&q=85',
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1000&q=85',
    ],
    shortDesc: 'Harvested from the pure waters of the Red Sea, elevated with biologically balanced ratios of Calcium, Magnesium, and Carbonates.',
    description: 'Formulated specifically for accelerated coral growth and vibrant polyp extension in reef aquariums. Contains perfectly balanced ratios of Foundation Elements (Ca 450ppm, Mg 1350ppm, dKH 12.0 at 1.025 SG) without any nitrate or phosphate contaminants.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Fast Dispatch',
      shippingMethod: 'Heavy Package Courier with Heavy-Duty Sealed Bucket',
      guaranteeText: '100% Authentic Sealed Red Sea Factory Batch',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '20 Minutes',
      steps: [
        'Always add salt to water — NEVER add water to salt.',
        'Use pure RO/DI water at 20°C – 25°C.',
        'Mix 38.2 grams of salt per 1 Liter of RO/DI water for 1.025 SG.',
        'Aerate with a small pump for 15 minutes until crystal clear, then introduce to aquarium.',
      ],
      includedInBox: ['22kg Airtight Resealable Heavy Duty Bucket with measuring scoop'],
    },
    specifications: {
      'Yield': 'Up to 660 Liters / 175 Gallons of pure reef seawater',
      'Calcium (Ca)': '450 ppm ± 15 ppm',
      'Magnesium (Mg)': '1,350 ppm ± 30 ppm',
      'Alkalinity (dKH)': '11.5 – 12.2 dKH',
      'Nitrates / Phosphates': '0.00 ppm (Ultra Pure)',
    },
    recommendedPairings: ['nemolight-aqua-marine-led', 'real-reef-live-rock-20kg'],
  },
  {
    id: 'ro-di-7stage-purifier',
    name: 'HydroPure 7-Stage 150GPD Reverse Osmosis / Deionization (RO/DI) Station',
    brand: 'HydroPure Systems',
    category: 'salt-chemistry',
    categoryLabel: 'Salt & Chemistry',
    price: 265.00,
    rating: 4.9,
    reviewsCount: 33,
    badge: '0 TDS Pure Water',
    inStock: true,
    stockCount: 8,
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1000&q=85',
      'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=1000&q=85',
    ],
    shortDesc: 'Guarantees 0.00 TDS laboratory-grade water for zero-algae reef mixing and automated evaporation top-off.',
    description: 'Equipped with dual pressure gauges, inline dual TDS meter, sediment pre-filter, dual catalytic carbon blocks, high-rejection 150GPD membrane, and dual color-changing DI resin chambers. Eliminates 99.9% of all chloramines, copper, heavy metals, and silicates.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Express Tracked',
      shippingMethod: 'Rigid Foam Packaged Box',
      guaranteeText: '2-Year Hardware Guarantee',
    },
    installationGuide: {
      difficulty: 'Moderate',
      estimatedTime: '20 – 30 Minutes',
      steps: [
        'Mount metal bracket to wall near cold water supply and drain line.',
        'Connect 1/2" brass faucet adapter or piercing saddle valve to water inlet.',
        'Run blue line to salt-mixing reservoir and black line to drain sink.',
        'Flush membrane for 10 minutes prior to first salt batch collection.',
      ],
      includedInBox: [
        'Pre-Assembled 7-Stage RO/DI Unit',
        'Dual Inline Digital TDS Meter',
        'Pressure Gauge & Auto-Shutoff Valve',
        'Filter Housing Wrench & Tubing Kit',
      ],
    },
    specifications: {
      'Production Rate': '150 Gallons Per Day (~23 Liters per hour)',
      'Product Water TDS': '0.00 PPM',
      'Recovery Ratio': '1:1.5 High Efficiency',
    },
    recommendedPairings: ['red-sea-coral-pro-salt'],
  },

  // ==========================================
  // 5. HARDWARE, SKIMMERS & PUMPS
  // ==========================================
  {
    id: 'nyos-quantum-160-skimmer',
    name: 'Nyos® Quantum 160 High-Performance Protein Skimmer',
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
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1000&q=85',
    ],
    shortDesc: 'Engineered in Germany with Hybrid Wheel technology. Produces micro-fine bubble foam for silent, crystal-clear water purification.',
    description: 'The Nyos Quantum 160 sets the standard for whisper-quiet protein skimming. Its transparent Clear-View body and needle-wheel impeller strip organic waste, proteins, and dissolved toxins before they can break down into nitrates and phosphates.',
    deliveryInfo: {
      estimatedDays: '1-2 Days Tracked Courier',
      shippingMethod: 'Reinforced Box with Custom Molded Foam',
      guaranteeText: '2-Year Manufacturer Warranty',
    },
    installationGuide: {
      difficulty: 'Plug & Play',
      estimatedTime: '15 Minutes',
      steps: [
        'Place skimmer in sump chamber with constant water depth of 20cm – 22cm.',
        'Plug in Quantum pump power adapter.',
        'Rotate precision micro-adjustment screw to set foam level at base of collection cup neck.',
        'Empty collection cup weekly or connect drain hose to waste container.',
      ],
      includedInBox: ['Quantum 160 Skimmer Body', 'Quantum 3.0 Pump', 'Air Silencer', 'Adjustment Valve'],
    },
    specifications: {
      'Tank Size Rating': '250 – 1,000 Liters (65 – 260 Gallons)',
      'Power Consumption': '18 Watts',
      'Air Draw': '1,500 Liters / Hour',
      'Footprint Dimensions': '18.5 cm × 25 cm × 53 cm',
      'Noise Level': '< 28 dB (Whisper Silent)',
    },
    recommendedPairings: ['red-sea-coral-pro-salt', 'designer-clownfish-pair'],
  },
];
