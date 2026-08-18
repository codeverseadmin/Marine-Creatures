// =============================================================================
// Marine Creatures — Species Data
// CMS-ready structure for all marine species
// =============================================================================

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  category: 'fish' | 'coral' | 'invertebrate' | 'reef';
  image: string;
  gallery?: string[];
  description: string;
  size: string;
  temperament: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Expert';
  diet: string;
  waterType: string;
  availability: 'Available' | 'Limited' | 'On Request';
  featured?: boolean;
}

// Using known stable Unsplash photo IDs for marine subjects
const UNS = 'https://images.unsplash.com/photo-';

export const SPECIES: Species[] = [
  {
    id: 'emperor-angelfish',
    name: 'Emperor Angelfish',
    scientificName: 'Pomacanthus imperator',
    category: 'fish',
    image: `${UNS}1601459427108-47e20b8dcd65?w=1200&q=85`,
    description:
      'One of the most visually stunning marine fish, the Emperor Angelfish features a bold pattern of horizontal blue and yellow stripes. Juveniles display a completely different pattern of white curved lines on a dark blue body, transforming dramatically as they mature.',
    size: '30–40 cm',
    temperament: 'Semi-aggressive',
    difficulty: 'Expert',
    diet: 'Omnivore — sponges, algae, small invertebrates',
    waterType: 'Saltwater Marine',
    availability: 'On Request',
    featured: true,
  },
  {
    id: 'mandarin-fish',
    name: 'Mandarin Fish',
    scientificName: 'Synchiropus splendidus',
    category: 'fish',
    image: `${UNS}1582967788606-a171c1080cb0?w=1200&q=85`,
    description:
      'Regarded as one of the most spectacularly coloured fish in the ocean, the Mandarin Fish displays an intricate pattern of electric blue, orange and green. A true jewel of the reef and a prized addition to any mature reef aquarium.',
    size: '6–8 cm',
    temperament: 'Peaceful',
    difficulty: 'Expert',
    diet: 'Carnivore — copepods, amphipods',
    waterType: 'Saltwater Marine Reef',
    availability: 'On Request',
    featured: true,
  },
  {
    id: 'clownfish',
    name: 'Ocellaris Clownfish',
    scientificName: 'Amphiprion ocellaris',
    category: 'fish',
    image: `${UNS}1535591273668-578e31182c4f?w=1200&q=85`,
    description:
      'The iconic Ocellaris Clownfish forms a symbiotic relationship with sea anemones, rarely venturing far from their host. Their vivid orange and white colouration makes them a perennial favourite in marine aquariums of all sizes.',
    size: '8–11 cm',
    temperament: 'Peaceful',
    difficulty: 'Beginner',
    diet: 'Omnivore — algae, zooplankton',
    waterType: 'Saltwater Marine',
    availability: 'Available',
    featured: true,
  },
  {
    id: 'blue-tang',
    name: 'Blue Tang',
    scientificName: 'Paracanthurus hepatus',
    category: 'fish',
    image: `${UNS}1546026423-cc4642628d2b?w=1200&q=85`,
    description:
      'The Blue Tang, with its vivid royal blue body and yellow tail fin, brings vibrant colour to any reef aquarium. An active and graceful swimmer that creates a sense of natural ocean movement throughout the tank.',
    size: '25–31 cm',
    temperament: 'Semi-aggressive',
    difficulty: 'Intermediate',
    diet: 'Herbivore — algae, marine vegetation',
    waterType: 'Saltwater Marine Reef',
    availability: 'Available',
    featured: true,
  },
  {
    id: 'lionfish',
    name: 'Volitans Lionfish',
    scientificName: 'Pterois volitans',
    category: 'fish',
    image: `${UNS}1583212292454-1fe6229603b7?w=1200&q=85`,
    description:
      'The Volitans Lionfish is a dramatic and architectural presence in any aquarium. Its elaborate fan-like pectoral fins and bold red-and-white striped pattern create a living sculpture. Reserved for experienced aquarists due to its venomous spines.',
    size: '35–40 cm',
    temperament: 'Predatory',
    difficulty: 'Intermediate',
    diet: 'Carnivore — small fish, crustaceans',
    waterType: 'Saltwater Marine',
    availability: 'On Request',
    featured: false,
  },
  {
    id: 'moorish-idol',
    name: 'Moorish Idol',
    scientificName: 'Zanclus cornutus',
    category: 'fish',
    image: `${UNS}1559827260-dc66d52bef19?w=1200&q=85`,
    description:
      'With its dramatic elongated dorsal fin and bold black, white and yellow banding, the Moorish Idol is one of the ocean\'s most elegant species. A challenging but extraordinarily rewarding specimen for the dedicated aquarist.',
    size: '18–23 cm',
    temperament: 'Peaceful',
    difficulty: 'Expert',
    diet: 'Omnivore — sponges, tunicates',
    waterType: 'Saltwater Marine Reef',
    availability: 'On Request',
    featured: false,
  },
];

export const FEATURED_SPECIES = SPECIES.filter((s) => s.featured);
