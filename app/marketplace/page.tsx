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
      {/* Header */}
      <div className="pt-40 pb-16 border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max">
          <span className="text-xs uppercase tracking-[0.35em] font-semibold text-[--color-accent] block mb-3">
            OFFICIAL MARINE STORE
          </span>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white font-light mb-4">
            Marine Marketplace
          </h1>
          <p className="font-body text-sm sm:text-base text-[--color-muted] max-w-2xl leading-relaxed">
            Captive-bred marine species, NemoLight spectrum fixtures, biological Real Reef rock, Red Sea salts, and precision German filtration hardware.
          </p>
        </div>
      </div>

      {/* Luxury Floating Filter & Search Bar */}
      <div className="sticky top-20 z-30 py-6 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.92)] backdrop-blur-2xl">
        <div className="container-max flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
          {/* Category Tabs Container */}
          <div className="p-2 rounded-2xl bg-[rgba(5,15,22,0.85)] border border-[rgba(255,255,255,0.1)] flex items-center gap-2 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[--color-accent] text-[--color-primary] shadow-[0_4px_20px_rgba(0,184,217,0.4)] font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex-1 sm:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                🔍
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-14 pl-12 pr-10 rounded-2xl bg-[rgba(5,15,22,0.85)] border border-[rgba(255,255,255,0.12)] text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-[--color-accent] focus:bg-[rgba(10,25,35,0.9)] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-14 px-5 rounded-2xl bg-[rgba(5,15,22,0.85)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container-max py-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 border border-[rgba(255,255,255,0.08)] rounded-3xl p-10 bg-[rgba(5,15,22,0.4)]">
            <span className="text-5xl block mb-4">🐠</span>
            <h3 className="font-display text-2xl text-white font-light mb-2">No products found</h3>
            <p className="text-sm text-[--color-muted] mb-6">
              We couldn&apos;t find any items matching &ldquo;{searchQuery}&rdquo;. Try another term.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-ghost text-xs px-6 py-3"
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
      </div>

      {/* Services Callout Banner */}
      <div className="container-max pb-28">
        <div className="rounded-3xl p-10 md:p-14 border border-[rgba(255,255,255,0.1)] bg-gradient-to-r from-[rgba(7,21,28,0.85)] via-[rgba(3,10,16,0.95)] to-[rgba(7,21,28,0.85)] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[--color-accent] font-semibold block mb-2">
              EXPERT SERVICES &amp; CONSULTATIONS
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-white font-light mb-2">
              Need Professional Installation or Renovation?
            </h3>
            <p className="text-sm text-[--color-muted] max-w-xl leading-relaxed">
              Our master marine engineers provide complete on-site setup, pipework, and complete revival of existing aquariums.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/services" className="btn-primary text-xs py-4 px-8 rounded-xl shadow-xl font-semibold">
              BOOK A SERVICE →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
