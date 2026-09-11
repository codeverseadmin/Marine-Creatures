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
  const isLive = isLiveProduct(product);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, e);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group rounded-2xl border border-slate-800/80 bg-[#06131d]/90 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-950/20 transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* ── Image Block ───────────────────────────────────────────── */}
      <Link
        href={`/marketplace/${product.id}`}
        className="block relative overflow-hidden bg-slate-950 aspect-[4/3]"
      >
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Subtle Category Badge (Top Left) */}
        <div className="absolute top-3 left-3">
          {isLive ? (
            <span className="text-[11px] font-semibold text-cyan-300 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-400/30">
              Live Specimen
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-300 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-400/30">
              Dry Goods
            </span>
          )}
        </div>

        {/* Wishlist Heart Button (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product);
          }}
          className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-xl backdrop-blur-md flex items-center justify-center transition-all active:scale-90 ${
            isWished
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-black/50 border border-white/20 text-white/80 hover:text-white hover:bg-black/70'
          }`}
          aria-label={isWished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <span className="text-sm leading-none">{isWished ? '❤️' : '🤍'}</span>
        </button>
      </Link>

      {/* ── Card Content ─────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3">
        <div>
          {/* Category & Origin */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
            <span className="capitalize">{product.category.replace('-', ' ')}</span>
            {isLive && <span>• 100% Live Arrival</span>}
          </div>

          {/* Product Title */}
          <Link
            href={`/marketplace/${product.id}`}
            className="font-semibold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors block line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>

          {/* Scientific Name (Subtle) */}
          {isLive && product.scientificName && (
            <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
              {product.scientificName}
            </p>
          )}
        </div>

        {/* ── Price & Add to Bag ───────────────────────────────────── */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-white font-mono">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] text-slate-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            className={`h-10 px-4 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${
              added
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 hover:shadow-cyan-400/20'
            }`}
            aria-label={`Add ${product.name} to bag`}
          >
            <span>{added ? '✓' : '+'}</span>
            <span>{added ? 'Added' : 'Add to Bag'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
