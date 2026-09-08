'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Product, PRODUCTS } from '@/lib/data/products';
import { BannerSlide, DEFAULT_BANNERS } from '@/lib/data/banners';

export interface InquiryLead {
  id: string;
  type: 'callback' | 'service_booking' | 'custom_quote' | 'whatsapp_order' | 'estimator_lead';
  name: string;
  phone: string;
  email?: string;
  serviceType?: string;
  spaceType?: string;
  tankSize?: string;
  location?: string;
  notes?: string;
  preferredDate?: string;
  items?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'archived';
}

interface CatalogContextType {
  products: Product[];
  banners: BannerSlide[];
  inquiries: InquiryLead[];
  isLoaded: boolean;
  isCloudSynced: boolean;
  
  // Product actions
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;

  // Banner actions
  addBanner: (banner: BannerSlide) => void;
  updateBanner: (id: string, updates: Partial<BannerSlide>) => void;
  deleteBanner: (id: string) => void;
  reorderBanners: (banners: BannerSlide[]) => void;

  // Inquiry actions
  addInquiry: (inquiry: Omit<InquiryLead, 'id' | 'createdAt' | 'status'>) => void;
  updateInquiryStatus: (id: string, status: InquiryLead['status']) => void;
  deleteInquiry: (id: string) => void;

  // Cloud Sync
  refreshFromCloud: () => Promise<void>;

  // System actions
  resetToDefaults: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PRODUCTS: 'mc_products_v1',
  BANNERS: 'mc_banners_v1',
  INQUIRIES: 'mc_inquiries_v1',
};

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [banners, setBanners] = useState<BannerSlide[]>(DEFAULT_BANNERS);
  const [inquiries, setInquiries] = useState<InquiryLead[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Load local cache first for instant render
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (storedProducts) {
        const parsed = JSON.parse(storedProducts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      }

      const storedBanners = localStorage.getItem(STORAGE_KEYS.BANNERS);
      if (storedBanners) {
        const parsedBanners = JSON.parse(storedBanners);
        if (Array.isArray(parsedBanners) && parsedBanners.length > 0) {
          setBanners(parsedBanners);
        }
      }

      const storedInquiries = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (storedInquiries) {
        const parsedInquiries = JSON.parse(storedInquiries);
        if (Array.isArray(parsedInquiries)) {
          setInquiries(parsedInquiries);
        }
      }
    } catch (err) {
      console.warn('Failed to load local storage state:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync with MongoDB Atlas in background
  const refreshFromCloud = useCallback(async () => {
    try {
      // 1. Fetch Products
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.success && Array.isArray(prodData.data) && prodData.data.length > 0) {
          setProducts(prodData.data);
          localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(prodData.data));
        }
      }

      // 2. Fetch Banners
      const bannerRes = await fetch('/api/banners');
      if (bannerRes.ok) {
        const bannerData = await bannerRes.json();
        if (bannerData.success && Array.isArray(bannerData.data) && bannerData.data.length > 0) {
          const mapped = bannerData.data.map((b: any) => ({
            ...b,
            isActive: b.active !== undefined ? b.active : true,
          }));
          setBanners(mapped);
          localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(mapped));
        }
      }

      // 3. Fetch Inquiries
      const inqRes = await fetch('/api/inquiries');
      if (inqRes.ok) {
        const inqData = await inqRes.json();
        if (inqData.success && Array.isArray(inqData.data)) {
          setInquiries(inqData.data);
          localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inqData.data));
        }
      }

      setIsCloudSynced(true);
    } catch (e) {
      console.warn('MongoDB cloud sync skipped or timed out; using local cache.', e);
      setIsCloudSynced(false);
    }
  }, []);

  useEffect(() => {
    refreshFromCloud();
  }, [refreshFromCloud]);

  // Product Operations
  const addProduct = useCallback((product: Product) => {
    const updated = [product, ...products.filter((p) => p.id !== product.id)];
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    // Cloud persist
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }).catch((err) => console.warn('Cloud sync error on addProduct:', err));
  }, [products]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    // Cloud persist
    fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch((err) => console.warn('Cloud sync error on updateProduct:', err));
  }, [products]);

  const deleteProduct = useCallback((id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));

    // Cloud persist
    fetch(`/api/products?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Cloud sync error on deleteProduct:', err));
  }, [products]);

  const getProduct = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  // Banner Operations
  const addBanner = useCallback((banner: BannerSlide) => {
    const updated = [banner, ...banners.filter((b) => b.id !== banner.id)];
    setBanners(updated);
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(updated));

    fetch('/api/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        badge: banner.badge,
        badgeColor: banner.badgeColor,
        ctaText: banner.ctaText,
        ctaLink: banner.ctaLink,
        image: banner.image,
        active: banner.isActive,
      }),
    }).catch((err) => console.warn('Cloud sync error on addBanner:', err));
  }, [banners]);

  const updateBanner = useCallback((id: string, updates: Partial<BannerSlide>) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, ...updates } : b));
    setBanners(updated);
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(updated));

    fetch('/api/banners', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    }).catch((err) => console.warn('Cloud sync error on updateBanner:', err));
  }, [banners]);

  const deleteBanner = useCallback((id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    setBanners(updated);
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(updated));

    fetch(`/api/banners?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Cloud sync error on deleteBanner:', err));
  }, [banners]);

  const reorderBanners = useCallback((reordered: BannerSlide[]) => {
    setBanners(reordered);
    localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(reordered));
  }, []);

  // Inquiry Operations
  const addInquiry = useCallback((inquiryData: Omit<InquiryLead, 'id' | 'createdAt' | 'status'>) => {
    const newInquiry: InquiryLead = {
      ...inquiryData,
      id: `INQ-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'new',
    };
    const updated = [newInquiry, ...inquiries];
    setInquiries(updated);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));

    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInquiry),
    }).catch((err) => console.warn('Cloud sync error on addInquiry:', err));
  }, [inquiries]);

  const updateInquiryStatus = useCallback((id: string, status: InquiryLead['status']) => {
    const updated = inquiries.map((inq) => (inq.id === id ? { ...inq, status } : inq));
    setInquiries(updated);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));

    fetch('/api/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    }).catch((err) => console.warn('Cloud sync error on updateInquiryStatus:', err));
  }, [inquiries]);

  const deleteInquiry = useCallback((id: string) => {
    const updated = inquiries.filter((inq) => inq.id !== id);
    setInquiries(updated);
    localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(updated));

    fetch(`/api/inquiries?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('Cloud sync error on deleteInquiry:', err));
  }, [inquiries]);

  // System Actions
  const resetToDefaults = useCallback(() => {
    setProducts(PRODUCTS);
    setBanners(DEFAULT_BANNERS);
    setInquiries([]);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.BANNERS);
    localStorage.removeItem(STORAGE_KEYS.INQUIRIES);

    fetch('/api/seed', { method: 'POST' }).catch((err) =>
      console.warn('Cloud re-seed error:', err)
    );
  }, []);

  const exportDataJson = useCallback(() => {
    const bundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products,
      banners,
      inquiries,
    };
    return JSON.stringify(bundle, null, 2);
  }, [products, banners, inquiries]);

  const importDataJson = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.products)) {
        setProducts(parsed.products);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products));
      }
      if (Array.isArray(parsed.banners)) {
        setBanners(parsed.banners);
        localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(parsed.banners));
      }
      if (Array.isArray(parsed.inquiries)) {
        setInquiries(parsed.inquiries);
        localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(parsed.inquiries));
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <CatalogContext.Provider
      value={{
        products,
        banners,
        inquiries,
        isLoaded,
        isCloudSynced,
        addProduct,
        updateProduct,
        deleteProduct,
        getProduct,
        addBanner,
        updateBanner,
        deleteBanner,
        reorderBanners,
        addInquiry,
        updateInquiryStatus,
        deleteInquiry,
        refreshFromCloud,
        resetToDefaults,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
}
