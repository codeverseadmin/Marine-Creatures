'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCatalog, InquiryLead } from '@/lib/context/CatalogContext';
import { useOrder, CustomerOrder, OrderProgressStep, TRACKING_STEPS_META } from '@/lib/context/OrderContext';
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

  const { orders, updateOrderStatus, updateOrderTracking, deleteOrder, approveOrder, ownerSignature, setOwnerSignature } = useOrder();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'banners' | 'inquiries' | 'overview' | 'system'>('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [adminViewMode, setAdminViewMode] = useState<'grid' | 'table'>('grid');

  // Order Management State
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({ awb: '', courier: '' });

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

  // MongoDB Atlas Connection & Health State
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    status: string;
    cluster?: string;
    database?: string;
    latencyMs?: number;
    counts?: { products: number; orders: number; inquiries: number; banners: number };
    error?: string;
    notice?: string;
  } | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [seedingDb, setSeedingDb] = useState(false);

  const checkDatabaseHealth = useCallback(async () => {
    setCheckingDb(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data);
    } catch (e: any) {
      setDbStatus({ connected: false, status: 'error', error: e.message });
    } finally {
      setCheckingDb(false);
    }
  }, []);

  const handleSeedDatabase = async () => {
    setSeedingDb(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('✓ MongoDB Atlas successfully seeded with products & banners!');
        checkDatabaseHealth();
      } else {
        alert('Seed notice: ' + (data.error || 'Check network connection'));
      }
    } catch (e: any) {
      alert('Seed request error: ' + e.message);
    } finally {
      setSeedingDb(false);
    }
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

  useEffect(() => {
    if (isAuthenticated) {
      checkDatabaseHealth();
    }
  }, [isAuthenticated, checkDatabaseHealth]);

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

  // Order helpers
  const ORDER_STEPS_SEQUENCE: OrderProgressStep[] = ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'];

  const getNextStep = (current: OrderProgressStep): OrderProgressStep | null => {
    const idx = ORDER_STEPS_SEQUENCE.indexOf(current);
    if (idx >= 0 && idx < ORDER_STEPS_SEQUENCE.length - 1) {
      return ORDER_STEPS_SEQUENCE[idx + 1];
    }
    return null;
  };

  const handleSendWhatsAppAlert = (order: CustomerOrder) => {
    const stepMeta = TRACKING_STEPS_META[order.currentStep];
    const itemsSummary = order.items.map((i) => `• ${i.product.name} (x${i.quantity})`).join('\n');
    const message = `🌊 *MARINE CREATURES DISPATCH UPDATE*\n\nHello *${order.customerName}*,\n\nYour order *#${order.id}* has been updated to:\n🔹 *${stepMeta.icon} ${stepMeta.label.toUpperCase()}*\n_${stepMeta.description}_\n\n📋 *Specimens & Gear:*\n${itemsSummary}\n\n💰 *Total:* ₹${order.totalAmount.toLocaleString('en-IN')}\n📍 *Destination:* ${order.city} (${order.pincode})\n${order.awbNumber ? `\n✈️ *Courier:* ${order.courierName || 'Priority Air Cargo'}\n🔖 *Air Waybill (AWB):* ${order.awbNumber}` : ''}\n⏳ *Est. Arrival:* ${order.estimatedDelivery}\n\nTrack live on our portal anytime.\nMarine Creatures Concierge`;

    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendInvoiceWhatsApp = (order: CustomerOrder) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marine-creatures-sand.vercel.app';
    const invoiceUrl = `${origin}/invoice/${order.id}`;
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const message = `🌊 *MARINE CREATURES — OFFICIAL TAX INVOICE & DISPATCH CONFIRMATION* 🌊\n\nDear *${order.customerName}*,\nYour order *#${order.id}* has been verified & approved by Marine Creatures Concierge.\n\n🧾 *Tax Invoice No:* ${order.invoiceNumber || `INV-${order.id}`}\n📅 *Date:* ${order.approvedAt || order.createdAt}\n📦 *Total Amount:* ₹${order.totalAmount.toLocaleString('en-IN')} (All-inclusive)\n📍 *Delivery Address:* ${order.address}, ${order.city} (${order.pincode})\n✈️ *Carrier:* ${order.courierName || 'Priority Air Cargo'} ${order.awbNumber ? `(AWB: ${order.awbNumber})` : ''}\n\n📄 *View / Download Your Official Tax Invoice:* \n${invoiceUrl}\n\nYour specimens are in specialized oxygenated thermal pods. Thank you for choosing Marine Creatures!`;

    const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSaveTracking = (orderId: string) => {
    updateOrderTracking(orderId, trackingForm.awb, trackingForm.courier);
    setEditingTrackingOrderId(null);
    showToast(`✓ Tracking details updated for #${orderId}`);
  };

  // Auth Screen (Clean & Mobile-Ready + Luxury Split for Laptop/Desktop)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#02070c] text-white flex flex-col justify-center px-4 py-8 relative">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="w-full max-w-sm lg:max-w-4xl mx-auto relative z-10">
          <div className="bg-[#07131d] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column (Desktop / Laptop Only) */}
            <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#061824] via-[#040e16] to-[#02070c] p-8 flex-col justify-between border-r border-slate-800/80">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,184,217,0.25)]">
                    🌊
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg tracking-wide">Marine Creatures</h2>
                    <span className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">
                      Control Center
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Executive Operations &amp; Management
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Manage captive-bred marine fish, coral frags, &amp; lighting tech</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Amazon-style 5-stage live dispatch pipeline with AWB editing</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>1-Tap WhatsApp dispatch notices &amp; client lead management</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Encrypted session authentication &amp; local JSON backups</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>OPERATIONS CONSOLE</span>
                <span>SECURE ENCRYPTED</span>
              </div>
            </div>

            {/* Right Column: Passcode Form (Mobile & Laptop) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-center lg:text-left mb-6">
                <div className="lg:hidden w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(0,184,217,0.15)]">
                  <span className="text-2xl">🔒</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Admin Sign In
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter master passcode to unlock control center
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
                    Master Admin Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      placeholder="Enter secret passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full h-13 sm:h-14 px-4 pr-12 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-base focus:outline-none focus:border-cyan-400 transition-colors"
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
                  className="w-full h-13 sm:h-14 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Unlock Control Center</span>
                  <span>→</span>
                </button>
              </form>

              <div className="pt-4 mt-6 border-t border-slate-800 text-center lg:text-left">
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
    { id: 'orders', label: 'Orders & Dispatches', count: orders.length, icon: '📦' },
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

      {/* Slide-over Hamburger Drawer (Mobile Only) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
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

      {/* Collapsible Desktop / Laptop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed top-0 bottom-0 left-0 w-72 xl:w-80 bg-[#05111a] border-r border-slate-800/80 z-40 p-5 xl:p-6 justify-between overflow-y-auto shadow-2xl transition-transform duration-300 ease-in-out ${
          desktopSidebarOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header with Close Button */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,184,217,0.2)]">
                🌊
              </div>
              <div>
                <h2 className="font-bold text-white text-base leading-tight tracking-wide">
                  Marine Creatures
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                    Control Center
                  </span>
                </div>
              </div>
            </div>

            {/* Close Sidebar Button */}
            <button
              onClick={() => setDesktopSidebarOpen(false)}
              className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors shrink-0 border border-slate-700"
              title="Close navigation sidebar"
              aria-label="Close navigation sidebar"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block px-3 mb-2">
              ADMIN NAVIGATION
            </span>
            {TAB_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 font-bold scale-[1.02]'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
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

        {/* Desktop Sidebar Bottom Controls */}
        <div className="pt-5 border-t border-slate-800 space-y-3">
          <Link
            href="/marketplace"
            target="_blank"
            className="w-full h-11 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-sm"
          >
            <span>🛍️</span>
            <span>Open Customer Storefront ↗</span>
          </Link>

          {/* Admin Profile Box */}
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 flex items-center justify-center font-bold text-xs">
                SS
              </div>
              <div className="leading-tight">
                <span className="text-xs font-bold text-white block">Suraj Shasmal</span>
                <span className="text-[10px] text-emerald-400 font-medium">● Online Admin</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors"
              title="Sign Out"
            >
              🔒
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area Wrapper (Offset when Desktop Sidebar is Open) */}
      <div
        className={`flex-1 w-full min-h-screen flex flex-col bg-[#02070c] transition-all duration-300 ease-in-out ${
          desktopSidebarOpen ? 'lg:pl-72 xl:pl-80' : 'lg:pl-0'
        }`}
      >
        {/* Top Mobile Header (Phone / Tablet Only) */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#05111a]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between gap-3">
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
              <h1 className="font-bold text-base text-white capitalize">
                {activeTab === 'products' && 'Product Inventory'}
                {activeTab === 'orders' && 'Orders & Dispatches'}
                {activeTab === 'banners' && 'Announcement Slides'}
                {activeTab === 'inquiries' && 'Client Inquiries'}
                {activeTab === 'overview' && 'Store Metrics'}
                {activeTab === 'system' && 'System & Backup'}
              </h1>
              <p className="text-[11px] text-slate-400">Marine Creatures Admin</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/marketplace"
              target="_blank"
              className="h-10 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 border border-slate-700"
            >
              <span>🛍️</span>
              <span>Store ↗</span>
            </Link>
            <button
              onClick={handleLogout}
              className="h-10 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Top Desktop Header (Laptop / Desktop Only) */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-[#05111a]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 xl:px-8 py-3.5 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle Button (Open / Close) */}
            <button
              onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
              className={`h-10 px-3.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold active:scale-95 shadow-sm ${
                desktopSidebarOpen
                  ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                  : 'bg-cyan-400 text-slate-950 font-bold border-cyan-300 shadow-cyan-400/20'
              }`}
              title={desktopSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
              aria-label="Toggle navigation sidebar"
            >
              <span className="text-sm">{desktopSidebarOpen ? '◀' : '☰'}</span>
              <span>{desktopSidebarOpen ? 'Hide Nav' : 'Show Nav'}</span>
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span>ADMIN</span>
                <span>/</span>
                <span className="text-cyan-400 font-bold uppercase">{activeTab}</span>
              </div>
              <h1 className="font-bold text-lg xl:text-xl text-white capitalize mt-0.5">
                {activeTab === 'products' && 'Product Catalog & Inventory Studio'}
                {activeTab === 'orders' && 'Live Orders & Air Cargo Dispatches'}
                {activeTab === 'banners' && 'Homepage Announcement Slides'}
                {activeTab === 'inquiries' && 'VIP Client Consultation Leads'}
                {activeTab === 'overview' && 'Store Operations & Analytics'}
                {activeTab === 'system' && 'Backup, Export & Database Tools'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* MongoDB Atlas Cloud Status Pill */}
            {dbStatus?.connected ? (
              <span
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5"
                title={`Connected to MongoDB ${dbStatus.cluster} (${dbStatus.database}) in ${dbStatus.latencyMs}ms`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MongoDB Live ({dbStatus.latencyMs}ms)</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('system');
                  checkDatabaseHealth();
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Click to view MongoDB Atlas connection settings"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>MongoDB: {checkingDb ? 'Checking...' : 'Atlas Setup'}</span>
              </button>
            )}

            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Catalog Active</span>
            </span>

            <Link
              href="/marketplace"
              target="_blank"
              className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-2 border border-slate-700 shadow-sm transition-all"
            >
              <span>🛍️</span>
              <span>Storefront Preview ↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 pb-28 space-y-6">
        {/* =========================================================================
            TAB 1: PRODUCTS
           ========================================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-5">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Showing <strong className="text-white">{filteredProducts.length}</strong> of {products.length} catalog items
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Desktop View Mode Switcher */}
                <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setAdminViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      adminViewMode === 'grid'
                        ? 'bg-cyan-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>▦</span>
                    <span>Grid View</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      adminViewMode === 'table'
                        ? 'bg-cyan-400 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>☰</span>
                    <span>Table View</span>
                  </button>
                </div>

                {!isEditingProduct && (
                  <button
                    onClick={handleNewProductClick}
                    className="w-full sm:w-auto h-11 sm:h-12 px-5 sm:px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wide uppercase flex items-center justify-center gap-2 active:scale-95 shadow-lg transition-all"
                  >
                    <span className="text-lg">+</span>
                    <span>Add Product</span>
                  </button>
                )}
              </div>
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

            {/* Big, Clean, Spacious Product Cards / Table */}
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
            ) : adminViewMode === 'table' ? (
              /* Table View for Desktop / Laptop */
              <div className="bg-[#071520] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="p-4">Specimen / Item</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock Units</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredProducts.map((p) => {
                        const isOut = !p.inStock || p.stockCount <= 0;
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80'}
                                  alt={p.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-black border border-slate-800 shrink-0"
                                />
                                <div className="min-w-0 max-w-xs">
                                  <h4 className="font-bold text-white truncate text-sm">{p.name}</h4>
                                  {p.scientificName && (
                                    <p className="text-[11px] text-slate-400 italic truncate">{p.scientificName}</p>
                                  )}
                                  {p.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20 inline-block mt-0.5">
                                      {p.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-[11px] uppercase font-bold px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 whitespace-nowrap">
                                {p.category.replace('-', ' ')}
                              </span>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <span className="font-extrabold text-cyan-400 font-mono text-sm">
                                ₹{p.price.toLocaleString('en-IN')}
                              </span>
                              {p.originalPrice && (
                                <span className="text-[10px] text-slate-500 line-through block">
                                  ₹{p.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleQuickStockChange(p, -1)}
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm active:scale-90"
                                >
                                  −
                                </button>
                                <span className={`w-8 text-center font-mono font-bold text-xs ${isOut ? 'text-red-400' : 'text-white'}`}>
                                  {p.stockCount}
                                </span>
                                <button
                                  onClick={() => handleQuickStockChange(p, 1)}
                                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-sm active:scale-90"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-4 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  const newInStock = !p.inStock;
                                  updateProduct(p.id, {
                                    inStock: newInStock,
                                    stockCount: newInStock && p.stockCount === 0 ? 5 : p.stockCount,
                                  });
                                  showToast(newInStock ? 'Marked In Stock' : 'Marked Out of Stock');
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1.5 ${
                                  p.inStock
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                }`}
                              >
                                <span>{p.inStock ? '●' : '○'}</span>
                                <span>{p.inStock ? 'Live' : 'Paused'}</span>
                              </button>
                            </td>
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  href={`/marketplace/${p.id}`}
                                  target="_blank"
                                  className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                                >
                                  <span>View ↗</span>
                                </Link>
                                <button
                                  onClick={() => handleEditProductClick(p)}
                                  className="h-8 px-3 rounded-lg bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 text-xs font-bold border border-cyan-400/30"
                                >
                                  Edit ✏️
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Delete "${p.name}"?`)) {
                                      deleteProduct(p.id);
                                      showToast('Product deleted');
                                    }
                                  }}
                                  className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center border border-red-500/20"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Grid View (Responsive: 1-col on mobile, 2-col on md, 3-col on xl, 4-col on 2xl) */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {filteredProducts.map((p) => {
                  const isOut = !p.inStock || p.stockCount <= 0;

                  return (
                    <div
                      key={p.id}
                      className="bg-[#071520] border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between gap-4"
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

                      {/* Stock Adjustment Bar */}
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

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickStockChange(p, -1)}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-base font-bold flex items-center justify-center active:scale-90 transition-transform shadow-sm"
                            title="Minus 1"
                          >
                            −
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-sm text-white">
                            {p.stockCount}
                          </span>
                          <button
                            onClick={() => handleQuickStockChange(p, 1)}
                            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-base font-bold flex items-center justify-center active:scale-90 transition-transform shadow-sm"
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
                          className={`h-9 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                            p.inStock
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-400 border-red-500/30'
                          }`}
                        >
                          <span>{p.inStock ? '●' : '○'}</span>
                          <span>{p.inStock ? 'Live' : 'Hidden'}</span>
                        </button>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          <Link
                            href={`/marketplace/${p.id}`}
                            target="_blank"
                            className="h-9 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <span>↗</span>
                          </Link>

                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="h-9 px-3 rounded-xl bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 text-xs font-bold border border-cyan-400/30"
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
                            className="h-9 w-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 flex items-center justify-center"
                            title="Delete product"
                          >
                            ✕
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
            TAB: ORDERS & LIVE DISPATCH TRACKER
           ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Header & Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>📦</span>
                  <span>Orders & Live Dispatches</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Manage live customer orders, advance Amazon-style 5-stage milestones, and send WhatsApp dispatch alerts.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="px-3 py-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
                  Total Orders: {orders.length}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
                  Active: {orders.filter((o) => o.currentStep !== 'delivered').length}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none pointer-events-none">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search order #, customer, phone, city..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'placed', label: 'Confirmed' },
                  { id: 'quarantine', label: 'Quarantine' },
                  { id: 'packed', label: 'Packed' },
                  { id: 'dispatched', label: 'Dispatched' },
                  { id: 'delivered', label: 'Delivered' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderStatusFilter(tab.id)}
                    className={`h-11 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      orderStatusFilter === tab.id
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {(() => {
              const filteredOrders = orders.filter((order) => {
                const matchesSearch =
                  order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                  order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
                  order.phone.includes(orderSearch) ||
                  order.city.toLowerCase().includes(orderSearch.toLowerCase());
                const matchesStatus =
                  orderStatusFilter === 'all' || order.currentStep === orderStatusFilter;
                return matchesSearch && matchesStatus;
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="bg-[#071520] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
                    <span className="text-4xl">📦</span>
                    <h3 className="text-base font-bold text-white">No Orders Found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {orderSearch || orderStatusFilter !== 'all'
                        ? 'No orders match your filter criteria.'
                        : 'Orders placed by customers through the checkout drawer will appear here.'}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const currentMeta = TRACKING_STEPS_META[order.currentStep];
                    const nextStep = getNextStep(order.currentStep);
                    const nextMeta = nextStep ? TRACKING_STEPS_META[nextStep] : null;
                    const isEditingTracking = editingTrackingOrderId === order.id;

                    return (
                      <div
                        key={order.id}
                        className="bg-[#071520] border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-5 shadow-xl hover:border-cyan-500/30 transition-all"
                      >
                        {/* Order Top Bar */}
                        <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/80">
                          {/* Row 1: Order ID, Created Date & Status + Delete */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-base sm:text-lg font-black text-cyan-400 tracking-tight">
                                #{order.id}
                              </span>
                              <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                                {order.createdAt}
                              </span>
                            </div>

                            {/* Current Status Badge + Delete Button */}
                            <div className="flex items-center gap-2">
                              <div
                                className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                                  order.currentStep === 'delivered'
                                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                    : order.currentStep === 'dispatched'
                                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                    : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                                }`}
                              >
                                <span className="text-sm">{currentMeta.icon}</span>
                                <span>{currentMeta.label}</span>
                              </div>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete order #${order.id}?`)) {
                                    deleteOrder(order.id);
                                    showToast(`Order #${order.id} deleted`);
                                  }
                                }}
                                className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-xs transition-colors shrink-0 border border-red-500/20"
                                title="Delete Order"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {/* Row 2: Customer Contact & Location Chips */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                              <span>👤</span>
                              <span>{order.customerName}</span>
                            </span>
                            <a
                              href={`https://wa.me/${order.phone.replace(/\D/g, '').length === 10 ? '91' + order.phone.replace(/\D/g, '') : order.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800/80 transition-colors"
                              title="Chat with customer on WhatsApp"
                            >
                              <span>📞</span>
                              <span>+91 {order.phone}</span>
                              <span className="text-[10px] text-emerald-400 font-bold ml-0.5">💬</span>
                            </a>
                            <span className="text-slate-300 flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                              <span>📍</span>
                              <span>{order.address ? `${order.address}, ` : ''}{order.city} ({order.pincode})</span>
                            </span>
                          </div>

                          {/* Row 3: Order Approval & Official Tax Invoice Actions */}
                          <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              {order.isApproved ? (
                                <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 text-xs shadow-sm">
                                  <span>✓</span>
                                  <span>Approved &amp; Invoiced ({order.invoiceNumber || `INV-${order.id}`})</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    approveOrder(order.id);
                                    showToast(`✓ Order #${order.id} Approved! Official Invoice generated.`);
                                  }}
                                  className="h-8 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 text-xs shadow-md active:scale-95 transition-all"
                                >
                                  <span>⚡</span>
                                  <span>Approve Order &amp; Issue Tax Invoice</span>
                                </button>
                              )}

                              {order.orderNotes && (
                                <span className="text-[11px] text-slate-400 italic bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/60">
                                  Note: {order.orderNotes}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                href={`/invoice/${order.id}`}
                                target="_blank"
                                className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                              >
                                <span>🧾</span>
                                <span>View Invoice ↗</span>
                              </Link>

                              <button
                                onClick={() => handleSendInvoiceWhatsApp(order)}
                                className="h-8 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                                title="Send Invoice PDF link to customer via WhatsApp"
                              >
                                <span>💬</span>
                                <span>WhatsApp Invoice</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Interactive Milestone Progress Control (Zero overlap!) */}
                        <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400 flex items-center gap-1.5">
                                <span>⚡</span>
                                <span>Milestone Progression Control</span>
                              </span>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Tap any milestone below or advance 1-tap to next stage
                              </p>
                            </div>

                            {nextStep && nextMeta && (
                              <button
                                onClick={() => {
                                  updateOrderStatus(order.id, nextStep);
                                  showToast(`✓ Advanced #${order.id} to "${nextMeta.label}"`);
                                }}
                                className="w-full sm:w-auto h-11 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shrink-0"
                              >
                                <span>1-Tap Advance:</span>
                                <span className="text-sm">{nextMeta.icon}</span>
                                <span className="underline decoration-slate-950/30 underline-offset-2">{nextMeta.label}</span>
                                <span className="text-sm">→</span>
                              </button>
                            )}
                          </div>

                          {/* 5 Milestone Step Pills */}
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                            {ORDER_STEPS_SEQUENCE.map((stepKey, idx) => {
                              const meta = TRACKING_STEPS_META[stepKey];
                              const isCurrent = order.currentStep === stepKey;
                              const isPassed =
                                ORDER_STEPS_SEQUENCE.indexOf(order.currentStep) >= idx;
                              const isLastStepOnMobile = idx === 4;

                              return (
                                <button
                                  key={stepKey}
                                  onClick={() => {
                                    updateOrderStatus(order.id, stepKey);
                                    showToast(`✓ Status updated to ${meta.label}`);
                                  }}
                                  className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all text-xs flex flex-col gap-1.5 relative overflow-hidden ${
                                    isLastStepOnMobile ? 'col-span-2 sm:col-span-1' : ''
                                  } ${
                                    isCurrent
                                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400/50'
                                      : isPassed
                                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-base">{meta.icon}</span>
                                    <span className="text-[10px] font-mono opacity-70 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/60">
                                      Step {idx + 1}
                                    </span>
                                  </div>
                                  <span className="font-bold leading-tight line-clamp-1 text-xs sm:text-[13px]">
                                    {meta.label}
                                  </span>
                                  <span className="text-[10px] font-semibold flex items-center gap-1">
                                    {isCurrent ? (
                                      <span className="text-cyan-300 flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                                        Active
                                      </span>
                                    ) : isPassed ? (
                                      <span className="text-emerald-400">✓ Completed</span>
                                    ) : (
                                      <span className="text-slate-500">Pending</span>
                                    )}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Order Items & Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Items List */}
                          <div className="space-y-2">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                              Order Items ({order.items.length})
                            </span>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60"
                                >
                                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                                    <img
                                      src={item.product.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80'}
                                      alt={item.product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                      {item.product.name}
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                      Qty: {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}
                                    </p>
                                  </div>
                                  <span className="text-xs sm:text-sm font-mono font-bold text-cyan-300 shrink-0">
                                    ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 flex items-center justify-between text-xs font-bold text-white px-1">
                              <span>Total Value:</span>
                              <span className="text-base text-cyan-400 font-mono">
                                ₹{order.totalAmount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {/* Tracking & Dispatch Controls */}
                          <div className="space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                                Shipping & AWB Details
                              </span>

                              {isEditingTracking ? (
                                <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-400/50 space-y-2.5">
                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase block mb-1">
                                      Air Waybill / AWB Number
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. BLR-EXP-99281"
                                      value={trackingForm.awb}
                                      onChange={(e) =>
                                        setTrackingForm({ ...trackingForm, awb: e.target.value })
                                      }
                                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[10px] text-slate-400 uppercase block mb-1">
                                      Courier / Airline Cargo Partner
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="e.g. IndiGo CarGo / Air India Cargo"
                                      value={trackingForm.courier}
                                      onChange={(e) =>
                                        setTrackingForm({ ...trackingForm, courier: e.target.value })
                                      }
                                      className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                                    />
                                  </div>

                                  <div className="flex gap-2 pt-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveTracking(order.id)}
                                      className="flex-1 h-8 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs"
                                    >
                                      Save AWB
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTrackingOrderId(null)}
                                      className="h-8 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-400 shrink-0">Carrier:</span>
                                    <span className="font-semibold text-white text-right truncate">
                                      {order.courierName || 'BlueDart Apex Express'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-400 shrink-0">Air Waybill (AWB):</span>
                                    <span className="font-mono font-bold text-cyan-300 text-right truncate">
                                      {order.awbNumber || 'Generating...'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-slate-400 shrink-0">Est. Arrival:</span>
                                    <span className="text-white text-right truncate">
                                      {order.estimatedDelivery}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setTrackingForm({
                                        awb: order.awbNumber || '',
                                        courier: order.courierName || '',
                                      });
                                      setEditingTrackingOrderId(order.id);
                                    }}
                                    className="w-full mt-2 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                                  >
                                    <span>✏️</span>
                                    <span>Edit AWB & Courier</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* WhatsApp Dispatch Alert Trigger */}
                            <button
                              onClick={() => handleSendWhatsAppAlert(order)}
                              className="w-full h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                            >
                              <span>💬</span>
                              <span>Send WhatsApp Dispatch Alert</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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

            {/* Banner Cards (Responsive 2-col on Laptop) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
                  onClick={() => setActiveTab('orders')}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-cyan-400/50 transition-colors flex items-center gap-3.5"
                >
                  <span className="text-2xl">📦</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Dispatches</h4>
                    <p className="text-xs text-slate-400">{orders.length} orders tracked</p>
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
            {/* Owner Signature & Invoice Branding */}
            <div className="bg-[#071520] border border-cyan-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <span>✍️</span>
                  <span>Owner Signature &amp; Invoice Branding</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  This signature and the official dispatch seal automatically appear on all approved customer tax invoices.
                </p>
              </div>

              {/* Current Signature Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Active Signatory Signature:
                  </span>
                  <div className="h-14 flex items-center bg-slate-900/60 px-4 rounded-xl border border-slate-800/80 min-w-[200px] justify-center">
                    {ownerSignature ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={ownerSignature}
                        alt="Owner Signature"
                        className="max-h-12 max-w-[180px] object-contain filter invert"
                      />
                    ) : (
                      <span className="font-serif italic text-2xl font-bold text-cyan-300">
                        Suraj Shasmal
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {ownerSignature ? 'Custom uploaded handwritten signature' : 'Default digital calligraphy signature'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <label className="h-10 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95">
                    <span>📁</span>
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === 'string') {
                              setOwnerSignature(reader.result);
                              showToast('✓ Owner signature updated for all invoices!');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {ownerSignature && (
                    <button
                      type="button"
                      onClick={() => {
                        setOwnerSignature(null);
                        showToast('Reset to default signature');
                      }}
                      className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* MongoDB Atlas Cloud Database Control Card */}
            <div className="bg-[#071520] border border-cyan-400/20 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
                    🍃
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <span>MongoDB Atlas Cloud Database</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                        CLUSTER0
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Cloud persistence for products, customer orders, tax invoices, and leads.
                    </p>
                  </div>
                </div>

                {dbStatus?.connected ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Connected ({dbStatus.latencyMs}ms)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>Awaiting Atlas IP Access</span>
                  </span>
                )}
              </div>

              {/* Database Telemetry Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Database</span>
                  <span className="text-xs font-mono font-bold text-white block mt-0.5">marine_creatures</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Products Cloud</span>
                  <span className="text-xs font-mono font-bold text-cyan-400 block mt-0.5">
                    {dbStatus?.counts?.products ?? products.length} Live
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Orders Cloud</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">
                    {dbStatus?.counts?.orders ?? orders.length} Active
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Inquiries Cloud</span>
                  <span className="text-xs font-mono font-bold text-purple-400 block mt-0.5">
                    {dbStatus?.counts?.inquiries ?? inquiries.length} Leads
                  </span>
                </div>
              </div>

              {/* Notice when IP needs whitelisting */}
              {!dbStatus?.connected && (
                <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <span>⚠️</span>
                    <span>MongoDB Atlas Network Access Configuration:</span>
                  </div>
                  <p className="leading-relaxed text-amber-200/90 text-[11px]">
                    MongoDB Atlas requires authorizing client IP addresses before granting connection. In your MongoDB Atlas Dashboard under <strong>Security &gt; Network Access</strong>:
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                    <span className="bg-black/50 px-2.5 py-1 rounded-lg border border-amber-500/30 text-white">
                      Recommended: 0.0.0.0/0 (Allow Everywhere)
                    </span>
                    <span className="text-slate-400">or Current IP:</span>
                    <span className="bg-black/50 px-2.5 py-1 rounded-lg border border-amber-500/30 text-cyan-300 font-bold">
                      14.194.112.94
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-400/80">
                    * The web app is currently operating with automatic local-first fallback, so all your operations, orders, and invoices continue working smoothly!
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={checkDatabaseHealth}
                  disabled={checkingDb}
                  className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all border border-slate-700"
                >
                  <span>🔄</span>
                  <span>{checkingDb ? 'Testing...' : 'Test Handshake & Ping'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSeedDatabase}
                  disabled={seedingDb}
                  className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-md"
                >
                  <span>🌱</span>
                  <span>{seedingDb ? 'Seeding...' : 'Seed / Sync All Data to Atlas'}</span>
                </button>
              </div>
            </div>

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
    </div>
  );
}


