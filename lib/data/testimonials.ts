// =============================================================================
// Marine Creatures — Testimonials Data
// =============================================================================

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  project: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    quote:
      'The aquarium completely transformed our living room. It\'s the first thing every guest notices — a living reef that feels genuinely extraordinary in our home.',
    author: 'S. Agarwal',
    role: 'Private Residence',
    project: 'Custom Reef Installation — Kolkata',
  },
  {
    id: '2',
    quote:
      'Marine Creatures understood our vision from the very first conversation. The result isn\'t just an aquarium — it is living architecture that defines our office.',
    author: 'R. Mehta',
    role: 'Managing Director',
    project: 'Corporate Lobby Reef — Mumbai',
  },
  {
    id: '3',
    quote:
      'What had become a neglected, troubled tank is now the defining feature of our entire home. The biological renovation exceeded every expectation we had.',
    author: 'P. Chatterjee',
    role: 'Private Residence',
    project: 'Full Aquarium Renovation — Kolkata',
  },
];
