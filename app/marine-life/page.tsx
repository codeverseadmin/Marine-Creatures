'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SPECIES } from '@/lib/data/species';

const DIFFICULTY_COLORS = {
  Beginner: 'var(--color-accent)',
  Intermediate: 'var(--color-gold)',
  Expert: '#E87070',
};

const FILTER_TABS = ['All Species', 'Beginner', 'Intermediate', 'Expert'];

export default function MarineLifePage() {
  const [activeTab, setActiveTab] = useState('All Species');
  const [search, setSearch] = useState('');

  const filteredSpecies = SPECIES.filter((s) => {
    const matchesTab =
      activeTab === 'All Species' || s.difficulty === activeTab;
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.scientificName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Hero */}
      <div
        className="relative flex items-end overflow-hidden"
        style={{ height: '60vh', minHeight: '440px' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=1920&q=85"
          alt="Marine Life at Marine Creatures"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(2,7,11,0.2) 0%, rgba(2,7,11,0.95) 100%)',
          }}
        />
        <div className="container-max relative z-10 pb-16">
          <span className="text-label text-[--color-accent] block mb-4">LIVING REEF ECOSYSTEMS</span>
          <h1 className="font-display text-display-lg text-[--color-text] font-light">
            Exotic<br /><em>Marine Species.</em>
          </h1>
          <p className="font-body font-light text-[--color-muted] mt-4 max-w-lg leading-relaxed" style={{ fontSize: '0.9375rem' }}>
            Ethically sourced, sustainably acclimated, and strictly quarantined marine life curated for bespoke luxury ecosystems.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="container-max pt-12 pb-6 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-xs font-body tracking-wider uppercase transition-all duration-300 rounded border ${
                  activeTab === tab
                    ? 'border-[--color-accent] text-[--color-accent] bg-[rgba(0,184,217,0.1)] shadow-[0_2px_12px_rgba(0,184,217,0.2)]'
                    : 'border-[rgba(255,255,255,0.1)] text-[--color-muted] hover:border-[rgba(255,255,255,0.3)] hover:text-white bg-[rgba(7,21,28,0.3)]'
                }`}
                data-cursor="EXPLORE"
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search species..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded px-4 py-2.5 text-xs text-[--color-text] placeholder:text-[--color-muted] focus:outline-none focus:border-[--color-accent] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Species Grid */}
      <div className="container-max section">
        {filteredSpecies.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl text-[--color-muted]">No marine species found matching your filter.</p>
            <button
              onClick={() => { setActiveTab('All Species'); setSearch(''); }}
              className="btn-ghost mt-6 text-xs"
              data-cursor="EXPLORE"
            >
              RESET FILTERS
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredSpecies.map((species) => (
              <Link
                key={species.id}
                href={`/marine-life/${species.id}`}
                className="group block rounded-xl border border-[rgba(255,255,255,0.06)] p-5 bg-[rgba(7,21,28,0.5)] hover:border-[rgba(0,184,217,0.4)] hover:shadow-[0_8px_30px_rgba(0,184,217,0.12)] transition-all duration-300 backdrop-blur-sm"
                data-cursor="EXPLORE"
              >

                <div className="overflow-hidden mb-5 relative" style={{ aspectRatio: '4/5' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={species.image}
                    alt={species.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                  <span
                    className="absolute top-4 right-4 text-[10px] px-2.5 py-1 border backdrop-blur-md"
                    style={{
                      color: DIFFICULTY_COLORS[species.difficulty],
                      borderColor: DIFFICULTY_COLORS[species.difficulty],
                      background: 'rgba(2, 7, 11, 0.75)',
                    }}
                  >
                    {species.difficulty.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-label text-[--color-muted] block mb-1 italic">
                      {species.scientificName}
                    </span>
                    <h2 className="font-display text-2xl text-[--color-text] font-light group-hover:text-[--color-accent] transition-colors duration-300">
                      {species.name}
                    </h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                  <div>
                    <span className="text-label text-[--color-muted] block">SIZE</span>
                    <span className="font-body text-[--color-text] text-xs mt-0.5 block">{species.size}</span>
                  </div>
                  <div>
                    <span className="text-label text-[--color-muted] block">AVAILABILITY</span>
                    <span className="font-body text-[--color-accent] text-xs mt-0.5 block">{species.availability}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

