'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/data/products';
import { useCart } from '@/lib/context/CartContext';
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
  const [selectedImg, setSelectedImg] = useState<string>(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'care' | 'installation' | 'specs' | 'shipping'>('care');
  const [added, setAdded] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState(false);

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
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="rounded-3xl overflow-hidden border border-[rgba(255,255,255,0.1)] bg-black/60 shadow-2xl relative"
              style={{ aspectRatio: '16/11' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImg}
                alt={product.name}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {product.badge && (
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-white bg-[--color-accent] px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl shadow-lg">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-2 scrollbar-none touch-momentum">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(img)}
                    className={`w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 active:scale-95 ${
                      selectedImg === img
                        ? 'border-[--color-accent] shadow-[0_0_15px_rgba(0,184,217,0.4)]'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Pricing & Purchase */}
          <div className="lg:col-span-5 space-y-5 sm:space-y-6">
            <div className="space-y-2.5">
              <span className="inline-block text-[11px] sm:text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] px-3 py-1 rounded-lg bg-[rgba(0,184,217,0.1)] border border-[rgba(0,184,217,0.25)]">
                {product.scientificName || product.categoryLabel}
              </span>
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
              </div>

              {/* WhatsApp direct order button */}
              <button
                onClick={handleWhatsAppInquiry}
                className="w-full h-12 rounded-xl border border-[rgba(0,184,217,0.3)] bg-[rgba(0,184,217,0.06)] hover:bg-[rgba(0,184,217,0.15)] active:scale-95 text-xs text-[--color-accent] font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>INQUIRE / ORDER VIA WHATSAPP</span>
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

        {/* Detailed Information Tabs */}
        <div className="mt-14 sm:mt-20 pt-10 border-t border-[rgba(255,255,255,0.08)]">
          {/* Tab buttons */}
          <div className="flex gap-2 sm:gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4 overflow-x-auto scrollbar-none touch-momentum">
            {product.careGuide && (
              <button
                onClick={() => setActiveTab('care')}
                className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all ${
                  activeTab === 'care'
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-lg'
                    : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.03)]'
                }`}
              >
                Care &amp; Husbandry
              </button>
            )}

            {product.installationGuide && (
              <button
                onClick={() => setActiveTab('installation')}
                className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all ${
                  activeTab === 'installation'
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-lg'
                    : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.03)]'
                }`}
              >
                Setup &amp; Installation
              </button>
            )}

            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all ${
                activeTab === 'specs'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-lg'
                  : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              Specifications
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all ${
                activeTab === 'shipping'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-lg'
                  : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              Shipping &amp; Guarantee
            </button>
          </div>

          {/* Tab Body */}
          <div className="py-8 sm:py-10">
            {activeTab === 'care' && product.careGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] space-y-4 text-xs">
                  <h3 className="text-base text-white font-medium mb-3">Optimal Water Parameters</h3>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                    <span className="text-[--color-muted]">Temperature</span>
                    <span className="text-white font-medium text-sm">{product.careGuide.temperature}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                    <span className="text-[--color-muted]">Salinity</span>
                    <span className="text-white font-medium text-sm">{product.careGuide.salinity}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                    <span className="text-[--color-muted]">pH Level</span>
                    <span className="text-white font-medium text-sm">{product.careGuide.ph}</span>
                  </div>
                  {product.careGuide.minimumTankSize && (
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                      <span className="text-[--color-muted]">Minimum Tank Size</span>
                      <span className="text-white font-medium text-sm">{product.careGuide.minimumTankSize}</span>
                    </div>
                  )}
                  {product.careGuide.diet && (
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                      <span className="text-[--color-muted]">Diet</span>
                      <span className="text-white font-medium text-sm">{product.careGuide.diet}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-xs space-y-3">
                  <h3 className="text-base text-white font-medium mb-3">Acclimation Steps</h3>
                  <ol className="space-y-2.5 list-decimal list-inside text-slate-300">
                    {product.careGuide.acclimationSteps.map((s, i) => (
                      <li key={i} className="leading-relaxed"><span className="text-white font-medium">{s}</span></li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'installation' && product.installationGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-xs space-y-3">
                  <h3 className="text-base text-white font-medium mb-3">Installation Steps</h3>
                  <ol className="space-y-2.5 list-decimal list-inside text-slate-300">
                    {product.installationGuide.steps.map((s, i) => (
                      <li key={i} className="leading-relaxed"><span className="text-white font-medium">{s}</span></li>
                    ))}
                  </ol>
                </div>

                <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-xs space-y-3">
                  <h3 className="text-base text-white font-medium mb-3">Included In The Box</h3>
                  <ul className="space-y-2.5 text-slate-300">
                    {product.installationGuide.includedInBox.map((item, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <span className="text-[--color-accent] font-bold">✓</span>
                        <span className="text-white font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] max-w-2xl text-xs space-y-3.5">
                <h3 className="text-base text-white font-medium mb-3">Technical Specifications</h3>
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5">
                    <span className="text-[--color-muted]">{k}</span>
                    <span className="text-white font-medium text-sm">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="p-6 sm:p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] max-w-2xl text-xs text-slate-300 leading-relaxed space-y-4">
                <h3 className="text-base text-white font-medium">100% Live Arrival Guarantee Across India</h3>
                <p>
                  All livestock is dispatched in oxygenated, climate-controlled thermal courier pods with continuous temperature monitoring.
                </p>
                <p>
                  In the rare event of transit complications, our stay-alive protocol provides immediate replacement or full reimbursement.
                </p>
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
