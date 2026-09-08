'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCatalog, InquiryLead } from '@/lib/context/CatalogContext';
import { Product, ProductMedia } from '@/lib/data/products';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    videos: [],
    media: [
      {
        id: 'media-init-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85',
        title: 'Primary Photo',
      },
    ],
    shortDesc: '',
    description: '',
  });

  // Media upload input helpers
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');

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
    setSidebarOpen(false);
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
      videos: productForm.videos || [],
      media: productForm.media || [],
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

  // Media Manager Handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (!base64) return;
        setProductForm((prev) => {
          const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
          const newMediaItem: ProductMedia = {
            id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: 'image',
            url: base64,
            title: file.name,
          };
          const updatedMedia = [...currentMedia, newMediaItem];
          const updatedImages = updatedMedia.filter((m) => m.type === 'image').map((m) => m.url);
          return {
            ...prev,
            media: updatedMedia,
            images: updatedImages.length > 0 ? updatedImages : prev.images,
          };
        });
      };
      reader.readAsDataURL(file);
    });
    showToast(`✓ Uploaded ${files.length} photo(s)`);
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (file.size > 25 * 1024 * 1024) {
      alert('Video file is larger than 25MB. For optimal performance, please use an MP4 URL or compress the video before uploading.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const videoDataUrl = uploadEvent.target?.result as string;
      if (!videoDataUrl) return;
      setProductForm((prev) => {
        const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
        const newMediaItem: ProductMedia = {
          id: `media-vid-${Date.now()}`,
          type: 'video',
          url: videoDataUrl,
          title: file.name,
        };
        const updatedMedia = [...currentMedia, newMediaItem];
        const updatedVideos = updatedMedia.filter((m) => m.type === 'video').map((m) => m.url);
        return {
          ...prev,
          media: updatedMedia,
          videos: updatedVideos,
        };
      });
      showToast(`✓ Video "${file.name}" uploaded to slideshow`);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddMediaUrl = () => {
    if (!newMediaUrl.trim()) return;
    const item: ProductMedia = {
      id: `media-${Date.now()}`,
      type: newMediaType,
      url: newMediaUrl.trim(),
      title: newMediaType === 'video' ? 'Product Video' : 'Product Photo',
    };
    setProductForm((prev) => {
      const currentMedia: ProductMedia[] = prev.media ? [...prev.media] : [];
      const updatedMedia = [...currentMedia, item];
      const updatedImages = updatedMedia.filter((m) => m.type === 'image').map((m) => m.url);
      const updatedVideos = updatedMedia.filter((m) => m.type === 'video').map((m) => m.url);
      return {
        ...prev,
        media: updatedMedia,
        images: updatedImages.length > 0 ? updatedImages : prev.images,
        videos: updatedVideos,
      };
    });
    setNewMediaUrl('');
    showToast(`✓ Added ${newMediaType} URL to slideshow`);
  };

  const handleRemoveMedia = (index: number) => {
    setProductForm((prev) => {
      if (!prev.media) return prev;
      const updatedMedia = prev.media.filter((_, i) => i !== index);
      const updatedImages = updatedMedia.filter((m) => m.type === 'image').map((m) => m.url);
      const updatedVideos = updatedMedia.filter((m) => m.type === 'video').map((m) => m.url);
      return {
        ...prev,
        media: updatedMedia,
        images: updatedImages.length > 0 ? updatedImages : ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85'],
        videos: updatedVideos,
      };
    });
    showToast('✓ Media item removed');
  };

  const handleMoveMedia = (index: number, direction: 'up' | 'down') => {
    setProductForm((prev) => {
      if (!prev.media) return prev;
      const items = [...prev.media];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      const updatedImages = items.filter((m) => m.type === 'image').map((m) => m.url);
      const updatedVideos = items.filter((m) => m.type === 'video').map((m) => m.url);
      return {
        ...prev,
        media: items,
        images: updatedImages,
        videos: updatedVideos,
      };
    });
  };

  const handleSetMediaCover = (index: number) => {
    setProductForm((prev) => {
      if (!prev.media || index === 0) return prev;
      const items = [...prev.media];
      const [selected] = items.splice(index, 1);
      items.unshift(selected);
      const updatedImages = items.filter((m) => m.type === 'image').map((m) => m.url);
      const updatedVideos = items.filter((m) => m.type === 'video').map((m) => m.url);
      return {
        ...prev,
        media: items,
        images: updatedImages,
        videos: updatedVideos,
      };
    });
    showToast('✓ Set as primary cover slide');
  };

  const handleEditProductClick = (product: Product) => {
    const existingMedia: ProductMedia[] = (product.media && product.media.length > 0)
      ? [...product.media]
      : [
          ...(product.images || []).map((img, i) => ({
            id: `img-${i}`,
            type: 'image' as const,
            url: img,
            title: `Photo ${i + 1}`,
          })),
          ...(product.videos || []).map((vid, i) => ({
            id: `vid-${i}`,
            type: 'video' as const,
            url: vid,
            title: `Live Specimen Video`,
          })),
        ];

    setProductForm({
      ...product,
      media: existingMedia,
      images: product.images || [],
      videos: product.videos || [],
    });
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
      videos: [],
      media: [
        {
          id: `media-${Date.now()}`,
          type: 'image',
          url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1000&q=85',
          title: 'Primary Photo',
        },
      ],
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
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(0,184,217,0.15)]">
              <span className="text-3xl">🔒</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Admin Portal
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Marine Creatures Control Center
            </p>
          </div>

          <div className="bg-[#07131d] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
                  Admin Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    placeholder="Enter secret passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full h-14 px-4 pr-12 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-base focus:outline-none focus:border-cyan-400 transition-colors"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-white p-1.5"
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
                className="w-full h-14 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                <span>Unlock Control Center</span>
                <span>→</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-center">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-1"
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

  const TAB_ITEMS = [
    { id: 'products', label: 'Products & Inventory', count: products.length, icon: '🐠' },
    { id: 'banners', label: 'Announcement Slides', count: banners.length, icon: '🎬' },
    { id: 'inquiries', label: 'Client Inquiries', count: inquiries.length, icon: '📬' },
    { id: 'overview', label: 'Analytics & Stats', icon: '📊' },
    { id: 'system', label: 'Backup & Restore', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#02070c] text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 pointer-events-none">
          <div className="bg-cyan-400 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-center">
            {notification}
          </div>
        </div>
      )}

      {/* Slide-over Hamburger Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 sm:w-80 max-w-[85vw] bg-[#05111a] border-r border-slate-800 p-5 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-lg">
                    🌊
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">Control Center</h2>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                      ● Live Mode
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-base"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Menu Items */}
              <nav className="space-y-2">
                {TAB_ITEMS.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950 shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>

                      {typeof item.count === 'number' && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-slate-950 text-cyan-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <Link
                href="/marketplace"
                target="_blank"
                className="w-full h-11 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>🛍️</span>
                <span>Open Storefront ↗</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full h-11 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/30"
              >
                <span>🔒</span>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Top Mobile Navbar with Big Hamburger & Current Section Title */}
      <header className="sticky top-0 z-30 bg-[#05111a]/95 backdrop-blur-md border-b border-slate-800">
        <div className="px-4 py-3.5 flex items-center justify-between gap-3 max-w-5xl mx-auto">
          {/* Hamburger + Active Tab Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-sm"
              aria-label="Open navigation menu"
            >
              <span className="w-5 h-0.5 bg-white rounded-full" />
              <span className="w-5 h-0.5 bg-white rounded-full" />
              <span className="w-5 h-0.5 bg-white rounded-full" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg text-white capitalize">
                  {activeTab === 'products' && 'Product Inventory'}
                  {activeTab === 'banners' && 'Announcement Slides'}
                  {activeTab === 'inquiries' && 'Client Inquiries'}
                  {activeTab === 'overview' && 'Store Metrics'}
                  {activeTab === 'system' && 'System & Backup'}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400">Marine Creatures Admin</p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            <Link
              href="/marketplace"
              target="_blank"
              className="h-10 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 border border-slate-700"
              title="Open storefront in new tab"
            >
              <span>🛍️</span>
              <span className="hidden sm:inline">Store</span>
              <span>↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="h-10 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-28">
        {/* =========================================================================
            TAB 1: PRODUCTS
           ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs text-slate-400">
                  Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} catalog items
                </span>
              </div>

              {!isEditingProduct && (
                <button
                  onClick={handleNewProductClick}
                  className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all"
                >
                  <span className="text-lg">+</span>
                  <span>Add Product</span>
                </button>
              )}
            </div>

            {/* Product Edit / Create Modal Card */}
            {isEditingProduct && (
              <div className="bg-[#071520] border-2 border-cyan-400 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
                    <h3 className="font-bold text-base sm:text-lg text-white">
                      {editingProductId ? `Edit: ${productForm.name}` : 'Create New Product'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProduct(false);
                      setEditingProductId(null);
                    }}
                    className="h-9 px-4 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveProduct} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Product Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Picasso Clownfish (Bonded Pair)"
                        value={productForm.name || ''}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Category *
                      </label>
                      <select
                        value={productForm.category || 'marine-life'}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value as any })}
                        className="w-full h-12 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      >
                        <option value="marine-life">Marine Life (Fish &amp; Corals)</option>
                        <option value="lighting-tech">Lighting &amp; Tech</option>
                        <option value="rock-sand">Live Rock &amp; Sand</option>
                        <option value="salt-chemistry">Salts &amp; Chemistry</option>
                        <option value="hardware">Equipment &amp; Skimmers</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Scientific Name / Subtitle
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Amphiprion percula"
                        value={productForm.scientificName || ''}
                        onChange={(e) => setProductForm({ ...productForm, scientificName: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="14999"
                        value={productForm.price || ''}
                        onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-bold text-cyan-300"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Original Price / MRP (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="17999"
                        value={productForm.originalPrice || ''}
                        onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Current Stock Units *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="10"
                        value={productForm.stockCount ?? 0}
                        onChange={(e) => setProductForm({ ...productForm, stockCount: Number(e.target.value) })}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Highlight Badge
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Rare Pair, Best Seller"
                        value={productForm.badge || ''}
                        onChange={(e) => setProductForm({ ...productForm, badge: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="sm:col-span-2 flex items-center gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                      <input
                        type="checkbox"
                        id="inStockCheck"
                        checked={productForm.inStock}
                        onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                        className="w-6 h-6 rounded text-cyan-400 bg-slate-800 border-slate-700"
                      />
                      <label htmlFor="inStockCheck" className="text-sm text-white font-semibold cursor-pointer">
                        Mark as Available for Customer Checkout
                      </label>
                    </div>

                    {/* Media Gallery Manager (Photos & Videos Slideshow) */}
                    <div className="sm:col-span-2 space-y-3 pt-2 border-t border-slate-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span>📸 Product Media Slideshow (Photos &amp; Videos)</span>
                            <span className="text-[10px] text-cyan-400 font-mono font-normal">
                              ({productForm.media?.length || 0} items)
                            </span>
                          </label>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Upload photos and live quarantine specimen video clips. Slide #1 will be the main catalog cover.
                          </p>
                        </div>

                        {/* Direct Action Upload Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Photo File Picker */}
                          <label className="cursor-pointer h-9 px-3.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 border border-cyan-400/30 active:scale-95 transition-all">
                            <span>📸</span>
                            <span>Upload Photos</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                          </label>

                          {/* Video File Picker */}
                          <label className="cursor-pointer h-9 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-500/30 active:scale-95 transition-all">
                            <span>🎥</span>
                            <span>Upload Video</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/ogg"
                              onChange={handleVideoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Add by URL input bar */}
                      <div className="flex flex-col sm:flex-row gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                        <select
                          value={newMediaType}
                          onChange={(e) => setNewMediaType(e.target.value as any)}
                          className="h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400 shrink-0 font-medium"
                        >
                          <option value="image">📸 Photo URL</option>
                          <option value="video">🎥 Video URL (MP4/WebM)</option>
                        </select>
                        <input
                          type="text"
                          placeholder={newMediaType === 'video' ? 'Paste direct video URL (e.g. https://.../video.mp4)' : 'Paste image URL (e.g. https://.../photo.jpg)'}
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          className="flex-1 h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                        <button
                          type="button"
                          onClick={handleAddMediaUrl}
                          className="h-10 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0 active:scale-95"
                        >
                          + Add to Slideshow
                        </button>
                      </div>

                      {/* Visual Slideshow Strip Grid */}
                      {productForm.media && productForm.media.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                          {productForm.media.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className={`relative rounded-2xl border overflow-hidden bg-slate-900 flex flex-col group ${
                                idx === 0 ? 'border-cyan-400 shadow-[0_0_12px_rgba(0,184,217,0.3)]' : 'border-slate-800'
                              }`}
                            >
                              {/* Slide Preview Container */}
                              <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
                                {item.type === 'video' ? (
                                  <div className="w-full h-full relative flex items-center justify-center">
                                    <video
                                      src={item.url}
                                      muted
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                      <span className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs pl-0.5 font-bold shadow-md">
                                        ▶
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={item.url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                )}

                                {/* Slide Number Badge */}
                                <div className="absolute top-2 left-2 flex items-center gap-1">
                                  <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md text-[10px] font-bold text-white">
                                    #{idx + 1}
                                  </span>
                                  {idx === 0 && (
                                    <span className="px-2 py-0.5 rounded-lg bg-cyan-400 text-[9px] font-bold text-slate-950 uppercase tracking-wider">
                                      Cover
                                    </span>
                                  )}
                                </div>

                                {/* Media Type Indicator */}
                                <div className="absolute top-2 right-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                      item.type === 'video'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800/90 text-slate-200'
                                    }`}
                                  >
                                    {item.type === 'video' ? '🎥 Video' : '📸 Photo'}
                                  </span>
                                </div>
                              </div>

                              {/* Card Action Controls */}
                              <div className="p-2 bg-slate-950/80 flex items-center justify-between gap-1 border-t border-slate-800/80 text-[11px]">
                                {idx !== 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSetMediaCover(idx)}
                                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                                    title="Make this the main cover image"
                                  >
                                    ★ Make Cover
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-medium italic">
                                    Primary Cover
                                  </span>
                                )}

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveMedia(idx, 'up')}
                                    className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                                    title="Move earlier"
                                  >
                                    ◀
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (productForm.media?.length || 0) - 1}
                                    onClick={() => handleMoveMedia(idx, 'down')}
                                    className="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 flex items-center justify-center text-xs"
                                    title="Move later"
                                  >
                                    ▶
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedia(idx)}
                                    className="w-6 h-6 rounded bg-red-500/20 text-red-400 hover:bg-red-500/40 flex items-center justify-center text-xs ml-1"
                                    title="Remove slide"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 bg-slate-900/40">
                          <span className="text-2xl block mb-1">📸</span>
                          <p className="text-xs text-slate-400 font-medium">No media uploaded for this product yet.</p>
                          <p className="text-[11px] text-slate-500 mt-1">Upload at least one photo or video to display in the customer slideshow.</p>
                        </div>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                        Short Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Origin, compatibility, highlights..."
                        value={productForm.shortDesc || ''}
                        onChange={(e) => setProductForm({ ...productForm, shortDesc: e.target.value })}
                        className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProduct(false);
                        setEditingProductId(null);
                      }}
                      className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95"
                    >
                      Save to Storefront →
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products by title, species..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full h-13 pl-11 pr-4 rounded-2xl bg-[#071520] border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                🔍
              </span>
              {productSearch && (
                <button
                  onClick={() => setProductSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    categoryFilter === c.id
                      ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                      : 'bg-[#071520] text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Big, Clean, Spacious Product Cards */}
            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center bg-[#071520] rounded-3xl border border-slate-800">
                <span className="text-4xl block mb-2">🐠</span>
                <p className="text-base text-slate-300 font-semibold">No products found</p>
                <button
                  onClick={() => {
                    setProductSearch('');
                    setCategoryFilter('all');
                  }}
                  className="mt-3 text-xs font-semibold text-cyan-400 underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((p) => {
                  const isOut = !p.inStock || p.stockCount <= 0;

                  return (
                    <div
                      key={p.id}
                      className="bg-[#071520] border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all shadow-md space-y-4"
                    >
                      {/* Top Row: Big Thumbnail + Title + Price */}
                      <div className="flex items-start gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&q=80'}
                          alt={p.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-black shrink-0 border border-slate-800"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {p.category.replace('-', ' ')}
                            </span>
                            {p.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20">
                                {p.badge}
                              </span>
                            )}
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                            {p.name}
                          </h4>

                          {p.scientificName && (
                            <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">
                              {p.scientificName}
                            </p>
                          )}

                          <div className="flex items-baseline gap-2.5 mt-2">
                            <span className="text-lg sm:text-xl font-extrabold text-cyan-400">
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

                      {/* Stock Adjustment Bar (Extra Big Buttons for Finger Taps) */}
                      <div className="bg-slate-900/90 px-4 py-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block font-medium">Available Units:</span>
                          <span
                            className={`text-sm font-bold ${
                              isOut ? 'text-red-400' : p.stockCount <= 3 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {isOut ? 'Out of Stock' : `${p.stockCount} in stock`}
                          </span>
                        </div>

                        {/* Big +/- Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickStockChange(p, -1)}
                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                            title="Minus 1"
                          >
                            −
                          </button>
                          <span className="w-10 text-center font-mono font-bold text-base text-white">
                            {p.stockCount}
                          </span>
                          <button
                            onClick={() => handleQuickStockChange(p, 1)}
                            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-lg font-bold flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                            title="Plus 1"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Bottom Action Strip */}
                      <div className="flex items-center justify-between pt-1 gap-2 flex-wrap">
                        {/* Status Toggle */}
                        <button
                          onClick={() => {
                            const newInStock = !p.inStock;
                            updateProduct(p.id, {
                              inStock: newInStock,
                              stockCount: newInStock && p.stockCount === 0 ? 5 : p.stockCount,
                            });
                            showToast(newInStock ? 'Marked In Stock' : 'Marked Out of Stock');
                          }}
                          className={`h-10 px-4 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                            p.inStock
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          <span>{p.inStock ? '●' : '○'}</span>
                          <span>{p.inStock ? 'Live on Store' : 'Hidden / Paused'}</span>
                        </button>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/marketplace/${p.id}`}
                            target="_blank"
                            className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <span>↗</span>
                          </Link>

                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="h-10 px-4 rounded-xl bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 text-xs font-bold border border-cyan-400/30"
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
                            className="h-10 w-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 flex items-center justify-center"
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
            TAB 2: BANNERS
           ========================================================================= */}
        {activeTab === 'banners' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Promotional Carousel Slides</h2>
                <p className="text-xs text-slate-400">Manage announcements sliding on customer homepage</p>
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
                  className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all"
                >
                  <span>+</span>
                  <span>Create Slide</span>
                </button>
              )}
            </div>

            {/* Banner Editor */}
            {isEditingBanner && (
              <form
                onSubmit={handleSaveBanner}
                className="bg-[#071520] border-2 border-cyan-400 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-base text-white">
                    {editingBannerId ? 'Edit Announcement Slide' : 'Create New Slide'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingBanner(false)}
                    className="h-9 px-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Slide Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Red Sea Live Coral Restock"
                      value={bannerForm.title || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Subtitle / Tagline *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 50+ New Acropora Frags Ready"
                      value={bannerForm.subtitle || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Badge Text
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LIMITED DROP"
                      value={bannerForm.badge || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                      CTA Button Text
                    </label>
                    <input
                      type="text"
                      placeholder="EXPLORE NOW →"
                      value={bannerForm.ctaText || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Background Image URL *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="https://..."
                      value={bannerForm.image || ''}
                      onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                    <input
                      type="checkbox"
                      id="bannerActiveCheck"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      className="w-6 h-6 rounded text-cyan-400 bg-slate-800 border-slate-700"
                    />
                    <label htmlFor="bannerActiveCheck" className="text-sm text-white font-semibold cursor-pointer">
                      Broadcast Live on Customer Homepage Carousel
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditingBanner(false)}
                    className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95"
                  >
                    Save Slide →
                  </button>
                </div>
              </form>
            )}

            {/* Banner Cards */}
            <div className="space-y-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="bg-[#071520] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between gap-4 overflow-hidden"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-800 text-cyan-400">
                        {b.badge}
                      </span>
                      <button
                        onClick={() => {
                          updateBanner(b.id, { isActive: !b.isActive });
                          showToast(b.isActive ? 'Slide hidden' : 'Slide active');
                        }}
                        className={`text-xs px-3 py-1 rounded-full font-bold border ${
                          b.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {b.isActive ? '● Live' : '○ Hidden'}
                      </button>
                    </div>

                    <div className="h-32 sm:h-36 rounded-2xl overflow-hidden relative border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <h4 className="absolute bottom-3 left-4 right-4 text-base sm:text-lg font-bold text-white truncate">
                        {b.title}
                      </h4>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 font-medium truncate">{b.subtitle}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <span className="text-xs text-slate-400">
                      CTA: <strong className="text-white">{b.ctaText}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditBannerClick(b)}
                        className="h-10 px-4 rounded-xl bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400/25 text-xs font-bold border border-cyan-400/30"
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
                        className="h-10 w-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 flex items-center justify-center"
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
            <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Storefront Carousel Preview
              </h3>
              <PromoCarousel />
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: INQUIRIES
           ========================================================================= */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Customer Consultation Leads</h2>
                <p className="text-xs text-slate-400">
                  Leads submitted from online forms with 1-tap WhatsApp reply
                </p>
              </div>
            </div>

            {inquiries.length === 0 ? (
              <div className="p-12 text-center bg-[#071520] rounded-3xl border border-slate-800">
                <span className="text-4xl block mb-2">📬</span>
                <p className="text-base text-slate-300 font-semibold">No pending leads right now</p>
                <p className="text-xs text-slate-500 mt-1">
                  Incoming callback and custom aquarium inquiries appear here immediately.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {inquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-md text-[10px] uppercase font-bold bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                        {inq.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(inq.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-white">{inq.name}</h4>
                      <p className="text-sm text-cyan-300 font-semibold mt-0.5">{inq.phone}</p>
                      {inq.email && <p className="text-xs text-slate-400 mt-0.5">{inq.email}</p>}
                    </div>

                    {inq.serviceType && (
                      <div className="text-xs text-slate-300 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                        Requested: <strong className="text-white">{inq.serviceType}</strong>
                        {inq.spaceType && <span> ({inq.spaceType})</span>}
                      </div>
                    )}

                    {inq.notes && (
                      <p className="text-xs text-slate-300 italic bg-black/40 p-3 rounded-xl border border-slate-800">
                        &ldquo;{inq.notes}&rdquo;
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <a
                        href={`https://wa.me/${inq.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(
                          inq.name
                        )},%20this%20is%20Marine%20Creatures%20following%20up%20on%20your%20consultation%20request.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-11 px-5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2 active:scale-95 transition-transform"
                      >
                        <span>💬</span>
                        <span>Reply on WhatsApp</span>
                      </a>

                      <button
                        onClick={() => {
                          deleteInquiry(inq.id);
                          showToast('Lead dismissed');
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold"
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
            TAB 4: OVERVIEW / STATS
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Catalog Products
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-white">{products.length}</span>
                <span className="text-xs text-emerald-400 block mt-1">Live in store</span>
              </div>

              <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Promo Slides
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-cyan-400">
                  {banners.filter((b) => b.isActive).length} / {banners.length}
                </span>
                <span className="text-xs text-slate-400 block mt-1">Active on carousel</span>
              </div>

              <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Stock Value
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-white">
                  ₹{totalInventoryValue.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-slate-400 block mt-1">Across all units</span>
              </div>

              <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Needs Restock
                </span>
                <span
                  className={`text-3xl sm:text-4xl font-extrabold ${
                    outOfStockItems.length > 0 ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  {outOfStockItems.length}
                </span>
                <span className="text-xs text-slate-400 block mt-1">Out or low units</span>
              </div>
            </div>

            <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quick Shortcuts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleNewProductClick}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-cyan-400/50 transition-colors flex items-center gap-3.5"
                >
                  <span className="text-2xl">➕</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Add New Product</h4>
                    <p className="text-xs text-slate-400">Post new corals, fish, or lights</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('inquiries')}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-cyan-400/50 transition-colors flex items-center gap-3.5"
                >
                  <span className="text-2xl">💬</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Review Client Leads</h4>
                    <p className="text-xs text-slate-400">{inquiries.length} pending client inquiries</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: SYSTEM & BACKUP
           ========================================================================= */}
        {activeTab === 'system' && (
          <div className="space-y-4 max-w-xl">
            <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3">
              <h4 className="text-base font-bold text-white">Export Catalog Backup</h4>
              <p className="text-xs text-slate-400">
                Download a JSON backup of all customized products, prices, and banners to your device.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md transition-all"
              >
                <span>📥</span>
                <span>Download Backup (.JSON)</span>
              </button>
            </div>

            <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3">
              <h4 className="text-base font-bold text-white">Restore from JSON</h4>
              <textarea
                rows={3}
                placeholder="Paste JSON string here..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 resize-none"
              />
              {importStatus && (
                <p className="text-xs font-bold text-emerald-400">{importStatus}</p>
              )}
              <button
                onClick={handleImportJson}
                disabled={!importJsonText}
                className="w-full sm:w-auto h-12 px-6 rounded-2xl border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-colors"
              >
                Restore JSON Data
              </button>
            </div>

            <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-5 space-y-3">
              <h4 className="text-base font-bold text-red-400">Factory Reset</h4>
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
                className="h-11 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider"
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


