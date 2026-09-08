'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useCart } from '@/lib/context/CartContext';
import { SITE_CONFIG } from '@/lib/config';

export function WishlistDrawer() {
  const { wishlist, isWishlistOpen, setIsWishlistOpen, removeFromWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();

  if (!isWishlistOpen) return null;

  const handleMoveToCart = (product: any, e: React.MouseEvent) => {
    addToCart(product, 1, e);
    removeFromWishlist(product.id);
    setIsCartOpen(true);
  };

  const handleInquireAll = () => {
    if (wishlist.length === 0) return;
    const summary = wishlist
      .map((p) => `• ${p.name} — ₹${p.price.toLocaleString('en-IN')}`)
      .join('\n');
    const msg = `Hi Marine Creatures! I have saved the following specimens to my wishlist:\n\n${summary}\n\nCan you confirm current quarantine status and live arrival availability for my location?`;
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[99992] overflow-hidden" aria-labelledby="wishlist-heading" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:w-auto sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-[rgba(3,10,16,0.98)] border-l border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col backdrop-blur-2xl h-full">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">❤️</span>
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-rose-400">YOUR WISHLIST</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                {wishlistCount}
              </span>
            </div>
            <button
              onClick={() => setIsWishlistOpen(false)}
              className="w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:border-white text-white flex items-center justify-center transition-all"
              aria-label="Close wishlist"
            >
              ✕
            </button>
          </div>

          {/* Subheader info */}
          <div className="px-5 py-2.5 bg-rose-500/5 border-b border-rose-500/15 text-xs text-rose-200/90 flex items-center justify-between">
            <span>Saved specimens &amp; precision hardware</span>
            {wishlistCount > 0 && (
              <button
                onClick={clearWishlist}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors underline underline-offset-2"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Wishlist Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 touch-momentum">
            {wishlist.length === 0 ? (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-2xl">
                  🤍
                </div>
                <h3 className="font-display text-2xl text-white font-light mb-2">
                  Your wishlist is empty
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6 leading-relaxed">
                  Tap the heart icon on any captive-bred marine fish, SPS coral, or NemoLight fixture to save it here.
                </p>
                <Link
                  href="/marketplace"
                  onClick={() => setIsWishlistOpen(false)}
                  className="btn-primary inline-flex text-xs py-3 px-6 rounded-xl font-bold uppercase tracking-wider"
                >
                  EXPLORE STOREFRONT →
                </Link>
              </div>
            ) : (
              wishlist.map((product) => (
                <div
                  key={product.id}
                  className="p-3.5 rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-sm flex gap-3.5 items-center justify-between group"
                >
                  <Link
                    href={`/marketplace/${product.id}`}
                    onClick={() => setIsWishlistOpen(false)}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-semibold text-cyan-400 tracking-wider block truncate">
                        {product.categoryLabel}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {product.name}
                      </h4>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-display text-sm sm:text-base text-white font-medium">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                        {product.originalPrice && (
                          <span className="text-[10px] text-slate-500 line-through">
                            ₹{product.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => handleMoveToCart(product, e)}
                      className="h-9 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase tracking-wider active:scale-95 shadow-md flex items-center gap-1"
                      title="Move to Shopping Bag"
                    >
                      <span>+</span>
                      <span className="hidden xs:inline">BAG</span>
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="w-9 h-9 rounded-xl border border-white/10 hover:border-red-400 text-slate-400 hover:text-red-400 flex items-center justify-center text-xs transition-colors"
                      title="Remove from wishlist"
                      aria-label="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {wishlist.length > 0 && (
            <div className="p-5 border-t border-white/10 bg-black/40 space-y-2.5 pb-safe">
              <button
                onClick={handleInquireAll}
                className="w-full h-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-xs text-emerald-300 font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>INQUIRE ALL ON WHATSAPP</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
