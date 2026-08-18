import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Installation — Professional Aquarium Installation',
  description:
    'Expert aquarium installation by Marine Creatures. Precision engineering for residential, commercial and hospitality environments.',
};

const STAGES = [
  {
    step: '01',
    title: 'Site Engineering & Floor Load Verification',
    desc: 'Structural engineer review for live weight load distribution (often 1,000kg+ per cubic meter), electrical isolation, and plumbing access channels.',
  },
  {
    step: '02',
    title: 'Cabinetry & Monolithic Tank Positioning',
    desc: 'Laser-leveled structural steel framing, anti-vibration neoprene bedding, and crane or robotic placement of acrylic/glass viewing panels.',
  },
  {
    step: '03',
    title: 'Precision Sump & Life Support Plumbing',
    desc: 'High-flow, whisper-quiet Schedule 80 PVC hard-plumbing with true union check valves, dual BeanAnimal overflow drains, and emergency backups.',
  },
  {
    step: '04',
    title: 'Reverse Osmosis Hydration & Salt Mixing',
    desc: 'Purified 0-TDS water production, laboratory grade reef salt synthesis, and thermal stabilization before any biological introduction.',
  },
  {
    step: '05',
    title: 'Aquascaping & Nitrogen Cycling',
    desc: 'Artistic underwater terrain sculpting followed by bio-augmentation to cultivate healthy beneficial bacteria colonies.',
  },
  {
    step: '06',
    title: 'Acclimation & VIP Client Handover',
    desc: 'Drip acclimation of quarantined marine life, IoT app pairing, and tailored operational orientation for your staff or household.',
  },
];

export default function InstallationPage() {
  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '65vh', minHeight: '480px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1612629808341-9de2462b1b8b?w=1920&q=85"
          alt="Aquarium Installation"
          className="absolute inset-0 w-full h-full object-cover opacity-45"
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">ENGINEERING EXCELLENCE</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Precision<br /><em>Installation.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-lg leading-relaxed" style={{ fontSize: '0.9375rem' }}>
            From structural load distribution to acoustic dampening, our engineering protocols ensure flawless installation with zero compromise.
          </p>
        </div>
      </div>

      {/* Process Section */}
      <div className="container-max pt-16 pb-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">

          <div className="lg:col-span-5">
            <span className="text-label text-[--color-accent] block mb-3">OUR PROTOCOL</span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light leading-snug mb-6">
              Flawless execution at every millimeter.
            </h2>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-6" style={{ fontSize: '0.9375rem' }}>
              Marine installations require a rare synthesis of heavy civil engineering, delicate marine biochemistry, and immaculate architectural finish.
            </p>
            <p className="font-body font-light text-[--color-muted] leading-loose mb-8" style={{ fontSize: '0.9375rem' }}>
              Our dedicated white-glove installation crew ensures that every pipe, sensor, and cable is completely concealed while remaining effortlessly serviceable.
            </p>
            <Link href="/contact" className="btn-primary inline-flex" data-cursor="ENTER">
              SCHEDULE A SITE INSPECTION →
            </Link>
          </div>

          <div className="lg:col-span-7 space-y-6">
            {STAGES.map((stage) => (
              <div
                key={stage.step}
                className="p-6 border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,184,217,0.3)] transition-colors duration-300 bg-[rgba(7,21,28,0.4)] flex gap-6"
              >
                <span className="text-label text-[--color-accent] shrink-0 font-body text-base mt-0.5">
                  {stage.step}
                </span>
                <div>
                  <h3 className="font-display text-xl text-[--color-text] font-light mb-2">
                    {stage.title}
                  </h3>
                  <p className="font-body font-light text-[--color-muted] text-xs leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safety & Guarantee Banner */}
        <div className="p-10 border border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.6)] grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <span className="font-display text-3xl text-[--color-accent] block mb-2">100%</span>
            <span className="text-label text-[--color-muted]">LEAK-TESTED UNDER PRESSURE</span>
          </div>
          <div>
            <span className="font-display text-3xl text-[--color-accent] block mb-2">24/7</span>
            <span className="text-label text-[--color-muted]">EMERGENCY PROTOCOL SUPPORT</span>
          </div>
          <div>
            <span className="font-display text-3xl text-[--color-accent] block mb-2">10-YR</span>
            <span className="text-label text-[--color-muted]">STRUCTURAL SEAM WARRANTY</span>
          </div>
        </div>
      </div>
    </div>
  );
}

