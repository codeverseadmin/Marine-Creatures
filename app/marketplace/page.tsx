'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { PRODUCTS, Product } from '@/lib/data/products';
import { ProductCard } from '@/components/marketplace/ProductCard';

const CATEGORIES = [
  { id: 'all', label: 'All Catalog' },
  { id: 'marine-life', label: '🐟 Marine Life & Fish' },
  { id: 'lighting-tech', label: '💡 Lighting & NemoLight' },
  { id: 'rock-sand', label: '🪨 Live Rock & Sand' },
  { id: 'salt-chemistry', label: '🧪 Salts & Chemistry' },
  { id: 'hardware', label: '⚙️ Skimmers & Hardware' },
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
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });
  }, [selectedCategory, searchQuery, sortBy]);

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Marketplace Header */}
      <div className="relative pt-32 pb-16 border-b border-[rgba(255,255,255,0.06)] overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,184,217,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="container-max relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-label text-[--color-accent] tracking-[0.3em] block mb-3">
                OFFICIAL MARINE STORE & HARDWARE
              </span>
              <h1 className="font-display text-display-lg text-[--color-text] font-light">
                Marine<br /><em>Marketplace.</em>
              </h1>
              <p className="font-body font-light text-[--color-muted] mt-4 max-w-xl leading-relaxed text-sm">
                Certified captive-bred marine livestock, NemoLight spectrum fixtures, biological Real Reef rock, Red Sea salts, and precision German filtration hardware.
              </p>
            </div>

            {/* Quick Guarantees Badge */}
            <div className="flex flex-wrap gap-2 md:max-w-xs">
              <div className="p-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] backdrop-blur-sm text-xs">
                <span className="text-[--color-accent] font-medium block">⚡ Live Arrival Guarantee</span>
                <span className="text-[10px] text-[--color-muted]">Insulated thermal courier pods with heat/cool packs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter, Search & Sorting Controls */}
      <div className="sticky top-20 z-30 bg-[rgba(2,7,11,0.92)] backdrop-blur-md border-b border-[rgba(255,255,255,0.08)] py-4">
        <div className="container-max">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded text-xs font-body tracking-wider whitespace-nowrap transition-all duration-300 border ${
                    selectedCategory === cat.id
                      ? 'border-[--color-accent] bg-[rgba(0,184,217,0.12)] text-[--color-accent] shadow-[0_2px_12px_rgba(0,184,217,0.2)] font-medium'
                      : 'border-[rgba(255,255,255,0.08)] text-[--color-muted] hover:border-[rgba(255,255,255,0.2)] hover:text-white bg-[rgba(7,21,28,0.4)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search fish, lights, rock, salt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded px-3.5 py-2 text-xs text-[--color-text] placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[--color-muted] hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[rgba(7,21,28,0.8)] border border-[rgba(255,255,255,0.1)] rounded px-3 py-2 text-xs text-[--color-text] focus:outline-none focus:border-[--color-accent]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container-max py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.3)]">
            <span className="text-4xl block mb-3">🐠</span>
            <h3 className="font-display text-2xl text-[--color-text] font-light mb-2">
              No products found
            </h3>
            <p className="font-body text-xs text-[--color-muted] max-w-sm mx-auto mb-6">
              We couldn&apos;t find any matches for &ldquo;{searchQuery}&rdquo;. Try clearing your search term or exploring other categories.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-ghost text-xs"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Services Callout Banner */}
      <div className="container-max pb-24">
        <div className="rounded-2xl p-8 md:p-12 border border-[rgba(0,184,217,0.3)] bg-gradient-to-r from-[rgba(7,21,28,0.9)] via-[rgba(3,10,16,0.95)] to-[rgba(7,21,28,0.9)] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-label text-[--color-accent] tracking-[0.25em] block mb-2">
              LOOKING FOR PROFESSIONAL ASSISTANCE?
            </span>
            <h3 className="font-display text-display-sm text-[--color-text] font-light mb-2">
              Book Full Aquarium Installation or Renovation
            </h3>
            <p className="font-body text-xs text-[--color-muted] max-w-xl leading-relaxed">
              Our master marine engineers provide complete on-site installation, pipework, aquascaping, and revitalization of existing aquariums across the UK & Europe.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 shrink-0">
            <Link href="/services" className="btn-primary text-xs">
              EXPLORE SERVICES & BOOKING →
            </Link>
            <Link href="/contact" className="btn-ghost text-xs">
              SPEAK TO A BIOLOGIST
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
