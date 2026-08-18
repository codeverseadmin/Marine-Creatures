'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/data/products';
import { ProductCard } from '@/components/marketplace/ProductCard';

const FILTERS = [
  { id: 'all', label: 'All Products' },
  { id: 'marine-life', label: 'Fish & Corals' },
  { id: 'lighting-tech', label: 'Lighting & Tech' },
  { id: 'rock-sand', label: 'Live Rock & Sand' },
  { id: 'salt-chemistry', label: 'Salts & Chemistry' },
];

export function MarketplaceShowcase() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'marine-life' | 'lighting-tech' | 'rock-sand' | 'salt-chemistry'>('all');

  const displayedProducts = activeFilter === 'all'
    ? PRODUCTS.slice(0, 8)
    : PRODUCTS.filter((p) => p.category === activeFilter).slice(0, 8);

  return (
    <section className="py-24 bg-[var(--color-primary)] border-t border-[rgba(255,255,255,0.06)]">
      <div className="container-max">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block mb-2">
              OFFICIAL STORE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light">
              Marine Marketplace
            </h2>
          </div>

          <Link
            href="/marketplace"
            className="btn-ghost text-xs py-3 px-6 self-start md:self-auto"
            data-cursor="EXPLORE"
          >
            VIEW ALL PRODUCTS →
          </Link>
        </div>

        {/* Filter Tabs with Proper Font Size */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 scrollbar-none mb-10">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-5 py-3 rounded-xl text-sm font-medium tracking-wide transition-all whitespace-nowrap ${
                activeFilter === f.id
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-[0_4px_20px_rgba(0,184,217,0.3)]'
                  : 'text-slate-300 hover:text-white bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.08)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
