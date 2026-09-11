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
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search fish, corals, pumps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-9 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 cursor-pointer shrink-0"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
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
