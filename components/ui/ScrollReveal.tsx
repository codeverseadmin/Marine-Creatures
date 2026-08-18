'use client';

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'fade';
}

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  style,
  ...rest
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const from =
      direction === 'up'
        ? { opacity: 0, y: 40 }
        : { opacity: 0 };

    const to =
      direction === 'up'
        ? { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay }
        : { opacity: 1, duration: 0.8, ease: 'power2.out', delay };

    gsap.fromTo(el, from, {
      ...to,
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
    });
  }, [delay, direction]);

  return (
    <div ref={ref} className={className} style={{ opacity: 0, ...style }} {...rest}>
      {children}
    </div>
  );
}
