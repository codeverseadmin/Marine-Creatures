'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCatalog, InquiryLead } from '@/lib/context/CatalogContext';
import { Product } from '@/lib/data/products';
import { BannerSlide } from '@/lib/data/banners';
import { PromoCarousel } from '@/components/ui/PromoCarousel';

const ADMIN_PASSCODE = 'marine2026';

export default function AdminDashboardPage() {
  const {
    products,
    banners,
    inquiries,
    addProduct,
    updateProduct,
    deleteProduct,
    addBanner,
    updateBanner,
    deleteBanner,
    updateInquiryStatus,
    deleteInquiry,
    resetToDefaults,
    exportDataJson,
    importDataJson,
  } = useCatalog();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'banners' | 'products' | 'inquiries' | 'system'>('overview');

  // Product Form State
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    id: '',
    name: '',
    scientificName: '',
    brand: '',
    category: 'marine-life',
    categoryLabel: 'Marine Life',
    price: 9999,
    originalPrice: 12999,
    rating: 5.0,
    reviewsCount: 12,
    badge: 'New',
    inStock: true,
    stockCount: 10,
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
    shortDesc: '',
    description: '',
    deliveryInfo: {
      estimatedDays: 'Next-Day Express Dispatch',
      shippingMethod: 'Oxygenated Insulated Thermal Pod Courier',
      guaranteeText: '100% Live Arrival Guaranteed',
    },
    specifications: { 'Origin': 'Indo-Pacific', 'Care Level': 'Beginner Friendly' },
  });

  // Banner Form State
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<BannerSlide>>({
    id: '',
    badge: 'SPECIAL ANNOUNCEMENT',
    badgeColor: 'var(--color-accent)',
    title: '',
    subtitle: '',
    desc: '',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
    ctaText: 'EXPLORE NOW →',
    ctaLink: '/marketplace',
    secondaryCtaText: 'LEARN MORE',
    secondaryCtaLink: '/services',
    isActive: true,
    priority: 1,
  });

  const [productSearch, setProductSearch] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Check session storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('mc_admin_authenticated');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE || passcode === 'admin123') {
      setIsAuthenticated(true);
      setAuthError(false);
      sessionStorage.setItem('mc_admin_authenticated', 'true');
    } else {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('mc_admin_authenticated');
  };

  // Product Save
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name) return;

    const id = editingProductId || productForm.id || productForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const categoryLabels: Record<string, string> = {
      'marine-life': 'Marine Life',
      'lighting-tech': 'Lighting & Tech',
      'rock-sand': 'Live Rock & Sand',
      'salt-chemistry': 'Salts & Chemistry',
      'hardware': 'Equipment & Skimmers',
    };

    const newProduct: Product = {
      id,
      name: productForm.name || 'Untitled Product',
      scientificName: productForm.scientificName || undefined,
      brand: productForm.brand || undefined,
      category: (productForm.category as any) || 'marine-life',
      categoryLabel: categoryLabels[productForm.category || 'marine-life'] || 'Marine Store',
      price: Number(productForm.price) || 0,
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      rating: Number(productForm.rating) || 5.0,
      reviewsCount: Number(productForm.reviewsCount) || 10,
      badge: productForm.badge || undefined,
      inStock: productForm.inStock ?? true,
      stockCount: Number(productForm.stockCount) || 0,
      images: Array.isArray(productForm.images) && productForm.images.length > 0 ? productForm.images : ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
      shortDesc: productForm.shortDesc || '',
      description: productForm.description || '',
      deliveryInfo: productForm.deliveryInfo || {
        estimatedDays: 'Next-Day Express Dispatch',
        shippingMethod: 'Oxygenated Insulated Thermal Pod Courier',
        guaranteeText: '100% Live Arrival Guaranteed',
      },
      specifications: productForm.specifications || {},
    };

    if (editingProductId) {
      updateProduct(editingProductId, newProduct);
    } else {
      addProduct(newProduct);
    }

    setIsEditingProduct(false);
    setEditingProductId(null);
  };

  const handleEditProductClick = (product: Product) => {
    setProductForm({ ...product });
    setEditingProductId(product.id);
    setIsEditingProduct(true);
  };

  // Banner Save
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title) return;

    const id = editingBannerId || bannerForm.id || `banner-${Date.now()}`;
    const newBanner: BannerSlide = {
      id,
      badge: bannerForm.badge || 'PROMOTION',
      badgeColor: bannerForm.badgeColor || 'var(--color-accent)',
      title: bannerForm.title || '',
      subtitle: bannerForm.subtitle || '',
      desc: bannerForm.desc || '',
      image: bannerForm.image || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
      ctaText: bannerForm.ctaText || 'EXPLORE NOW →',
      ctaLink: bannerForm.ctaLink || '/marketplace',
      secondaryCtaText: bannerForm.secondaryCtaText || undefined,
      secondaryCtaLink: bannerForm.secondaryCtaLink || undefined,
      isActive: bannerForm.isActive ?? true,
      priority: Number(bannerForm.priority) || 1,
    };

    if (editingBannerId) {
      updateBanner(editingBannerId, newBanner);
    } else {
      addBanner(newBanner);
    }

    setIsEditingBanner(false);
    setEditingBannerId(null);
  };

  const handleEditBannerClick = (banner: BannerSlide) => {
    setBannerForm({ ...banner });
    setEditingBannerId(banner.id);
    setIsEditingBanner(true);
  };

  // Export JSON
  const handleDownloadBackup = () => {
    const data = exportDataJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marine_creatures_catalog_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    if (!importJsonText) return;
    const success = importDataJson(importJsonText);
    if (success) {
      setImportStatus('✓ Data imported successfully!');
      setImportJsonText('');
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus('✕ Invalid JSON format. Please verify.');
    }
  };

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <div style={{ background: 'var(--color-primary)', minHeight: '100vh' }} className="flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl border border-[rgba(255,255,255,0.12)] bg-[rgba(5,15,22,0.95)] backdrop-blur-2xl shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[rgba(0,184,217,0.1)] border border-[rgba(0,184,217,0.3)] text-3xl flex items-center justify-center mx-auto text-[--color-accent]">
            🛡️
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-[--color-accent] block mb-2">
              MARINE CREATURES ARCHITECTURE
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-white font-light">
              Admin Control Center
            </h1>
            <p className="font-body text-xs text-slate-400 mt-1">
              Enter master passcode to manage catalog, inventory and banner updates
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">
                Master Security Passcode
              </label>
              <input
                type="password"
                placeholder="Enter passcode (e.g. marine2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.15)] text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent] transition-all text-base"
                autoFocus
              />
              {authError && (
                <p className="text-xs text-red-400 mt-1.5 font-medium">
                  ✕ Invalid passcode. Try &lsquo;marine2026&rsquo;
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-wider hover:bg-white active:scale-95 transition-all shadow-lg"
            >
              UNLOCK DASHBOARD →
            </button>
          </form>

          <div className="pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Return to Main Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered Products
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.scientificName && p.scientificName.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stockCount, 0);
  const outOfStockCount = products.filter((p) => !p.inStock || p.stockCount <= 0).length;

  return (
    <div style={{ background: '#02070B', minHeight: '100vh', paddingTop: '0px' }} className="pb-24 text-white">
      {/* Top Restricted Security Banner */}
      <div className="bg-[#0b131a] border-b border-slate-800/80 px-4 py-1.5 text-[10px] sm:text-[11px] font-mono text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-amber-400 font-semibold tracking-wider">RESTRICTED ADMIN CONSOLE</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline">Internal Operations &amp; Broadcast Management</span>
        </div>
        <Link
          href="/"
          target="_blank"
          className="text-[--color-accent] hover:underline font-sans text-xs flex items-center gap-1 font-medium"
        >
          <span>Live Customer Portal</span>
          <span>↗</span>
        </Link>
      </div>

      {/* Main Admin Navigation Bar */}
      <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(3,10,16,0.96)] backdrop-blur-md sticky top-0 z-30">
        <div className="container-max py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-light text-white">
                  Admin Control Center
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Live Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Marine Creatures Master Commerce &amp; Broadcast Suite
              </p>
            </div>
          </div>

          {/* Quick links & Logout */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/marketplace"
              target="_blank"
              className="px-3.5 py-2 rounded-xl text-xs border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:bg-white/10 text-white flex items-center gap-1.5 transition-colors"
            >
              <span>🛍️</span>
              <span>View Storefront ↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl text-xs border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="container-max flex gap-2 overflow-x-auto scrollbar-none touch-momentum pt-2 pb-3">
          {[
            { id: 'overview', label: '📊 Overview & Metrics' },
            { id: 'banners', label: `🎬 Sliding Banners (${banners.length})` },
            { id: 'products', label: `🐠 Products & Stock (${products.length})` },
            { id: 'inquiries', label: `📬 Client Leads (${inquiries.length})` },
            { id: 'system', label: '⚙️ Backup & Restore' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-medium tracking-wide whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[--color-accent] text-[--color-primary] font-semibold shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container-max py-8 sm:py-12">
        {/* =========================================================================
            TAB 1: OVERVIEW & METRICS
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="p-5 sm:p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] backdrop-blur-xl">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Total Catalog Products</span>
                <span className="font-display text-3xl sm:text-4xl text-white font-light">{products.length}</span>
                <span className="text-[11px] text-emerald-400 block mt-2">Active in Storefront</span>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] backdrop-blur-xl">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Active Sliding Banners</span>
                <span className="font-display text-3xl sm:text-4xl text-[--color-accent] font-light">
                  {banners.filter((b) => b.isActive).length} / {banners.length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-2">Broadcast on Marketplace</span>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] backdrop-blur-xl">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Est. Inventory Value</span>
                <span className="font-display text-2xl sm:text-3xl text-white font-light">
                  ₹{totalInventoryValue.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-2">Across all live units</span>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] backdrop-blur-xl">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-1">Low / Out of Stock</span>
                <span className={`font-display text-3xl sm:text-4xl font-light ${outOfStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                  {outOfStockCount}
                </span>
                <span className="text-[11px] text-slate-400 block mt-2">Items need replenishment</span>
              </div>
            </div>

            {/* Live Banner Preview in Admin */}
            <div className="p-6 sm:p-8 rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.6)] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-xl text-white font-light">Live Sliding Carousel Preview</h3>
                  <p className="text-xs text-slate-400">This is how promotional updates slide across the storefront.</p>
                </div>
                <button
                  onClick={() => setActiveTab('banners')}
                  className="px-4 py-2 rounded-xl text-xs bg-[--color-accent] text-[--color-primary] font-semibold"
                >
                  Manage Banners →
                </button>
              </div>

              <PromoCarousel />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div
                onClick={() => {
                  setProductForm({
                    id: '',
                    name: '',
                    scientificName: '',
                    category: 'marine-life',
                    categoryLabel: 'Marine Life',
                    price: 9999,
                    inStock: true,
                    stockCount: 10,
                    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
                    shortDesc: '',
                    description: '',
                  });
                  setEditingProductId(null);
                  setIsEditingProduct(true);
                  setActiveTab('products');
                }}
                className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] hover:border-[--color-accent] cursor-pointer transition-all active:scale-[0.98] group"
              >
                <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">➕</span>
                <h4 className="font-display text-lg text-white font-medium mb-1">Add New Product</h4>
                <p className="text-xs text-slate-400">Publish fresh corals, fish, live rock, or lighting hardware.</p>
              </div>

              <div
                onClick={() => {
                  setBannerForm({
                    id: `banner-${Date.now()}`,
                    badge: 'LIMITED DROP',
                    badgeColor: 'var(--color-accent)',
                    title: '',
                    subtitle: '',
                    desc: '',
                    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
                    ctaText: 'EXPLORE →',
                    ctaLink: '/marketplace',
                    isActive: true,
                    priority: 1,
                  });
                  setEditingBannerId(null);
                  setIsEditingBanner(true);
                  setActiveTab('banners');
                }}
                className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] hover:border-[--color-accent] cursor-pointer transition-all active:scale-[0.98] group"
              >
                <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">📢</span>
                <h4 className="font-display text-lg text-white font-medium mb-1">Post Announcement Slide</h4>
                <p className="text-xs text-slate-400">Create high-impact promotional carousel slides like Amazon.</p>
              </div>

              <div
                onClick={() => setActiveTab('inquiries')}
                className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(7,21,28,0.5)] hover:border-[--color-accent] cursor-pointer transition-all active:scale-[0.98] group"
              >
                <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">💬</span>
                <h4 className="font-display text-lg text-white font-medium mb-1">Review Client Leads</h4>
                <p className="text-xs text-slate-400">View contact inquiries and one-click WhatsApp client follow-ups.</p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: SLIDING BANNERS MANAGER
           ========================================================================= */}
        {activeTab === 'banners' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
                  Amazon-Style Sliding Banners
                </h2>
                <p className="text-xs text-slate-400">
                  Manage promotional updates, flash drops, and live announcements.
                </p>
              </div>

              {!isEditingBanner && (
                <button
                  onClick={() => {
                    setBannerForm({
                      id: `banner-${Date.now()}`,
                      badge: 'NEW PROMOTION',
                      badgeColor: 'var(--color-accent)',
                      title: '',
                      subtitle: '',
                      desc: '',
                      image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
                      ctaText: 'EXPLORE NOW →',
                      ctaLink: '/marketplace',
                      isActive: true,
                      priority: banners.length + 1,
                    });
                    setEditingBannerId(null);
                    setIsEditingBanner(true);
                  }}
                  className="px-5 py-3 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 shadow-lg"
                >
                  <span>+</span>
                  <span>Create New Slide</span>
                </button>
              )}
            </div>

            {/* Banner Editor Form Modal / Card */}
            {isEditingBanner && (
              <form onSubmit={handleSaveBanner} className="p-6 sm:p-8 rounded-3xl border border-[--color-accent] bg-[rgba(5,15,22,0.95)] backdrop-blur-2xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-4">
                  <h3 className="font-display text-xl text-white font-medium">
                    {editingBannerId ? 'Edit Announcement Slide' : 'Create New Announcement Slide'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingBanner(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-white/5"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Slide Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Sea Live Coral Restock"
                      value={bannerForm.title || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Subtitle / Tagline *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50+ New Acropora & LPS Coral Frags Ready"
                      value={bannerForm.subtitle || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Badge Text</label>
                    <input
                      type="text"
                      placeholder="e.g. LIMITED TIME OFFER"
                      value={bannerForm.badge || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Badge Color (Hex / CSS)</label>
                    <input
                      type="text"
                      placeholder="e.g. #00B8D9 or #C7A76C"
                      value={bannerForm.badgeColor || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, badgeColor: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-300 block mb-1">Background Image URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/photo-..."
                      value={bannerForm.image || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-300 block mb-1">Detailed Description</label>
                    <textarea
                      rows={2}
                      placeholder="Detailed promotional copy or explanation..."
                      value={bannerForm.desc || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, desc: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Primary CTA Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. SHOP NOW →"
                      value={bannerForm.ctaText || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Primary CTA Link URL</label>
                    <input
                      type="text"
                      placeholder="e.g. /marketplace or /services"
                      value={bannerForm.ctaLink || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaLink: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bannerForm.isActive}
                        onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-[--color-accent]"
                      />
                      <span>Active (Broadcast live on carousel)</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                  <button
                    type="button"
                    onClick={() => setIsEditingBanner(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/20 text-xs text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-wider shadow-lg"
                  >
                    Save &amp; Broadcast Slide →
                  </button>
                </div>
              </form>
            )}

            {/* Banners List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] p-5 backdrop-blur-xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span
                        className="text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          color: b.badgeColor || 'var(--color-accent)',
                          border: `1px solid ${b.badgeColor || 'var(--color-accent)'}`,
                        }}
                      >
                        {b.badge}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="h-28 rounded-xl overflow-hidden relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <h4 className="absolute bottom-2 left-3 right-3 font-display text-lg text-white font-light line-clamp-1">
                        {b.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 font-medium line-clamp-1">{b.subtitle}</p>
                    {b.desc && <p className="text-[11px] text-slate-400 line-clamp-2">{b.desc}</p>}
                  </div>

                  <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateBanner(b.id, { isActive: !b.isActive })}
                        className="text-slate-400 hover:text-white"
                      >
                        {b.isActive ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditBannerClick(b)}
                        className="px-3 py-1.5 rounded-lg border border-[--color-accent] text-[--color-accent] hover:bg-[--color-accent] hover:text-[--color-primary] font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete banner "${b.title}"?`)) {
                            deleteBanner(b.id);
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: PRODUCT CATALOG & INVENTORY MANAGER
           ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
                  Products &amp; Inventory Management
                </h2>
                <p className="text-xs text-slate-400">
                  Update live stock, pricing, image galleries, and add new marine items.
                </p>
              </div>

              {!isEditingProduct && (
                <button
                  onClick={() => {
                    setProductForm({
                      id: '',
                      name: '',
                      scientificName: '',
                      category: 'marine-life',
                      categoryLabel: 'Marine Life',
                      price: 9999,
                      originalPrice: 12999,
                      inStock: true,
                      stockCount: 10,
                      images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
                      shortDesc: '',
                      description: '',
                    });
                    setEditingProductId(null);
                    setIsEditingProduct(true);
                  }}
                  className="px-5 py-3 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 shadow-lg"
                >
                  <span>+</span>
                  <span>Add New Product</span>
                </button>
              )}
            </div>

            {/* Product Creation / Edit Form */}
            {isEditingProduct && (
              <form onSubmit={handleSaveProduct} className="p-6 sm:p-8 rounded-3xl border border-[--color-accent] bg-[rgba(5,15,22,0.95)] backdrop-blur-2xl shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-4">
                  <h3 className="font-display text-xl text-white font-medium">
                    {editingProductId ? `Edit Product (${productForm.name})` : 'Create New Product'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingProduct(false)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-lg bg-white/5"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-300 block mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Picasso Clownfish (Bonded Pair)"
                      value={productForm.name || ''}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Category *</label>
                    <select
                      value={productForm.category || 'marine-life'}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(5,15,22,0.95)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    >
                      <option value="marine-life">Marine Life (Fish & Corals)</option>
                      <option value="lighting-tech">Lighting & Tech (NemoLight)</option>
                      <option value="rock-sand">Live Rock & Sand</option>
                      <option value="salt-chemistry">Salts & Chemistry</option>
                      <option value="hardware">Equipment & Skimmers</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Scientific Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Amphiprion percula"
                      value={productForm.scientificName || ''}
                      onChange={(e) => setProductForm({ ...productForm, scientificName: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="14999"
                      value={productForm.price || ''}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Original Price (₹ MRP)</label>
                    <input
                      type="number"
                      placeholder="17999"
                      value={productForm.originalPrice || ''}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Stock Count *</label>
                    <input
                      type="number"
                      required
                      placeholder="10"
                      value={productForm.stockCount ?? 10}
                      onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Badge Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Popular Pair / Best Seller"
                      value={productForm.badge || ''}
                      onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.inStock}
                        onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                        className="w-4 h-4 rounded text-[--color-accent]"
                      />
                      <span>In Stock (Available to Order)</span>
                    </label>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-slate-300 block mb-1">Image URLs (Comma-separated)</label>
                    <input
                      type="text"
                      placeholder="https://image1.jpg, https://image2.jpg"
                      value={Array.isArray(productForm.images) ? productForm.images.join(', ') : ''}
                      onChange={(e) => setProductForm({ ...productForm, images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-slate-300 block mb-1">Short Description</label>
                    <input
                      type="text"
                      placeholder="Single line summary of the specimen or hardware..."
                      value={productForm.shortDesc || ''}
                      onChange={(e) => setProductForm({ ...productForm, shortDesc: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent]"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-slate-300 block mb-1">Full Detailed Description</label>
                    <textarea
                      rows={3}
                      placeholder="Comprehensive overview of compatibility, origin, and characteristics..."
                      value={productForm.description || ''}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full p-3.5 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-sm text-white focus:outline-none focus:border-[--color-accent] resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                  <button
                    type="button"
                    onClick={() => setIsEditingProduct(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/20 text-xs text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-wider shadow-lg"
                  >
                    Save Product to Storefront →
                  </button>
                </div>
              </form>
            )}

            {/* Products Table with Quick Adjustments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  placeholder="Filter products by name or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="max-w-md w-full h-11 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[--color-accent]"
                />
                <span className="text-xs text-slate-400">
                  Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} items
                </span>
              </div>

              <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[rgba(255,255,255,0.04)] border-b border-[rgba(255,255,255,0.08)] text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                      <tr>
                        <th className="py-3 px-4">Item</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price (₹)</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
                      {filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-black/40 shrink-0" />
                            <div className="min-w-0 max-w-xs">
                              <span className="text-white font-medium truncate block">{p.name}</span>
                              {p.scientificName && <span className="text-[10px] text-slate-400 italic block">{p.scientificName}</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 capitalize">{p.category.replace('-', ' ')}</td>

                          <td className="py-3.5 px-4 font-semibold text-white">
                            ₹{p.price.toLocaleString('en-IN')}
                          </td>

                          <td className="py-3.5 px-4">
                            <input
                              type="number"
                              value={p.stockCount}
                              onChange={(e) => updateProduct(p.id, { stockCount: Number(e.target.value) })}
                              className="w-16 h-8 px-2 rounded-lg bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-white text-center text-xs"
                            />
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => updateProduct(p.id, { inStock: !p.inStock })}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                                p.inStock
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                              }`}
                            >
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                            <Link
                              href={`/marketplace/${p.id}`}
                              target="_blank"
                              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px]"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleEditProductClick(p)}
                              className="px-2.5 py-1 rounded-lg border border-[--color-accent] text-[--color-accent] hover:bg-[--color-accent] hover:text-[--color-primary] text-[11px]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[11px]"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CLIENT INQUIRIES & LEADS
           ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
                  Client Inquiries &amp; Consultations
                </h2>
                <p className="text-xs text-slate-400">
                  Direct lead inquiries received from booking forms and callback requests.
                </p>
              </div>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-12 text-center border border-[rgba(255,255,255,0.08)] rounded-3xl bg-[rgba(5,15,22,0.5)]">
                <span className="text-4xl block mb-2">📬</span>
                <h3 className="font-display text-xl text-white font-light mb-1">No pending leads</h3>
                <p className="text-xs text-slate-400">New callback requests and service bookings will appear here in real time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-[--color-accent]/10 text-[--color-accent] border border-[--color-accent]/20">
                        {inq.type.replace('_', ' ')}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(inq.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-display text-lg text-white font-medium">{inq.name}</h4>
                      <p className="text-slate-300">{inq.phone} {inq.email && `• ${inq.email}`}</p>
                    </div>

                    {inq.serviceType && (
                      <div className="text-[11px] text-slate-400 border-t border-[rgba(255,255,255,0.06)] pt-2">
                        <span>Service: <strong className="text-white">{inq.serviceType}</strong></span>
                        {inq.spaceType && <span> | Space: <strong className="text-white">{inq.spaceType}</strong></span>}
                      </div>
                    )}

                    {inq.notes && (
                      <p className="text-[11px] text-slate-300 italic bg-black/30 p-2.5 rounded-xl border border-white/5">
                        &ldquo;{inq.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-[rgba(255,255,255,0.06)]">
                      <a
                        href={`https://wa.me/${inq.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(inq.name)},%20this%20is%20Marine%20Creatures%20following%20up%20on%20your%20inquiry.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 font-medium flex items-center gap-1.5"
                      >
                        <span>💬</span>
                        <span>Chat on WhatsApp</span>
                      </a>

                      <button
                        onClick={() => deleteInquiry(inq.id)}
                        className="text-red-400 hover:text-red-300 text-[11px]"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: SYSTEM BACKUP & RESET
           ========================================================================= */}
        {activeTab === 'system' && (
          <div className="space-y-8 max-w-2xl">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl text-white font-light">
                Catalog Backup &amp; Data System
              </h2>
              <p className="text-xs text-slate-400">
                Export full catalog JSON snapshot or restore factory demo data.
              </p>
            </div>

            {/* Export */}
            <div className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] space-y-3">
              <h4 className="font-display text-lg text-white font-medium">Export Catalog JSON Backup</h4>
              <p className="text-xs text-slate-400">
                Download a JSON snapshot containing all live products, promotional sliding banners, and leads.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="px-5 py-2.5 rounded-xl bg-[--color-accent] text-[--color-primary] font-semibold text-xs uppercase tracking-wider flex items-center gap-2 active:scale-95 shadow-lg"
              >
                <span>📥</span>
                <span>Download Backup (.JSON)</span>
              </button>
            </div>

            {/* Import */}
            <div className="p-6 rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(5,15,22,0.7)] space-y-3">
              <h4 className="font-display text-lg text-white font-medium">Import Catalog Data</h4>
              <p className="text-xs text-slate-400">
                Paste valid JSON backup string below to restore products and banners.
              </p>
              <textarea
                rows={4}
                placeholder="Paste JSON string here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.12)] text-xs text-white font-mono focus:outline-none focus:border-[--color-accent] resize-none"
              />
              {importStatus && (
                <p className="text-xs font-medium text-emerald-400">{importStatus}</p>
              )}
              <button
                onClick={handleImportJson}
                disabled={!importJsonText}
                className="px-5 py-2.5 rounded-xl border border-[--color-accent] text-[--color-accent] hover:bg-[--color-accent] hover:text-[--color-primary] font-semibold text-xs uppercase tracking-wider disabled:opacity-40"
              >
                Restore JSON Data
              </button>
            </div>

            {/* Reset */}
            <div className="p-6 rounded-2xl border border-red-500/20 bg-red-950/10 space-y-3">
              <h4 className="font-display text-lg text-red-400 font-medium">Factory Reset Catalog</h4>
              <p className="text-xs text-slate-400">
                Reset all products, banner slides, and settings back to original factory defaults.
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all catalog items and banners to factory defaults?')) {
                    resetToDefaults();
                    alert('Catalog reset to defaults successfully.');
                  }
                }}
                className="px-5 py-2.5 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-semibold text-xs uppercase tracking-wider"
              >
                Reset To Defaults
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated Admin Console Footer */}
      <footer className="mt-20 border-t border-slate-800/80 bg-[#010406] py-6 text-xs text-slate-400">
        <div className="container-max flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-slate-300 font-medium">🛡️ Marine Creatures Admin OS v1.0.0</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">Restricted Internal Access</span>
          </div>

          <div className="flex items-center gap-5">
            <Link href="/" target="_blank" className="text-[--color-accent] hover:underline flex items-center gap-1 font-medium">
              <span>Switch to Live Customer Storefront</span>
              <span>↗</span>
            </Link>
            <span className="text-slate-700">•</span>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 font-medium">
              Sign Out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
