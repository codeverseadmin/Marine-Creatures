'use client';

import { useEffect, useRef, useState } from 'react';

interface CursorState {
  label: string;
  expanded: boolean;
}

const defaultState: CursorState = { label: '', expanded: false };

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>(defaultState);
  const [isTouch, setIsTouch] = useState(true); // default true until confirmed desktop

  useEffect(() => {
    // Detect touch device
    setIsTouch(window.matchMedia('(hover: none)').matches);

    if (window.matchMedia('(hover: none)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animFrame: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      // Dot follows mouse exactly
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;

      // Ring follows with lag
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;

      animFrame = requestAnimationFrame(animate);
    };

    const onEnterInteractive = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      const label = el.dataset.cursor || '';
      setState({ label, expanded: true });
    };

    const onLeaveInteractive = () => {
      setState(defaultState);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    animFrame = requestAnimationFrame(animate);

    // Attach to all interactive elements
    const interactives = document.querySelectorAll<HTMLElement>(
      'a, button, [data-cursor]'
    );
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', onEnterInteractive);
      el.addEventListener('mouseleave', onLeaveInteractive);
    });

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animFrame);
      interactives.forEach((el) => {
        el.removeEventListener('mouseenter', onEnterInteractive);
        el.removeEventListener('mouseleave', onLeaveInteractive);
      });
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="cursor-dot"
        style={{
          width: state.expanded ? '80px' : '8px',
          height: state.expanded ? '80px' : '8px',
          background: state.expanded ? 'rgba(0,184,217,0.1)' : 'var(--color-accent)',
          border: state.expanded ? '1px solid rgba(0,184,217,0.5)' : 'none',
        }}
        aria-hidden="true"
      >
        {state.label && (
          <span
            className="cursor-label"
            style={{ opacity: state.expanded ? 1 : 0 }}
          >
            {state.label}
          </span>
        )}
      </div>

      {/* Ring */}
      <div
        ref={ringRef}
        className="cursor-ring"
        style={{
          width: state.expanded ? '0px' : '40px',
          height: state.expanded ? '0px' : '40px',
          opacity: state.expanded ? 0 : 1,
        }}
        aria-hidden="true"
      />
    </>
  );
}
