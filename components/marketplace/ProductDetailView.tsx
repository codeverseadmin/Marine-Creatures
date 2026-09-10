'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Product, ProductMedia, isLiveProduct } from '@/lib/data/products';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useCatalog } from '@/lib/context/CatalogContext';
import { ProductCard } from './ProductCard';
import { SITE_CONFIG } from '@/lib/config';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product: initialProduct, relatedProducts }: ProductDetailViewProps) {
  const { getProduct } = useCatalog();
  const product = getProduct(initialProduct.id) || initialProduct;
  const { addToCart, setIsCartOpen } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const isWished = isInWishlist(product.id);
  const isLive = isLiveProduct(product);

  // Unified Media List (Photos + Videos)
  const mediaItems: ProductMedia[] = React.useMemo(() => {
    const list: ProductMedia[] = [];
    if (product.media && product.media.length > 0) {
      return product.media;
    }
    // Fallback: build from images and videos arrays
    product.images.forEach((img, i) => {
      list.push({
        id: `img-${i}`,
        type: 'image',
        url: img,
        title: `${product.name} — Photo ${i + 1}`,
      });
    });
    if (product.videos && product.videos.length > 0) {
      product.videos.forEach((vid, i) => {
        list.push({
          id: `vid-${i}`,
          type: 'video',
          url: vid,
          title: `Live Quarantine Specimen Video`,
        });
      });
    }
    return list;
  }, [product]);

  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const currentMedia = mediaItems[activeMediaIndex] || mediaItems[0];

  const [quantity, setQuantity] = useState(1);

  // Dynamically compute tabs based on what data this specific product actually possesses
  const availableTabs = useMemo(() => {
    const list: Array<{ id: string; label: string; icon: string }> = [];
    if (product.careGuide) {
      list.push({ id: 'overview', label: 'Tank Fit & Care', icon: '🐠' });
    }
    if (product.installationGuide) {
      list.push({ id: 'setup', label: 'Setup & In-Box', icon: '🔧' });
    }
    list.push({ id: 'specs', label: 'Specifications', icon: '📋' });
    list.push({ id: 'shipping', label: 'Transit & Guarantee', icon: '🚚' });
    if (product.careGuide?.acclimationSteps && product.careGuide.acclimationSteps.length > 0) {
      list.push({ id: 'acclimation', label: 'Acclimation Guide', icon: '💧' });
    }
    return list;
  }, [product]);

  const [activeTab, setActiveTab] = useState<string>(availableTabs[0]?.id || 'specs');

  // Keep active tab valid if product changes
  useEffect(() => {
    if (!availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id || 'specs');
    }
  }, [availableTabs, activeTab]);

  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState(false);

  const prevMedia = () => {
    setActiveMediaIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const nextMedia = () => {
    setActiveMediaIndex((prev) => (prev + 1) % mediaItems.length);
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.trim().length >= 4) {
      setPincodeChecked(true);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    addToCart(product, quantity, e);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsCartOpen(true);
    }, 600);
  };

  const handleWhatsAppInquiry = () => {
    const locInfo = pincode ? ` (Delivery Pincode: ${pincode})` : '';
    const message = `Hi Marine Creatures! I would like to inquire about the ${product.name} (₹${product.price.toLocaleString('en-IN')})${locInfo}.\n\nCan you confirm delivery timing and live availability for my location?`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  return (
    <div
      style={{ background: 'var(--color-primary)', minHeight: '100vh', paddingTop: '130px' }}
      className="pb-32 md:pb-16"
    >
      {/* Main Product Container */}
      <div className="container-max pb-16 md:pb-24">
        {/* Integrated Top Navigation & Breadcrumbs */}
        <div className="flex items-center justify-between gap-4 pb-5 sm:pb-6 mb-6 sm:mb-10 border-b border-[rgba(255,255,255,0.08)] text-xs sm:text-sm">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-[--color-accent] hover:text-white font-medium transition-colors"
          >
            ← BACK TO MARKETPLACE
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-[--color-muted] overflow-x-auto scrollbar-none whitespace-nowrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="opacity-30">/</span>
            <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
            <span className="opacity-30">/</span>
            <span className="text-[--color-accent]">{product.categoryLabel}</span>
            <span className="opacity-30">/</span>
            <span className="text-white truncate max-w-xs">{product.name}</span>
          </div>
        </div>

        {/* Main Product Showcase Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Left Column: Photo & Video Interactive Slideshow */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="rounded-3xl overflow-hidden border border-[rgba(255,255,255,0.12)] bg-black/80 shadow-2xl relative select-none flex items-center justify-center"
              style={{ aspectRatio: '16/11' }}
            >
              {/* Main Media Display: Image or Video */}
              {currentMedia?.type === 'video' ? (
                <div className="w-full h-full relative bg-black flex items-center justify-center">
                  <video
                    key={currentMedia.url}
                    src={currentMedia.url}
                    controls
                    autoPlay
                    loop
                    playsInline
                    className="w-full h-full object-contain max-h-full"
                  />
                  {/* Live Quarantine Badge */}
                  <div className="absolute top-4 right-4 z-20 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-cyan-300 bg-slate-950/85 px-3 py-1.5 rounded-xl border border-cyan-400/40 backdrop-blur-md shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                      LIVE SPECIMEN VIDEO
                    </span>
                  </div>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={currentMedia?.url || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />
              )}

              {/* Badges Overlay */}
              {product.badge && currentMedia?.type !== 'video' && (
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 z-10 pointer-events-none">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-white bg-[--color-accent] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl shadow-lg">
                    {product.badge}
                  </span>
                </div>
              )}

              {/* Prev / Next Slide Chevrons */}
              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
                    aria-label="Previous media slide"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  <button
                    onClick={nextMedia}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-white/20 bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all active:scale-90"
                    aria-label="Next media slide"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Slide Counter Overlay */}
                  <div className="absolute bottom-3.5 right-3.5 z-10 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-mono font-medium text-white/90 border border-white/10">
                      {activeMediaIndex + 1} / {mediaItems.length}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail Selector Strip (Photos + Videos) */}
            {mediaItems.length > 1 && (
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none touch-momentum">
                {mediaItems.map((item, idx) => (
                  <button
                    key={item.id || idx}
                    onClick={() => setActiveMediaIndex(idx)}
                    className={`relative w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 active:scale-95 bg-black/50 ${
                      activeMediaIndex === idx
                        ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,184,217,0.5)] scale-[1.02]'
                        : 'border-white/10 opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`View slide ${idx + 1} (${item.type})`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative flex items-center justify-center bg-slate-900">
                        {item.thumbnail ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-cyan-950 flex items-center justify-center" />
                        )}
                        {/* Play Icon Badge */}
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-0.5">
                          <span className="w-6 h-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[10px] pl-0.5 shadow-md font-bold">
                            ▶
                          </span>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-cyan-300">
                            VIDEO
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Pricing & Purchase */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs tracking-wider uppercase font-semibold text-cyan-200 bg-[rgba(0,20,30,0.85)] px-3 py-1 rounded-xl border border-cyan-400/40 shadow-[0_0_10px_rgba(0,184,217,0.3)]">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
                    </span>
                    Live Animal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs tracking-wider uppercase font-medium text-amber-200 bg-[rgba(20,12,0,0.85)] px-3 py-1 rounded-xl border border-amber-500/30">
                    <span>📦</span>
                    Dry Goods
                  </span>
                )}
                <span className="inline-block text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] px-3 py-1 rounded-lg bg-[rgba(0,184,217,0.1)] border border-[rgba(0,184,217,0.25)]">
                  {product.scientificName || product.categoryLabel}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-4xl md:text-5xl text-white font-light leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-baseline gap-3 sm:gap-4 pt-1">
                <span className="font-display text-2xl sm:text-4xl text-white font-light">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <span className="text-xs sm:text-base text-slate-500 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  In Stock ({product.stockCount} Available)
                </span>
              </div>

              {/* Quick Spec Badges */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(product.specifications).slice(0, 3).map(([k, v]) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-[10px] sm:text-[11px] text-slate-300"
                    >
                      <strong className="text-[--color-accent] font-medium">{k}:</strong> {v}
                    </span>
                  ))}
                </div>
              )}

              <p className="font-body text-xs sm:text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Delivery Assurance & Pincode Checker */}
            <div className="p-4 sm:p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] space-y-3 text-xs">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="text-base">⚡</span>
                <span>{product.deliveryInfo.estimatedDays}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-[--color-muted] leading-relaxed">
                {product.deliveryInfo.guaranteeText} • {product.deliveryInfo.shippingMethod}
              </p>

              {/* Pincode checker form */}
              <form onSubmit={handlePincodeCheck} className="pt-2 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    setPincodeChecked(false);
                  }}
                  className="w-40 sm:w-48 h-9 px-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent]"
                />
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-[11px] font-semibold tracking-wider uppercase text-white transition-all"
                >
                  Check
                </button>
              </form>

              {pincodeChecked && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center gap-2 animate-fade-in">
                  <span>✓</span>
                  <span>
                    Direct insulated climate delivery available for pincode <strong>{pincode}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Quantity and Add to Bag */}
            <div className="space-y-3.5 pt-1">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] rounded-xl h-12 sm:h-14 px-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 sm:w-10 h-10 flex items-center justify-center text-base text-[--color-muted] hover:text-white transition-colors"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 sm:w-10 text-center text-xs sm:text-sm font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    className="w-8 sm:w-10 h-10 flex items-center justify-center text-base text-[--color-muted] hover:text-white transition-colors"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 h-12 sm:h-14 px-4 sm:px-8 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-xl active:scale-95 ${
                    added
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[--color-accent] text-[--color-primary] hover:bg-white'
                  }`}
                >
                  {added ? 'ADDED TO BAG ✓' : `ADD TO BAG — ₹${(product.price * quantity).toLocaleString('en-IN')}`}
                </button>

                {/* Wishlist Toggle Button */}
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`h-12 sm:h-14 w-12 sm:w-14 rounded-xl border flex items-center justify-center text-lg active:scale-90 transition-all shrink-0 ${
                    isWished
                      ? 'border-rose-500 bg-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                      : 'border-white/15 bg-white/5 text-white/70 hover:text-white hover:border-white/40'
                  }`}
                  aria-label={isWished ? 'Remove from wishlist' : 'Save to wishlist'}
                  title={isWished ? 'Saved in Wishlist' : 'Add to Wishlist'}
                >
                  {isWished ? '❤️' : '🤍'}
                </button>
              </div>

              {/* WhatsApp direct order button */}
              <button
                onClick={handleWhatsAppInquiry}
                className="w-full h-12 rounded-xl border border-[rgba(0,184,217,0.3)] bg-[rgba(0,184,217,0.06)] hover:bg-[rgba(0,184,217,0.15)] active:scale-95 text-xs text-[--color-accent] font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>INQUIRE / ORDER VIA WHATSAPP</span>
              </button>

              {/* Request Live Feeding Video button */}
              <button
                onClick={() => {
                  const message = `Hi Marine Creatures! I am interested in the ${product.name} (₹${product.price.toLocaleString('en-IN')}). Could you please share a quick 10-second quarantine tank feeding clip or live video before I order?`;
                  window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                }}
                className="w-full h-11 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 active:scale-95 text-xs text-cyan-300 font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>🎥 REQUEST LIVE FEEDING VIDEO ON WHATSAPP</span>
              </button>
            </div>

            <div className="pt-1">
              <Link
                href="/services"
                className="text-xs text-[--color-muted] hover:text-[--color-accent] flex items-center gap-1.5 transition-colors"
              >
                <span>🔧</span>
                <span>Need complete on-site installation or plumbing setup? Book a consultation →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Elevated Product Detail Tabs (De-cluttered, High-Signal UX) ── */}
        <div className="mt-14 sm:mt-20 pt-10 border-t border-[rgba(255,255,255,0.08)]">
          {/* Tab Navigation */}
          <div className="flex gap-2 sm:gap-4 border-b border-[rgba(255,255,255,0.08)] overflow-x-auto scrollbar-none touch-momentum pb-px">
            {availableTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-medium tracking-wide whitespace-nowrap border-b-2 transition-all duration-200 -mb-px rounded-t-xl ${
                    isActive
                      ? 'border-[--color-accent] text-[--color-accent] bg-[rgba(0,184,217,0.06)] font-semibold'
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <span className="text-base sm:text-lg leading-none">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Panels */}
          <div className="py-8 sm:py-10">
            {/* 1. Livestock Overview & Tank Fit */}
            {activeTab === 'overview' && product.careGuide && (
              <div className="space-y-8 animate-fade-in">
                {/* Visual Suitability Grid */}
                <div>
                  <h3 className="text-xs uppercase tracking-widest font-semibold text-[--color-accent] mb-4">
                    Ecosystem Compatibility &amp; Essentials
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Reef Safe */}
                    <div className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] backdrop-blur-md">
                      <span className="text-[11px] text-[--color-muted] block mb-1.5 uppercase tracking-wider">
                        Reef Compatibility
                      </span>
                      <div className="flex items-center gap-2">
                        {product.careGuide.reefSafe ? (
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            100% Coral Safe
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Fish-Only System
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Min Tank Size */}
                    {product.careGuide.minimumTankSize && (
                      <div className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] backdrop-blur-md">
                        <span className="text-[11px] text-[--color-muted] block mb-1.5 uppercase tracking-wider">
                          Minimum Tank Volume
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {product.careGuide.minimumTankSize}
                        </span>
                      </div>
                    )}

                    {/* Temperament */}
                    {product.careGuide.temperament && (
                      <div className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] backdrop-blur-md">
                        <span className="text-[11px] text-[--color-muted] block mb-1.5 uppercase tracking-wider">
                          Temperament
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {product.careGuide.temperament}
                        </span>
                      </div>
                    )}

                    {/* Diet */}
                    {product.careGuide.diet && (
                      <div className="p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.6)] backdrop-blur-md">
                        <span className="text-[11px] text-[--color-muted] block mb-1.5 uppercase tracking-wider">
                          Diet Profile
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-white truncate block" title={product.careGuide.diet}>
                          {product.careGuide.diet}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Water Chemistry Metrics */}
                <div className="p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-gradient-to-br from-[rgba(7,21,28,0.8)] to-[rgba(3,10,16,0.9)] backdrop-blur-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <span>🧪</span>
                      <span>Target Water Parameters</span>
                    </h3>
                    <span className="text-[11px] text-[--color-muted]">
                      Recommended closed-loop marine reef parameters
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[--color-muted] block">Water Temperature</span>
                        <span className="text-sm font-medium text-white">{product.careGuide.temperature}</span>
                      </div>
                      <span className="text-xl opacity-70">🌡️</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[--color-muted] block">Specific Gravity / Salinity</span>
                        <span className="text-sm font-medium text-white">{product.careGuide.salinity}</span>
                      </div>
                      <span className="text-xl opacity-70">🌊</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-[--color-muted] block">pH Alkalinity Buffer</span>
                        <span className="text-sm font-medium text-white">{product.careGuide.ph}</span>
                      </div>
                      <span className="text-xl opacity-70">⚗️</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-cyan-400 font-bold">⚡ Marine Curators Note:</span>
                    <span>Specimens are fully acclimated and feeding vigorously in captive quarantine prior to dispatch.</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Setup & In-Box (for Equipment & Tech) */}
            {activeTab === 'setup' && product.installationGuide && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 animate-fade-in">
                {/* Setup Steps */}
                <div className="p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-base text-white font-medium flex items-center gap-2">
                      <span>🔧</span>
                      <span>Quick Setup Protocol</span>
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {product.installationGuide.difficulty}
                    </span>
                  </div>
                  <div className="space-y-3 pt-2">
                    {(product.installationGuide.steps || []).map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="w-6 h-6 rounded-full bg-[--color-accent]/20 text-[--color-accent] text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-0.5">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Included In Box */}
                <div className="p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-4">
                  <h3 className="text-base text-white font-medium flex items-center gap-2 mb-2">
                    <span>📦</span>
                    <span>Included Inside The Box</span>
                  </h3>
                  <div className="space-y-2.5 pt-2">
                    {(product.installationGuide.includedInBox || []).map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold shrink-0">
                          ✓
                        </span>
                        <span className="text-xs sm:text-sm text-slate-200 font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Specifications Tab */}
            {activeTab === 'specs' && (
              <div className="max-w-3xl rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl p-6 sm:p-8 animate-fade-in space-y-4">
                <h3 className="text-base text-white font-medium mb-4 flex items-center gap-2">
                  <span>📋</span>
                  <span>Technical &amp; Biological Specifications</span>
                </h3>
                <div className="divide-y divide-white/[0.06]">
                  {Object.entries(product.specifications || {}).map(([key, val]) => (
                    <div key={key} className="py-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-[--color-muted] font-medium">{key}</span>
                      <span className="text-white font-medium text-right">{val}</span>
                    </div>
                  ))}
                  {product.scientificName && (
                    <div className="py-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-[--color-muted] font-medium">Scientific Classification</span>
                      <span className="text-[--color-accent] italic font-serif text-right">{product.scientificName}</span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="py-3.5 flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-[--color-muted] font-medium">Brand &amp; Engineering</span>
                      <span className="text-white font-medium text-right">{product.brand}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Live Transit & Guarantee Tab */}
            {activeTab === 'shipping' && (
              <div className="max-w-4xl space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-3">
                    <span className="text-3xl block">📦</span>
                    <h4 className="text-sm font-semibold text-white">Oxygenated Thermal Pods</h4>
                    <p className="text-xs text-[--color-muted] leading-relaxed">
                      Custom-engineered insulated capsules pressurized with pure medicinal oxygen and 48-hour phase-change thermal gel packs.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-xl space-y-3">
                    <span className="text-3xl block">🛡️</span>
                    <h4 className="text-sm font-semibold text-emerald-300">100% Live Arrival Guarantee</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Zero customer risk. In the rare event of transit complications, our concierge guarantees an immediate specimen replacement or 100% reimbursement.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-3">
                    <span className="text-3xl block">✈️</span>
                    <h4 className="text-sm font-semibold text-white">Priority Airport Cargo</h4>
                    <p className="text-xs text-[--color-muted] leading-relaxed">
                      Handled via express climate cargo flights directly connecting our aquaculture hubs to your local airport courier depot.
                    </p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-300 text-center sm:text-left">
                    <strong className="text-white">Have specific dispatch timing requests?</strong> We can coordinate delivery dates around your schedule.
                  </div>
                  <button
                    onClick={handleWhatsAppInquiry}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-xs font-semibold text-emerald-300 uppercase tracking-wider transition-all whitespace-nowrap"
                  >
                    Coordinate Dispatch on WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* 5. Acclimation Guide Tab */}
            {activeTab === 'acclimation' && product.careGuide?.acclimationSteps && (
              <div className="max-w-3xl space-y-6 animate-fade-in">
                <div className="p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] backdrop-blur-xl space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <div>
                      <h3 className="text-base text-white font-medium flex items-center gap-2">
                        <span>💧</span>
                        <span>Gentle Acclimation Protocol</span>
                      </h3>
                      <p className="text-xs text-[--color-muted] mt-1">
                        Follow these simple steps when your sealed climate pod arrives
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 shrink-0">
                      Step-by-Step
                    </span>
                  </div>

                  <div className="space-y-4 pt-2">
                    {(product.careGuide.acclimationSteps || []).map((step, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="w-8 h-8 rounded-xl bg-[--color-accent]/20 text-[--color-accent] text-sm font-bold flex items-center justify-center shrink-0">
                          0{idx + 1}
                        </span>
                        <div className="pt-1">
                          <span className="text-xs sm:text-sm text-white font-medium leading-relaxed block">{step}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 flex items-center gap-2.5">
                    <span>📋</span>
                    <span>An illustrated printed acclimation guide and water testing card are included inside your shipment.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Frequently Paired Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-14 sm:mt-20 pt-12 border-t border-[rgba(255,255,255,0.08)] pb-12">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block mb-2">
              RECOMMENDED COMBINATIONS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl text-white font-light mb-8">
              Frequently Paired Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          Sticky Floating Mobile Buy Bar (Thumb-friendly high conversion bar)
         ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[rgba(3,10,16,0.96)] border-t border-[rgba(255,255,255,0.12)] backdrop-blur-2xl p-3.5 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] text-[--color-muted] truncate block">{product.name}</span>
          <span className="font-display text-xl text-white font-light leading-none">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleWhatsAppInquiry}
            className="w-11 h-11 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg active:scale-95 transition-transform"
            aria-label="WhatsApp Inquiry"
          >
            💬
          </button>
          <button
            onClick={handleAddToCart}
            className={`h-11 px-5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
              added
                ? 'bg-emerald-500 text-white'
                : 'bg-[--color-accent] text-[--color-primary]'
            }`}
          >
            {added ? 'ADDED ✓' : '+ BAG'}
          </button>
        </div>
      </div>
    </div>
  );
}
