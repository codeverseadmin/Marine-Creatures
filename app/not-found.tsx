import Link from 'next/link';

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
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-1" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `${Math.random() * 60}%`,
              animationDuration: `${8 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 6}s`,
              opacity: 0,
              animationName: 'particle-drift',
              animationTimingFunction: 'linear',
              animationIterationCount: 'infinite',
            }}
          />
        ))}
      </div>

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
          className="btn-primary inline-flex"
          data-cursor="ENTER"
        >
          RETURN TO MARINE CREATURES
          <span className="text-[--color-primary]">→</span>
        </Link>
      </div>
    </div>
  );
}
