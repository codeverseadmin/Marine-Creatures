'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PRODUCTS } from '@/lib/data/products';
import { ProductCard } from '@/components/marketplace/ProductCard';

const CATEGORY_TILES = [
  {
    id: 'marine-life',
    name: 'Fish & Marine Life',
    count: '6 Species Available',
    image: 'https://images.unsplash.com/photo-1544551763-92ab472cad5d?w=800&q=85',
    desc: 'Captive-bred Clownfish pairs, Emperor Angelfish & Rose Anemones.',
  },
  {
    id: 'lighting-tech',
    name: 'Lighting & NemoLight',
    count: 'Full Spectrum Units',
    image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=800&q=85',
    desc: 'NemoLight Ultra-Spectral fixtures, Radion G6 & Smart controllers.',
  },
  {
    id: 'rock-sand',
    name: 'Live Rock & Sand',
    count: 'Bio-Active Cultured',
    image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=85',
    desc: 'Real Reef™ biological purple rock & Bahamian aragonite live sand.',
  },
  {
    id: 'salt-chemistry',
    name: 'Salts & Chemistry',
    count: 'Laboratory Grade',
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&q=85',
    desc: 'Red Sea Coral Pro salt buckets & 7-stage RO/DI water stations.',
  },
  {
    id: 'hardware',
    name: 'Skimmers & Hardware',
    count: 'German Precision',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=85',
    desc: 'Nyos Quantum skimmers, DC pumps & titanium chiller units.',
  },
];

export function MarketplaceShowcase() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'marine-life' | 'lighting-tech' | 'rock-sand' | 'salt-chemistry'>('all');

  const displayedProducts = activeFilter === 'all'
    ? PRODUCTS.slice(0, 8)
    : PRODUCTS.filter((p) => p.category === activeFilter).slice(0, 8);

  return (
    <section className="section bg-[var(--color-primary)] border-t border-[rgba(255,255,255,0.06)] relative">
      <div className="container-max">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-label text-[--color-accent] tracking-[0.3em] block mb-3">
              OFFICIAL MARINE MARKETPLACE
            </span>
            <h2 className="font-display text-display-md text-[--color-text] font-light">
              Living Creatures &amp;<br /><em>Aquarium Hardware.</em>
            </h2>
          </div>

          <Link
            href="/marketplace"
            className="btn-ghost text-xs self-start md:self-auto"
            data-cursor="EXPLORE"
          >
            VIEW FULL MARKETPLACE (20+ ITEMS) →
          </Link>
        </div>

        {/* 5 Category Visual Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
          {CATEGORY_TILES.map((tile) => (
            <Link
              key={tile.id}
              href={`/marketplace?category=${tile.id}`}
              className="group relative rounded-xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] hover:border-[--color-accent] hover:shadow-[0_8px_30px_rgba(0,184,217,0.2)] transition-all duration-500 p-5 flex flex-col justify-end"
              style={{ minHeight: '220px' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={tile.image}
                alt={tile.name}
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-50 group-hover:scale-110 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,7,11,0.95)] via-[rgba(2,7,11,0.5)] to-transparent" />

              <div className="relative z-10">
                <span className="text-[10px] uppercase font-semibold text-[--color-accent] tracking-wider block mb-1">
                  {tile.count}
                </span>
                <h3 className="font-display text-lg text-white font-medium mb-1 group-hover:text-[--color-accent] transition-colors">
                  {tile.name}
                </h3>
                <p className="text-[11px] text-[--color-muted] line-clamp-2 leading-relaxed">
                  {tile.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.06)] pb-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'All Featured' },
              { id: 'marine-life', label: '🐟 Marine Life' },
              { id: 'lighting-tech', label: '💡 NemoLight & Tech' },
              { id: 'rock-sand', label: '🪨 Rock & Substrate' },
              { id: 'salt-chemistry', label: '🧪 Salt & Water Care' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-4 py-2 rounded text-xs font-body tracking-wider whitespace-nowrap transition-all ${
                  activeFilter === f.id
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-[0_2px_12px_rgba(0,184,217,0.3)]'
                    : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="hidden sm:inline text-xs text-[--color-muted]">
            ⚡ Click &apos;+ ADD&apos; for instant shopping bag animation
          </span>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
