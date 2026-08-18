'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/data/products';
import { useCart } from '@/lib/context/CartContext';
import { ProductCard } from './ProductCard';
import { SITE_CONFIG } from '@/lib/config';

interface ProductDetailViewProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductDetailView({ product, relatedProducts }: ProductDetailViewProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedImg, setSelectedImg] = useState<string>(product.images[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'care' | 'installation' | 'specs' | 'shipping'>('care');
  const [added, setAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    addToCart(product, quantity, e);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setIsCartOpen(true);
    }, 700);
  };

  const handleWhatsAppInquiry = () => {
    const message = `Hi Marine Creatures! I would like to inquire about the ${product.name} (₹${product.price.toLocaleString('en-IN')}).\n\nCan you confirm delivery timing and live availability for my location?`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encoded}`, '_blank');
  };

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Breadcrumb Navigation with Generous Navbar Clearance */}
      <div className="pt-44 md:pt-48 pb-6 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(2,7,11,0.85)]">
        <div className="container-max flex items-center gap-2 text-xs sm:text-sm text-[--color-muted]">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="opacity-40">/</span>
          <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          <span className="opacity-40">/</span>
          <span className="text-[--color-accent] font-medium">{product.categoryLabel}</span>
          <span className="opacity-40">/</span>
          <span className="text-white font-medium truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <div className="container-max pt-12 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
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
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <span className="text-xs uppercase tracking-wider font-semibold text-white bg-[--color-accent] px-3.5 py-1.5 rounded-xl shadow-lg">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(img)}
                    className={`w-24 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
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
          <div className="lg:col-span-5 space-y-6">
            <div>
              <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block mb-2">
                {product.scientificName || product.categoryLabel}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl text-white font-light mb-4 leading-tight">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-4 mb-4">
                <span className="font-display text-3xl sm:text-4xl text-white font-light">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && (
                  <span className="text-sm sm:text-base text-slate-500 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                  In Stock ({product.stockCount} Available)
                </span>
              </div>
              <p className="font-body text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Delivery Assurance */}
            <div className="p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white font-medium">
                <span className="text-base">⚡</span>
                <span>{product.deliveryInfo.estimatedDays}</span>
              </div>
              <p className="text-[12px] text-[--color-muted] leading-relaxed">
                {product.deliveryInfo.guaranteeText} • {product.deliveryInfo.shippingMethod}
              </p>
            </div>

            {/* Quantity and Add to Bag */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.03)] rounded-xl h-14 px-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center text-base text-[--color-muted] hover:text-white transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    className="w-10 h-10 flex items-center justify-center text-base text-[--color-muted] hover:text-white transition-colors"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 h-14 px-8 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-xl ${
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
                className="w-full h-12 rounded-xl border border-[rgba(0,184,217,0.3)] bg-[rgba(0,184,217,0.06)] hover:bg-[rgba(0,184,217,0.15)] text-xs text-[--color-accent] font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-2"
              >
                <span>💬</span>
                <span>INQUIRE / ORDER VIA WHATSAPP CONCIERGE</span>
              </button>
            </div>

            <div className="pt-2">
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
        <div className="mt-20 pt-12 border-t border-[rgba(255,255,255,0.08)]">
          {/* Tab buttons */}
          <div className="flex gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4 overflow-x-auto scrollbar-none">
            {product.careGuide && (
              <button
                onClick={() => setActiveTab('care')}
                className={`px-5 py-3 rounded-xl text-xs font-medium tracking-wider uppercase transition-all ${
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
                className={`px-5 py-3 rounded-xl text-xs font-medium tracking-wider uppercase transition-all ${
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
              className={`px-5 py-3 rounded-xl text-xs font-medium tracking-wider uppercase transition-all ${
                activeTab === 'specs'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-lg'
                  : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              Specifications
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`px-5 py-3 rounded-xl text-xs font-medium tracking-wider uppercase transition-all ${
                activeTab === 'shipping'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-lg'
                  : 'text-[--color-muted] hover:text-white bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              Shipping &amp; Guarantee
            </button>
          </div>

          {/* Tab Body */}
          <div className="py-10">
            {activeTab === 'care' && product.careGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] space-y-4 text-xs">
                  <h3 className="text-base text-white font-medium mb-4">Optimal Water Parameters</h3>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <span className="text-[--color-muted]">Temperature</span>
                    <span className="text-white font-medium text-sm">{product.careGuide.temperature}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <span className="text-[--color-muted]">Salinity</span>
                    <span className="text-white font-medium text-sm">{product.careGuide.salinity}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <span className="text-[--color-muted]">pH Level</span>
                    <span className="text-white font-medium text-sm">{product.careGuide.ph}</span>
                  </div>
                  {product.careGuide.minimumTankSize && (
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                      <span className="text-[--color-muted]">Minimum Tank Size</span>
                      <span className="text-white font-medium text-sm">{product.careGuide.minimumTankSize}</span>
                    </div>
                  )}
                  {product.careGuide.diet && (
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                      <span className="text-[--color-muted]">Diet</span>
                      <span className="text-white font-medium text-sm">{product.careGuide.diet}</span>
                    </div>
                  )}
                </div>

                <div className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-xs space-y-3">
                  <h3 className="text-base text-white font-medium mb-4">Acclimation Steps</h3>
                  <ol className="space-y-3 list-decimal list-inside text-slate-300">
                    {product.careGuide.acclimationSteps.map((s, i) => (
                      <li key={i} className="leading-relaxed"><span className="text-white font-medium">{s}</span></li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'installation' && product.installationGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-xs space-y-3">
                  <h3 className="text-base text-white font-medium mb-4">Installation Steps</h3>
                  <ol className="space-y-3 list-decimal list-inside text-slate-300">
                    {product.installationGuide.steps.map((s, i) => (
                      <li key={i} className="leading-relaxed"><span className="text-white font-medium">{s}</span></li>
                    ))}
                  </ol>
                </div>

                <div className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] text-xs space-y-3">
                  <h3 className="text-base text-white font-medium mb-4">Included In The Box</h3>
                  <ul className="space-y-3 text-slate-300">
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
              <div className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] max-w-2xl text-xs space-y-4">
                <h3 className="text-base text-white font-medium mb-4">Technical Specifications</h3>
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[rgba(255,255,255,0.06)] pb-3">
                    <span className="text-[--color-muted]">{k}</span>
                    <span className="text-white font-medium text-sm">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="p-8 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] max-w-2xl text-xs text-slate-300 leading-relaxed space-y-4">
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
          <div className="mt-20 pt-16 border-t border-[rgba(255,255,255,0.08)] pb-24">
            <span className="text-xs uppercase tracking-[0.25em] font-semibold text-[--color-accent] block mb-2">
              RECOMMENDED COMBINATIONS
            </span>
            <h2 className="font-display text-3xl text-white font-light mb-10">
              Frequently Paired Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
