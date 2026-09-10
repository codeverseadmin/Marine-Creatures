'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/lib/context/CatalogContext';
import { isLiveProduct } from '@/lib/data/products';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { PromoCarousel } from '@/components/ui/PromoCarousel';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

type SectionType = 'all' | 'live' | 'dry';

const SECTIONS: { id: SectionType; label: string; icon: string; desc: string }[] = [
  { id: 'all',  label: 'All Products',   icon: '🌊', desc: 'Browse the full catalog' },
  { id: 'live', label: 'Live Animals',   icon: '🐟', desc: 'Shipped alive · Live arrival guarantee' },
  { id: 'dry',  label: 'Dry Goods',      icon: '📦', desc: 'Hardware, lighting & chemicals' },
];

const LIVE_CATEGORIES = [
  { id: 'all',         label: 'All Livestock', icon: '🌊' },
  { id: 'marine-life', label: 'Fish & Corals', icon: '🐠' },
];

const DRY_CATEGORIES = [
  { id: 'all',            label: 'All Gear',  icon: '🌊' },
  { id: 'lighting-tech',  label: 'Lighting',  icon: '💡' },
  { id: 'rock-sand',      label: 'Rock',      icon: '🪨' },
  { id: 'salt-chemistry', label: 'Salts',     icon: '🧪' },
  { id: 'hardware',       label: 'Gear',      icon: '⚙️' },
];

const ALL_CATEGORIES = [
  { id: 'all',            label: 'All',      icon: '🌊' },
  { id: 'marine-life',    label: 'Fish',     icon: '🐟' },
  { id: 'lighting-tech',  label: 'Lighting', icon: '💡' },
  { id: 'rock-sand',      label: 'Rock',     icon: '🪨' },
  { id: 'salt-chemistry', label: 'Salts',    icon: '🧪' },
  { id: 'hardware',       label: 'Gear',     icon: '⚙️' },
];

// ──────────────────────────────────────────────────────────────────────────────
// Section info banners (animated hero strips per section)
// ──────────────────────────────────────────────────────────────────────────────

function LiveSectionBanner() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-cyan-400/20 bg-gradient-to-r from-[rgba(0,184,217,0.08)] via-[rgba(0,184,217,0.04)] to-transparent"
      style={{ padding: '1px' }}
    >
      <div className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 bg-[rgba(4,18,28,0.85)] backdrop-blur-md">
        {/* Animated heartbeat dot */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400" />
          </span>
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-cyan-400">Live Animals</span>
        </div>

        <div className="w-px h-8 bg-cyan-400/20 hidden sm:block shrink-0" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[11px] sm:text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400">🚚</span>
            <span>Next-Day Express Dispatch</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400">🫧</span>
            <span>Oxygenated Insulated Thermal Pod</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-cyan-400">✓</span>
            <span className="font-semibold text-cyan-300">100% Live Arrival Guarantee</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function DrySectionBanner() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden border border-amber-400/20"
      style={{ background: 'rgba(4,18,28,0.85)' }}
    >
      <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-base leading-none">📦</span>
          <span className="text-[11px] uppercase tracking-[0.25em] font-bold text-amber-400">Dry Goods</span>
        </div>

        <div className="w-px h-8 bg-amber-400/20 hidden sm:block shrink-0" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-[11px] sm:text-xs text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">🚛</span>
            <span>Standard Tracked Courier · 2–5 Days</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">🛡️</span>
            <span>Manufacturer Warranty Included</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-amber-400">↩</span>
            <span className="font-semibold text-amber-300">Easy 7-Day Returns</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { products, isCloudSynced } = useCatalog();
  const [section, setSection] = useState<SectionType>('live');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Derive which category tabs to show for the active section
  const activeCategories =
    section === 'live' ? LIVE_CATEGORIES :
    section === 'dry'  ? DRY_CATEGORIES  :
    ALL_CATEGORIES;

  // Reset category chip when switching sections
  const handleSectionChange = (s: SectionType) => {
    setSection(s);
    setSelectedCategory('all');
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // Section filter
        const isLive = isLiveProduct(item);
        if (section === 'live' && !isLive) return false;
        if (section === 'dry'  && isLive)  return false;

        // Category filter
        const matchesCategory =
          selectedCategory === 'all' || item.category === selectedCategory;

        // Search filter
        const matchesSearch =
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.scientificName && item.scientificName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          item.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc')  return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [products, section, selectedCategory, searchQuery, sortBy]);

  const liveCount = products.filter(isLiveProduct).length;
  const dryCount  = products.filter((p) => !isLiveProduct(p)).length;

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
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
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
                  >✕</button>
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

          {/* ── LIVE / DRY SECTION SWITCHER ─────────────────────────── */}
          <div className="pt-1">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-1.5 rounded-2xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]">
              {SECTIONS.map((s) => {
                const isActive = section === s.id;
                const count = s.id === 'live' ? liveCount : s.id === 'dry' ? dryCount : products.length;

                // Color tokens per section
                const activeStyle =
                  s.id === 'live'
                    ? 'bg-gradient-to-br from-cyan-500/20 to-teal-600/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_20px_rgba(0,184,217,0.25)]'
                    : s.id === 'dry'
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-400/40 text-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.2)]'
                    : 'bg-gradient-to-br from-[rgba(0,184,217,0.12)] to-[rgba(0,184,217,0.04)] border border-[rgba(0,184,217,0.3)] text-white';

                const inactiveStyle = 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-[rgba(255,255,255,0.04)]';

                return (
                  <button
                    key={s.id}
                    onClick={() => handleSectionChange(s.id)}
                    className={`relative flex flex-col items-center justify-center gap-1 py-3 sm:py-4 px-2 rounded-xl text-center transition-all duration-300 active:scale-95 ${isActive ? activeStyle : inactiveStyle}`}
                  >
                    {/* Animated pulse ring for live tab when active */}
                    {s.id === 'live' && isActive && (
                      <span className="absolute top-2 right-2 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-70" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                      </span>
                    )}

                    <span className="text-xl sm:text-2xl leading-none">{s.icon}</span>
                    <span className="font-semibold text-[11px] sm:text-xs tracking-wide leading-tight">{s.label}</span>
                    <span className={`text-[10px] tabular-nums font-medium px-2 py-0.5 rounded-full ${
                      isActive
                        ? s.id === 'live'
                          ? 'bg-cyan-400/15 text-cyan-300'
                          : s.id === 'dry'
                          ? 'bg-amber-400/15 text-amber-300'
                          : 'bg-white/10 text-slate-300'
                        : 'bg-white/5 text-slate-500'
                    }`}>
                      {count} items
                    </span>
                    <span className="hidden sm:block text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-1">{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Section info banner ──────────────────────────────────── */}
          {section === 'live' && (
            <div className="animate-fade-in-down">
              <LiveSectionBanner />
            </div>
          )}
          {section === 'dry' && (
            <div className="animate-fade-in-down">
              <DrySectionBanner />
            </div>
          )}

          {/* ── Category chips + item count ──────────────────────────── */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none touch-momentum py-1">
              {activeCategories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    title={cat.label}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${
                      isActive
                        ? section === 'live'
                          ? 'bg-cyan-500 text-[--color-primary] shadow-[0_2px_12px_rgba(0,184,217,0.45)] font-semibold'
                          : section === 'dry'
                          ? 'bg-amber-400 text-[--color-primary] shadow-[0_2px_12px_rgba(251,191,36,0.35)] font-semibold'
                          : 'bg-[--color-accent] text-[--color-primary] shadow-[0_2px_12px_rgba(0,184,217,0.45)] font-semibold'
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
              onClick={() => { setSection('all'); setSelectedCategory('all'); setSearchQuery(''); }}
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
