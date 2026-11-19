'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCatalog } from '@/lib/context/CatalogContext';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { PromoCarousel } from '@/components/ui/PromoCarousel';
import { MobileCategoryDrawer } from '@/components/marketplace/MobileCategoryDrawer';

interface CategoryOption {
  id: string;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'All Items' },
  { id: 'marine-life', label: 'Fish & Reef Life' },
  { id: 'lighting-tech', label: 'Lighting & Tech' },
  { id: 'rock-sand', label: 'Live Rock & Sand' },
  { id: 'salt-chemistry', label: 'Salts & Chemistry' },
  { id: 'hardware', label: 'Equipment & Pumps' },
];

function CategoryIcon({ id, className = 'w-4 h-4' }: { id: string; className?: string }) {
  switch (id) {
    case 'marine-life':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18.5 9.5c-1.5-3-4.5-5-8.5-5S3.5 5.5 2 9.5c1 3 3.5 5.5 8 6.5 4.5-1 7-3.5 8.5-6.5z" />
          <path d="M22 12c-1 2-3 4-6 5" />
        </svg>
      );
    case 'lighting-tech':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
        </svg>
      );
    case 'rock-sand':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
        </svg>
      );
    case 'salt-chemistry':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10 2v7.31L4.62 19.3A2 2 0 0 0 6.35 22h11.3a2 2 0 0 0 1.73-2.7L14 9.31V2" />
          <path d="M8.5 2h7" />
          <path d="M14 9.3h-4" />
        </svg>
      );
    case 'hardware':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    case 'all':
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12c5-3 7 3 10 0s5-3 10 0" />
          <path d="M2 17c5-3 7 3 10 0s5-3 10 0" />
        </svg>
      );
  }
}

function MarketplaceContent() {
  const { products } = useCatalog();
  const searchParams = useSearchParams();
  const sectionParam = searchParams.get('section');
  const categoryParam = searchParams.get('category');
  const queryParam = searchParams.get('q') || searchParams.get('search');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState<string>('All Items');
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Helper to map category IDs to friendly labels
  const getCategoryLabel = (catId: string): string => {
    if (catId === 'all') return 'All Items';
    if (catId === 'aquatic-remedies') return 'Aquatic Remedies';
    if (catId.startsWith('sub:')) return catId.slice(4);
    const match = CATEGORIES.find((c) => c.id === catId);
    return match ? match.label : catId;
  };

  // Handle category and section query params if linked from elsewhere
  useEffect(() => {
    if (sectionParam === 'live') {
      setSelectedCategory('marine-life');
      setSelectedCategoryLabel('Fish & Reef Life');
    } else if (categoryParam) {
      setSelectedCategory(categoryParam);
      setSelectedCategoryLabel(getCategoryLabel(categoryParam));
    }
  }, [sectionParam, categoryParam]);

  // Handle search query param (e.g. from schema.org SearchAction or direct links)
  useEffect(() => {
    if (queryParam) {
      setSearchQuery(queryParam);
    }
  }, [queryParam]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // Category filter
        let matchesCategory = true;
        if (selectedCategory === 'all') {
          matchesCategory = true;
        } else if (selectedCategory === 'aquatic-remedies') {
          matchesCategory =
            Boolean(item.brand?.toLowerCase().includes('aquatic remed')) ||
            Boolean(item.name?.toLowerCase().includes('aquatic remed'));
        } else if (selectedCategory.startsWith('sub:')) {
          const subLabel = selectedCategory.slice(4).toLowerCase();
          matchesCategory = (item.categoryLabel || '').toLowerCase() === subLabel;
        } else {
          matchesCategory = item.category === selectedCategory;
        }

        // Search query
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          item.name.toLowerCase().includes(query) ||
          (item.scientificName && item.scientificName.toLowerCase().includes(query)) ||
          (item.brand && item.brand.toLowerCase().includes(query)) ||
          item.shortDesc.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0;
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="bg-[var(--color-primary)] min-h-screen text-[var(--color-text)] overflow-x-hidden">
      {/* ── Marketplace Top Header ──────────────────────────────────────── */}
      {/*
        Top padding must clear the fixed navbar:
          - Mobile   h-16 (64 px) + safe-area-inset-top + 20px breathing room = ~84px+
          - Desktop  h-20 (80 px) + extra = ~108px+
        Using CSS calc so it works with env() on iOS Safari.
      */}
      <div
        className="marketplace-top-padding pb-6 border-b border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[var(--color-deep)] to-[var(--color-primary)]"
      >
        <div className="container-max space-y-6">
          {/* Title & Search/Sort Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" aria-hidden="true" />
                <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-[var(--color-accent)]">
                  Official Marine Catalog
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-[var(--color-text)] font-light tracking-tight">
                Marine Marketplace
              </h1>
              <p className="font-body text-sm sm:text-base text-[var(--color-muted)] mt-2 sm:mt-3 max-w-xl leading-relaxed">
                Captive-bred fish, reef life, lighting &amp; precision reef gear delivered safely across India.
              </p>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-80 group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-accent)] transition-colors pointer-events-none flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search fish, reef life, gear..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-10 pr-20 rounded-2xl bg-[var(--color-secondary)] backdrop-blur-xl border border-white/10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[rgba(0,184,217,0.2)] transition-all shadow-inner"
                  aria-label="Search marine marketplace products"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery ? (
                    <>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[rgba(0,184,217,0.15)] text-[var(--color-accent)] border border-[rgba(0,184,217,0.3)]">
                        {filteredProducts.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center text-xs transition-all active:scale-90"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="hidden md:inline-block text-[10px] font-mono text-slate-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                      ESC
                    </span>
                  )}
                </div>
              </div>

              {/* Custom Styled Sort Dropdown */}
              <div className="relative shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto h-12 pl-4 pr-10 rounded-2xl bg-[var(--color-secondary)] backdrop-blur-xl border border-white/10 text-xs font-semibold text-slate-200 focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[rgba(0,184,217,0.2)] transition-all cursor-pointer appearance-none shadow-inner"
                  aria-label="Sort products by"
                >
                  <option value="featured" className="bg-[var(--color-deep)] text-white">Featured</option>
                  <option value="price-asc" className="bg-[var(--color-deep)] text-white">Price: Low to High</option>
                  <option value="price-desc" className="bg-[var(--color-deep)] text-white">Price: High to Low</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" aria-hidden="true">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-momentum text-[11px] pt-1">
            <span className="text-[var(--color-muted)] text-[10px] uppercase font-bold tracking-wider shrink-0 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Quick:
            </span>
            {['Clownfish', 'Angelfish', 'Blue Tang', 'Anemone', 'Apex', 'LED'].map((tag) => {
              const isCurrent = searchQuery.toLowerCase() === tag.toLowerCase();
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSearchQuery(isCurrent ? '' : tag)}
                  className={`px-3 py-1 rounded-full text-xs transition-all shrink-0 border ${
                    isCurrent
                      ? 'bg-[rgba(0,184,217,0.15)] border-[var(--color-accent)] text-[var(--color-accent)] font-semibold shadow-[0_0_12px_rgba(0,184,217,0.25)]'
                      : 'bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* Promotional Carousel with Intentional Transition Breathing Room */}
          <div className="pt-2 sm:pt-3 pb-1">
            <PromoCarousel />
          </div>

          {/* ── Category Selection: Mobile Hamburger Drawer Trigger + Desktop Luxury Glass Tabs ── */}
          <div className="pt-5 sm:pt-6 border-t border-[rgba(255,255,255,0.08)]">
            {/* ── MOBILE ONLY (< md): Luxury Hamburger Category Trigger Card ── */}
            <div className="block md:hidden space-y-2.5">
              <button
                type="button"
                onClick={() => setIsCategoryDrawerOpen(true)}
                className="w-full min-h-[54px] px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#07242E] via-[#08303C] to-[#07242E] border border-[rgba(0,212,255,0.35)] hover:border-[var(--color-accent)] shadow-[0_4px_20px_rgba(0,212,255,0.12)] flex items-center justify-between transition-all group active:scale-[0.99] touch-manipulation backdrop-blur-md"
                aria-label="Open Category Menu"
              >
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="w-9 h-9 rounded-xl bg-[rgba(0,184,217,0.15)] border border-[rgba(0,184,217,0.4)] text-[var(--color-accent)] flex items-center justify-center text-base font-bold group-hover:scale-105 transition-transform shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </span>
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--color-accent)] block leading-tight">
                      Browse Marine Life &amp; Gear
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white tracking-wider whitespace-nowrap block">
                      SHOP BY CATEGORY
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[rgba(0,184,217,0.15)] text-[var(--color-accent)] border border-[rgba(0,184,217,0.3)] whitespace-nowrap max-w-[140px] truncate">
                    {selectedCategoryLabel}
                  </span>
                  <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center text-slate-400 group-hover:text-[var(--color-accent)] transition-colors border border-slate-800">
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </button>

              {/* Active Filter Pill Bar (Shown when filtered on mobile) */}
              {selectedCategory !== 'all' && (
                <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#082B32]/60 border border-[rgba(0,212,255,0.3)] text-xs animate-fadeIn">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse shrink-0" />
                    <span className="text-slate-300 text-[11px]">Filtered:</span>
                    <span className="font-bold text-[var(--color-accent)] text-xs truncate">
                      {selectedCategoryLabel}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono shrink-0">
                      ({filteredProducts.length} shown)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setSelectedCategoryLabel('All Items');
                    }}
                    className="text-[11px] text-[var(--color-accent)] hover:text-white underline font-semibold shrink-0 active:scale-95 transition-all"
                  >
                    Reset to All
                  </button>
                </div>
              )}
            </div>

            {/* ── DESKTOP ONLY (md+): Luxury Glass Horizontal Tab Bar ── */}
            <div className="hidden md:flex items-center justify-between gap-3">
              {/* Category buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-momentum">
                {CATEGORIES.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedCategoryLabel(cat.label);
                      }}
                      className={`h-10 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 active:scale-95 ${
                        isActive
                          ? 'bg-[var(--color-accent)] text-[var(--color-primary)] font-bold shadow-[0_4px_20px_rgba(0,184,217,0.35)]'
                          : 'bg-[var(--color-secondary)] hover:bg-[rgba(7,21,28,0.95)] text-[var(--color-muted)] border border-[rgba(255,255,255,0.08)]'
                      }`}
                    >
                      <CategoryIcon id={cat.id} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Item count */}
              <span className="text-xs text-[var(--color-muted)] shrink-0">
                Showing <strong className="text-[var(--color-text)]">{filteredProducts.length}</strong> items
              </span>
            </div>
          </div>

          {selectedCategory === 'lighting-tech' && (
            <div className="mt-4 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between gap-4 flex-wrap text-xs text-slate-300">
              <div className="space-y-0.5">
                <span className="font-semibold text-white block">Dedicated Nemo Lighting Hub Available</span>
                <span className="text-slate-400">Comparing Nemo E450, E600, E900, or E1200 models with verified tank-fit specs?</span>
              </div>
              <Link
                href="/marketplace/lighting"
                className="font-semibold text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
              >
                View Nemo Comparison Matrix &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Grid ────────────────────────────────────────────────── */}
      <section className="container-max py-8 sm:py-12">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 sm:py-20 border border-[rgba(255,255,255,0.08)] rounded-3xl p-8 sm:p-12 bg-[var(--color-secondary)] max-w-lg mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(0,184,217,0.1)] border border-[rgba(0,184,217,0.25)] flex items-center justify-center mx-auto mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18.5 9.5c-1.5-3-4.5-5-8.5-5S3.5 5.5 2 9.5c1 3 3.5 5.5 8 6.5 4.5-1 7-3.5 8.5-6.5z" />
                <path d="M22 12c-1 2-3 4-6 5" />
              </svg>
            </div>
            {/* WHAT HAPPENED? */}
            <h3 className="font-display text-2xl sm:text-3xl text-[var(--color-text)] font-light mb-3">
              No specimens found
            </h3>
            {/* WHY? */}
            <p className="font-body text-sm text-[var(--color-muted)] mb-6 max-w-sm mx-auto leading-relaxed">
              No available marine life or equipment matches your current active filters{searchQuery ? ` or search "${searchQuery}"` : ''}.
            </p>
            {/* WHAT CAN I DO? */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="btn-primary w-full sm:w-auto rounded-xl text-xs py-3.5 px-6 font-semibold tracking-wider uppercase active:scale-95 transition-all"
              >
                Clear Filters
              </button>
              <a
                href={`https://wa.me/919330436603?text=${encodeURIComponent(`Hi Suraj, I am looking for marine specimens or equipment (${searchQuery || selectedCategory}) that are currently not listed.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost w-full sm:w-auto rounded-xl text-xs py-3.5 px-5 font-semibold tracking-wider uppercase border-[rgba(255,255,255,0.15)] text-white hover:border-[var(--color-accent)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Custom Concierge Sourcing ↗
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Bottom Service Consultation Banner ──────────────────────────── */}
      {/*
        Bottom padding must account for the fixed MobileBottomNav:
          - MobileBottomNav sits at bottom-2.5 (10px) with ~68px inner nav height
          - Total clearance needed on mobile: ~78px + env(safe-area-inset-bottom) + 24px breathing
          - md+: no bottom nav, 4rem is sufficient
      */}
      <section
        className="container-max marketplace-bottom-spacing"
      >
        <div className="rounded-2xl p-6 sm:p-8 border border-[rgba(255,255,255,0.08)] bg-[var(--color-secondary)] flex flex-col md:flex-row items-center justify-between gap-6 glass-card-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-accent)]">
              Expert Installation &amp; Maintenance
            </span>
            <h3 className="font-display text-xl sm:text-2xl text-[var(--color-text)] font-light">
              Need Custom Aquarium Setup?
            </h3>
            <p className="font-body text-xs sm:text-sm text-[var(--color-muted)] max-w-xl leading-relaxed">
              From residential reef displays to corporate lobby aquariums, our marine biologists handle full design, plumbing, and live maintenance.
            </p>
          </div>

          <Link
            href="/services"
            className="btn-primary rounded-xl py-3.5 px-7 shrink-0 active:scale-95 transition-transform"
          >
            Explore Services →
          </Link>
        </div>
      </section>

      {/* ── Mobile Category Drawer ──────────────────────────────────────── */}
      <MobileCategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
        activeCategory={selectedCategory}
        onSelectCategory={(categoryId, label) => {
          setSelectedCategory(categoryId);
          setSelectedCategoryLabel(label);
        }}
        products={products}
      />
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="bg-[var(--color-primary)] min-h-screen" />}>
      <MarketplaceContent />
    </Suspense>
  );
}
