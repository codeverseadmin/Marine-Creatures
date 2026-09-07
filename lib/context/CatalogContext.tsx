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

  // Load from localStorage on client mount
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
      console.warn('Failed to load catalog state from localStorage, using defaults.', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when state changes
  const persistProducts = useCallback((newProducts: Product[]) => {
    setProducts(newProducts);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
    } catch (e) {
      console.error('Error saving products to localStorage', e);
    }
  }, []);

  const persistBanners = useCallback((newBanners: BannerSlide[]) => {
    setBanners(newBanners);
    try {
      localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(newBanners));
    } catch (e) {
      console.error('Error saving banners to localStorage', e);
    }
  }, []);

  const persistInquiries = useCallback((newInquiries: InquiryLead[]) => {
    setInquiries(newInquiries);
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(newInquiries));
    } catch (e) {
      console.error('Error saving inquiries to localStorage', e);
    }
  }, []);

  // Product Operations
  const addProduct = useCallback((product: Product) => {
    const updated = [product, ...products.filter((p) => p.id !== product.id)];
    persistProducts(updated);
  }, [products, persistProducts]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    persistProducts(updated);
  }, [products, persistProducts]);

  const deleteProduct = useCallback((id: string) => {
    const updated = products.filter((p) => p.id !== id);
    persistProducts(updated);
  }, [products, persistProducts]);

  const getProduct = useCallback((id: string) => {
    return products.find((p) => p.id === id);
  }, [products]);

  // Banner Operations
  const addBanner = useCallback((banner: BannerSlide) => {
    const updated = [banner, ...banners.filter((b) => b.id !== banner.id)];
    persistBanners(updated);
  }, [banners, persistBanners]);

  const updateBanner = useCallback((id: string, updates: Partial<BannerSlide>) => {
    const updated = banners.map((b) => (b.id === id ? { ...b, ...updates } : b));
    persistBanners(updated);
  }, [banners, persistBanners]);

  const deleteBanner = useCallback((id: string) => {
    const updated = banners.filter((b) => b.id !== id);
    persistBanners(updated);
  }, [banners, persistBanners]);

  const reorderBanners = useCallback((newBanners: BannerSlide[]) => {
    persistBanners(newBanners);
  }, [persistBanners]);

  // Inquiry Operations
  const addInquiry = useCallback((inquiryData: Omit<InquiryLead, 'id' | 'createdAt' | 'status'>) => {
    const newInquiry: InquiryLead = {
      ...inquiryData,
      id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      status: 'new',
    };
    persistInquiries([newInquiry, ...inquiries]);
  }, [inquiries, persistInquiries]);

  const updateInquiryStatus = useCallback((id: string, status: InquiryLead['status']) => {
    const updated = inquiries.map((inq) => (inq.id === id ? { ...inq, status } : inq));
    persistInquiries(updated);
  }, [inquiries, persistInquiries]);

  const deleteInquiry = useCallback((id: string) => {
    const updated = inquiries.filter((inq) => inq.id !== id);
    persistInquiries(updated);
  }, [inquiries, persistInquiries]);

  // System Operations
  const resetToDefaults = useCallback(() => {
    persistProducts(PRODUCTS);
    persistBanners(DEFAULT_BANNERS);
    persistInquiries([]);
  }, [persistProducts, persistBanners, persistInquiries]);

  const exportDataJson = useCallback(() => {
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products,
      banners,
      inquiries,
    }, null, 2);
  }, [products, banners, inquiries]);

  const importDataJson = useCallback((jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.products && Array.isArray(parsed.products)) {
        persistProducts(parsed.products);
      }
      if (parsed.banners && Array.isArray(parsed.banners)) {
        persistBanners(parsed.banners);
      }
      if (parsed.inquiries && Array.isArray(parsed.inquiries)) {
        persistInquiries(parsed.inquiries);
      }
      return true;
    } catch (e) {
      console.error('Failed to import catalog data JSON', e);
      return false;
    }
  }, [persistProducts, persistBanners, persistInquiries]);

  return (
    <CatalogContext.Provider
      value={{
        products,
        banners,
        inquiries,
        isLoaded,
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
