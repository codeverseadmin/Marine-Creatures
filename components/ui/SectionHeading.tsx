'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SectionHeadingProps {
  id?: string;
  label?: string;
  heading: string[];
  subheading?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  accentLine?: boolean;
}

export function SectionHeading({
  id,
  label,
  heading,
  subheading,
  align = 'left',
  className = '',
  accentLine = true,
}: SectionHeadingProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lines = container.querySelectorAll('.heading-line');
    const labelEl = container.querySelector('.heading-label');
    const sub = container.querySelector('.heading-sub');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top 80%',
        once: true,
      },
    });

    if (labelEl) {
      tl.fromTo(labelEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
    }

    tl.fromTo(
      lines,
      { y: '100%', opacity: 0 },
      { y: '0%', opacity: 1, duration: 0.9, stagger: 0.1, ease: 'power3.out' },
      labelEl ? '-=0.3' : 0
    );

    if (sub) {
      tl.fromTo(sub, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, '-=0.4');
    }

    return () => {
      tl.kill();
    };
  }, []);

  const alignClass =
    align === 'center'
      ? 'text-center items-center'
      : align === 'right'
      ? 'text-right items-end'
      : 'text-left items-start';

  return (
    <div ref={containerRef} className={`flex flex-col ${alignClass} ${className}`}>
      {label && (
        <div className="heading-label flex items-center gap-3 mb-6">
          {accentLine && align !== 'center' && (
            <span className="accent-line" />
          )}
          <span className="text-label text-[--color-accent]">{label}</span>
        </div>
      )}

      <h2 id={id} className="font-display text-display-lg text-[--color-text] font-light overflow-hidden">
        {heading.map((line, i) => (
          <span key={i} className="block overflow-hidden">
            <span className="heading-line block">{line}</span>
          </span>
        ))}
      </h2>

      {subheading && (
        <p className="heading-sub mt-6 text-[--color-muted] font-body font-light leading-relaxed max-w-xl" style={{ fontSize: '0.9375rem' }}>
          {subheading}
        </p>
      )}
    </div>
  );
}
