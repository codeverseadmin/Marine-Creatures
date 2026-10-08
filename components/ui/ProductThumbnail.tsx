'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/data/products';
import { resolveProductImage } from '@/lib/resolveProductImage';

interface ProductThumbnailProps {
  product: Product;
  className?: string;
  sizeClassName?: string;
}

export function ProductThumbnail({
  product,
  className = '',
  sizeClassName = 'w-20 h-20 sm:w-22 sm:h-22 rounded-lg',
}: ProductThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const resolved = resolveProductImage(product);

  const hasPhoto = resolved.hasRealPhoto && !imageError && Boolean(resolved.src);

  if (hasPhoto) {
    return (
      <img
        src={resolved.src}
        alt={resolved.alt}
        onError={() => setImageError(true)}
        className={`${sizeClassName} object-cover border border-[rgba(255,255,255,0.08)] shrink-0 bg-black/40 ${className}`}
      />
    );
  }

  // Approved luxury blueprint fallback card for products without verified photograph
  return (
    <div
      className={`${sizeClassName} border border-[rgba(0,184,217,0.25)] bg-gradient-to-br from-[#020b12] via-[#051724] to-[#01090f] flex flex-col items-center justify-center p-1.5 shrink-0 relative overflow-hidden text-center shadow-inner ${className}`}
      aria-label={`${product.name} — Technical blueprint`}
    >
      <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-0.5">
        {product.category === 'lighting-tech' ? (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
          </svg>
        ) : product.category === 'hardware' ? (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="M10 2v7.31L4.62 19.3A2 2 0 0 0 6.35 22h11.3a2 2 0 0 0 1.73-2.7L14 9.31V2" />
            <path d="M8.5 2h7" />
            <path d="M14 9.3h-4" />
          </svg>
        )}
      </div>
      <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-tighter leading-tight line-clamp-1">
        Blueprint
      </span>
      <span className="text-[7px] text-slate-400 leading-none mt-0.5 line-clamp-1">
        Verified Spec
      </span>
    </div>
  );
}
