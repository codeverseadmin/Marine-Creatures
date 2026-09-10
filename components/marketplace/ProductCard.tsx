'use client';

import React from 'react';
import Link from 'next/link';
import { Product, isLiveProduct } from '@/lib/data/products';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = React.useState(false);
  const isWished = isInWishlist(product.id);
  const isLive   = isLiveProduct(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, e);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div
      className={`group rounded-3xl border backdrop-blur-xl transition-all duration-300 flex flex-col h-full overflow-hidden glass-card-hover ${
        isLive
          // ── LIVE: cyan glow border + subtle teal tint
          ? 'border-cyan-500/30 bg-[rgba(0,184,217,0.04)] hover:border-cyan-400/70 hover:shadow-[0_16px_48px_rgba(0,184,217,0.22),0_0_0_1px_rgba(0,184,217,0.15)]'
          // ── DRY: amber/neutral, existing style
          : 'border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.85)] hover:border-amber-400/30 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)]'
      }`}
    >
      {/* ── Top Image Block ───────────────────────────────────────────── */}
      <Link
        href={`/marketplace/${product.id}`}
        className="block relative overflow-hidden bg-black/50"
        style={{ aspectRatio: '16/11' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* ── Type badge (top-left) — replaces plain category label ── */}
        <div className="absolute top-3.5 left-3.5">
          {isLive ? (
            // LIVE ANIMAL badge — cyan with heartbeat dot
            <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-wider uppercase font-semibold text-cyan-200 bg-[rgba(0,20,30,0.82)] backdrop-blur-md px-3 py-1 rounded-xl border border-cyan-400/40 shadow-[0_0_10px_rgba(0,184,217,0.3)]">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
              </span>
              Live Animal
            </span>
          ) : (
            // DRY GOODS badge — warm amber
            <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-wider uppercase font-medium text-amber-200 bg-[rgba(20,12,0,0.82)] backdrop-blur-md px-3 py-1 rounded-xl border border-amber-500/30">
              <span className="leading-none">📦</span>
              Dry Goods
            </span>
          )}
        </div>

        {/* ── Live video badge (top-right) — unchanged ────────────────── */}
        {((product.videos && product.videos.length > 0) || (product.media && product.media.some((m) => m.type === 'video'))) && (
          <div className="absolute top-3.5 right-3.5">
            <span className="text-[10px] tracking-wider font-semibold text-cyan-300 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-cyan-400/40 flex items-center gap-1 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>LIVE VIDEO</span>
            </span>
          </div>
        )}

        {/* ── Wishlist Heart ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all active:scale-90 ${
            isWished
              ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.7)] scale-105'
              : 'bg-black/60 border border-white/20 text-white/80 hover:text-white hover:border-white/50'
          }`}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span className="text-sm leading-none">{isWished ? '❤️' : '🤍'}</span>
        </button>
      </Link>

      {/* ── Card Body ─────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link
            href={`/marketplace/${product.id}`}
            className="font-display text-lg sm:text-xl text-white group-hover:text-[--color-accent] transition-colors block line-clamp-1 mb-1.5 font-normal"
          >
            {product.name}
          </Link>

          {/* Scientific name for live items */}
          {isLive && product.scientificName && (
            <span className="block font-body text-[10px] italic text-cyan-400/70 mb-1 -mt-0.5">
              {product.scientificName}
            </span>
          )}

          <p className="font-body text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.shortDesc}
          </p>
        </div>

        {/* ── Shipping strip ────────────────────────────────────────── */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] sm:text-[11px] font-medium ${
          isLive
            ? 'bg-cyan-400/10 border border-cyan-400/15 text-cyan-300/80'
            : 'bg-amber-400/5 border border-amber-400/10 text-amber-300/70'
        }`}>
          <span className="shrink-0 text-sm leading-none">{isLive ? '🚚' : '📦'}</span>
          <span className="truncate">
            {isLive
              ? '100% Live Arrival Guarantee · Oxygenated Pod'
              : 'Standard Shipping · 2–5 Business Days'}
          </span>
        </div>

        {/* ── Price & Action ────────────────────────────────────────── */}
        <div className={`pt-4 border-t flex items-center justify-between gap-3 ${
          isLive ? 'border-cyan-400/10' : 'border-[rgba(255,255,255,0.08)]'
        }`}>
          <div className="flex flex-col">
            <span className="font-display text-xl sm:text-2xl text-white font-light">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-slate-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 shadow-md active:scale-95 ${
              added
                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                : isLive
                ? 'bg-cyan-500 text-[--color-primary] hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(0,184,217,0.5)]'
                : 'bg-[--color-accent] text-[--color-primary] hover:bg-white hover:shadow-[0_0_20px_rgba(0,184,217,0.4)]'
            }`}
            aria-label={`Add ${product.name} to bag`}
          >
            {added ? 'ADDED ✓' : '+ ADD TO BAG'}
          </button>
        </div>
      </div>
    </div>
  );
}
