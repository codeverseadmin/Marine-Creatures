'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { SITE_CONFIG } from '@/lib/config';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen, isCartOpen, cartIconBouncing } = useCart();
  const { wishlistCount, setIsWishlistOpen, isWishlistOpen } = useWishlist();

  // Hide bottom dock when on admin, on invoice, when cart/wishlist drawers are open or when viewing an individual product detail
  const isProductDetail = pathname.startsWith('/marketplace/') && pathname.split('/').filter(Boolean).length > 1;
  const isAdmin = pathname.startsWith('/admin');
  const isInvoice = pathname.startsWith('/invoice');
  if (isCartOpen || isWishlistOpen || isProductDetail || isAdmin || isInvoice) return null;

  const isHome = pathname === '/';
  const isMarketplace = pathname.startsWith('/marketplace');

  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Marine Creatures! I am exploring your rare marine life & reef catalog and need assistance.')}`;

  return (
    <div
      className="md:hidden fixed bottom-2.5 left-2.5 right-2.5 z-40 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile quick actions"
    >
      <nav
        className="pointer-events-auto max-w-md mx-auto rounded-2xl p-1.5 flex items-center justify-between gap-1 shadow-[0_12px_40px_rgba(0,0,0,0.88),0_0_24px_rgba(0,184,217,0.14)] border border-[rgba(255,255,255,0.12)] bg-[rgba(3,10,16,0.94)] backdrop-blur-2xl"
      >
        {/* 1. Home */}
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
            isHome
              ? 'text-[--color-accent] bg-white/[0.06] shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Home"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isHome ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Home</span>
          {isHome && (
            <span className="w-1 h-1 rounded-full bg-[--color-accent] mt-0.5 shadow-[0_0_6px_var(--color-accent)]" />
          )}
        </Link>

        {/* 2. Live Stock (Primary Livestock Conversion Route) */}
        <Link
          href="/marketplace?section=live"
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 relative ${
            isMarketplace
              ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 shadow-[0_0_12px_rgba(0,184,217,0.25)]'
              : 'text-slate-300 hover:text-cyan-200'
          }`}
          aria-label="Live Animals Marketplace"
        >
          <div className="relative mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18.5 9.5c-1.5-3-4.5-5-8.5-5S3.5 5.5 2 9.5c1 3 3.5 5.5 8 6.5 4.5-1 7-3.5 8.5-6.5z" />
              <path d="M22 12c-1 2-3 4-6 5" />
              <path d="M14 13c-.5 1.5-2 3-4 3.5" />
            </svg>
            <span className="absolute -top-1 -right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase">Live</span>
          {isMarketplace && (
            <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_#00b8d9]" />
          )}
        </Link>

        {/* 3. Shopping Bag */}
        <button
          onClick={() => setIsCartOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 relative ${
            cartIconBouncing
              ? 'text-[--color-accent] scale-105 bg-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label={`Shopping Bag (${cartCount} items)`}
        >
          <div className="relative mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-[--color-accent] text-[--color-primary] font-extrabold text-[9px] flex items-center justify-center shadow-lg shadow-cyan-500/40 animate-scale-pop">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Bag</span>
        </button>

        {/* 4. Saved / Wishlist */}
        <button
          onClick={() => setIsWishlistOpen(true)}
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl text-slate-400 hover:text-rose-300 transition-all duration-200 active:scale-95 relative"
          aria-label={`Wishlist (${wishlistCount} items)`}
        >
          <div className="relative mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill={wishlistCount > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={wishlistCount > 0 ? 'text-rose-400' : ''} aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white font-extrabold text-[9px] flex items-center justify-center shadow-lg shadow-rose-500/40 animate-scale-pop">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Saved</span>
        </button>

        {/* 5. Live WhatsApp Concierge */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all duration-200 active:scale-95 relative"
          aria-label="Chat with Concierge on WhatsApp"
        >
          <div className="relative mb-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">Chat</span>
        </a>
      </nav>
    </div>
  );
}
