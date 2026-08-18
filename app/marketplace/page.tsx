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
      <div className="pt-32 pb-12 border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max">
          <span className="text-label text-[--color-accent] tracking-[0.25em] block mb-2">
            OFFICIAL STORE
          </span>
          <h1 className="font-display text-4xl sm:text-5xl text-white font-light mb-3">
            Marine Marketplace
          </h1>
          <p className="font-body text-xs sm:text-sm text-[--color-muted] max-w-xl">
            Captive-bred marine life, NemoLight reef LED fixtures, biological Real Reef rock, and Red Sea salts.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="py-6 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(2,7,11,0.6)]">
        <div className="container-max flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-xs font-body tracking-wider transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-md'
                    : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-60">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3.5 py-2 text-xs text-white placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent]"
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
              className="bg-[rgba(7,21,28,0.8)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[--color-accent]"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container-max py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-[rgba(255,255,255,0.06)] rounded-2xl p-8">
            <h3 className="font-display text-xl text-white font-light mb-2">No products found</h3>
            <p className="text-xs text-[--color-muted] mb-4">Try clearing your search query.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="btn-ghost text-xs"
            >
              Reset Filters
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

      {/* Simple Services Banner */}
      <div className="container-max pb-20">
        <div className="rounded-xl p-8 border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-label text-[--color-accent] block mb-1">SERVICES</span>
            <h3 className="font-display text-xl text-white font-light">
              Need Professional Installation or Aquarium Renovation?
            </h3>
            <p className="text-xs text-[--color-muted] mt-1">
              Our marine biologists and engineers provide complete on-site setup and maintenance.
            </p>
          </div>
          <Link href="/services" className="btn-primary text-xs shrink-0">
            BOOK A SERVICE →
          </Link>
        </div>
      </div>
    </div>
  );
}
