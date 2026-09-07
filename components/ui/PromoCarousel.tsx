'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/lib/context/CatalogContext';
import { BannerSlide } from '@/lib/data/banners';

export function PromoCarousel() {
  const { banners } = useCatalog();
  const activeBanners = banners.filter((b) => b.isActive);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = activeBanners.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-play interval
  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, nextSlide, currentIndex]);

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchDeltaXRef.current = 0;
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null) {
      touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null) {
      if (touchDeltaXRef.current < -50) {
        nextSlide();
      } else if (touchDeltaXRef.current > 50) {
        prevSlide();
      }
    }
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;
    setIsPaused(false);
  };

  if (total === 0) return null;

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden border border-[rgba(255,255,255,0.1)] shadow-2xl bg-[rgba(2,7,11,0.9)] group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-roledescription="carousel"
      aria-label="Promotional Updates and Live Announcements"
    >
      {/* Sliding Strip Container */}
      <div
        className="flex transition-transform duration-700 ease-out will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {activeBanners.map((slide: BannerSlide, idx: number) => (
          <div
            key={slide.id}
            className="w-full shrink-0 relative min-h-[360px] sm:min-h-[420px] md:min-h-[460px] flex items-center"
          >
            {/* Background Image with Deep Vignette */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover object-center"
              loading={idx === 0 ? 'eager' : 'lazy'}
            />

            {/* Gradient Darkening & Accent Glow */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-[rgba(2,7,11,0.95)] via-[rgba(2,7,11,0.75)] to-[rgba(2,7,11,0.3)]"
              aria-hidden="true"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[rgba(2,7,11,0.95)] via-transparent to-[rgba(2,7,11,0.3)]"
              aria-hidden="true"
            />

            {/* Slide Content */}
            <div className="relative z-10 container-max py-10 sm:py-14 max-w-3xl">
              {/* Badge */}
              <div className="mb-3 sm:mb-4">
                <span
                  className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-md"
                  style={{
                    backgroundColor: 'rgba(2, 7, 11, 0.75)',
                    border: `1px solid ${slide.badgeColor || 'var(--color-accent)'}`,
                    color: slide.badgeColor || 'var(--color-accent)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: slide.badgeColor || 'var(--color-accent)' }}
                  />
                  {slide.badge}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl text-white font-light leading-tight mb-2 sm:mb-3">
                {slide.title}
              </h2>

              {/* Subtitle */}
              <p className="font-body text-xs sm:text-sm md:text-base text-slate-300 font-medium mb-3 sm:mb-4">
                {slide.subtitle}
              </p>

              {/* Description */}
              {slide.desc && (
                <p className="font-body text-xs sm:text-sm text-slate-400 font-light max-w-xl line-clamp-2 sm:line-clamp-3 mb-6 sm:mb-8 leading-relaxed">
                  {slide.desc}
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  href={slide.ctaLink}
                  className="btn-primary text-xs py-3.5 px-6 sm:px-8 rounded-xl font-semibold tracking-wider uppercase shadow-xl active:scale-95 transition-transform"
                  data-cursor="EXPLORE"
                >
                  {slide.ctaText}
                </Link>

                {slide.secondaryCtaText && slide.secondaryCtaLink && (
                  <Link
                    href={slide.secondaryCtaLink}
                    className="btn-ghost text-xs py-3.5 px-6 rounded-xl font-medium tracking-wider uppercase border-white/20 hover:border-white text-white active:scale-95 transition-transform"
                    data-cursor="VIEW"
                  >
                    {slide.secondaryCtaText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prev / Next Chevrons */}
      {total > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/15 bg-black/50 hover:bg-black/80 hover:border-white/40 text-white flex items-center justify-center transition-all backdrop-blur-md opacity-80 group-hover:opacity-100 active:scale-90"
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/15 bg-black/50 hover:bg-black/80 hover:border-white/40 text-white flex items-center justify-center transition-all backdrop-blur-md opacity-80 group-hover:opacity-100 active:scale-90"
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Slide Indicators & Auto-play Progress Bar */}
      {total > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 right-6 z-20 flex items-center gap-2">
          {activeBanners.map((_, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentIndex
                  ? 'w-8 bg-[--color-accent] shadow-[0_0_12px_rgba(0,184,217,0.8)]'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
