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
    <div className="group rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] hover:border-[rgba(0,184,217,0.5)] hover:shadow-[0_10px_30px_rgba(0,184,217,0.12)] transition-all duration-300 flex flex-col justify-between overflow-hidden">
      {/* Top Image Link */}
      <Link
        href={`/marketplace/${product.id}`}
        className="block relative overflow-hidden bg-black/40"
        style={{ aspectRatio: '16/11' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Minimalist category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] tracking-wider uppercase font-medium text-white/90 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
            {product.categoryLabel}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link
            href={`/marketplace/${product.id}`}
            className="font-display text-lg text-white group-hover:text-[--color-accent] transition-colors block line-clamp-1 mb-1 font-light"
          >
            {product.name}
          </Link>

          <p className="font-body text-xs text-[--color-muted] line-clamp-2 leading-relaxed mb-4">
            {product.shortDesc}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
          <div>
            <span className="font-display text-lg text-white font-light">
              £{product.price.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className={`px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-1 ${
              added
                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                : 'bg-[--color-accent] text-[--color-primary] hover:bg-white'
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
