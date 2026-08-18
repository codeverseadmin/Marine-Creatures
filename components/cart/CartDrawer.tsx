'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { SITE_CONFIG } from '@/lib/config';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    cartCount,
    cartTotal,
  } = useCart();

  if (!isCartOpen) return null;

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    const itemsSummary = cart
      .map(
        ({ product, quantity }) =>
          `• ${product.name} (Qty: ${quantity}) - ₹${(product.price * quantity).toLocaleString('en-IN')}`
      )
      .join('\n');

    const message = `Hi Marine Creatures! I would like to place an order for the following items:\n\n${itemsSummary}\n\n*Cart Total: ₹${cartTotal.toLocaleString('en-IN')}*\n\nPlease confirm delivery availability and dispatch timings to my location.`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encoded}`;
    window.open(whatsappUrl, '_blank');
    setIsCartOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[99990] overflow-hidden" aria-labelledby="cart-heading">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[rgba(3,10,16,0.96)] border-l border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col backdrop-blur-xl">
          {/* Header */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-label text-[--color-accent] tracking-[0.2em]">SHOPPING BAG</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-[rgba(0,184,217,0.15)] text-[--color-accent] font-medium">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-label text-[--color-muted] hover:text-white transition-colors p-2"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          {/* Free shipping banner */}
          <div className="px-6 py-3 bg-[rgba(0,184,217,0.06)] border-b border-[rgba(0,184,217,0.15)] text-xs text-[--color-text] flex items-center gap-2">
            <span>⚡</span>
            <span>
              {cartTotal >= 15000
                ? 'Unlocked: FREE Oxygenated Insulated Thermal Pod Shipping Across India!'
                : `Add ₹${(15000 - cartTotal).toLocaleString('en-IN')} more for FREE Climate-Controlled Shipping`}
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto mb-4 text-2xl">
                  🛒
                </div>
                <h3 className="font-display text-xl text-[--color-text] font-light mb-2">
                  Your bag is empty
                </h3>
                <p className="font-body text-xs text-[--color-muted] max-w-xs mx-auto mb-6">
                  Explore our captive-bred marine life, NemoLight LED fixtures, and live rock hardscapes.
                </p>
                <Link
                  href="/marketplace"
                  onClick={() => setIsCartOpen(false)}
                  className="btn-primary inline-flex text-xs"
                >
                  EXPLORE MARKETPLACE →
                </Link>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)]"
                >
                  {/* Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-20 h-20 rounded object-cover border border-[rgba(255,255,255,0.08)] shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/marketplace/${product.id}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-body text-xs font-medium text-[--color-text] hover:text-[--color-accent] transition-colors line-clamp-1"
                        >
                          {product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="text-xs text-[--color-muted] hover:text-red-400 p-1"
                          aria-label="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-[10px] text-[--color-muted] block mt-0.5">
                        {product.categoryLabel}
                      </span>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-[rgba(255,255,255,0.12)] rounded">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="px-2 py-0.5 text-xs text-[--color-muted] hover:text-white"
                        >
                          −
                        </button>
                        <span className="px-2 py-0.5 text-xs font-medium text-[--color-text]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="px-2 py-0.5 text-xs text-[--color-muted] hover:text-white"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-body text-xs font-semibold text-[--color-accent]">
                        ₹{(product.price * quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.length > 0 && (
            <div className="p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.8)] space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[--color-muted] font-light">Subtotal</span>
                <span className="font-display text-xl text-[--color-text] font-light">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[--color-muted] border-b border-[rgba(255,255,255,0.06)] pb-3">
                <span>Shipping &amp; Live Guarantee</span>
                <span className="text-[--color-accent]">Calculated at Dispatch</span>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleWhatsAppCheckout}
                  className="btn-primary w-full justify-center text-xs py-3.5 flex items-center gap-2 shadow-lg"
                >
                  <span>💬</span>
                  <span>CHECKOUT VIA WHATSAPP CONCIERGE →</span>
                </button>
                <Link
                  href="/services"
                  onClick={() => setIsCartOpen(false)}
                  className="btn-ghost w-full justify-center text-xs py-2.5 text-center block"
                >
                  ADD INSTALLATION / RENOVATION SERVICE
                </Link>
              </div>

              <p className="text-[10px] text-[--color-muted] text-center opacity-70">
                🔒 100% DOA Live Arrival Guaranteed • Verified Red Sea Batch Authenticity • Nurtured in CODEVERSE
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
