'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/lib/context/CatalogContext';
import { ProductCard } from '@/components/marketplace/ProductCard';

const FILTERS = [
  { id: 'all', label: 'All Products' },
  { id: 'marine-life', label: 'Fish & Corals' },
  { id: 'lighting-tech', label: 'Lighting & Tech' },
  { id: 'rock-sand', label: 'Live Rock & Sand' },
  { id: 'salt-chemistry', label: 'Salts & Chemistry' },
];

export function MarketplaceShowcase() {
  const { products } = useCatalog();
  const [activeFilter, setActiveFilter] = useState<'all' | 'marine-life' | 'lighting-tech' | 'rock-sand' | 'salt-chemistry'>('all');

  const displayedProducts = activeFilter === 'all'
    ? products.slice(0, 8)
    : products.filter((p) => p.category === activeFilter).slice(0, 8);

  return (
    <section className="section bg-[var(--color-primary)] border-t border-[rgba(255,255,255,0.06)] relative overflow-hidden">
      {/* Background soft ambient glow */}
      <div
        className="absolute top-0 right-1/4 w-[500px] h-[300px] pointer-events-none opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(0,184,217,0.15) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="container-max relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block mb-2 sm:mb-3">
              OFFICIAL STORE
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light">
              Marine Marketplace
            </h2>
            <p className="font-body text-xs sm:text-sm text-[--color-muted] mt-1.5 sm:mt-2 max-w-lg">
              Live captive-bred specimens, NemoLight smart fixtures, and cured live rock hardscapes.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="btn-ghost text-xs py-3 px-6 rounded-2xl border-[rgba(255,255,255,0.15)] text-white hover:border-[--color-accent] hover:text-[--color-accent] self-start md:self-auto transition-all active:scale-95"
            data-cursor="EXPLORE"
          >
            VIEW FULL STORE ({products.length} ITEMS) →
          </Link>
        </div>

        {/* Floating Luxury Glass Tab Bar */}
        <div className="mb-8 sm:mb-12 overflow-x-auto scrollbar-none touch-momentum py-1">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[rgba(5,15,22,0.85)] border border-[rgba(255,255,255,0.1)] backdrop-blur-xl shadow-lg">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium tracking-wide transition-all duration-300 whitespace-nowrap active:scale-95 ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
