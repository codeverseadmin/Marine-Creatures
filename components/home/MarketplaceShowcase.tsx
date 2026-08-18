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
    <section className="py-28 bg-[var(--color-primary)] border-t border-[rgba(255,255,255,0.06)]">
      <div className="container-max">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-3">
              OFFICIAL STORE
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-white font-light">
              Marine Marketplace
            </h2>
          </div>

          <Link
            href="/marketplace"
            className="btn-ghost text-xs py-3.5 px-7 rounded-xl border-[rgba(255,255,255,0.15)] text-white hover:border-[--color-accent] hover:text-[--color-accent] self-start md:self-auto transition-all"
            data-cursor="EXPLORE"
          >
            VIEW FULL STORE (10 ITEMS) →
          </Link>
        </div>

        {/* Floating Luxury Glass Tab Bar */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-[rgba(5,15,22,0.85)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl shadow-xl overflow-x-auto max-w-full scrollbar-none">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-6 py-3 rounded-xl text-sm font-medium tracking-wide transition-all duration-300 whitespace-nowrap ${
                  activeFilter === f.id
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-[0_4px_20px_rgba(0,184,217,0.4)]'
                    : 'text-slate-300 hover:text-white hover:bg-[rgba(255,255,255,0.06)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
