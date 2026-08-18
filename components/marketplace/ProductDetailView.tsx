'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/data/products';
import { useCart } from '@/lib/context/CartContext';
import { ProductCard } from './ProductCard';

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

  return (
    <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }}>
      {/* Breadcrumb Header */}
      <div className="pt-28 pb-4 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(2,7,11,0.5)]">
        <div className="container-max flex items-center gap-2 text-xs text-[--color-muted]">
          <Link href="/" className="hover:text-[--color-accent] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-[--color-accent] transition-colors">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-[--color-accent] uppercase tracking-wider">{product.categoryLabel}</span>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main Product Showcase Section */}
      <div className="container-max py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Multi-Image Gallery */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
            {/* Thumbnails */}
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto max-h-[500px] scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImg(img)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImg === img
                      ? 'border-[--color-accent] shadow-[0_0_12px_rgba(0,184,217,0.5)]'
                      : 'border-[rgba(255,255,255,0.1)] opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="flex-1 rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.7)] shadow-2xl relative" style={{ aspectRatio: '4/3' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImg}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              {product.badge && (
                <div className="absolute top-4 left-4">
                  <span className="text-xs uppercase font-semibold tracking-wider text-white bg-[--color-accent] px-3 py-1.5 rounded-md shadow-lg">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Pricing, Specs & Buy Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              {/* Sub-header / Scientific name */}
              {product.scientificName ? (
                <span className="text-xs text-[--color-accent] tracking-widest italic block mb-2">
                  {product.scientificName}
                </span>
              ) : product.brand ? (
                <span className="text-xs text-[--color-muted] tracking-widest uppercase block mb-2">
                  Brand: {product.brand}
                </span>
              ) : null}

              {/* Title */}
              <h1 className="font-display text-2xl sm:text-3xl text-[--color-text] font-light leading-tight mb-4">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center text-amber-400 text-sm">
                  {'★'.repeat(Math.round(product.rating))}
                  <span className="text-xs font-semibold ml-1.5 text-white">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-[--color-muted]">({product.reviewsCount} verified reviews)</span>
                <span className="text-xs text-emerald-400 font-medium">✓ In Stock ({product.stockCount} left)</span>
              </div>

              {/* Price Banner */}
              <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] mb-6 flex items-baseline justify-between">
                <div>
                  <span className="font-display text-3xl text-[--color-text] font-light">
                    £{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-[--color-muted] line-through ml-3">
                      £{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-[10px] text-[--color-muted] block mt-1">
                    VAT Included • Professional Acclimation Pod Available
                  </span>
                </div>
              </div>

              {/* Short Description */}
              <p className="font-body text-xs text-[--color-muted] leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Expected Delivery & Dispatch Box */}
              <div className="p-4 rounded-xl border border-[rgba(0,184,217,0.25)] bg-[rgba(0,184,217,0.05)] mb-8 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-[--color-accent] font-medium">
                  <span>⚡</span>
                  <span>Expected Delivery: {product.deliveryInfo.estimatedDays}</span>
                </div>
                <p className="text-[11px] text-[--color-muted] leading-relaxed">
                  {product.deliveryInfo.shippingMethod}
                </p>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1.5 pt-1 border-t border-[rgba(0,184,217,0.15)]">
                  <span>🛡️</span>
                  <span>{product.deliveryInfo.guaranteeText}</span>
                </div>
              </div>

              {/* Quantity Selector & Add to Cart Button */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-[rgba(255,255,255,0.15)] rounded-lg bg-[rgba(7,21,28,0.6)]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-3 text-sm text-[--color-muted] hover:text-white"
                  >
                    −
                  </button>
                  <span className="px-3 py-3 text-sm font-medium text-white min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                    className="px-3.5 py-3 text-sm text-[--color-muted] hover:text-white"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3.5 px-6 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                    added
                      ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.8)]'
                      : 'bg-[--color-accent] text-[--color-primary] hover:bg-[--color-cyan] hover:shadow-[0_0_25px_rgba(0,210,247,0.6)]'
                  }`}
                >
                  {added ? 'ADDED TO BAG ✓' : `ADD TO SHOPPING BAG — £${(product.price * quantity).toFixed(2)}`}
                </button>
              </div>

              {/* Booking Cross-Sell Button */}
              <Link
                href="/services"
                className="w-full py-3 rounded-lg border border-[rgba(255,255,255,0.1)] hover:border-[--color-accent] bg-[rgba(255,255,255,0.02)] text-xs text-[--color-muted] hover:text-white transition-colors text-center block"
              >
                🛠️ NEED PROFESSIONAL INSTALLATION OR TANK SETUP? BOOK HERE →
              </Link>
            </div>
          </div>
        </div>

        {/* Detailed Tabs: Care Guide / Installation / Specifications / Shipping */}
        <div className="mt-16 pt-12 border-t border-[rgba(255,255,255,0.08)]">
          {/* Tab Navigation */}
          <div className="flex items-center gap-4 border-b border-[rgba(255,255,255,0.08)] pb-4 overflow-x-auto scrollbar-none">
            {product.careGuide && (
              <button
                onClick={() => setActiveTab('care')}
                className={`text-xs uppercase tracking-wider py-2 px-4 rounded transition-all ${
                  activeTab === 'care'
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                    : 'text-[--color-muted] hover:text-white'
                }`}
              >
                🔬 Care & Husbandry Guide
              </button>
            )}

            {product.installationGuide && (
              <button
                onClick={() => setActiveTab('installation')}
                className={`text-xs uppercase tracking-wider py-2 px-4 rounded transition-all ${
                  activeTab === 'installation'
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                    : 'text-[--color-muted] hover:text-white'
                }`}
              >
                🛠️ Setup & Installation Protocol
              </button>
            )}

            <button
              onClick={() => setActiveTab('specs')}
              className={`text-xs uppercase tracking-wider py-2 px-4 rounded transition-all ${
                activeTab === 'specs'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                  : 'text-[--color-muted] hover:text-white'
              }`}
            >
              📋 Technical Specifications
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`text-xs uppercase tracking-wider py-2 px-4 rounded transition-all ${
                activeTab === 'shipping'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                  : 'text-[--color-muted] hover:text-white'
              }`}
            >
              🚚 Shipping, Thermal Pods & Guarantee
            </button>
          </div>

          {/* Tab Contents */}
          <div className="py-8">
            {/* Tab 1: Care Guide */}
            {activeTab === 'care' && product.careGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Parameters Matrix */}
                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)]">
                  <h3 className="font-display text-lg text-[--color-accent] font-light mb-4">
                    Optimal Water Parameters
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-[--color-muted]">Temperature</span>
                      <span className="font-medium text-white">{product.careGuide.temperature}</span>
                    </div>
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-[--color-muted]">Specific Gravity (Salinity)</span>
                      <span className="font-medium text-white">{product.careGuide.salinity}</span>
                    </div>
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-[--color-muted]">pH Level</span>
                      <span className="font-medium text-white">{product.careGuide.ph}</span>
                    </div>
                    {product.careGuide.minimumTankSize && (
                      <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                        <span className="text-[--color-muted]">Minimum Tank Size</span>
                        <span className="font-medium text-white">{product.careGuide.minimumTankSize}</span>
                      </div>
                    )}
                    {product.careGuide.diet && (
                      <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                        <span className="text-[--color-muted]">Diet & Nutrition</span>
                        <span className="font-medium text-white">{product.careGuide.diet}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acclimation Protocol */}
                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)]">
                  <h3 className="font-display text-lg text-[--color-accent] font-light mb-4">
                    Step-by-Step Acclimation Protocol
                  </h3>
                  <ol className="space-y-3 text-xs list-decimal list-inside text-[--color-muted]">
                    {product.careGuide.acclimationSteps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-white">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Tab 2: Installation Guide */}
            {activeTab === 'installation' && product.installationGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-lg text-[--color-accent] font-light">
                      Mounting & Setup Steps
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded bg-[rgba(0,184,217,0.15)] text-[--color-accent]">
                      {product.installationGuide.difficulty} • ~{product.installationGuide.estimatedTime}
                    </span>
                  </div>
                  <ol className="space-y-3 text-xs list-decimal list-inside text-[--color-muted]">
                    {product.installationGuide.steps.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="text-white">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)]">
                  <h3 className="font-display text-lg text-[--color-accent] font-light mb-4">
                    What&apos;s Included In The Box
                  </h3>
                  <ul className="space-y-2 text-xs text-[--color-muted]">
                    {product.installationGuide.includedInBox.map((item, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-[--color-accent]">✓</span>
                        <span className="text-white">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 3: Specs */}
            {activeTab === 'specs' && (
              <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)] max-w-2xl">
                <h3 className="font-display text-lg text-[--color-accent] font-light mb-4">
                  Full Technical Specifications
                </h3>
                <div className="space-y-3 text-xs">
                  {Object.entries(product.specifications).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-[--color-muted]">{key}</span>
                      <span className="font-medium text-white">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Shipping & DOA Policy */}
            {activeTab === 'shipping' && (
              <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.5)] max-w-3xl space-y-4 text-xs text-[--color-muted] leading-relaxed">
                <h3 className="font-display text-lg text-[--color-accent] font-light">
                  100% Dead-on-Arrival (DOA) & Health Guarantee
                </h3>
                <p>
                  Every marine creature shipped from our London quarantine facility is dispatched in heavy-duty, double-sealed oxygenated bags nestled inside climate-regulated thermal pods with specialized active heat/cool packs.
                </p>
                <p>
                  In the rare event of transit complications, our 100% Live Arrival Guarantee covers immediate replacement or store credit. Simply snap a clear photo in the unopened transport bag within 2 hours of signed delivery.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recommended Pairings / Frequently Bought Together */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-[rgba(255,255,255,0.08)]">
            <span className="text-label text-[--color-accent] tracking-[0.25em] block mb-3">
              COMPLETE YOUR ECOSYSTEM
            </span>
            <h2 className="font-display text-display-sm text-[--color-text] font-light mb-8">
              Frequently Paired Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
