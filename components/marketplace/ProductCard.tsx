'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/data/products';
import { useCart } from '@/lib/context/CartContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const [added, setAdded] = React.useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1, e);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)] hover:border-[rgba(0,184,217,0.4)] hover:shadow-[0_12px_36px_rgba(0,184,217,0.14)] transition-all duration-300 flex flex-col justify-between overflow-hidden backdrop-blur-md">
      {/* Top Image Link */}
      <Link href={`/marketplace/${product.id}`} className="block relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(2,7,11,0.85)] via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="text-[10px] tracking-widest uppercase font-semibold text-[--color-accent] bg-[rgba(2,7,11,0.85)] border border-[rgba(0,184,217,0.3)] px-2.5 py-1 rounded backdrop-blur-md">
            {product.categoryLabel}
          </span>
          {product.badge && (
            <span className="text-[10px] tracking-wider uppercase font-semibold text-white bg-[rgba(0,184,217,0.9)] px-2.5 py-1 rounded shadow-lg">
              {product.badge}
            </span>
          )}
        </div>

        {/* Stock status indicator */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>In Stock ({product.stockCount} available)</span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {product.scientificName ? (
            <span className="text-[11px] text-[--color-accent] italic block mb-1">
              {product.scientificName}
            </span>
          ) : product.brand ? (
            <span className="text-[10px] tracking-wider text-[--color-muted] uppercase block mb-1">
              {product.brand}
            </span>
          ) : null}

          <Link
            href={`/marketplace/${product.id}`}
            className="font-body text-sm font-medium text-[--color-text] hover:text-[--color-accent] transition-colors line-clamp-2 leading-snug mb-2"
          >
            {product.name}
          </Link>

          <p className="font-body text-xs text-[--color-muted] line-clamp-2 leading-relaxed mb-4">
            {product.shortDesc}
          </p>
        </div>

        {/* Price & Add to Cart button */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-lg text-[--color-text] font-light">
                £{product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-[--color-muted] line-through">
                  £{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[9px] text-[--color-accent] block">
              {product.deliveryInfo.estimatedDays}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className={`px-3.5 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 ${
              added
                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)] scale-95'
                : 'bg-[--color-accent] text-[--color-primary] hover:bg-[--color-cyan] hover:shadow-[0_0_15px_rgba(0,210,247,0.5)]'
            }`}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? (
              <>
                <span>ADDED ✓</span>
              </>
            ) : (
              <>
                <span>+ ADD</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
