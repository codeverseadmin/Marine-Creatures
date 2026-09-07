'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCatalog, InquiryLead } from '@/lib/context/CatalogContext';
import { Product } from '@/lib/data/products';
import { BannerSlide } from '@/lib/data/banners';
import { PromoCarousel } from '@/components/ui/PromoCarousel';

const ADMIN_PASSCODE = process.env.NEXT_PUBLIC_ADMIN_PASSCODE || 'mc@admin#2026!';

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
    deleteInquiry,
    resetToDefaults,
    exportDataJson,
    importDataJson,
  } = useCatalog();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'banners' | 'inquiries' | 'overview' | 'system'>('products');

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
    badge: 'New Arrival',
    inStock: true,
    stockCount: 10,
    images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
    shortDesc: '',
    description: '',
  });

  // Banner Form State
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<Partial<BannerSlide>>({
    id: '',
    badge: 'SPECIAL ANNOUNCEMENT',
    badgeColor: '#00B8D9',
    title: '',
    subtitle: '',
    desc: '',
    image: 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
    ctaText: 'EXPLORE NOW →',
    ctaLink: '/marketplace',
    isActive: true,
    priority: 1,
  });

  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

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
    if (passcode === ADMIN_PASSCODE) {
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
      reviewsCount: Number(productForm.reviewsCount) || 12,
      badge: productForm.badge || undefined,
      inStock: productForm.inStock ?? true,
      stockCount: Number(productForm.stockCount) || 0,
      images: Array.isArray(productForm.images) && productForm.images.length > 0 && productForm.images[0].trim() !== ''
        ? productForm.images
        : ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
      shortDesc: productForm.shortDesc || '',
      description: productForm.description || '',
      deliveryInfo: {
        estimatedDays: 'Next-Day Express Dispatch',
        shippingMethod: 'Oxygenated Insulated Thermal Pod Courier',
        guaranteeText: '100% Live Arrival Guaranteed',
      },
      specifications: { Origin: 'Indo-Pacific', 'Care Level': 'Reef Safe' },
    };

    if (editingProductId) {
      updateProduct(editingProductId, newProduct);
      showToast(`✓ Updated "${newProduct.name}"`);
    } else {
      addProduct(newProduct);
      showToast(`✓ Added "${newProduct.name}"`);
    }

    setIsEditingProduct(false);
    setEditingProductId(null);
  };

  const handleEditProductClick = (product: Product) => {
    setProductForm({ ...product });
    setEditingProductId(product.id);
    setIsEditingProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewProductClick = () => {
    setProductForm({
      id: '',
      name: '',
      scientificName: '',
      brand: '',
      category: 'marine-life',
      categoryLabel: 'Marine Life',
      price: 4999,
      originalPrice: 5999,
      badge: 'Fresh Stock',
      inStock: true,
      stockCount: 5,
      images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
      shortDesc: '',
      description: '',
    });
    setEditingProductId(null);
    setIsEditingProduct(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Banner Save
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title) return;

    const id = editingBannerId || bannerForm.id || `banner-${Date.now()}`;
    const newBanner: BannerSlide = {
      id,
      badge: bannerForm.badge || 'PROMOTION',
      badgeColor: bannerForm.badgeColor || '#00B8D9',
      title: bannerForm.title || '',
      subtitle: bannerForm.subtitle || '',
      desc: bannerForm.desc || '',
      image: bannerForm.image || 'https://images.unsplash.com/photo-1546026423-cc4642628d2b?w=1600&q=85',
      ctaText: bannerForm.ctaText || 'EXPLORE NOW →',
      ctaLink: bannerForm.ctaLink || '/marketplace',
      isActive: bannerForm.isActive ?? true,
      priority: Number(bannerForm.priority) || 1,
    };

    if (editingBannerId) {
      updateBanner(editingBannerId, newBanner);
      showToast(`✓ Banner updated`);
    } else {
      addBanner(newBanner);
      showToast(`✓ New banner slide created`);
    }

    setIsEditingBanner(false);
    setEditingBannerId(null);
  };

  const handleEditBannerClick = (banner: BannerSlide) => {
    setBannerForm({ ...banner });
    setEditingBannerId(banner.id);
    setIsEditingBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Export JSON
  const handleDownloadBackup = () => {
    const data = exportDataJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marine_creatures_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Backup file downloaded');
  };

  const handleImportJson = () => {
    if (!importJsonText) return;
    const success = importDataJson(importJsonText);
    if (success) {
      setImportStatus('✓ Data restored successfully!');
      setImportJsonText('');
      setTimeout(() => setImportStatus(null), 3000);
      showToast('✓ Catalog data imported');
    } else {
      setImportStatus('✕ Invalid JSON format.');
    }
  };

  // Quick Stock Toggles
  const handleQuickStockChange = (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stockCount + delta);
    updateProduct(p.id, {
      stockCount: newStock,
      inStock: newStock > 0,
    });
  };

  // Auth Screen (Clean & Mobile-Ready)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#03090e] text-white flex flex-col justify-center px-4 py-8 relative">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo / Badge */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(0,184,217,0.15)]">
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              Marine Creatures Admin
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Store manager &amp; live inventory portal
            </p>
          </div>

          {/* Card */}
          <div className="bg-[#07131d] border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Admin Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    placeholder="Enter secret passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full h-12 px-3.5 pr-11 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
                  >
                    {showPasscode ? 'Hide' : 'Show'}
                  </button>
                </div>
                {authError && (
                  <p className="text-xs text-red-400 mt-2 font-medium flex items-center gap-1">
                    <span>✕</span> Incorrect passcode. Please try again.
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm tracking-wide transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2"
              >
                <span>Unlock Store Manager</span>
                <span>→</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-center">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
              >
                <span>←</span>
                <span>Back to Customer Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.scientificName && p.scientificName.toLowerCase().includes(productSearch.toLowerCase())) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalInventoryValue = products.reduce((acc, p) => acc + p.price * p.stockCount, 0);
  const outOfStockItems = products.filter((p) => !p.inStock || p.stockCount <= 0);

  return (
    <div className="min-h-screen bg-[#03090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:w-auto z-50 pointer-events-none">
          <div className="bg-cyan-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-2xl font-medium text-xs sm:text-sm text-center">
            {notification}
          </div>
        </div>
      )}

      {/* Top Mobile-Friendly Header */}
      <header className="sticky top-0 z-40 bg-[#06121b]/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="px-4 py-3 flex items-center justify-between gap-3 max-w-6xl mx-auto">
          {/* Brand / Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-sm shrink-0">
              🌊
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white truncate">Marine Creatures</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Store &amp; Inventory Manager</p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/marketplace"
              target="_blank"
              className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
              title="Open storefront in new tab"
            >
              <span>🛍️</span>
              <span className="hidden sm:inline">Store</span>
              <span>↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="h-8 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-colors"
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Pill Tabs (Mobile Touch Optimized) */}
        <div className="border-t border-slate-800/60 bg-[#040c13] px-3 py-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-6xl mx-auto">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'products'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>🐠 Products</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'products' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('banners')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'banners'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>🎬 Banners</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'banners' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {banners.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'inquiries'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>📬 Leads</span>
              {inquiries.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'inquiries' ? 'bg-slate-950 text-cyan-300' : 'bg-amber-400 text-slate-950'
                }`}>
                  {inquiries.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>📊 Stats</span>
            </button>

            <button
              onClick={() => setActiveTab('system')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'system'
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>⚙️ Backup</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 pb-28">
        {/* =========================================================================
            TAB 1: PRODUCTS (PRIMARY WORKHORSE FOR STORE OWNER)
           ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Top Product Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#06121b] p-3.5 rounded-2xl border border-slate-800/80">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white">Product Catalog</h2>
                <p className="text-xs text-slate-400">
                  {filteredProducts.length} items &bull; Click + to add new stock
                </p>
              </div>

              {!isEditingProduct && (
                <button
                  onClick={handleNewProductClick}
                  className="w-full sm:w-auto h-11 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all"
                >
                  <span className="text-base font-bold">+</span>
                  <span>Add Product</span>
                </button>
              )}
            </div>

            {/* Product Edit / Create Modal Card */}
            {isEditingProduct && (
              <div className="bg-[#071520] border-2 border-cyan-400/80 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="font-semibold text-sm sm:text-base text-white">
                      {editingProductId ? `Edit: ${productForm.name}` : 'Create New Product'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProduct(false);
                      setEditingProductId(null);
                    }}
                    className="h-8 px-3 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Name */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Picasso Clownfish (Bonded Pair)"
                        value={productForm.name || ''}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Category *
                      </label>
                      <select
                        value={productForm.category || 'marine-life'}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                        className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      >
                        <option value="marine-life">Marine Life (Fish &amp; Corals)</option>
                        <option value="lighting-tech">Lighting &amp; Tech</option>
                        <option value="rock-sand">Live Rock &amp; Sand</option>
                        <option value="salt-chemistry">Salts &amp; Chemistry</option>
                        <option value="hardware">Equipment &amp; Skimmers</option>
                      </select>
                    </div>

                    {/* Scientific / Subtitle */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Scientific Name / Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Amphiprion percula"
                        value={productForm.scientificName || ''}
                        onChange={(e) => setProductForm({ ...productForm, scientificName: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Selling Price */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Selling Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="14999"
                        value={productForm.price || ''}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Original Price / MRP */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Original Price / MRP (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="17999"
                        value={productForm.originalPrice || ''}
                        onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Stock Count */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="10"
                        value={productForm.stockCount ?? 0}
                        onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Badge */}
                    <div>
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Highlight Badge
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rare Specimen, Best Seller"
                        value={productForm.badge || ''}
                        onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* In Stock Toggle */}
                    <div className="sm:col-span-2 flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        id="inStockCheck"
                        checked={productForm.inStock}
                        onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                        className="w-5 h-5 rounded text-cyan-400 bg-slate-800 border-slate-700 focus:ring-cyan-400"
                      />
                      <label htmlFor="inStockCheck" className="text-xs sm:text-sm text-white font-medium cursor-pointer">
                        Mark as Available for Instant Customer Order
                      </label>
                    </div>

                    {/* Image URL */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Image URL (Unsplash or direct image link)
                      </label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={Array.isArray(productForm.images) ? productForm.images.join(', ') : ''}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            images: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Description */}
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-300 block mb-1">
                        Short Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Key care highlights, origin, compatibility..."
                        value={productForm.shortDesc || ''}
                        onChange={(e) => setProductForm({ ...productForm, shortDesc: e.target.value })}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProduct(false);
                        setEditingProductId(null);
                      }}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs uppercase tracking-wider shadow-lg active:scale-95"
                    >
                      Save to Store →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Search & Category Filter Controls */}
            <div className="space-y-2.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products by name, species..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#06121b] border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                  🔍
                </span>
                {productSearch && (
                  <button
                    onClick={() => setProductSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'marine-life', label: 'Marine Life' },
                  { id: 'lighting-tech', label: 'Lighting' },
                  { id: 'rock-sand', label: 'Rock & Sand' },
                  { id: 'salt-chemistry', label: 'Salts' },
                  { id: 'hardware', label: 'Hardware' },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === c.id
                        ? 'bg-slate-700 text-white font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Mobile Card List */}
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center bg-[#06121b] rounded-2xl border border-slate-800">
                <span className="text-3xl block mb-2">🐠</span>
                <p className="text-sm text-slate-300 font-medium">No products found matching your search</p>
                <button
                  onClick={() => {
                    setProductSearch('');
                    setCategoryFilter('all');
                  }}
                  className="mt-3 text-xs text-cyan-400 underline"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredProducts.map((p) => {
                  const isLowStock = p.stockCount <= 3;
                  const isOut = !p.inStock || p.stockCount <= 0;

                  return (
                    <div
                      key={p.id}
                      className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-3.5 hover:border-slate-700 transition-colors flex flex-col justify-between gap-3"
                    >
                      {/* Top Row: Thumbnail + Info */}
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&q=80'}
                          alt={p.name}
                          className="w-16 h-16 rounded-xl object-cover bg-black shrink-0 border border-slate-800"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {p.category.replace('-', ' ')}
                            </span>
                            {p.badge && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                                {p.badge}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-semibold text-white truncate mt-1">
                            {p.name}
                          </h4>

                          {p.scientificName && (
                            <p className="text-[11px] text-slate-400 italic truncate">
                              {p.scientificName}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-bold text-cyan-400">
                              ₹{p.price.toLocaleString('en-IN')}
                            </span>
                            {p.originalPrice && (
                              <span className="text-xs text-slate-500 line-through">
                                ₹{p.originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle Row: Stock Controls (+ / - buttons for easy thumb tapping) */}
                      <div className="flex items-center justify-between bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Stock:</span>
                          <span
                            className={`font-semibold ${
                              isOut ? 'text-red-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : `${p.stockCount} units`}
                          </span>
                        </div>

                        {/* Quick increment/decrement buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickStockChange(p, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
                            title="Decrease 1"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono font-semibold text-white">
                            {p.stockCount}
                          </span>
                          <button
                            onClick={() => handleQuickStockChange(p, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center active:scale-95 transition-transform"
                            title="Increase 1"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Bottom Row: Actions (Edit, Status, View, Delete) */}
                      <div className="flex items-center justify-between pt-1 gap-2">
                        {/* Instant In-Stock Toggle */}
                        <button
                          onClick={() => {
                            const newInStock = !p.inStock;
                            updateProduct(p.id, {
                              inStock: newInStock,
                              stockCount: newInStock && p.stockCount === 0 ? 5 : p.stockCount,
                            });
                            showToast(newInStock ? 'Marked In Stock' : 'Marked Out of Stock');
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            p.inStock
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          {p.inStock ? '● Active' : '○ Paused'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/marketplace/${p.id}`}
                            target="_blank"
                            className="h-8 px-2.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-medium inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <span>↗</span>
                          </Link>

                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="h-8 px-3 rounded-lg bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 text-xs font-semibold border border-cyan-400/30"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete "${p.name}" from catalog?`)) {
                                deleteProduct(p.id);
                                showToast(`Deleted "${p.name}"`);
                              }
                            }}
                            className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 flex items-center justify-center"
                            title="Delete product"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: PROMOTIONAL SLIDING BANNERS
           ========================================================================= */}
        {activeTab === 'banners' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#06121b] p-3.5 rounded-2xl border border-slate-800/80">
              <div>
                <h2 className="text-base font-semibold text-white">Sliding Announcement Banners</h2>
                <p className="text-xs text-slate-400">
                  Broadcast flash sales and new arrivals on the storefront carousel
                </p>
              </div>

              {!isEditingBanner && (
                <button
                  onClick={() => {
                    setBannerForm({
                      id: `banner-${Date.now()}`,
                      badge: 'SPECIAL ANNOUNCEMENT',
                      badgeColor: '#00B8D9',
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto h-11 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all"
                >
                  <span className="text-base font-bold">+</span>
                  <span>Create Banner Slide</span>
                </button>
              )}
            </div>

            {/* Banner Editor */}
            {isEditingBanner && (
              <form
                onSubmit={handleSaveBanner}
                className="bg-[#071520] border-2 border-cyan-400/80 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-semibold text-sm sm:text-base text-white">
                    {editingBannerId ? 'Edit Announcement Slide' : 'Create New Slide'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingBanner(false)}
                    className="h-8 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Headline Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Sea Live Coral Restock"
                      value={bannerForm.title || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Subtitle / Tagline *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50+ New Acropora & LPS Coral Frags Ready"
                      value={bannerForm.subtitle || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LIMITED TIME"
                      value={bannerForm.badge || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Button Text &amp; Link
                    </label>
                    <input
                      type="text"
                      placeholder="EXPLORE NOW →"
                      value={bannerForm.ctaText || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Background Image URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={bannerForm.image || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      id="bannerActiveCheck"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      className="w-5 h-5 rounded text-cyan-400 bg-slate-800 border-slate-700 focus:ring-cyan-400"
                    />
                    <label htmlFor="bannerActiveCheck" className="text-xs sm:text-sm text-white font-medium cursor-pointer">
                      Broadcast Live on Customer Homepage Carousel
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingBanner(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs uppercase tracking-wider shadow-lg active:scale-95"
                  >
                    Save Slide →
                  </button>
                </div>
              </form>
            )}

            {/* Banner List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between gap-3 overflow-hidden"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                        {b.badge}
                      </span>
                      <button
                        onClick={() => {
                          updateBanner(b.id, { isActive: !b.isActive });
                          showToast(b.isActive ? 'Slide hidden' : 'Slide active');
                        }}
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          b.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {b.isActive ? '● Live' : '○ Hidden'}
                      </button>
                    </div>

                    <div className="h-28 rounded-xl overflow-hidden relative border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <h4 className="absolute bottom-2 left-3 right-3 text-sm font-semibold text-white truncate">
                        {b.title}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 font-medium truncate">{b.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] text-slate-500">
                      CTA: <strong className="text-slate-300">{b.ctaText}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditBannerClick(b)}
                        className="h-8 px-3 rounded-lg bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 text-xs font-semibold border border-cyan-400/20"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete banner "${b.title}"?`)) {
                            deleteBanner(b.id);
                            showToast('Banner slide deleted');
                          }
                        }}
                        className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 flex items-center justify-center"
                        title="Delete banner"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Carousel Preview Card */}
            <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Storefront Carousel Preview
              </h3>
              <PromoCarousel />
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: LEADS & INQUIRIES (ONE-TOUCH WHATSAPP)
           ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="bg-[#06121b] p-3.5 rounded-2xl border border-slate-800/80">
              <h2 className="text-base font-semibold text-white">Customer Leads &amp; Consultations</h2>
              <p className="text-xs text-slate-400">
                Direct inquiries from consultation forms with 1-tap WhatsApp reply
              </p>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-8 text-center bg-[#06121b] rounded-2xl border border-slate-800">
                <span className="text-3xl block mb-2">📬</span>
                <p className="text-sm text-slate-300 font-medium">No pending inquiries right now</p>
                <p className="text-xs text-slate-500 mt-1">
                  When a client fills out an aquarium consultation or callback form, it appears here instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-cyan-400/10 text-cyan-300 border border-cyan-400/20">
                        {inq.type.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-white">{inq.name}</h4>
                      <p className="text-xs text-cyan-300 font-medium mt-0.5">{inq.phone}</p>
                      {inq.email && <p className="text-xs text-slate-400">{inq.email}</p>}
                    </div>

                    {inq.serviceType && (
                      <div className="text-xs text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        Interested in: <strong className="text-white">{inq.serviceType}</strong>
                        {inq.spaceType && <span> ({inq.spaceType})</span>}
                      </div>
                    )}

                    {inq.notes && (
                      <p className="text-xs text-slate-300 italic bg-black/40 p-2.5 rounded-lg border border-slate-800">
                        &ldquo;{inq.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <a
                        href={`https://wa.me/${inq.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(
                          inq.name
                        )},%20this%20is%20Marine%20Creatures%20following%20up%20on%20your%20consultation%20request.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 active:scale-95 transition-transform"
                      >
                        <span>💬</span>
                        <span>Reply on WhatsApp</span>
                      </a>

                      <button
                        onClick={() => {
                          deleteInquiry(inq.id);
                          showToast('Lead dismissed');
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-medium"
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
            TAB 4: METRICS & OVERVIEW
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="bg-[#06121b] p-3.5 rounded-2xl border border-slate-800/80">
              <h2 className="text-base font-semibold text-white">Store Health &amp; Inventory Metrics</h2>
              <p className="text-xs text-slate-400">High level overview of stock and catalog value</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Catalog Products
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-white">{products.length}</span>
                <span className="text-[11px] text-emerald-400 block mt-1">Live in store</span>
              </div>

              <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Promo Slides
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-cyan-400">
                  {banners.filter((b) => b.isActive).length} / {banners.length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">Active on carousel</span>
              </div>

              <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Total Stock Value
                </span>
                <span className="text-xl sm:text-2xl font-bold text-white">
                  ₹{totalInventoryValue.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">Across all units</span>
              </div>

              <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                  Needs Restock
                </span>
                <span
                  className={`text-2xl sm:text-3xl font-bold ${
                    outOfStockItems.length > 0 ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  {outOfStockItems.length}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">Out or low stock</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Jump
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={handleNewProductClick}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-cyan-400/50 transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">➕</span>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Add New Product</h4>
                    <p className="text-[10px] text-slate-400">Create fish, coral, rock, or lights</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('inquiries')}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-cyan-400/50 transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">💬</span>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Review Client Leads</h4>
                    <p className="text-[10px] text-slate-400">{inquiries.length} pending client inquiries</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: BACKUP & DATA
           ========================================================================= */}
        {activeTab === 'system' && (
          <div className="space-y-4 max-w-xl">
            <div className="bg-[#06121b] p-3.5 rounded-2xl border border-slate-800/80">
              <h2 className="text-base font-semibold text-white">Backup &amp; Reset</h2>
              <p className="text-xs text-slate-400">Export or restore your catalog at any time</p>
            </div>

            {/* Download Backup */}
            <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-semibold text-white">Export Catalog Backup</h4>
              <p className="text-xs text-slate-400">
                Save a JSON backup of all your customized products, prices, and banners to your device.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md transition-all"
              >
                <span>📥</span>
                <span>Download Backup (.JSON)</span>
              </button>
            </div>

            {/* Restore Backup */}
            <div className="bg-[#06121b] border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-semibold text-white">Restore from JSON</h4>
              <textarea
                rows={3}
                placeholder="Paste JSON string here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 resize-none"
              />
              {importStatus && (
                <p className="text-xs font-semibold text-emerald-400">{importStatus}</p>
              )}
              <button
                onClick={handleImportJson}
                disabled={!importJsonText}
                className="w-full sm:w-auto h-11 px-4 rounded-xl border border-cyan-400/60 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 font-semibold text-xs uppercase tracking-wider disabled:opacity-40 transition-colors"
              >
                Restore JSON Data
              </button>
            </div>

            {/* Factory Reset */}
            <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-4 space-y-2.5">
              <h4 className="text-sm font-semibold text-red-400">Factory Reset</h4>
              <p className="text-xs text-slate-400">
                Reset everything back to original demo products and banners.
              </p>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all products and banners to defaults?')) {
                    resetToDefaults();
                    showToast('Catalog reset to defaults');
                  }
                }}
                className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold uppercase tracking-wider"
              >
                Reset To Factory Defaults
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

