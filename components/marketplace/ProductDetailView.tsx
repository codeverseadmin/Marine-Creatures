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
      {/* Breadcrumb Navigation */}
      <div className="pt-36 pb-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="container-max flex items-center gap-2 text-xs text-[--color-muted]">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-white transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-[--color-accent]">{product.categoryLabel}</span>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="container-max py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Image Gallery */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-black/40 shadow-xl"
              style={{ aspectRatio: '16/11' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImg}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(img)}
                    className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImg === img
                        ? 'border-[--color-accent]'
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
              <span className="text-label text-[--color-accent] tracking-wider block mb-2">
                {product.scientificName || product.categoryLabel}
              </span>
              <h1 className="font-display text-3xl sm:text-4xl text-white font-light mb-3">
                {product.name}
              </h1>
              <span className="font-display text-3xl text-white font-light block mb-4">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              <p className="font-body text-xs sm:text-sm text-[--color-muted] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Delivery Assurance */}
            <div className="p-4 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] space-y-1 text-xs">
              <div className="flex items-center gap-2 text-white font-medium">
                <span>⚡</span>
                <span>{product.deliveryInfo.estimatedDays}</span>
              </div>
              <p className="text-[11px] text-[--color-muted]">
                {product.deliveryInfo.guaranteeText}
              </p>
            </div>

            {/* Quantity and Add to Bag */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-[rgba(255,255,255,0.15)] rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-3 text-sm text-[--color-muted] hover:text-white"
                >
                  −
                </button>
                <span className="px-3 py-3 text-sm font-medium text-white min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  className="px-3 py-3 text-sm text-[--color-muted] hover:text-white"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 py-3.5 px-6 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                  added
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-[--color-accent] text-[--color-primary] hover:bg-white'
                }`}
              >
                {added ? 'ADDED TO BAG ✓' : `ADD TO BAG — ₹${(product.price * quantity).toLocaleString('en-IN')}`}
              </button>
            </div>


            <Link
              href="/services"
              className="text-xs text-[--color-muted] hover:text-[--color-accent] block text-center pt-2 transition-colors"
            >
              Need installation or tank setup assistance? Book here →
            </Link>
          </div>
        </div>

        {/* Detailed Information Tabs */}
        <div className="mt-16 pt-10 border-t border-[rgba(255,255,255,0.08)]">
          {/* Tab buttons */}
          <div className="flex gap-2 border-b border-[rgba(255,255,255,0.08)] pb-4 overflow-x-auto scrollbar-none">
            {product.careGuide && (
              <button
                onClick={() => setActiveTab('care')}
                className={`px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-all ${
                  activeTab === 'care'
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                    : 'text-[--color-muted] hover:text-white'
                }`}
              >
                Care &amp; Husbandry
              </button>
            )}

            {product.installationGuide && (
              <button
                onClick={() => setActiveTab('installation')}
                className={`px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-all ${
                  activeTab === 'installation'
                    ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                    : 'text-[--color-muted] hover:text-white'
                }`}
              >
                Setup &amp; Installation
              </button>
            )}

            <button
              onClick={() => setActiveTab('specs')}
              className={`px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-all ${
                activeTab === 'specs'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                  : 'text-[--color-muted] hover:text-white'
              }`}
            >
              Specifications
            </button>

            <button
              onClick={() => setActiveTab('shipping')}
              className={`px-4 py-2 rounded-lg text-xs tracking-wider uppercase transition-all ${
                activeTab === 'shipping'
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold'
                  : 'text-[--color-muted] hover:text-white'
              }`}
            >
              Shipping &amp; Guarantee
            </button>
          </div>

          {/* Tab Body */}
          <div className="py-8">
            {activeTab === 'care' && product.careGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)] space-y-3 text-xs">
                  <h3 className="text-sm text-white font-medium mb-3">Optimal Parameters</h3>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                    <span className="text-[--color-muted]">Temperature</span>
                    <span className="text-white font-medium">{product.careGuide.temperature}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                    <span className="text-[--color-muted]">Salinity</span>
                    <span className="text-white font-medium">{product.careGuide.salinity}</span>
                  </div>
                  <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                    <span className="text-[--color-muted]">pH Level</span>
                    <span className="text-white font-medium">{product.careGuide.ph}</span>
                  </div>
                  {product.careGuide.minimumTankSize && (
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-[--color-muted]">Minimum Tank Size</span>
                      <span className="text-white font-medium">{product.careGuide.minimumTankSize}</span>
                    </div>
                  )}
                  {product.careGuide.diet && (
                    <div className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                      <span className="text-[--color-muted]">Diet</span>
                      <span className="text-white font-medium">{product.careGuide.diet}</span>
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)] text-xs">
                  <h3 className="text-sm text-white font-medium mb-3">Acclimation Steps</h3>
                  <ol className="space-y-2 list-decimal list-inside text-[--color-muted]">
                    {product.careGuide.acclimationSteps.map((s, i) => (
                      <li key={i} className="leading-relaxed"><span className="text-white">{s}</span></li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {activeTab === 'installation' && product.installationGuide && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)] text-xs">
                  <h3 className="text-sm text-white font-medium mb-3">Installation Steps</h3>
                  <ol className="space-y-2 list-decimal list-inside text-[--color-muted]">
                    {product.installationGuide.steps.map((s, i) => (
                      <li key={i} className="leading-relaxed"><span className="text-white">{s}</span></li>
                    ))}
                  </ol>
                </div>

                <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)] text-xs">
                  <h3 className="text-sm text-white font-medium mb-3">In The Box</h3>
                  <ul className="space-y-2 text-[--color-muted]">
                    {product.installationGuide.includedInBox.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-[--color-accent]">✓</span>
                        <span className="text-white">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)] max-w-xl text-xs space-y-3">
                <h3 className="text-sm text-white font-medium mb-3">Technical Specifications</h3>
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[rgba(255,255,255,0.04)] pb-2">
                    <span className="text-[--color-muted]">{k}</span>
                    <span className="text-white font-medium">{v}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="p-6 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(7,21,28,0.4)] max-w-2xl text-xs text-[--color-muted] leading-relaxed space-y-3">
                <h3 className="text-sm text-white font-medium">100% Live Arrival Guarantee</h3>
                <p>
                  All livestock is dispatched in oxygenated, climate-controlled thermal courier pods with temperature monitoring.
                </p>
                <p>
                  In the rare event of any issues during transit, our stay-alive policy covers immediate replacement or refund.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Frequently Paired Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-[rgba(255,255,255,0.08)]">
            <span className="text-label text-[--color-accent] tracking-[0.2em] block mb-2">
              RECOMMENDED COMBINATIONS
            </span>
            <h2 className="font-display text-2xl text-white font-light mb-8">
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
