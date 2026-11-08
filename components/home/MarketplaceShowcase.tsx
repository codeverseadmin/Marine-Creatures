'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/lib/context/CatalogContext';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { MobileCategoryDrawer } from '@/components/marketplace/MobileCategoryDrawer';

const DESKTOP_FILTERS = [
  { id: 'all', label: 'All Products', icon: '🌊' },
  { id: 'marine-life', label: 'Fish & Reef Life', icon: '🐠' },
  { id: 'lighting-tech', label: 'Lighting & Tech', icon: '💡' },
  { id: 'rock-sand', label: 'Live Rock & Sand', icon: '🪨' },
  { id: 'salt-chemistry', label: 'Salts & Chemistry', icon: '🧪' },
  { id: 'hardware', label: 'Equipment & Pumps', icon: '⚙️' },
];

export function MarketplaceShowcase() {
  const { products } = useCatalog();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeLabel, setActiveLabel] = useState<string>('All Products');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Synchronize category label whenever filter ID changes
  useEffect(() => {
    if (activeFilter === 'all') {
      setActiveLabel('All Products');
    } else if (activeFilter === 'aquatic-remedies') {
      setActiveLabel('Aquatic Remedies');
    } else if (activeFilter.startsWith('sub:')) {
      setActiveLabel(activeFilter.slice(4));
    } else {
      const match = DESKTOP_FILTERS.find((f) => f.id === activeFilter);
      if (match) setActiveLabel(match.label);
    }
  }, [activeFilter]);

  // Dynamic products filtering supporting categories, subcategories, and brand filters
  const displayedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    if (activeFilter === 'all') {
      filtered = products;
    } else if (activeFilter === 'aquatic-remedies') {
      filtered = products.filter(
        (p) =>
          p.brand?.toLowerCase().includes('aquatic remed') ||
          p.name?.toLowerCase().includes('aquatic remed')
      );
    } else if (activeFilter.startsWith('sub:')) {
      const subLabel = activeFilter.slice(4).toLowerCase();
      filtered = products.filter(
        (p) => (p.categoryLabel || '').toLowerCase() === subLabel
      );
    } else {
      filtered = products.filter((p) => p.category === activeFilter);
    }

    return filtered.slice(0, 8);
  }, [products, activeFilter]);

  const handleSelectCategory = (categoryId: string, label: string) => {
    setActiveFilter(categoryId);
    setActiveLabel(label);
  };

  return (
    <section
      className="section bg-[var(--color-primary)] border-t border-[rgba(255,255,255,0.06)] relative overflow-hidden"
      aria-labelledby="marketplace-showcase-heading"
    >
      {/* Background soft ambient glow */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[300px] pointer-events-none opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="container-max relative z-10">
        {/* Section Header */}
        <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-6 sm:mb-10">
          <div>
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[#00D4FF] block mb-2 sm:mb-3">
              OFFICIAL STORE
            </span>
            <h2
              id="marketplace-showcase-heading"
              className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light tracking-tight"
            >
              Marine Marketplace
            </h2>
            <p className="font-body text-sm sm:text-base text-[--color-muted] mt-1.5 sm:mt-2 max-w-lg leading-relaxed">
              Live captive-bred specimens, NemoLight smart fixtures, and cured live rock hardscapes.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="btn-ghost text-xs py-3 px-6 rounded-2xl border-[rgba(255,255,255,0.15)] text-white hover:border-[#00D4FF] hover:text-[#00D4FF] self-start md:self-auto transition-all active:scale-95 shadow-sm"
            data-cursor="EXPLORE"
          >
            VIEW FULL STORE ({products?.length || 0} ITEMS) →
          </Link>
        </ScrollReveal>

        {/* ── MOBILE: Dedicated Hamburger Shop by Category Control (Reference: MC-UX-MARKETPLACE-CATEGORY-DRAWER-V1) ── */}
        <div className="block md:hidden mb-6">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#06151C] via-[#082B32]/70 to-[#06151C] border border-[#00D4FF]/30 hover:border-[#00D4FF] text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all active:scale-[0.98] group"
            aria-haspopup="dialog"
            aria-expanded={isDrawerOpen}
            aria-controls="mobile-category-drawer"
            id="mobile-category-drawer-trigger"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#00D4FF]/15 border border-[#00D4FF]/40 text-[#00D4FF] flex items-center justify-center text-base sm:text-lg font-bold group-hover:scale-105 transition-transform shrink-0">
                ☰
              </span>
              <div className="text-left">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.18em] text-[#00D4FF] block leading-tight">
                  Browse Marine Life &amp; Gear
                </span>
                <span className="text-xs sm:text-sm font-bold text-white tracking-wider whitespace-nowrap block">
                  SHOP BY CATEGORY
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto pl-2">
              <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-[#00D4FF]/15 text-[#00D4FF] border border-[#00D4FF]/30 whitespace-nowrap">
                {activeLabel}
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-black/40 flex items-center justify-center text-slate-400 group-hover:text-[#00D4FF] transition-colors border border-slate-800">
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Active Filter Pill Bar (Shown when filtered on mobile) */}
          {activeFilter !== 'all' && (
            <div className="flex items-center justify-between mt-2.5 px-3.5 py-2 rounded-xl bg-[#082B32]/60 border border-[#00D4FF]/30 text-xs animate-fadeIn">
              <div className="flex items-center gap-2 truncate pr-2">
                <span className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse shrink-0" />
                <span className="text-slate-300 text-[11px]">Filtered:</span>
                <span className="font-bold text-[#00D4FF] text-xs truncate">
                  {activeLabel}
                </span>
                <span className="text-slate-400 text-[11px] font-mono shrink-0">
                  ({displayedProducts.length} shown)
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectCategory('all', 'All Products')}
                className="text-[11px] text-[#00D4FF] hover:text-white underline font-semibold shrink-0 active:scale-95 transition-all"
              >
                Reset to All
              </button>
            </div>
          )}
        </div>

        {/* ── DESKTOP: Clean Luxury Glass Horizontal Tab Bar (Preserved for md+ viewports) ── */}
        <ScrollReveal
          delay={0.1}
          className="hidden md:block mb-8 sm:mb-12 overflow-x-auto scrollbar-none touch-momentum py-1"
        >
          <div
            className="inline-flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[rgba(5,15,22,0.85)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl shadow-lg"
            role="tablist"
            aria-label="Marketplace category filters"
          >
            {DESKTOP_FILTERS.map((f) => {
              const isActive = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleSelectCategory(f.id, f.label)}
                  className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 whitespace-nowrap active:scale-95 flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#00D4FF] text-[#020609] font-bold shadow-[0_4px_20px_rgba(0,212,255,0.4)]'
                      : 'text-slate-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  <span className="text-base">{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </ScrollReveal>

        {/* ── Products Grid ── */}
        <ScrollReveal delay={0.15}>
          {/* Lighting Hub Special Notice Banner */}
          {activeFilter === 'lighting-tech' && (
            <div className="mb-6 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-300">
              <span>
                Comparing Nemo E450, E600, E900, or E1200 fixtures? View our comprehensive specification &amp; tank-fit guide.
              </span>
              <Link
                href="/marketplace/lighting"
                className="font-semibold text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
              >
                Explore Dedicated Lighting Hub &rarr;
              </Link>
            </div>
          )}

          {/* Active Category Header Bar for Desktop & Mobile if Filtered */}
          {activeFilter !== 'all' && (
            <div className="hidden md:flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-300">
                  Showing results for:{' '}
                  <strong className="text-white font-bold text-base">{activeLabel}</strong>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                  {displayedProducts.length} items
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectCategory('all', 'All Products')}
                className="text-xs text-cyan-400 hover:text-white underline font-semibold transition-colors"
              >
                Clear filter (View All)
              </button>
            </div>
          )}

          {displayedProducts.length === 0 ? (
            <div className="text-center py-16 border border-[rgba(255,255,255,0.08)] rounded-3xl p-8 bg-[var(--color-secondary)] max-w-md mx-auto">
              <p className="text-sm text-[var(--color-muted)]">
                No specimens currently available matching <strong className="text-white">{activeLabel}</strong>.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectCategory('all', 'All Products')}
                  className="btn-ghost rounded-xl text-xs py-2 px-4"
                >
                  Reset Filter
                </button>
                <Link href="/marketplace" className="btn-primary rounded-xl text-xs py-2 px-4">
                  View Full Catalog
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </ScrollReveal>
      </div>

      {/* ── MOBILE CATEGORY DRAWER ── */}
      <MobileCategoryDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeCategory={activeFilter}
        onSelectCategory={handleSelectCategory}
        products={products}
      />
    </section>
  );
}
