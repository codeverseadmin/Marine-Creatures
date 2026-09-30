'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

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
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);

  // Auto-dismiss drag hint after 2.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const dismissHint = () => setShowHint(false);

  const updatePosition = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = Math.max(2, Math.min(98, (x / rect.width) * 100));
    setPosition(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dismissHint();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  return (
    <div
      ref={containerRef}
      className="ba-slider relative w-full h-full select-none overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] cursor-ew-resize touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-label="Before and after comparison slider"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        dismissHint();
        if (e.key === 'ArrowLeft') setPosition((p) => Math.max(0, p - 5));
        if (e.key === 'ArrowRight') setPosition((p) => Math.min(100, p + 5));
      }}
    >
      {/* After image — full width base */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={afterSrc}
        alt={afterAlt}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        draggable={false}
      />

      {/* Before image — clipped */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
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
      <div className="absolute top-3.5 left-3.5 text-[10px] uppercase tracking-wider font-semibold text-white bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10 pointer-events-none">
        BEFORE
      </div>
      <div className="absolute top-3.5 right-3.5 text-[10px] uppercase tracking-wider font-semibold text-white bg-black/70 px-2.5 py-1 rounded-md backdrop-blur-md border border-white/10 pointer-events-none">
        AFTER
      </div>

      {/* Handle */}
      <div
        className="absolute top-0 bottom-0 z-10 w-0.5 bg-white shadow-[0_0_12px_rgba(0,184,217,0.8)] pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        {/* Grip circle */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center border transition-transform ${
            isDragging
              ? 'scale-110 border-[--color-accent] bg-[rgba(0,184,217,0.4)] shadow-[0_0_20px_rgba(0,184,217,0.8)]'
              : 'border-white/80 bg-[rgba(2,7,11,0.8)] shadow-lg'
          } backdrop-blur-md`}
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="text-white">
            <path d="M1 5H13M1 5L4 2M1 5L4 8M13 5L10 2M13 5L10 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      {/* DRAG TO REVEAL hint — subtle, discoverable, auto-dismisses on interaction or after 2.5s */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 transition-all duration-500 ${
          showHint ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        aria-hidden="true"
      >
        <div className="bg-[rgba(2,7,11,0.88)] backdrop-blur-xl border border-[var(--color-accent)]/40 rounded-2xl px-5 py-2.5 flex items-center gap-2.5 shadow-2xl shadow-cyan-950/60">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8L22 12L18 16" />
            <path d="M6 8L2 12L6 16" />
            <path d="M2 12H22" />
          </svg>
          <span className="text-[11px] font-bold text-white tracking-[0.2em] uppercase">DRAG TO REVEAL</span>
        </div>
      </div>
    </div>
  );
}
