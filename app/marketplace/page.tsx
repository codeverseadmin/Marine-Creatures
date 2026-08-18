'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/data/products';
import { ProductCard } from '@/components/marketplace/ProductCard';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'marine-life', label: 'Fish & Corals' },
  { id: 'lighting-tech', label: 'Lighting & Tech' },
  { id: 'rock-sand', label: 'Live Rock & Sand' },
  { id: 'salt-chemistry', label: 'Salts & Chemistry' },
  { id: 'hardware', label: 'Equipment & Skimmers' },
];

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((item) => {
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
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Integrated Luxury Marketplace Header */}
      <div className="pt-24 md:pt-28 pb-8 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[rgba(6,20,29,0.95)] to-[var(--color-primary)]">
        <div className="container-max space-y-6">
          {/* Top Row: Title + Search & Sort */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-[--color-accent] animate-pulse" />
                <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent]">
                  OFFICIAL MARINE STORE
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light tracking-tight">
                Marine Marketplace
              </h1>
              <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-1.5 max-w-xl">
                Captive-bred livestock, NemoLight fixtures, Real Reef rock, salts &amp; precision hardware across India.
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search Box with SVG */}
              <div className="relative flex-1 sm:w-80">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search species, lighting, rock, salt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 pr-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.08)] transition-all"
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

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 px-3.5 rounded-xl bg-[rgba(10,25,35,0.9)] border border-[rgba(255,255,255,0.12)] text-xs text-white focus:outline-none focus:border-[--color-accent] cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Category Filter Tabs */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-[rgba(255,255,255,0.06)] overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2 shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? 'bg-[--color-accent] text-[--color-primary] shadow-[0_2px_15px_rgba(0,184,217,0.4)] font-semibold'
                      : 'text-slate-300 hover:text-white bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-[--color-muted] shrink-0 hidden sm:inline-block">
              <strong className="text-white">{filteredProducts.length}</strong> items
            </span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <section className="container-max py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-[rgba(255,255,255,0.08)] rounded-3xl p-8 bg-[rgba(5,15,22,0.4)]">
            <span className="text-4xl block mb-3">🐠</span>
            <h3 className="font-display text-xl text-white font-light mb-2">No products found</h3>
            <p className="text-xs text-[--color-muted] mb-5">
              We couldn&apos;t find any items matching &ldquo;{searchQuery}&rdquo;. Try another search term.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-ghost text-xs px-5 py-2.5 rounded-xl"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Services Callout Banner */}
      <section className="container-max pb-36">
        <div className="rounded-3xl p-8 md:p-12 border border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[rgba(7,21,28,0.85)] via-[rgba(3,10,16,0.95)] to-[rgba(7,21,28,0.85)] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[--color-accent] font-semibold block mb-1.5">
              EXPERT SERVICES &amp; CONSULTATIONS
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-2">
              Need Professional Installation or Renovation?
            </h3>
            <p className="text-xs sm:text-sm text-[--color-muted] max-w-xl leading-relaxed">
              Our master marine engineers provide complete on-site setup, pipework, and complete revival of existing aquariums across India.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/services" className="btn-primary text-xs py-3.5 px-7 rounded-xl shadow-xl font-semibold">
              BOOK A SERVICE →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
