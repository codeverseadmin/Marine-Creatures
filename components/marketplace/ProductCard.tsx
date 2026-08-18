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
    <div className="group rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.85)] hover:border-[rgba(0,184,217,0.4)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Top Image Link */}
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

        {/* Minimalist category badge */}
        <div className="absolute top-3.5 left-3.5">
          <span className="text-[11px] tracking-wider uppercase font-medium text-white/90 bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
            {product.categoryLabel}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <Link
            href={`/marketplace/${product.id}`}
            className="font-display text-xl text-white group-hover:text-[--color-accent] transition-colors block line-clamp-1 mb-2 font-normal"
          >
            {product.name}
          </Link>

          <p className="font-body text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.shortDesc}
          </p>
        </div>

        {/* Price & Action */}
        <div className="pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4">
          <span className="font-display text-xl text-white font-light">
            £{product.price.toFixed(2)}
          </span>

          <button
            onClick={handleAdd}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 shadow-md ${
              added
                ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                : 'bg-[--color-accent] text-[--color-primary] hover:bg-white hover:shadow-[0_0_20px_rgba(0,184,217,0.4)] active:scale-95'
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
