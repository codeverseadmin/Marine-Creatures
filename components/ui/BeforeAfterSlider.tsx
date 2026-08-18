'use client';

import { useRef, useState, useCallback } from 'react';

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = 'Before',
  afterAlt = 'After',
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50); // percentage
  const isDragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    setPosition(pct);
  }, []);

  // Mouse events
  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    updatePosition(e.clientX);

    const onMove = (e: MouseEvent) => { if (isDragging.current) updatePosition(e.clientX); };
    const onUp = () => { isDragging.current = false; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
    window.removeEventListener('mousemove', onMove);

    // Cleaner approach
    const moveHandler = (e: MouseEvent) => updatePosition(e.clientX);
    const upHandler = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', moveHandler);
    };
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler, { once: true });
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    updatePosition(e.touches[0].clientX);
  };

  // Click on container
  const onContainerClick = (e: React.MouseEvent) => {
    updatePosition(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className="ba-slider w-full h-full select-none"
      onClick={onContainerClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      role="slider"
      aria-label="Before and after comparison"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 5));
        if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 5));
      }}
    >
      {/* After image — full width base */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterSrc}
        alt={afterAlt}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before image — clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={beforeSrc}
          alt={beforeAlt}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: `${10000 / position}%`, maxWidth: 'none' }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <div className="absolute top-6 left-6 text-label text-[--color-text] bg-[rgba(0,0,0,0.5)] px-3 py-1.5 backdrop-blur-sm">
        BEFORE
      </div>
      <div className="absolute top-6 right-6 text-label text-[--color-text] bg-[rgba(0,0,0,0.5)] px-3 py-1.5 backdrop-blur-sm">
        AFTER
      </div>

      {/* Handle */}
      <div
        className="ba-handle"
        style={{ left: `${position}%` }}
        onMouseDown={onMouseDown}
      >
        {/* Glow line */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent, rgba(0,184,217,0.6) 50%, transparent)',
            boxShadow: '0 0 20px rgba(0,184,217,0.4)',
          }}
        />
        {/* Grip circle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(0,184,217,0.15)',
            border: '1px solid rgba(0,184,217,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 5H13M1 5L4 2M1 5L4 8M13 5L10 2M13 5L10 8" stroke="rgba(0,184,217,0.9)" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}
