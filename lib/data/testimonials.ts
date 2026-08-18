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
      'The aquarium completely changed the character of our space. It\'s the first thing every guest notices — and the last thing they stop talking about.',
    author: 'Client Name',
    role: 'Private Residence',
    project: 'Residential Reef Installation',
  },
  {
    id: '2',
    quote:
      'Marine Creatures understood our brief from the very first conversation. The result isn\'t just an aquarium — it\'s a piece of living architecture.',
    author: 'Client Name',
    role: 'Corporate Director',
    project: 'Commercial Lobby Installation',
  },
  {
    id: '3',
    quote:
      'The transformation was extraordinary. What had become a neglected tank is now the defining feature of the entire room. The renovation exceeded every expectation.',
    author: 'Client Name',
    role: 'Private Residence',
    project: 'Aquarium Renovation',
  },
];
