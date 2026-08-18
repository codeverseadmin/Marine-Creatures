'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/data/products';
import { ProductCard } from '@/components/marketplace/ProductCard';

const CATEGORIES = [
  { id: 'all', label: 'All Products' },
  { id: 'marine-life', label: 'Fish & Corals' },
  { id: 'lighting-tech', label: 'Lighting & NemoLight' },
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
      {/* Luxury Marketplace Hero Banner */}
      <section className="relative pt-44 md:pt-52 pb-20 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[rgba(4,14,20,0.9)] via-[rgba(2,7,11,0.95)] to-[var(--color-primary)] overflow-hidden">
        {/* Subtle background glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,184,217,0.35) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        <div className="container-max relative z-10 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(0,184,217,0.1)] border border-[rgba(0,184,217,0.25)] mb-6">
            <span className="w-2 h-2 rounded-full bg-[--color-accent] animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent]">
              OFFICIAL MARINE STORE &amp; HARDWARE
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-white font-light tracking-tight mb-6">
            Marine Marketplace
          </h1>

          <p className="font-body text-sm sm:text-base text-[--color-muted] max-w-2xl mx-auto leading-relaxed">
            Captive-bred marine species, NemoLight spectrum fixtures, biological Real Reef rock, Red Sea salts, and precision German filtration hardware dispatched safely across India.
          </p>
        </div>
      </section>

      {/* Spacious, Elegant Filter & Search Section (Non-colliding) */}
      <section className="py-10 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(3,10,16,0.6)] backdrop-blur-md">
        <div className="container-max space-y-8">
          {/* Category Navigation Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-xl text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 ${
                  selectedCategory === cat.id
                    ? 'bg-[--color-accent] text-[--color-primary] shadow-[0_4px_20px_rgba(0,184,217,0.4)] font-semibold scale-105'
                    : 'text-slate-300 hover:text-white bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Bar & Sort Dropdown Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search marine life, lighting, live rock, salts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-12 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(255,255,255,0.07)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Results Count & Sort Dropdown */}
            <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0">
              <span className="text-xs text-[--color-muted]">
                Showing <strong className="text-white text-sm">{filteredProducts.length}</strong> items
              </span>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-14 px-5 rounded-xl bg-[rgba(5,15,22,0.95)] border border-[rgba(255,255,255,0.12)] text-xs sm:text-sm text-white focus:outline-none focus:border-[--color-accent] cursor-pointer"
              >
                <option value="featured">Sort: Featured Collection</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="container-max py-20">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-28 border border-[rgba(255,255,255,0.08)] rounded-3xl p-10 bg-[rgba(5,15,22,0.4)]">
            <span className="text-5xl block mb-4">🐠</span>
            <h3 className="font-display text-2xl text-white font-light mb-2">No products found</h3>
            <p className="text-sm text-[--color-muted] mb-6">
              We couldn&apos;t find any items matching &ldquo;{searchQuery}&rdquo;. Try another search term.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-ghost text-xs px-6 py-3 rounded-xl"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Services Callout Banner */}
      <section className="container-max pb-36">
        <div className="rounded-3xl p-10 md:p-14 border border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[rgba(7,21,28,0.85)] via-[rgba(3,10,16,0.95)] to-[rgba(7,21,28,0.85)] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[--color-accent] font-semibold block mb-2">
              EXPERT SERVICES &amp; CONSULTATIONS
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-2">
              Need Professional Installation or Renovation?
            </h3>
            <p className="text-sm text-[--color-muted] max-w-xl leading-relaxed">
              Our master marine engineers provide complete on-site setup, pipework, and complete revival of existing aquariums across India.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/services" className="btn-primary text-xs py-4 px-8 rounded-xl shadow-xl font-semibold">
              BOOK A SERVICE →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
