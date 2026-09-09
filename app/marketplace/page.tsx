'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/lib/context/CatalogContext';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { PromoCarousel } from '@/components/ui/PromoCarousel';

// Icon + short label — instantly scannable on any screen size
const CATEGORIES = [
  { id: 'all',            label: 'All',      icon: '🌊' },
  { id: 'marine-life',    label: 'Fish',     icon: '🐟' },
  { id: 'lighting-tech',  label: 'Lighting', icon: '💡' },
  { id: 'rock-sand',      label: 'Rock',     icon: '🪨' },
  { id: 'salt-chemistry', label: 'Salts',    icon: '🧪' },
  { id: 'hardware',       label: 'Gear',     icon: '⚙️' },
];

export default function MarketplacePage() {
  const { products, isCloudSynced } = useCatalog();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.scientificName && item.scientificName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const selectedCat = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* ── Marketplace Header ─────────────────────────────────────────── */}
      <div className="pt-28 sm:pt-36 md:pt-40 pb-6 sm:pb-10 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[rgba(6,20,29,0.95)] to-[var(--color-primary)]">
        <div className="container-max space-y-5 sm:space-y-6">

          {/* Row 1: Title + Search + Sort */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2.5">
                <span className="w-2 h-2 rounded-full bg-[--color-accent] animate-pulse" />
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent]">
                  OFFICIAL MARINE STORE
                </span>
                {!isCloudSynced && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-[10px] font-semibold text-cyan-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Syncing…
                  </span>
                )}
              </div>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl text-white font-light tracking-tight">
                Marine Marketplace
              </h1>
              <p className="font-body text-xs sm:text-sm text-slate-400 font-normal mt-1 sm:mt-2 max-w-xl leading-relaxed">
                Captive-bred livestock, lighting, live rock, salts &amp; precision gear — shipped live across India.
              </p>
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-72">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px', paddingRight: '36px' }}
                  className="w-full h-11 rounded-2xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.08)] transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3 rounded-2xl bg-[rgba(10,25,35,0.95)] border border-[rgba(255,255,255,0.12)] text-xs text-white focus:outline-none focus:border-[--color-accent] cursor-pointer shrink-0"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">↑ Price</option>
                <option value="price-desc">↓ Price</option>
              </select>
            </div>
          </div>

          {/* Promo Carousel */}
          <div className="pt-2">
            <PromoCarousel />
          </div>

          {/* Row 3: Category Chips + Item Count */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            {/* Icon-pill filter tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-momentum py-1">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    title={cat.label}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${
                      isActive
                        ? 'bg-[--color-accent] text-[--color-primary] shadow-[0_2px_12px_rgba(0,184,217,0.45)] font-semibold'
                        : 'text-slate-300 hover:text-white bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.09)] border border-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    <span className="text-sm leading-none">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live count pill */}
            <span className="text-[11px] text-slate-500 shrink-0 tabular-nums">
              <strong className="text-white font-semibold">{filteredProducts.length}</strong>
              <span className="hidden sm:inline"> items</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Products Grid ──────────────────────────────────────────────── */}
      <section className="container-max py-10 sm:py-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-[rgba(255,255,255,0.08)] rounded-3xl p-6 sm:p-10 bg-[rgba(5,15,22,0.4)]">
            <span className="text-4xl block mb-3">🐠</span>
            <h3 className="font-display text-2xl text-white font-light mb-2">No results found</h3>
            <p className="text-xs sm:text-sm text-[--color-muted] mb-6">
              Try a different search or browse a category above.
            </p>
            <button
              onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              className="btn-ghost text-xs px-6 py-3 rounded-2xl active:scale-95"
            >
              CLEAR FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Services Banner ────────────────────────────────────────────── */}
      <section className="container-max pb-28 md:pb-20">
        <div className="rounded-3xl p-7 sm:p-10 md:p-12 border border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[rgba(7,21,28,0.85)] via-[rgba(3,10,16,0.95)] to-[rgba(7,21,28,0.85)] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-[--color-accent] font-semibold block mb-2">
              EXPERT SERVICES
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-2">
              Need Professional Installation?
            </h3>
            <p className="text-xs sm:text-sm text-[--color-muted] max-w-xl leading-relaxed">
              Our master marine engineers handle complete on-site setup, pipework &amp; aquarium revival across India.
            </p>
          </div>
          <Link href="/services" className="btn-primary text-xs py-3.5 px-8 rounded-2xl shadow-xl font-semibold active:scale-95 transition-transform shrink-0">
            BOOK A SERVICE →
          </Link>
        </div>
      </section>
    </div>
  );
}
