'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCatalog } from '@/lib/context/CatalogContext';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { PromoCarousel } from '@/components/ui/PromoCarousel';

interface CategoryOption {
  id: string;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'All Items', icon: '🌊' },
  { id: 'marine-life', label: 'Marine Life & Corals', icon: '🐠' },
  { id: 'lighting-tech', label: 'Lighting & Tech', icon: '💡' },
  { id: 'rock-sand', label: 'Live Rock & Sand', icon: '🪨' },
  { id: 'salt-chemistry', label: 'Salts & Chemistry', icon: '🧪' },
  { id: 'hardware', label: 'Equipment & Pumps', icon: '⚙️' },
];

function MarketplaceContent() {
  const { products } = useCatalog();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Handle section query param if linked from elsewhere
  useEffect(() => {
    if (sectionParam === 'live') {
      setSelectedCategory('marine-life');
    }
  }, [sectionParam]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // Category filter
        const matchesCategory =
          selectedCategory === 'all' || item.category === selectedCategory;

        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.scientificName && item.scientificName.toLowerCase().includes(query)) ||
          (item.brand && item.brand.toLowerCase().includes(query)) ||
          item.shortDesc.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="bg-[#02070c] min-h-screen text-slate-100">
      {/* ── Marketplace Top Header ──────────────────────────────────────── */}
      <div className="pt-24 sm:pt-28 pb-6 border-b border-slate-800/80 bg-gradient-to-b from-[#06141d] to-[#02070c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          {/* Title & Search/Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-[11px] uppercase tracking-widest font-semibold text-cyan-400">
                  Official Marine Catalog
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                Marine Marketplace
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg">
                Captive-bred fish, corals, lighting &amp; precision reef gear delivered safely across India.
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-80 group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 group-focus-within:text-cyan-300 transition-colors pointer-events-none flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search fish, corals, gear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-10 pr-20 rounded-2xl bg-[rgba(6,18,28,0.7)] backdrop-blur-xl border border-white/10 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_24px_rgba(6,182,212,0.25)] transition-all shadow-inner"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery ? (
                    <>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                        {filteredProducts.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-all active:scale-90"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="hidden md:inline-block text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                      ESC
                    </span>
                  )}
                </div>
              </div>

              {/* Custom Styled Sort Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto h-12 pl-4 pr-10 rounded-2xl bg-[rgba(6,18,28,0.7)] backdrop-blur-xl border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer appearance-none shadow-inner"
                >
                  <option value="featured" className="bg-[#071520] text-white">Featured</option>
                  <option value="price-asc" className="bg-[#071520] text-white">Price: Low to High</option>
                  <option value="price-desc" className="bg-[#071520] text-white">Price: High to Low</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-[11px] pt-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1">
              <span className="text-cyan-400">⚡</span> Quick:
            </span>
            {['Clownfish', 'Angelfish', 'Blue Tang', 'Anemone', 'Apex', 'LED'].map((tag) => {
              const isCurrent = searchQuery.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(isCurrent ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 border ${
                    isCurrent
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-semibold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Promotional Carousel */}
          <div className="pt-1">
            <PromoCarousel />
          </div>

          {/* ── Single Clean Category Bar ───────────────────────────────── */}
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`h-10 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-950'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span className="text-sm">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">
              Showing <strong className="text-white">{filteredProducts.length}</strong> items
            </span>
          </div>
        </div>
      </div>

      {/* ── Product Grid ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-slate-800 rounded-3xl p-8 bg-[#071520] max-w-md mx-auto">
            <span className="text-4xl block mb-3">🐠</span>
            <h3 className="text-lg font-bold text-white mb-1">No items found</h3>
            <p className="text-xs text-slate-400 mb-5">
              Try searching with different keywords or reset category filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-5 py-2.5 rounded-xl bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Bottom Service Consultation Banner ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-16">
        <div className="rounded-2xl p-6 sm:p-8 border border-slate-800 bg-[#06141d] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
              Expert Installation &amp; Maintenance
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Need Custom Aquarium Setup?
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              From residential reef displays to corporate lobby aquariums, our marine biologists handle full design, plumbing, and live maintenance.
            </p>
          </div>

          <Link
            href="/services"
            className="h-12 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-all active:scale-95 shrink-0 shadow-md"
          >
            Explore Services →
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="bg-[#02070c] min-h-screen" />}>
      <MarketplaceContent />
    </Suspense>
  );
}
