'use client';

import { useEffect, useState } from 'react';

interface Particle {
  left: string;
  bottom: string;
  width: string;
  height: string;
  duration: string;
  delay: string;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    left: `${Math.random() * 100}%`,
    bottom: `${5 + Math.random() * 55}%`,
    width: `${1 + Math.random() * 2}px`,
    height: `${1 + Math.random() * 2}px`,
    duration: `${8 + Math.random() * 12}s`,
    delay: `${Math.random() * 10}s`,
  }));
}

interface OceanParticlesProps {
  count?: number;
  className?: string;
}

/**
 * Client-only particle system — rendered only after hydration to avoid SSR mismatch.
 */
export function OceanParticles({ count = 50, className = '' }: OceanParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  // Only generate on the client after mount to avoid hydration mismatch
  useEffect(() => {
    setParticles(generateParticles(count));
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: p.left,
            bottom: p.bottom,
            width: p.width,
            height: p.height,
            opacity: 0,
            animationName: 'particle-drift',
            animationDuration: p.duration,
            animationDelay: p.delay,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      ))}
    </div>
  );
}
