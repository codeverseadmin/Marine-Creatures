import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Materials — Premium Reef & Aquascaping Materials',
  description: 'Premium aquarium materials, reef structures, substrates and equipment curated by Marine Creatures for extraordinary aquarium environments.',
};

const CATEGORIES = [
  {
    name: 'Live Rock',
    desc: 'Premium cured live rock forming the architectural foundation of any reef aquarium.',
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=80',
  },
  {
    name: 'Reef Structures',
    desc: 'Handcrafted ceramic and natural reef structures for aquascape composition.',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=80',
  },
  {
    name: 'Substrates',
    desc: 'Fine aragonite sand, crushed coral and speciality substrates for reef and fish environments.',
    image: 'https://images.unsplash.com/photo-1543721513-e83f95e6fdc4?w=800&q=80',
  },
  {
    name: 'Premium Equipment',
    desc: 'Filtration, skimmers, lighting, dosing and controller systems from leading manufacturers.',
    image: 'https://images.unsplash.com/photo-1612629808341-9de2462b1b8b?w=800&q=80',
  },
];

export default function MaterialsPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      <div className="relative flex items-end overflow-hidden" style={{ height: '55vh', minHeight: '400px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=1920&q=85" alt="Marine Materials" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(2,7,11,0.1) 0%, rgba(2,7,11,0.95) 100%)' }} />
        <div className="container-max relative z-10 pb-14">
          <span className="text-label text-[--color-accent] block mb-4">MATERIALS</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">The Raw Beauty<br /><em>of the Reef.</em></h1>
        </div>
      </div>
      <div className="container-max section">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CATEGORIES.map((cat) => (
            <div key={cat.name} className="group">
              <div className="overflow-hidden mb-4" style={{ aspectRatio: '16/9' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
              </div>
              <h2 className="font-display text-display-sm text-[--color-text] font-light mb-2">{cat.name}</h2>
              <p className="font-body font-light text-[--color-muted] text-sm leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">ENQUIRE ABOUT MATERIALS →</Link>
        </div>
      </div>
    </div>
  );
}
