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
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
            isHome
              ? 'text-[--color-accent] bg-white/[0.06] shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Home"
        >
          <span className="text-lg leading-none mb-1">🏠</span>
          <span className="text-[10px] font-semibold tracking-wide uppercase">Home</span>
          {isHome && (
            <span className="w-1 h-1 rounded-full bg-[--color-accent] mt-0.5 shadow-[0_0_6px_var(--color-accent)]" />
          )}
        </Link>

        {/* 2. Live Stock (Primary Livestock Conversion Route) */}
        <Link
          href="/marketplace?section=live"
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 relative ${
            isMarketplace
              ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 shadow-[0_0_12px_rgba(0,184,217,0.25)]'
              : 'text-slate-300 hover:text-cyan-200'
          }`}
          aria-label="Live Animals Marketplace"
        >
          <div className="relative">
            <span className="text-lg leading-none mb-1 block">🐠</span>
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
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
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 relative ${
            cartIconBouncing
              ? 'text-[--color-accent] scale-105 bg-cyan-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label={`Shopping Bag (${cartCount} items)`}
        >
          <div className="relative">
            <span className="text-lg leading-none mb-1 block">🛒</span>
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
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-slate-400 hover:text-rose-300 transition-all duration-200 active:scale-95 relative"
          aria-label={`Wishlist (${wishlistCount} items)`}
        >
          <div className="relative">
            <span className="text-lg leading-none mb-1 block">❤️</span>
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
          className="flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all duration-200 active:scale-95 relative"
          aria-label="Chat with Concierge on WhatsApp"
        >
          <div className="relative">
            <span className="text-lg leading-none mb-1 block">💬</span>
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
