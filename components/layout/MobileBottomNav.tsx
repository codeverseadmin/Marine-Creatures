'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/lib/context/CartContext';
import { SITE_CONFIG } from '@/lib/config';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen, isCartOpen, cartIconBouncing } = useCart();

  // Hide bottom nav when on admin, on invoice, when cart drawer is open or when viewing an individual product detail
  const isProductDetail = pathname.startsWith('/marketplace/') && pathname.split('/').filter(Boolean).length > 1;
  const isAdmin = pathname.startsWith('/admin');
  const isInvoice = pathname.startsWith('/invoice');
  if (isCartOpen || isProductDetail || isAdmin || isInvoice) return null;

  const isHome = pathname === '/';
  const isMarketplace = pathname === '/marketplace';
  const isServices = pathname.startsWith('/services') || pathname.startsWith('/installation') || pathname.startsWith('/renovation') || pathname.startsWith('/aquarium-design');

  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi Marine Creatures! I would like to inquire about your marine life, aquariums, and services.')}`;

  return (
    <div
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 pointer-events-none"
      aria-label="Mobile quick actions"
    >
      <nav
        className="pointer-events-auto max-w-md mx-auto glass-dock rounded-2xl px-2 py-1.5 flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.8)] border border-[rgba(255,255,255,0.12)] bg-[rgba(3,10,16,0.92)] backdrop-blur-2xl"
      >
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
            isHome
              ? 'text-[--color-accent]'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Home"
        >
          <span className="text-lg leading-none mb-1">🏠</span>
          <span className="text-[10px] font-medium tracking-wide uppercase">Home</span>
          {isHome && (
            <span className="w-1 h-1 rounded-full bg-[--color-accent] mt-0.5" />
          )}
        </Link>

        {/* Marketplace */}
        <Link
          href="/marketplace"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
            isMarketplace
              ? 'text-[--color-accent]'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Marketplace Store"
        >
          <span className="text-lg leading-none mb-1">🛍️</span>
          <span className="text-[10px] font-medium tracking-wide uppercase">Store</span>
          {isMarketplace && (
            <span className="w-1 h-1 rounded-full bg-[--color-accent] mt-0.5" />
          )}
        </Link>

        {/* Services */}
        <Link
          href="/services"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
            isServices
              ? 'text-[--color-accent]'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label="Services & Booking"
        >
          <span className="text-lg leading-none mb-1">⚡</span>
          <span className="text-[10px] font-medium tracking-wide uppercase">Services</span>
          {isServices && (
            <span className="w-1 h-1 rounded-full bg-[--color-accent] mt-0.5" />
          )}
        </Link>

        {/* WhatsApp Live Concierge */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-emerald-400 hover:text-emerald-300 transition-all duration-200 active:scale-95"
          aria-label="Chat with Concierge on WhatsApp"
        >
          <span className="text-lg leading-none mb-1">💬</span>
          <span className="text-[10px] font-medium tracking-wide uppercase">Chat</span>
        </a>

        {/* Bag */}
        <button
          onClick={() => setIsCartOpen(true)}
          className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-95 ${
            cartIconBouncing
              ? 'text-[--color-accent] scale-110'
              : 'text-slate-400 hover:text-white'
          }`}
          aria-label={`Shopping Bag (${cartCount} items)`}
        >
          <div className="relative">
            <span className="text-lg leading-none mb-1 block">🛒</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[--color-accent] text-[--color-primary] font-bold text-[9px] flex items-center justify-center shadow-md animate-scale-pop">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-wide uppercase">Bag</span>
        </button>
      </nav>
    </div>
  );
}
