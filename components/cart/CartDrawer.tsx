'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useOrder } from '@/lib/context/OrderContext';
import { SITE_CONFIG } from '@/lib/config';

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
  } = useCart();
  const { createOrder, setIsTrackingOpen } = useOrder();

  const [customerName, setCustomerName] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');

  if (!isCartOpen) return null;

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    // Create tracked order in system
    const newOrder = createOrder({
      customerName: customerName.trim() || 'Client',
      phone: '',
      city: customerCity.trim() || 'India',
      pincode: customerPincode.trim() || '700001',
      items: cart.map((i) => ({ product: i.product, quantity: i.quantity })),
      totalAmount: cartTotal,
      estimatedDelivery: 'Tomorrow via Priority Air Cargo',
    });

    const itemsSummary = cart
      .map(
        ({ product, quantity }) =>
          `• ${product.name} (Qty: ${quantity}) - ₹${(product.price * quantity).toLocaleString('en-IN')}`
      )
      .join('\n');

    const destInfo = customerCity ? `\n📍 *Destination:* ${customerCity} ${customerPincode ? `(${customerPincode})` : ''}` : '';

    const message = `Hi Marine Creatures! I am placing Order *#${newOrder.id}* on your online store:\n\n${itemsSummary}\n\n*Cart Total: ₹${cartTotal.toLocaleString('en-IN')}*${destInfo}\n\nLive Tracking ID: *#${newOrder.id}*\nPlease confirm payment link and dispatch timing for my insulated pod!`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encoded}`;
    window.open(whatsappUrl, '_blank');

    clearCart();
    setIsCartOpen(false);
    setIsTrackingOpen(true);
  };

  return (
    <div className="fixed inset-0 z-[99990] overflow-hidden" aria-labelledby="cart-heading" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:w-auto sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-[rgba(3,10,16,0.98)] border-l border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col backdrop-blur-2xl h-full">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-label text-[--color-accent] tracking-[0.2em]">SHOPPING BAG</span>
              <span className="px-2.5 py-0.5 text-xs rounded-full bg-[rgba(0,184,217,0.15)] text-[--color-accent] font-medium border border-[rgba(0,184,217,0.3)]">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-white active:scale-95 text-white flex items-center justify-center transition-all"
              aria-label="Close shopping bag"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="6" />
              </svg>
            </button>
          </div>

          {/* Free shipping banner */}
          <div className="px-5 sm:px-6 py-3 bg-[rgba(0,184,217,0.06)] border-b border-[rgba(0,184,217,0.15)] text-xs text-[--color-text] flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="leading-snug">
              {cartTotal >= 15000
                ? 'Unlocked: FREE Oxygenated Insulated Thermal Pod Shipping Across India!'
                : `Add ₹${(15000 - cartTotal).toLocaleString('en-IN')} more for FREE Climate-Controlled Shipping`}
            </span>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 touch-momentum">
            {cart.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center mx-auto mb-4 text-2xl">
                  🛒
                </div>
                <h3 className="font-display text-xl text-[--color-text] font-light mb-2">
                  Your bag is empty
                </h3>
                <p className="font-body text-xs text-[--color-muted] max-w-xs mx-auto mb-6 leading-relaxed">
                  Explore our captive-bred marine life, NemoLight LED fixtures, and live rock hardscapes.
                </p>
                <Link
                  href="/marketplace"
                  onClick={() => setIsCartOpen(false)}
                  className="btn-primary inline-flex text-xs py-3 px-6 rounded-xl"
                >
                  EXPLORE MARKETPLACE →
                </Link>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-3.5 p-3 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] backdrop-blur-sm"
                >
                  {/* Image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg object-cover border border-[rgba(255,255,255,0.08)] shrink-0 bg-black/40"
                  />

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/marketplace/${product.id}`}
                          onClick={() => setIsCartOpen(false)}
                          className="font-body text-xs font-medium text-[--color-text] hover:text-[--color-accent] transition-colors truncate block"
                        >
                          {product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="w-7 h-7 -mr-1 -mt-1 flex items-center justify-center text-xs text-[--color-muted] hover:text-red-400 active:scale-95 transition-colors"
                          aria-label={`Remove ${product.name} from bag`}
                        >
                          ✕
                        </button>
                      </div>
                      <span className="text-[10px] text-[--color-muted] block mt-0.5">
                        {product.categoryLabel}
                      </span>
                    </div>

                    {/* Quantity & Price */}
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex items-center border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-sm text-[--color-muted] hover:text-white active:bg-white/10 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-[--color-text]">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-sm text-[--color-muted] hover:text-white active:bg-white/10 transition-colors"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-body text-xs font-bold text-[--color-accent]">
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
            <div className="p-5 sm:p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.9)] space-y-3.5 pb-safe">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[--color-muted] font-light">Subtotal</span>
                <span className="font-display text-2xl text-[--color-text] font-light">
                  ₹{cartTotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[--color-muted] border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                <span>Shipping &amp; Live Guarantee</span>
                <span className="text-[--color-accent] font-medium">Calculated at Dispatch</span>
              </div>

              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <input
                    type="text"
                    placeholder="City & Pincode"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="h-10 px-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  onClick={handleWhatsAppCheckout}
                  className="btn-primary w-full justify-center text-xs py-4 px-4 rounded-xl flex items-center gap-2 shadow-xl active:scale-[0.98] transition-transform font-bold tracking-wider uppercase"
                >
                  <span className="text-base">💬</span>
                  <span>CHECKOUT VIA WHATSAPP →</span>
                </button>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Link
                    href="/services"
                    onClick={() => setIsCartOpen(false)}
                    className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                  >
                    + Add Installation Setup
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsTrackingOpen(true);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <span>📦</span>
                    <span>Track Active Order</span>
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-[--color-muted] text-center opacity-70 leading-tight pt-1">
                🔒 100% DOA Live Arrival Guaranteed • Verified Red Sea Batch Authenticity • Nurtured in CODEVERSE
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
