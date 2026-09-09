import Link from 'next/link';
import { OceanParticles } from '@/components/ui/OceanParticles';

export default function NotFound() {
  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden"
      style={{ background: 'var(--color-primary)' }}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1920&q=70"
          alt=""
          className="w-full h-full object-cover opacity-10"
        />

        <div className="absolute inset-0" style={{ background: 'rgba(2,7,11,0.8)' }} />
      </div>

      {/* Particles */}
      <OceanParticles count={25} className="z-1" />

      <div className="relative z-10 container-max">
        <span className="text-label text-[--color-accent] tracking-[0.3em] block mb-8">404</span>

        <h1 className="font-display text-display-lg text-[--color-text] font-light mb-6">
          Lost Beneath<br /><em>The Surface?</em>
        </h1>

        <p className="font-body font-light text-[--color-muted] max-w-md mx-auto leading-relaxed mb-12" style={{ fontSize: '0.9375rem' }}>
          The page you are looking for has drifted into deeper waters. Let us guide you back.
        </p>

        <Link
          href="/"
          className="btn-primary inline-flex rounded-xl text-xs py-3.5 px-8 shadow-xl active:scale-95 transition-transform"
          data-cursor="ENTER"
        >
          RETURN TO MARINE CREATURES
          <span className="text-[--color-primary]">→</span>
        </Link>
      </div>
    </div>
  );
}
