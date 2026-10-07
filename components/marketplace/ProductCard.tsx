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
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const isWished = isInWishlist(product.id);
  const isLive = isLiveProduct(product);
  const isOutOfStock = !product.inStock || product.stockCount <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    // Commerce fires first — animation is an enhancement layer (CTO rule)
    addToCart(product, 1, e);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const hasPrice = product.price > 0 && !product.priceOnRequest;
  const inquiryPriceText = hasPrice ? ` (₹${product.price.toLocaleString('en-IN')})` : ' (Price on Request)';
  const waitlistUrl = `https://wa.me/919330436603?text=${encodeURIComponent(
    `Hello Suraj, I am interested in ${product.name}${inquiryPriceText}. Please share current availability and pricing for Marine Creatures!`
  )}`;

  const hasImage = Boolean(product.images && product.images.length > 0 && product.images[0]);

  return (
    <div className="group rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[var(--color-secondary)] hover:border-[rgba(0,184,217,0.35)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.45),0_0_24px_rgba(0,184,217,0.10)] transition-all duration-300 flex flex-col h-full overflow-hidden">

      {/* ── 1. PRODUCT IMAGE ────────────────────────────────────────── */}
      <Link
        href={`/marketplace/${product.id}`}
        className="block relative overflow-hidden bg-[var(--color-primary)] aspect-[4/3]"
      >
        {hasImage ? (
          <>
            {!imageLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center ocean-shimmer"
                aria-hidden="true"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(0,184,217,0.25)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18.5 9.5c-1.5-3-4.5-5-8.5-5S3.5 5.5 2 9.5c1 3 3.5 5.5 8 6.5 4.5-1 7-3.5 8.5-6.5z" />
                  <path d="M22 12c-1 2-3 4-6 5" />
                </svg>
              </div>
            )}

            <img
              src={product.images[0]}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              loading="lazy"
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#020b12] via-[#051724] to-[#01090f] border-b border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,184,217,0.12)_0%,transparent_70%)] pointer-events-none" />
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_15px_rgba(0,184,217,0.15)]">
              {product.category === 'lighting-tech' ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                </svg>
              ) : product.category === 'hardware' ? (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M10 2v7.31L4.62 19.3A2 2 0 0 0 6.35 22h11.3a2 2 0 0 0 1.73-2.7L14 9.31V2" />
                  <path d="M8.5 2h7" />
                  <path d="M14 9.3h-4" />
                </svg>
              )}
            </div>
            <span className="text-[11px] font-semibold text-white/90 uppercase tracking-wider text-center line-clamp-1">
              {product.brand || 'Marine Equipment'}
            </span>
            <span className="text-[10px] text-cyan-400 font-mono mt-0.5">
              Product Image Coming Soon
            </span>
            <span className="text-[9px] text-slate-400 font-sans mt-0.5 tracking-tight">
              Verified Technical Specification
            </span>
          </div>
        )}

        {/* Category Badge (Top Left) */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isQuarantined ? (
            <span className="text-[11px] font-semibold text-[var(--color-cyan)] bg-[rgba(2,7,11,0.85)] backdrop-blur-md px-2.5 py-1 rounded-lg border border-[rgba(0,184,217,0.35)] shadow-[0_0_12px_rgba(0,184,217,0.2)]">
              Quarantined
            </span>
          ) : isLive ? (
            <span className="text-[11px] font-semibold text-[var(--color-cyan)] bg-[rgba(2,7,11,0.85)] backdrop-blur-md px-2.5 py-1 rounded-lg border border-[rgba(0,184,217,0.3)]">
              Live Specimen
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[var(--color-gold)] bg-[rgba(2,7,11,0.85)] backdrop-blur-md px-2.5 py-1 rounded-lg border border-[rgba(199,167,108,0.3)]">
              {product.categoryLabel || 'Dry Goods'}
            </span>
          )}

          {product.rarity === 'Rare' && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-amber-500/40">
              Rare Specimen
            </span>
          )}

          {isOutOfStock && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300 bg-rose-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-rose-500/40">
              Out of Stock
            </span>
          )}
        </div>

        {/* Wishlist Button (Top Right) */}
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
              : 'bg-[rgba(2,7,11,0.6)] border border-[rgba(255,255,255,0.2)] text-white/80 hover:text-white hover:bg-[rgba(2,7,11,0.8)]'
          }`}
          aria-label={isWished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isWished ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </Link>

      {/* ── Card Content: COMMON NAME -> SCIENTIFIC NAME -> PRICE -> AVAILABILITY -> ACTION ── */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between gap-3 bg-[var(--color-secondary)]">
        <div>
          {/* 2. COMMON NAME */}
          <Link
            href={`/marketplace/${product.id}`}
            className="font-display text-base sm:text-lg text-[var(--color-text)] font-normal group-hover:text-[var(--color-accent)] transition-colors block line-clamp-2 leading-snug tracking-wide"
          >
            {product.name}
          </Link>

          {/* 3. SCIENTIFIC NAME / BRAND */}
          {isLive && product.scientificName ? (
            <p className="text-xs text-[var(--color-muted)] italic line-clamp-1 mt-1 font-body">
              {product.scientificName}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-muted)] line-clamp-1 mt-1 font-body">
              {product.brand ? `${product.brand} • ` : ''}{product.categoryLabel || product.category.replace('-', ' ')}
            </p>
          )}
        </div>

        {/* ── 4. PRICE & 5. AVAILABILITY & 6. ACTION ─────────────── */}
        <div className="pt-3 border-t border-[rgba(255,255,255,0.07)] space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            {/* 4. PRICE */}
            <div className="flex items-baseline gap-2">
              {hasPrice ? (
                <>
                  <span className="text-base sm:text-lg font-bold text-[var(--color-text)]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {(product.compareAtPrice || product.originalPrice) && (product.compareAtPrice || product.originalPrice)! > product.price && (
                    <span className="text-xs text-[var(--color-muted)] line-through">
                      ₹{(product.compareAtPrice || product.originalPrice)!.toLocaleString('en-IN')}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm sm:text-base font-semibold text-[var(--color-accent)] tracking-wide">
                  Price on Request
                </span>
              )}
            </div>

            {/* 5. AVAILABILITY */}
            <div className="text-[11px] font-medium">
              {isOutOfStock ? (
                <span className="text-rose-400">Sold Out</span>
              ) : product.isQuarantined ? (
                <span className="text-[var(--color-cyan)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" aria-hidden="true" />
                  Quarantined
                </span>
              ) : product.availabilityStatus === 'LIMITED' ? (
                <span className="text-amber-400">Limited</span>
              ) : (
                <span className="text-emerald-400">Available</span>
              )}
            </div>
          </div>

          {/* 6. ACTION */}
          <div>
            {isOutOfStock ? (
              <a
                href={waitlistUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-full h-10 px-3.5 rounded-xl bg-[rgba(199,167,108,0.12)] hover:bg-[rgba(199,167,108,0.22)] border border-[rgba(199,167,108,0.35)] text-[var(--color-gold)] text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95"
                title="Request WhatsApp notification on restock"
                aria-label={`Request restock notification for ${product.name} on WhatsApp`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span>Notify on WhatsApp</span>
              </a>
            ) : (
              <button
                onClick={handleAdd}
                className={`w-full h-10 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95 ${
                  added
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[var(--color-accent)] hover:bg-[var(--color-cyan)] text-[var(--color-primary)]'
                }`}
                aria-label={`Add ${product.name} to inquiry bag`}
              >
                {added ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>{hasPrice ? 'Add to Bag' : 'Add to Bag'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
