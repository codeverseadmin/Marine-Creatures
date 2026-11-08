'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/data/products';

export interface CategoryItem {
  id: string;
  label: string;
  count: number;
  icon: string;
  description?: string;
  subcategories?: Array<{
    id: string;
    label: string;
    count: number;
  }>;
}

interface MobileCategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (categoryId: string, label: string) => void;
  products: Product[];
}

export function MobileCategoryDrawer({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  products,
}: MobileCategoryDrawerProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // ── Calculate dynamic categories & authentic subcategories from catalogue ─
  const categories: CategoryItem[] = useMemo(() => {
    if (!products || products.length === 0) return [];

    // Helper to count products matching a category
    const countForCat = (catId: string) => products.filter((p) => p.category === catId).length;

    // Helper to extract authentic subcategory counts
    const getSubcategories = (catId: string) => {
      const subMap: Record<string, number> = {};
      products
        .filter((p) => p.category === catId)
        .forEach((p) => {
          const lbl = (p.categoryLabel || '').trim();
          if (lbl) {
            subMap[lbl] = (subMap[lbl] || 0) + 1;
          }
        });

      return Object.entries(subMap).map(([label, count]) => ({
        id: `sub:${label}`,
        label,
        count,
      }));
    };

    // Aquatic Remedies brand-level filter count (authentic 7 items in catalogue)
    const aquaticRemediesCount = products.filter(
      (p) =>
        p.brand?.toLowerCase().includes('aquatic remed') ||
        p.name?.toLowerCase().includes('aquatic remed')
    ).length;

    return [
      {
        id: 'all',
        label: 'All Products',
        count: products.length,
        icon: '🌊',
        description: 'Complete marine catalogue & living livestock',
      },
      {
        id: 'marine-life',
        label: 'Fish & Reef Life',
        count: countForCat('marine-life'),
        icon: '🐠',
        description: 'Captive-bred clownfish, show tangs & quarantined specimens',
      },
      {
        id: 'lighting-tech',
        label: 'Lighting & Tech',
        count: countForCat('lighting-tech'),
        icon: '💡',
        description: 'NemoLight LED fixtures & smart reef illumination',
        subcategories: getSubcategories('lighting-tech'),
      },
      {
        id: 'rock-sand',
        label: 'Live Rock & Sand',
        count: countForCat('rock-sand'),
        icon: '🪨',
        description: 'Real Reef biological live rock & Bahamian aragonite',
        subcategories: getSubcategories('rock-sand'),
      },
      {
        id: 'salt-chemistry',
        label: 'Salts & Chemistry',
        count: countForCat('salt-chemistry'),
        icon: '🧪',
        description: 'Red Sea salts, precision test kits & trace supplements',
        subcategories: getSubcategories('salt-chemistry'),
      },
      {
        id: 'aquatic-remedies',
        label: 'Aquatic Remedies',
        count: aquaticRemediesCount,
        icon: '💊',
        description: 'Ceramic bio-blocks, By-Par resin & advanced biological media',
      },
      {
        id: 'hardware',
        label: 'Equipment & Pumps',
        count: countForCat('hardware'),
        icon: '⚙️',
        description: 'Nyos protein skimmers, Sunsun pumps & wavemakers',
        subcategories: getSubcategories('hardware'),
      },
    ];
  }, [products]);

  // ── Auto-expand category containing current active filter ─────────────────
  useEffect(() => {
    if (activeCategory.startsWith('sub:')) {
      const activeSub = activeCategory.slice(4);
      const parent = categories.find((c) =>
        c.subcategories?.some((s) => s.label === activeSub)
      );
      if (parent) {
        setExpandedCategories((prev) => ({ ...prev, [parent.id]: true }));
      }
    } else if (activeCategory) {
      setExpandedCategories((prev) => ({ ...prev, [activeCategory]: true }));
    }
  }, [activeCategory, categories]);

  // ── Background Scroll Lock ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // ── Android Back Button & ESC Key Navigation ──────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    // Push dummy state to capture back button
    window.history.pushState({ categoryDrawerOpen: true }, '');

    const handlePopState = () => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleSelect = (id: string, label: string) => {
    onSelectCategory(id, label);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-drawer-title"
    >
      {/* ── Backdrop Overlay ──────────────────────────────────────────────── */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-fadeIn"
        aria-hidden="true"
      />

      {/* ── Slide-in Drawer (Right to Left) ───────────────────────────────── */}
      <aside
        id="mobile-category-drawer"
        className="relative w-full max-w-[340px] sm:max-w-[380px] h-full bg-gradient-to-b from-[#06151C] via-[#020609] to-[#020609] border-l border-[rgba(0,212,255,0.2)] shadow-2xl flex flex-col z-10 animate-slideLeft transform overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* ── Pinned Drawer Header ────────────────────────────────────────── */}
        <div className="px-5 py-4.5 border-b border-slate-800/80 bg-[rgba(6,21,28,0.98)] backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] text-[#00D4FF] flex items-center justify-center text-lg font-bold">
              ☰
            </span>
            <div>
              <h3 id="category-drawer-title" className="text-sm font-bold text-white tracking-wider uppercase font-display">
                Shop by Category
              </h3>
              <p className="text-[11px] text-slate-400 font-body">
                Official Marine Creatures Catalogue
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close category drawer"
            className="w-10 h-10 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-base transition-colors border border-slate-700/60 active:scale-95"
          >
            ✕
          </button>
        </div>

        {/* ── Active Selection Banner ─────────────────────────────────────── */}
        <div className="px-5 py-2.5 bg-[#082B32]/40 border-b border-slate-800/60 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-400">Current View:</span>
          <span className="font-semibold text-[#00D4FF] text-xs">
            {categories.find((c) => c.id === activeCategory)?.label ||
              (activeCategory.startsWith('sub:') ? activeCategory.slice(4) : 'All Products')}
          </span>
        </div>

        {/* ── Scrollable Category List ────────────────────────────────────── */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 overscroll-contain"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#00D4FF rgba(15, 23, 42, 0.6)',
          }}
        >
          {categories.map((cat) => {
            const isCatActive =
              activeCategory === cat.id ||
              (activeCategory.startsWith('sub:') &&
                cat.subcategories?.some((s) => s.id === activeCategory));
            const isExactActive = activeCategory === cat.id;
            const hasSub = cat.subcategories && cat.subcategories.length > 0;
            const isExpanded = !!expandedCategories[cat.id];

            return (
              <div
                key={cat.id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isCatActive
                    ? 'border-[#00D4FF]/60 bg-gradient-to-r from-[#082B32]/70 to-[#06151C]/90 shadow-[0_4px_16px_rgba(0,212,255,0.15)]'
                    : 'border-slate-800/70 bg-[#06151C]/60 hover:border-slate-700 hover:bg-[#06151C]'
                }`}
              >
                {/* Main Category Row */}
                <div
                  onClick={() => handleSelect(cat.id, cat.label)}
                  className="w-full min-h-[52px] px-3.5 py-3 flex items-center justify-between cursor-pointer active:bg-cyan-950/30 transition-colors select-none"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleSelect(cat.id, cat.label);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="text-xl shrink-0 p-1 rounded-lg bg-black/40 border border-slate-800/80">
                      {cat.icon}
                    </span>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold tracking-wide truncate ${
                            isExactActive ? 'text-[#00D4FF]' : 'text-white'
                          }`}
                        >
                          {cat.label}
                        </span>
                        {isExactActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] shadow-[0_0_8px_#00D4FF]" />
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 leading-tight mt-0.5 font-light">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Authentic Product Count Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isExactActive
                          ? 'bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/40 font-bold'
                          : 'bg-slate-900/80 text-slate-400 border-slate-800'
                      }`}
                    >
                      {cat.count}
                    </span>

                    {/* Expand/Collapse Chevron for Subcategories */}
                    {hasSub && (
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(cat.id, e)}
                        aria-label={`Toggle subcategories for ${cat.label}`}
                        className="w-8 h-8 rounded-lg bg-black/30 hover:bg-slate-800/80 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-800/60 active:scale-90"
                      >
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-[#00D4FF]' : 'text-slate-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategory Rows (Authentic from Catalogue) */}
                {hasSub && isExpanded && (
                  <div className="bg-black/40 border-t border-slate-800/80 divide-y divide-slate-800/40">
                    {cat.subcategories!.map((sub) => {
                      const isSubActive = activeCategory === sub.id;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => handleSelect(sub.id, sub.label)}
                          className={`w-full min-h-[44px] pl-12 pr-4 py-2 flex items-center justify-between text-left text-xs transition-colors active:bg-cyan-950/40 ${
                            isSubActive
                              ? 'bg-[#082B32]/50 text-[#00D4FF] font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSubActive ? 'bg-[#00D4FF]' : 'bg-slate-600'
                              }`}
                            />
                            <span className="truncate">{sub.label}</span>
                          </div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/60 text-slate-400 border border-slate-800 shrink-0">
                            {sub.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Pinned Drawer Footer ────────────────────────────────────────── */}
        <div className="p-4 border-t border-slate-800/80 bg-[rgba(6,21,28,0.98)] backdrop-blur-xl shrink-0 space-y-2">
          {activeCategory !== 'all' && (
            <button
              type="button"
              onClick={() => handleSelect('all', 'All Products')}
              className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-colors border border-slate-700/60"
            >
              <span>↺</span>
              <span>Reset to All Products</span>
            </button>
          )}

          <Link
            href="/marketplace"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#00D4FF] hover:bg-[#69E7EA] text-[#020609] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,212,255,0.3)] transition-all active:scale-[0.98]"
          >
            <span>View Full Store ({products.length} Items)</span>
            <span>→</span>
          </Link>
        </div>
      </aside>
    </div>
  );
}

