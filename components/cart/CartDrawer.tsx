'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useOrder } from '@/lib/context/OrderContext';
import { SITE_CONFIG } from '@/lib/config';

type CheckoutStep = 'cart' | 'details' | 'success';

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

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  // Reset step when drawer opens
  useEffect(() => {
    if (isCartOpen) {
      setStep('cart');
      setFormError(null);
    }
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  const goToStep = (next: CheckoutStep) => {
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 180);
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setTimeout(() => setStep('cart'), 400);
  };

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      setFormError('Please enter your full name');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit WhatsApp phone number');
      return;
    }

    if (!customerAddress.trim()) {
      setFormError('Please enter your delivery street / house address');
      return;
    }

    if (!customerCity.trim() || !customerPincode.trim()) {
      setFormError('Please enter your city and 6-digit postal code');
      return;
    }

    setFormError(null);

    const newOrder = createOrder({
      customerName: customerName.trim(),
      phone: cleanPhone,
      address: customerAddress.trim(),
      city: customerCity.trim(),
      pincode: customerPincode.trim(),
      orderNotes: orderNotes.trim() || undefined,
      items: cart.map((i) => ({ product: i.product, quantity: i.quantity })),
      subtotal: cartTotal,
      totalAmount: cartTotal,
      estimatedDelivery: 'Tomorrow via Priority Air Cargo',
    });

    const itemsSummary = cart
      .map(
        ({ product, quantity }) =>
          `• ${product.name} (Qty: ${quantity}) - ₹${(product.price * quantity).toLocaleString('en-IN')}`
      )
      .join('\n');

    const message = `🌊 *NEW ORDER RECEIVED — MARINE CREATURES* 🌊\n*Order ID:* #${newOrder.id}\n\n👤 *CUSTOMER DETAILS:*\n• *Name:* ${customerName.trim()}\n• *Phone:* +91 ${cleanPhone}\n• *Delivery Address:* ${customerAddress.trim()}\n• *City & Pincode:* ${customerCity.trim()} (${customerPincode.trim()})${orderNotes.trim() ? `\n• *Special Notes:* ${orderNotes.trim()}` : ''}\n\n📦 *ORDERED SPECIMENS:*\n${itemsSummary}\n\n*Total Order Value:* ₹${cartTotal.toLocaleString('en-IN')}\n*Thermal Pod Packaging:* FREE Oxygenated Climate Pod`;

    const encoded = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encoded}`;
    window.open(whatsappUrl, '_blank');

    setPlacedOrderId(newOrder.id);
    clearCart();
    goToStep('success');
  };

  // ─── Shared Header ────────────────────────────────────────────────────────
  const renderHeader = (title: string, showBack: boolean) => (
    <div className="p-5 sm:p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => goToStep('cart')}
            className="w-9 h-9 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-cyan-400 active:scale-95 text-white flex items-center justify-center transition-all mr-1"
            aria-label="Back to cart"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <span className="text-label text-[--color-accent] tracking-[0.2em]">{title}</span>
          {step === 'cart' && (
            <span className="px-2.5 py-0.5 text-xs rounded-full bg-[rgba(0,184,217,0.15)] text-[--color-accent] font-medium border border-[rgba(0,184,217,0.3)]">
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </span>
          )}
          {step === 'details' && (
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/15 text-emerald-400 font-medium border border-emerald-400/25">
              Step 2 of 2
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleClose}
        className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-white active:scale-95 text-white flex items-center justify-center transition-all flex-shrink-0"
        aria-label="Close shopping bag"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );

  // ─── Step Indicator ────────────────────────────────────────────────────────
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 px-6 py-2.5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] flex-shrink-0">
      {(['cart', 'details'] as const).map((s, i) => {
        const isActive = step === s || (step === 'success' && s === 'details');
        const isDone = (s === 'cart' && (step === 'details' || step === 'success'));
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : isActive
                  ? 'bg-[--color-accent] text-[--color-primary]'
                  : 'bg-[rgba(255,255,255,0.08)] text-[--color-muted]'
              }`}>
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                isActive ? 'text-[--color-accent]' : isDone ? 'text-emerald-400' : 'text-[--color-muted]'
              }`}>
                {s === 'cart' ? 'Cart' : 'Details'}
              </span>
            </div>
            {i === 0 && (
              <div className={`flex-1 h-px max-w-8 transition-colors ${
                step === 'details' || step === 'success' ? 'bg-emerald-500' : 'bg-[rgba(255,255,255,0.1)]'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  // ─── Step 1: Cart ─────────────────────────────────────────────────────────
  const renderCartStep = () => (
    <>
      {/* Free shipping banner */}
      <div className="px-5 sm:px-6 py-3 bg-[rgba(0,184,217,0.06)] border-b border-[rgba(0,184,217,0.15)] text-xs text-[--color-text] flex items-center gap-2 flex-shrink-0">
        <span className="text-sm">⚡</span>
        <span className="leading-snug">
          {cartTotal >= 15000
            ? 'Unlocked: FREE Oxygenated Insulated Thermal Pod Shipping Across India!'
            : `Add ₹${(15000 - cartTotal).toLocaleString('en-IN')} more for FREE Climate-Controlled Shipping`}
        </span>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
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
              onClick={handleClose}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg object-cover border border-[rgba(255,255,255,0.08)] shrink-0 bg-black/40"
              />
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/marketplace/${product.id}`}
                      onClick={handleClose}
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
        <div className="p-5 sm:p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.95)] space-y-3 flex-shrink-0 pb-safe">
          <div className="flex items-center justify-between">
            <span className="text-[--color-muted] text-sm font-light">Subtotal</span>
            <span className="font-display text-2xl text-[--color-text] font-light">
              ₹{cartTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[--color-muted] border-b border-[rgba(255,255,255,0.06)] pb-3">
            <span>Shipping &amp; Live Guarantee</span>
            <span className="text-[--color-accent] font-medium">Calculated at Dispatch</span>
          </div>

          <button
            onClick={() => goToStep('details')}
            className="btn-primary w-full justify-center text-xs py-3.5 px-4 rounded-xl flex items-center gap-2 shadow-xl active:scale-[0.98] transition-transform font-bold tracking-wider uppercase"
          >
            <span>PROCEED TO CHECKOUT</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link
              href="/services"
              onClick={handleClose}
              className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
            >
              + Add Installation Setup
            </Link>
            <button
              type="button"
              onClick={() => {
                handleClose();
                setIsTrackingOpen(true);
              }}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
            >
              <span>📦</span>
              <span>Track Active Order</span>
            </button>
          </div>

          <p className="text-[10px] text-[--color-muted] text-center opacity-70 leading-tight">
            🔒 100% DOA Live Arrival Guaranteed • Verified Red Sea Batch Authenticity
          </p>
        </div>
      )}
    </>
  );

  // ─── Step 2: Customer Details ─────────────────────────────────────────────
  const renderDetailsStep = () => (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-5 sm:p-6 space-y-4">

          {/* Order Summary Strip */}
          <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] p-3.5 space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[--color-muted] mb-2">
              Order Summary ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </div>
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center justify-between gap-2">
                <span className="text-xs text-[--color-text] truncate">
                  {product.name}
                  <span className="text-[--color-muted] ml-1">×{quantity}</span>
                </span>
                <span className="text-xs font-bold text-[--color-accent] flex-shrink-0">
                  ₹{(product.price * quantity).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="border-t border-[rgba(255,255,255,0.06)] pt-2 flex items-center justify-between">
              <span className="text-xs text-[--color-muted]">Total</span>
              <span className="font-display text-lg text-[--color-text] font-semibold">
                ₹{cartTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Form Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400">
                Live Cargo Delivery Details
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                * Required for Invoice
              </span>
            </div>

            {formError && (
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9px] uppercase font-semibold text-slate-400 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-semibold text-slate-400 block mb-1">
                  WhatsApp Phone *
                </label>
                <input
                  type="tel"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-[9px] uppercase font-semibold text-slate-400 block mb-1">
                Delivery Street Address *
              </label>
              <input
                type="text"
                placeholder="House/Flat No, Apartment, Landmark, Area"
                value={customerAddress}
                onChange={(e) => {
                  setCustomerAddress(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* City + Pincode */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[9px] uppercase font-semibold text-slate-400 block mb-1">
                  City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru"
                  value={customerCity}
                  onChange={(e) => {
                    setCustomerCity(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] uppercase font-semibold text-slate-400 block mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 560038"
                  value={customerPincode}
                  onChange={(e) => {
                    setCustomerPincode(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full h-10 px-3 rounded-xl bg-black/60 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[9px] uppercase font-semibold text-slate-400 block mb-1">
                Acclimation / Delivery Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="Special handling, delivery instructions…"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-black/40 border border-white/6 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>

          {/* WhatsApp info badge */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/8 border border-emerald-400/20">
            <span className="text-lg mt-0.5 flex-shrink-0">💬</span>
            <div>
              <p className="text-[11px] font-semibold text-emerald-300 mb-0.5">
                Order sent to Suraj via WhatsApp
              </p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                After placing, WhatsApp will open instantly with your full order details sent to our admin for processing.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="p-5 sm:p-6 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.95)] flex-shrink-0 pb-safe">
        <button
          onClick={handleWhatsAppCheckout}
          className="btn-primary w-full justify-center text-xs py-4 px-4 rounded-xl flex items-center gap-2.5 shadow-xl active:scale-[0.98] transition-transform font-bold tracking-wider uppercase"
        >
          <span className="text-base">💬</span>
          <span>PLACE ORDER &amp; OPEN WHATSAPP →</span>
        </button>
        <p className="text-[10px] text-[--color-muted] text-center opacity-60 leading-tight mt-3">
          🔒 100% DOA Live Arrival Guaranteed • Verified Red Sea Batch Authenticity
        </p>
      </div>
    </>
  );

  // ─── Step 3: Success ──────────────────────────────────────────────────────
  const renderSuccessStep = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 text-center gap-5">
      {/* Animated check */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400/40 flex items-center justify-center">
          <span className="text-4xl">🐠</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-2 border-[rgba(2,7,11,1)] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      <div className="space-y-1.5">
        <h2 className="font-display text-2xl text-white font-light">Order Placed!</h2>
        {placedOrderId && (
          <p className="text-sm text-[--color-accent] font-mono font-semibold tracking-wider">
            #{placedOrderId}
          </p>
        )}
        <p className="text-xs text-[--color-muted] leading-relaxed max-w-xs">
          Your order details have been sent to Suraj on WhatsApp. He will confirm your order shortly.
        </p>
      </div>

      {/* WhatsApp status indicator */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/25 w-full max-w-xs">
        <span className="relative flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75 top-0 left-0"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
        </span>
        <span className="text-xs font-semibold text-emerald-300">WhatsApp opening now…</span>
      </div>

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <button
          onClick={() => {
            setIsTrackingOpen(true);
            handleClose();
          }}
          className="btn-primary w-full justify-center text-xs py-3.5 px-4 rounded-xl flex items-center gap-2 font-bold tracking-wider uppercase"
        >
          <span>📦</span>
          <span>TRACK MY ORDER</span>
        </button>
        <button
          onClick={handleClose}
          className="text-xs text-[--color-muted] hover:text-white transition-colors py-2"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[99990] overflow-hidden"
      aria-labelledby="cart-heading"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity duration-300"
        onClick={handleClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex w-full sm:w-auto sm:pl-10">
        <div className="w-full sm:w-screen max-w-md bg-[rgba(3,10,16,0.98)] border-l border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col backdrop-blur-2xl h-full">

          {/* Step: Success hides step indicator and has its own close */}
          {step === 'success' ? (
            <>
              <div className="p-5 sm:p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between flex-shrink-0">
                <span className="text-label text-emerald-400 tracking-[0.2em]">ORDER CONFIRMED</span>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-white active:scale-95 text-white flex items-center justify-center transition-all"
                  aria-label="Close"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {renderSuccessStep()}
            </>
          ) : (
            <>
              {renderHeader(
                step === 'cart' ? 'SHOPPING BAG' : 'DELIVERY DETAILS',
                step === 'details'
              )}
              {renderStepIndicator()}
              <div className={`flex flex-col flex-1 min-h-0 transition-opacity duration-180 ${animating ? 'opacity-0' : 'opacity-100'}`}>
                {step === 'cart' && renderCartStep()}
                {step === 'details' && renderDetailsStep()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
