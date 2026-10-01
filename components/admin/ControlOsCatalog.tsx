'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Product } from '@/lib/data/products';
import { optimizeImageForUpload } from '@/lib/image-optimizer';

// Category taxonomy constants
export const CATALOG_CATEGORIES = [
  { id: 'marine-life', label: 'Marine Life & Corals', itemType: 'live' },
  { id: 'lighting-tech', label: 'Lighting & Tech', itemType: 'dry' },
  { id: 'rock-sand', label: 'Live Rock & Sand', itemType: 'dry' },
  { id: 'salt-chemistry', label: 'Salts & Chemistry', itemType: 'dry' },
  { id: 'hardware', label: 'Equipment & Pumps', itemType: 'dry' },
] as const;

export interface CatalogMetrics {
  totalProducts: number;
  activeProducts: number;
  archived: number;
  lowStock: number;
  outOfStock: number;
  needsReview: number;
  missingImage: number;
  categories: Record<string, number>;
}

interface ControlOsCatalogProps {
  onReturnToOverview?: () => void;
  showToast?: (msg: string) => void;
}

export function ControlOsCatalog({ onReturnToOverview, showToast = () => {} }: ControlOsCatalogProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<CatalogMetrics>({
    totalProducts: 0,
    activeProducts: 0,
    archived: 0,
    lowStock: 0,
    outOfStock: 0,
    needsReview: 0,
    missingImage: 0,
    categories: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedStockState, setSelectedStockState] = useState<string>('all');
  const [selectedImageStatus, setSelectedImageStatus] = useState<string>('all');
  const [selectedPriceMode, setSelectedPriceMode] = useState<string>('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Modal Workflow State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<Partial<Product>>({
    name: '',
    id: '',
    sku: '',
    brand: 'Marine Creatures',
    category: 'marine-life',
    categoryLabel: 'Marine Life & Corals',
    itemType: 'live',
    price: 0,
    priceOnRequest: false,
    originalPrice: undefined,
    inStock: true,
    stockCount: 10,
    availabilityStatus: 'AVAILABLE',
    availabilityNote: '',
    shortDesc: '',
    description: '',
    scientificName: '',
    origin: '',
    rarity: '',
    feedingCondition: '',
    images: [],
    imageStatus: 'VERIFIED',
    researchStatus: 'READY',
    careGuide: {
      temperature: '24°C – 26°C',
      salinity: '1.024 – 1.026 SG',
      ph: '8.1 – 8.4',
      diet: 'Omnivore',
      temperament: 'Peaceful',
      minimumTankSize: '300 L',
      reefSafe: true,
      careLevel: 'Moderate',
    },
    specifications: {},
    seoTitle: '',
    seoDescription: '',
    canonicalOverride: '',
    noIndex: false,
  });

  // Action Confirmation Modals
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Product | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Image Uploading State in Modal
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');

  // ── Debounce Search ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ── Fetch Authoritative Catalog from MongoDB ───────────────────────────────
  const fetchCatalogData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedStockState !== 'all') params.set('stockState', selectedStockState);
      if (selectedImageStatus !== 'all') params.set('imageStatus', selectedImageStatus);
      if (selectedPriceMode !== 'all') params.set('priceMode', selectedPriceMode);

      const res = await fetch(`/api/admin/catalog?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Administrative session expired. Please re-authenticate.');
        }
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        if (json.metrics) {
          setMetrics(json.metrics);
        }
      } else {
        throw new Error(json.error || 'Failed to parse catalog response');
      }
    } catch (err: any) {
      setError(err.message || 'Operational catalog synchronization error');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedCategory, selectedStatus, selectedStockState, selectedImageStatus, selectedPriceMode]);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  // ── Metric Card Click Handlers ─────────────────────────────────────────────
  const handleMetricClick = (type: 'active' | 'lowStock' | 'outOfStock' | 'archived' | 'needsReview' | 'missingImage') => {
    if (type === 'active') {
      setSelectedStatus('active');
      setSelectedStockState('all');
      setSelectedImageStatus('all');
    } else if (type === 'lowStock') {
      setSelectedStatus('active');
      setSelectedStockState('low_stock');
      setSelectedImageStatus('all');
    } else if (type === 'outOfStock') {
      setSelectedStatus('active');
      setSelectedStockState('out_of_stock');
      setSelectedImageStatus('all');
    } else if (type === 'archived') {
      setSelectedStatus('archived');
      setSelectedStockState('all');
      setSelectedImageStatus('all');
    } else if (type === 'needsReview') {
      setSelectedStatus('needs_review');
      setSelectedStockState('all');
      setSelectedImageStatus('all');
    } else if (type === 'missingImage') {
      setSelectedImageStatus('missing');
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedStockState('all');
    setSelectedImageStatus('all');
    setSelectedPriceMode('all');
  };

  const hasActiveFilters =
    debouncedSearch !== '' ||
    selectedCategory !== 'all' ||
    selectedStatus !== 'all' ||
    selectedStockState !== 'all' ||
    selectedImageStatus !== 'all' ||
    selectedPriceMode !== 'all';

  // ── Open Add Product Wizard ────────────────────────────────────────────────
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setActiveStep(1);
    setEditorError(null);
    setFormState({
      name: '',
      id: '',
      sku: '',
      brand: 'Marine Creatures',
      category: 'marine-life',
      categoryLabel: 'Marine Life & Corals',
      itemType: 'live',
      price: 0,
      priceOnRequest: false,
      originalPrice: undefined,
      inStock: true,
      stockCount: 10,
      availabilityStatus: 'AVAILABLE',
      availabilityNote: '',
      shortDesc: '',
      description: '',
      scientificName: '',
      origin: '',
      rarity: '',
      feedingCondition: '',
      images: [],
      imageStatus: 'VERIFIED',
      researchStatus: 'READY',
      careGuide: {
        temperature: '24°C – 26°C',
        salinity: '1.024 – 1.026 SG',
        ph: '8.1 – 8.4',
        diet: 'Omnivore',
        temperament: 'Peaceful',
        minimumTankSize: '300 L',
        reefSafe: true,
        careLevel: 'Moderate',
      },
      specifications: {},
      seoTitle: '',
      seoDescription: '',
      canonicalOverride: '',
      noIndex: false,
    });
    setIsEditorOpen(true);
  };

  // ── Open Edit Product Wizard ───────────────────────────────────────────────
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setActiveStep(1);
    setEditorError(null);
    setFormState({
      ...prod,
      careGuide: prod.careGuide || {
        temperature: '24°C – 26°C',
        salinity: '1.024 – 1.026 SG',
        ph: '8.1 – 8.4',
        diet: 'Omnivore',
        temperament: 'Peaceful',
        minimumTankSize: '300 L',
        reefSafe: true,
        careLevel: 'Moderate',
      },
      specifications: prod.specifications || {},
      seoTitle: prod.seoTitle || '',
      seoDescription: prod.seoDescription || '',
      canonicalOverride: prod.canonicalOverride || '',
      noIndex: Boolean(prod.noIndex),
    });
    setIsEditorOpen(true);
  };

  // ── Auto-Generate Slug From Name ───────────────────────────────────────────
  const handleNameChange = (name: string) => {
    setFormState((prev) => {
      const updates: Partial<Product> = { name };
      // Only auto-generate slug if creating a new product or slug was previously empty
      if (!editingProduct) {
        updates.id = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      return { ...prev, ...updates };
    });
  };

  // ── Category Change (with automatic itemType mapping) ───────────────────────
  const handleCategoryChange = (catId: string) => {
    const found = CATALOG_CATEGORIES.find((c) => c.id === catId);
    setFormState((prev) => ({
      ...prev,
      category: catId as any,
      categoryLabel: found?.label || catId,
      itemType: (found?.itemType as any) || (catId === 'marine-life' ? 'live' : 'dry'),
    }));
  };

  // ── Media Handlers (Binary Cloud & Upload Pipeline) ────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    showToast(`Optimizing & uploading ${files.length} asset(s)...`);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const optimized = await optimizeImageForUpload(file, 1600, 0.85);

        const formData = new FormData();
        formData.append('file', optimized);
        formData.append('type', 'image');

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed for ${file.name}`);
        }

        const json = await res.json();
        if (json.url) {
          newUrls.push(json.url);
        }
      }

      setFormState((prev) => {
        const currentImages = prev.images || [];
        const updatedImages = [...currentImages, ...newUrls];
        return {
          ...prev,
          images: updatedImages,
          imageStatus: 'VERIFIED',
        };
      });

      showToast(`✓ Uploaded ${newUrls.length} image(s) successfully`);
    } catch (err: any) {
      setEditorError(err.message || 'Media upload failed');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleAddExternalImageUrl = () => {
    if (!newImageUrl.trim()) return;
    const url = newImageUrl.trim();
    setFormState((prev) => {
      const currentImages = prev.images || [];
      return {
        ...prev,
        images: [...currentImages, url],
      };
    });
    setNewImageUrl('');
    showToast('✓ Added external image reference');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormState((prev) => {
      const updated = (prev.images || []).filter((_, i) => i !== indexToRemove);
      return {
        ...prev,
        images: updated,
        imageStatus: updated.length === 0 ? 'NEEDS_MEDIA_ASSET' : prev.imageStatus,
      };
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    setFormState((prev) => {
      const images = [...(prev.images || [])];
      if (index < 0 || index >= images.length) return prev;
      const [selected] = images.splice(index, 1);
      return {
        ...prev,
        images: [selected, ...images],
      };
    });
    showToast('✓ Set as primary thumbnail');
  };

  // ── SEO Health Calculation ─────────────────────────────────────────────────
  const seoHealth = useMemo(() => {
    const title = (formState.seoTitle || formState.name || '').trim();
    const desc = (formState.seoDescription || formState.shortDesc || '').trim();
    const hasSlug = Boolean((formState.id || '').trim());
    const hasImages = Array.isArray(formState.images) && formState.images.length > 0;
    const hasFullDesc = Boolean((formState.description || '').trim());
    const isPOR = Boolean(formState.priceOnRequest);
    const validPrice = isPOR || (typeof formState.price === 'number' && formState.price > 0);

    const checks = [
      { label: 'SEO Title (30–65 chars)', passed: title.length >= 30 && title.length <= 70 },
      { label: 'Meta Description (120–165 chars)', passed: desc.length >= 100 && desc.length <= 175 },
      { label: 'Clean Canonical Slug', passed: hasSlug && /^[a-z0-9-]+$/.test(formState.id || '') },
      { label: 'Primary Commercial Image', passed: hasImages },
      { label: 'Comprehensive Description', passed: hasFullDesc },
      { label: 'Commercial Pricing Validity', passed: validPrice },
      { label: 'JSON-LD Structured Data Schema Ready', passed: hasSlug && title.length > 0 && validPrice },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const score = Math.round((passedCount / checks.length) * 100);

    return {
      checks,
      passedCount,
      totalCount: checks.length,
      score,
      status: score >= 80 ? 'OPTIMAL' : score >= 50 ? 'NEEDS_ATTENTION' : 'INCOMPLETE',
    };
  }, [formState]);

  // ── Form Validation Rules ──────────────────────────────────────────────────
  const validationResults = useMemo(() => {
    const blockingErrors: string[] = [];
    const warnings: string[] = [];

    // Blocking 1: Product Name
    if (!formState.name || !formState.name.trim()) {
      blockingErrors.push('Product Name is required.');
    }

    // Blocking 2: Unique Slug
    const slug = (formState.id || '').trim();
    if (!slug) {
      blockingErrors.push('Product Slug / ID is required.');
    } else if (!/^[a-z0-9-]+$/.test(slug)) {
      blockingErrors.push('Slug may only contain lowercase letters, numbers, and hyphens.');
    }

    // Blocking 3: Price Validity
    if (!formState.priceOnRequest) {
      if (typeof formState.price !== 'number' || formState.price < 0 || isNaN(formState.price)) {
        blockingErrors.push('Fixed-price items must have a valid non-negative numerical price.');
      }
    }

    // Blocking 4: Category
    if (!formState.category) {
      blockingErrors.push('Category selection is required.');
    }

    // Warning 1: Missing Images
    if (!formState.images || formState.images.length === 0) {
      warnings.push('No images attached. Item will display with fallback visual blueprint.');
    }

    // Warning 2: Fallback Asset License
    if (formState.imageStatus === 'NEEDS_LICENSE_REVIEW') {
      warnings.push('Asset marked as Luxury Blueprint / License Review. Verified photography recommended.');
    }

    // Warning 3: SEO Description
    if (!formState.seoDescription && !formState.shortDesc) {
      warnings.push('Missing meta description. Search engines will generate automated snippet.');
    }

    // Warning 4: Live Species Scientific Name
    if (formState.itemType === 'live' && !formState.scientificName) {
      warnings.push('Scientific Name is omitted for this live marine specimen.');
    }

    return {
      blockingErrors,
      warnings,
      isValid: blockingErrors.length === 0,
    };
  }, [formState]);

  // ── Save / Persist Product to MongoDB ──────────────────────────────────────
  const handleSaveProduct = async () => {
    if (!validationResults.isValid) {
      setEditorError(`Please resolve ${validationResults.blockingErrors.length} blocking error(s) before saving.`);
      return;
    }

    setIsSaving(true);
    setEditorError(null);

    try {
      const isEditing = Boolean(editingProduct);
      const url = '/api/admin/catalog';
      const method = isEditing ? 'PATCH' : 'POST';

      const payload = {
        ...formState,
        id: (formState.id || '').trim().toLowerCase(),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Server returned HTTP ${res.status}`);
      }

      showToast(isEditing ? `✓ Updated "${payload.name}" successfully` : `✓ Published "${payload.name}" to catalog`);
      setIsEditorOpen(false);
      await fetchCatalogData();
    } catch (err: any) {
      setEditorError(err.message || 'Error persisting catalog changes to database');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Archive / Unarchive Handler ────────────────────────────────────────────
  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setIsProcessingAction(true);
    try {
      const action = archiveTarget.isArchived ? 'unarchive' : 'archive';
      const res = await fetch('/api/admin/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: archiveTarget.id, action }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || `Failed to ${action} product`);
      }

      showToast(`✓ ${action === 'archive' ? 'Archived' : 'Restored'} "${archiveTarget.name}"`);
      setArchiveTarget(null);
      await fetchCatalogData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ── Duplicate Product Handler ──────────────────────────────────────────────
  const handleDuplicateConfirm = async () => {
    if (!duplicateTarget) return;
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: duplicateTarget.id, action: 'duplicate' }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to duplicate product');
      }

      showToast(`✓ Created draft copy: "${json.data?.name}"`);
      setDuplicateTarget(null);
      await fetchCatalogData();
    } catch (err: any) {
      alert(`Duplication failed: ${err.message}`);
    } finally {
      setIsProcessingAction(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Top Operational Navigation & Control Bar ──────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            {onReturnToOverview && (
              <button
                onClick={onReturnToOverview}
                className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors"
                title="Return to Operational Overview"
              >
                ← Overview
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>Catalog & SKU Governance</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase tracking-widest">
                Phase 3B
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative operational interface backed directly by MongoDB Atlas Cluster0.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCatalogData}
            disabled={isLoading}
            className="min-h-[40px] px-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
            title="Refresh from MongoDB"
          >
            <span className={`inline-block ${isLoading ? 'animate-spin' : ''}`}>↻</span>
            <span className="hidden sm:inline">Sync DB</span>
          </button>

          <button
            onClick={handleOpenAddProduct}
            className="min-h-[40px] px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all"
          >
            <span>＋</span>
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Summary Operational Metric Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Active */}
        <button
          onClick={() => handleMetricClick('active')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'active' && selectedStockState === 'all'
              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm'
              : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Items</div>
          <div className="text-xl font-bold font-mono text-white mt-1">{metrics.activeProducts}</div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Live in store
          </div>
        </button>

        {/* Metric 2: Low Stock */}
        <button
          onClick={() => handleMetricClick('lowStock')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStockState === 'low_stock'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
              : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Low Stock (≤5)</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{metrics.lowStock}</div>
          <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Reorder advisory
          </div>
        </button>

        {/* Metric 3: Out of Stock */}
        <button
          onClick={() => handleMetricClick('outOfStock')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStockState === 'out_of_stock'
              ? 'bg-red-500/10 border-red-500/40 text-red-300 shadow-sm'
              : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Out of Stock</div>
          <div className="text-xl font-bold font-mono text-red-400 mt-1">{metrics.outOfStock}</div>
          <div className="text-[10px] text-red-400/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Unavailable
          </div>
        </button>

        {/* Metric 4: Archived */}
        <button
          onClick={() => handleMetricClick('archived')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'archived'
              ? 'bg-slate-700/20 border-slate-600 text-slate-200 shadow-sm'
              : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Archived</div>
          <div className="text-xl font-bold font-mono text-slate-300 mt-1">{metrics.archived}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
            Hidden from public
          </div>
        </button>

        {/* Metric 5: Needs Review */}
        <button
          onClick={() => handleMetricClick('needsReview')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedStatus === 'needs_review'
              ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-sm'
              : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Needs Review</div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1">{metrics.needsReview}</div>
          <div className="text-[10px] text-purple-400/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Audit checklist
          </div>
        </button>

        {/* Metric 6: Missing Image */}
        <button
          onClick={() => handleMetricClick('missingImage')}
          className={`p-3.5 rounded-xl border text-left transition-all ${
            selectedImageStatus === 'missing'
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm'
              : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
          }`}
        >
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Missing Media</div>
          <div className="text-xl font-bold font-mono text-blue-400 mt-1">{metrics.missingImage}</div>
          <div className="text-[10px] text-blue-400/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Requires photo
          </div>
        </button>
      </div>

      {/* ── Search, Filters & Composable Filter Bar ────────────────────────── */}
      <div className="bg-[#070d14] border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Debounced Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products by Name, SKU, Slug, Scientific Name, Brand, or Category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
              className="min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {CATALOG_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label} ({metrics.categories[cat.id] || 0})
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
              <option value="needs_review">Needs Review</option>
            </select>

            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={`min-h-[42px] px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                filterDrawerOpen || selectedStockState !== 'all' || selectedImageStatus !== 'all' || selectedPriceMode !== 'all'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>⚙ Filters</span>
              {(selectedStockState !== 'all' || selectedImageStatus !== 'all' || selectedPriceMode !== 'all') && (
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              )}
            </button>
          </div>
        </div>

        {/* Secondary Extended Filters Drawer */}
        {filterDrawerOpen && (
          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Stock State */}
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Stock Availability</label>
              <select
                value={selectedStockState}
                onChange={(e) => setSelectedStockState(e.target.value)}
                className="w-full min-h-[38px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock (&gt;5)</option>
                <option value="low_stock">Low Stock (1–5)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Image Status */}
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Image Classification</label>
              <select
                value={selectedImageStatus}
                onChange={(e) => setSelectedImageStatus(e.target.value)}
                className="w-full min-h-[38px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Image Statuses</option>
                <option value="verified">Verified Photography Only</option>
                <option value="fallback">Luxury Blueprint / Fallback</option>
                <option value="missing">Missing Media</option>
                <option value="needs_review">Needs Review</option>
              </select>
            </div>

            {/* Price Mode */}
            <div>
              <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Pricing Mode</label>
              <select
                value={selectedPriceMode}
                onChange={(e) => setSelectedPriceMode(e.target.value)}
                className="w-full min-h-[38px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">All Pricing Modes</option>
                <option value="fixed">Fixed Price Only</option>
                <option value="on_request">Price on Request Only</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Chips & Reset Bar */}
        {hasActiveFilters && (
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase">Active Filters:</span>
            {debouncedSearch && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-mono flex items-center gap-1">
                &quot;{debouncedSearch}&quot;
                <button onClick={() => setSearchQuery('')} className="hover:text-white">✕</button>
              </span>
            )}
            {selectedCategory !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-mono flex items-center gap-1">
                Cat: {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-white">✕</button>
              </span>
            )}
            {selectedStatus !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-mono flex items-center gap-1">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('all')} className="hover:text-white">✕</button>
              </span>
            )}
            {selectedStockState !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-mono flex items-center gap-1">
                Stock: {selectedStockState}
                <button onClick={() => setSelectedStockState('all')} className="hover:text-white">✕</button>
              </span>
            )}
            {selectedImageStatus !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-mono flex items-center gap-1">
                Image: {selectedImageStatus}
                <button onClick={() => setSelectedImageStatus('all')} className="hover:text-white">✕</button>
              </span>
            )}
            {selectedPriceMode !== 'all' && (
              <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-cyan-300 text-[11px] font-mono flex items-center gap-1">
                Price: {selectedPriceMode}
                <button onClick={() => setSelectedPriceMode('all')} className="hover:text-white">✕</button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 ml-auto transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* ── Main Error Display ────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCatalogData}
            className="px-3 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium text-xs transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Product List / Table Surface ──────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 font-mono">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
          Querying MongoDB Atlas product collection...
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-[#070d14] border border-slate-800/80 rounded-2xl space-y-3">
          <div className="text-2xl">🐠</div>
          <h3 className="text-sm font-bold text-white">No products found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No products match the selected filters or search query.'
              : 'The production catalog is currently empty.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 rounded-xl bg-slate-800 text-cyan-300 hover:text-white text-xs font-semibold"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#070d14]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800/80">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">SKU / Slug</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Pricing</th>
                  <th className="py-3 px-4">Inventory</th>
                  <th className="py-3 px-4">Image Status</th>
                  <th className="py-3 px-4">SEO Health</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {products.map((p) => {
                  const hasImage = p.images && p.images.length > 0;
                  const isVerifiedImage = p.imageStatus === 'VERIFIED';
                  const isPOR = Boolean(p.priceOnRequest);
                  const isArchived = Boolean(p.isArchived);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-900/40 transition-colors ${
                        isArchived ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      {/* Column 1: Thumbnail + Product Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
                            {hasImage ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-slate-600">
                                NO ASSET
                              </div>
                            )}
                            {/* Live Badge Indicator */}
                            {p.itemType === 'live' && (
                              <span
                                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-tl bg-emerald-400"
                                title="Live Marine Specimen"
                              />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-[200px]" title={p.name}>
                              {p.name}
                            </div>
                            {p.scientificName && (
                              <div className="text-[10px] text-slate-400 italic truncate max-w-[200px]">
                                {p.scientificName}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-500 font-mono truncate">
                              {p.brand || 'Marine Creatures'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: SKU / Slug */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-slate-300">{p.sku || '—'}</div>
                        <div className="text-slate-500 text-[10px] truncate max-w-[140px]" title={p.id}>
                          {p.id}
                        </div>
                      </td>

                      {/* Column 3: Category */}
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[10px]">
                          {p.categoryLabel || p.category}
                        </span>
                      </td>

                      {/* Column 4: Pricing */}
                      <td className="py-3 px-4 font-mono">
                        {isPOR ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                            On Request
                          </span>
                        ) : (
                          <div>
                            <span className="text-white font-bold">₹{p.price?.toLocaleString('en-IN')}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[10px] text-slate-500 line-through ml-1.5">
                                ₹{p.originalPrice.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Inventory */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {!p.inStock || p.stockCount <= 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            Out of stock
                          </span>
                        ) : p.stockCount <= 5 ? (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            Low ({p.stockCount})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {p.stockCount} units
                          </span>
                        )}
                      </td>

                      {/* Column 6: Image Status */}
                      <td className="py-3 px-4">
                        {isVerifiedImage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px]">
                            ✓ Verified
                          </span>
                        ) : p.imageStatus === 'NEEDS_LICENSE_REVIEW' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[10px]" title="Luxury Blueprint Asset">
                            Blueprint
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-[10px]">
                            ⚠ Needs Photo
                          </span>
                        )}
                      </td>

                      {/* Column 7: SEO Health */}
                      <td className="py-3 px-4 font-mono text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-md ${
                            p.seoTitle && p.seoDescription
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {p.seoTitle && p.seoDescription ? '✓ Optimized' : 'Standard'}
                        </span>
                      </td>

                      {/* Column 8: Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/marketplace/${p.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="View Public Page (Opens in new tab)"
                          >
                            👁
                          </Link>

                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors"
                            title="Edit Product Details"
                          >
                            ✎
                          </button>

                          <button
                            onClick={() => setDuplicateTarget(p)}
                            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="Duplicate Product (Safe Copy)"
                          >
                            ⧉
                          </button>

                          <button
                            onClick={() => setArchiveTarget(p)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isArchived
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-900 border-slate-800 hover:border-amber-500/50 text-slate-400 hover:text-amber-400'
                            }`}
                            title={isArchived ? 'Restore to Active Catalog' : 'Archive Product'}
                          >
                            {isArchived ? '↑' : '⊘'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View (< 768px) */}
          <div className="md:hidden space-y-3">
            {products.map((p) => {
              const hasImage = p.images && p.images.length > 0;
              const isVerified = p.imageStatus === 'VERIFIED';
              const isPOR = Boolean(p.priceOnRequest);
              const isArchived = Boolean(p.isArchived);

              return (
                <div
                  key={p.id}
                  className={`bg-[#070d14] border border-slate-800/80 rounded-2xl p-4 space-y-3 ${
                    isArchived ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0 relative">
                      {hasImage ? (
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-mono text-slate-600">
                          NO ASSET
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                          {p.categoryLabel || p.category}
                        </span>
                        {isArchived && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            ARCHIVED
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-sm truncate mt-1">{p.name}</h4>
                      {p.scientificName && (
                        <p className="text-[11px] text-slate-400 italic truncate">{p.scientificName}</p>
                      )}
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">SKU: {p.sku || p.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <div>
                      {isPOR ? (
                        <span className="text-amber-400 font-bold font-mono">Price On Request</span>
                      ) : (
                        <span className="text-white font-bold font-mono">₹{p.price?.toLocaleString('en-IN')}</span>
                      )}
                    </div>

                    <div className="font-mono text-[11px]">
                      {!p.inStock || p.stockCount <= 0 ? (
                        <span className="text-red-400">Out of Stock</span>
                      ) : p.stockCount <= 5 ? (
                        <span className="text-amber-400">Low Stock ({p.stockCount})</span>
                      ) : (
                        <span className="text-emerald-400">{p.stockCount} in stock</span>
                      )}
                    </div>
                  </div>

                  {/* Mobile Action Buttons */}
                  <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
                    <Link
                      href={`/marketplace/${p.id}`}
                      target="_blank"
                      className="min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center text-xs"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="min-h-[44px] rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-semibold text-xs flex items-center justify-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDuplicateTarget(p)}
                      className="min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center text-xs"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setArchiveTarget(p)}
                      className="min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center text-xs"
                    >
                      {isArchived ? 'Restore' : 'Archive'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Add / Edit Product Multi-Section Governance Drawer / Modal ─────── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#090f17] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Step {activeStep} of 7
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingProduct ? `Governance ID: ${editingProduct.id}` : 'Create an authoritative catalog record'}
                </p>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Stepper Navigation Pills */}
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 shrink-0">
              {[
                { step: 1, label: '01 Basic' },
                { step: 2, label: '02 Catalog' },
                { step: 3, label: '03 Pricing & Stock' },
                { step: 4, label: '04 Specifications' },
                { step: 5, label: '05 Media' },
                { step: 6, label: '06 SEO Health' },
                { step: 7, label: '07 Review & Save' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors ${
                    activeStep === s.step
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Modal Body: Active Step View */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 font-sans text-xs">
              {editorError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  ⚠️ {editorError}
                </div>
              )}

              {/* ── STEP 1: BASIC INFORMATION ── */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-slate-200 block mb-1">
                      Product Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formState.name || ''}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Purple Tang, AI Hydra 32HD LED, Red Sea Coral Pro Salt"
                      className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">
                        Canonical Slug / ID <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formState.id || ''}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            id: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                          }))
                        }
                        placeholder="e.g. purple-tang-l"
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs font-mono text-cyan-300"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Public URL: /marketplace/{formState.id || 'slug'}
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">SKU (Stock Keeping Unit)</label>
                      <input
                        type="text"
                        value={formState.sku || ''}
                        onChange={(e) => setFormState((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                        placeholder="e.g. MC-LIV-001"
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">Brand / Producer</label>
                      <input
                        type="text"
                        value={formState.brand || ''}
                        onChange={(e) => setFormState((prev) => ({ ...prev, brand: e.target.value }))}
                        placeholder="Marine Creatures, Maxspect, Sunsun, Biozym"
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">Short Tagline / Teaser</label>
                      <input
                        type="text"
                        value={formState.shortDesc || ''}
                        onChange={(e) => setFormState((prev) => ({ ...prev, shortDesc: e.target.value }))}
                        placeholder="Concise commercial summary displayed in marketplace cards"
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-200 block mb-1">Full Detailed Dossier / Description</label>
                    <textarea
                      rows={5}
                      value={formState.description || ''}
                      onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Authoritative product description, biotope background, and technical specifications..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl p-3.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 2: CATALOG TAXONOMY ── */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">
                        Category <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={formState.category || 'marine-life'}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                      >
                        {CATALOG_CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">Item Physical Nature</label>
                      <select
                        value={formState.itemType || 'live'}
                        onChange={(e) => setFormState((prev) => ({ ...prev, itemType: e.target.value as any }))}
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                      >
                        <option value="live">Live Specimen / Coral / Macroalgae</option>
                        <option value="dry">Dry Good / Technical Equipment / Chemistry</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">Promotional Badge</label>
                      <input
                        type="text"
                        value={formState.badge || ''}
                        onChange={(e) => setFormState((prev) => ({ ...prev, badge: e.target.value }))}
                        placeholder="e.g. Rare Specimen, High-PAR, Best Seller, New In"
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">Catalog Status</label>
                      <select
                        value={formState.isArchived ? 'archived' : 'active'}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            isArchived: e.target.value === 'archived',
                            archivedAt: e.target.value === 'archived' ? new Date() : undefined,
                          }))
                        }
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                      >
                        <option value="active">Active (Publicly Visible)</option>
                        <option value="archived">Archived (Delisted from Marketplace)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: PRICING & STOCK ── */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  {/* Pricing Mode Radio */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                    <span className="font-semibold text-slate-200 block">Pricing Architecture</span>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="pricingMode"
                          checked={!formState.priceOnRequest}
                          onChange={() => setFormState((prev) => ({ ...prev, priceOnRequest: false }))}
                          className="text-cyan-400 focus:ring-cyan-400"
                        />
                        Fixed Price (Direct Checkout / WhatsApp Quotation)
                      </label>

                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="radio"
                          name="pricingMode"
                          checked={Boolean(formState.priceOnRequest)}
                          onChange={() => setFormState((prev) => ({ ...prev, priceOnRequest: true, price: 0 }))}
                          className="text-cyan-400 focus:ring-cyan-400"
                        />
                        Price on Request (POR) — Specimen / Bespoke
                      </label>
                    </div>
                  </div>

                  {!formState.priceOnRequest ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-semibold text-slate-200 block mb-1">
                          Selling Price (₹ INR) <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formState.price ?? 0}
                          onChange={(e) => setFormState((prev) => ({ ...prev, price: Number(e.target.value) }))}
                          className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs font-mono text-white"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-slate-200 block mb-1">Compare-At / Original Price (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={formState.originalPrice ?? ''}
                          onChange={(e) =>
                            setFormState((prev) => ({
                              ...prev,
                              originalPrice: e.target.value ? Number(e.target.value) : undefined,
                            }))
                          }
                          placeholder="Optional strikethrough price"
                          className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                      ℹ️ Price on Request items do not display a numerical price publicly. The product JSON-LD schema
                      will safely emit an inquiry-based offer without generating fake zero values.
                    </div>
                  )}

                  {/* Stock & Availability */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">Stock Unit Count</label>
                      <input
                        type="number"
                        min="0"
                        value={formState.stockCount ?? 0}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            stockCount: Number(e.target.value),
                            inStock: Number(e.target.value) > 0,
                          }))
                        }
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs font-mono text-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">In Stock Switch</label>
                      <select
                        value={formState.inStock ? 'true' : 'false'}
                        onChange={(e) => setFormState((prev) => ({ ...prev, inStock: e.target.value === 'true' }))}
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                      >
                        <option value="true">In Stock</option>
                        <option value="false">Out of Stock</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">Availability Classification</label>
                      <select
                        value={formState.availabilityStatus || 'AVAILABLE'}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            availabilityStatus: e.target.value as any,
                          }))
                        }
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="LIMITED">LIMITED (Low Quantity)</option>
                        <option value="ON REQUEST">ON REQUEST (Import / Diver Order)</option>
                        <option value="QUARANTINED">QUARANTINED (In Protocol)</option>
                        <option value="OUT OF STOCK">OUT OF STOCK</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4: PRODUCT SPECIFICATIONS & DOSSIER ── */}
              {activeStep === 4 && (
                <div className="space-y-4">
                  {formState.itemType === 'live' ? (
                    /* Marine Life Dossier */
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs">
                        🐠 Live Specimen Parameters & Biotope Care Dossier
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Scientific Name (Binomial)</label>
                          <input
                            type="text"
                            value={formState.scientificName || ''}
                            onChange={(e) => setFormState((prev) => ({ ...prev, scientificName: e.target.value }))}
                            placeholder="e.g. Zebrasoma xanthurum"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs italic text-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Origin / Natural Biome</label>
                          <input
                            type="text"
                            value={formState.origin || ''}
                            onChange={(e) => setFormState((prev) => ({ ...prev, origin: e.target.value }))}
                            placeholder="e.g. Red Sea, Coral Sea, Indo-Pacific"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Temperament</label>
                          <input
                            type="text"
                            value={formState.careGuide?.temperament || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                careGuide: { ...prev.careGuide!, temperament: e.target.value },
                              }))
                            }
                            placeholder="Peaceful, Semi-Aggressive"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Reef Compatibility</label>
                          <select
                            value={formState.careGuide?.reefSafe ? 'true' : 'false'}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                careGuide: { ...prev.careGuide!, reefSafe: e.target.value === 'true' },
                              }))
                            }
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                          >
                            <option value="true">Reef Safe (100%)</option>
                            <option value="false">With Caution / Not Reef Safe</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Minimum Aquarium Size</label>
                          <input
                            type="text"
                            value={formState.careGuide?.minimumTankSize || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                careGuide: { ...prev.careGuide!, minimumTankSize: e.target.value },
                              }))
                            }
                            placeholder="e.g. 400 Litres (100 Gal)"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Water Temperature</label>
                          <input
                            type="text"
                            value={formState.careGuide?.temperature || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                careGuide: { ...prev.careGuide!, temperature: e.target.value },
                              }))
                            }
                            placeholder="24°C – 26°C"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Salinity (SG)</label>
                          <input
                            type="text"
                            value={formState.careGuide?.salinity || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                careGuide: { ...prev.careGuide!, salinity: e.target.value },
                              }))
                            }
                            placeholder="1.024 – 1.026 SG"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">pH Level</label>
                          <input
                            type="text"
                            value={formState.careGuide?.ph || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                careGuide: { ...prev.careGuide!, ph: e.target.value },
                              }))
                            }
                            placeholder="8.1 – 8.4"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Technical Hardware / Dry Good Specifications */
                    <div className="space-y-4">
                      <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                        ⚙ Technical Equipment & Hardware Engineering Specifications
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Power Consumption (Wattage)</label>
                          <input
                            type="text"
                            value={formState.specifications?.['Power Consumption'] || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                specifications: { ...prev.specifications, 'Power Consumption': e.target.value },
                              }))
                            }
                            placeholder="e.g. 36W, 100W"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Aquarium Fit / Tank Range</label>
                          <input
                            type="text"
                            value={formState.specifications?.['Tank Size Range'] || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                specifications: { ...prev.specifications, 'Tank Size Range': e.target.value },
                              }))
                            }
                            placeholder="e.g. 60–90 cm (24–36 in)"
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Warranty Term</label>
                          <input
                            type="text"
                            value={formState.specifications?.['Warranty'] || '1 Year Authorized Manufacturer Warranty'}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                specifications: { ...prev.specifications, Warranty: e.target.value },
                              }))
                            }
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-slate-200 block mb-1">Origin / Certification</label>
                          <input
                            type="text"
                            value={formState.specifications?.['Certification'] || 'CE / RoHS Certified'}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                specifications: { ...prev.specifications, Certification: e.target.value },
                              }))
                            }
                            className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 5: MEDIA MANAGEMENT ── */}
              {activeStep === 5 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200 block">Product Photography & Visual Assets</span>
                      <p className="text-[11px] text-slate-400">
                        First image in the sequence serves as the primary marketplace thumbnail and social card asset.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={formState.imageStatus || 'VERIFIED'}
                        onChange={(e) => setFormState((prev) => ({ ...prev, imageStatus: e.target.value as any }))}
                        className="min-h-[36px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-2.5 text-xs text-slate-300"
                      >
                        <option value="VERIFIED">Classification: Verified Photography</option>
                        <option value="NEEDS_LICENSE_REVIEW">Classification: Luxury Blueprint / Fallback</option>
                        <option value="NEEDS_MEDIA_ASSET">Classification: Needs Asset</option>
                      </select>
                    </div>
                  </div>

                  {/* Classification Banner */}
                  {formState.imageStatus === 'NEEDS_LICENSE_REVIEW' ? (
                    <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                      ℹ️ Classified as Luxury Blueprint / Technical Vector. This item uses our bespoke brand visual
                      scheme until dedicated photographic assets are captured.
                    </div>
                  ) : formState.imageStatus === 'VERIFIED' ? (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                      ✓ Classified as Verified Authentic Photography.
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                      ⚠ No verified photograph available. Visual upload recommended before active marketing.
                    </div>
                  )}

                  {/* Upload Drop Zone & External Input */}
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-slate-700 space-y-3 text-center">
                    <input
                      type="file"
                      id="catalog-file-upload"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="catalog-file-upload"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-colors"
                    >
                      <span>📁</span>
                      <span>{isUploadingMedia ? 'Optimizing & Uploading...' : 'Upload Photos (Client Canvas Optimized)'}</span>
                    </label>

                    <div className="flex items-center gap-2 max-w-lg mx-auto pt-2">
                      <input
                        type="url"
                        placeholder="Or paste external asset URL..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="flex-1 min-h-[36px] bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-white"
                      />
                      <button
                        onClick={handleAddExternalImageUrl}
                        className="px-3.5 min-h-[36px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Image Gallery Sequence */}
                  {formState.images && formState.images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      {formState.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-xl overflow-hidden border bg-slate-900 group ${
                            idx === 0 ? 'border-cyan-400 ring-2 ring-cyan-400/20' : 'border-slate-800'
                          }`}
                        >
                          <img src={imgUrl} alt={`Asset ${idx + 1}`} className="w-full h-32 object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold">
                              PRIMARY
                            </span>
                          )}

                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            {idx > 0 && (
                              <button
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="px-2 py-1 rounded bg-slate-800 text-cyan-300 text-[10px] font-semibold hover:bg-slate-700"
                                title="Make Primary Thumbnail"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveImage(idx)}
                              className="px-2 py-1 rounded bg-rose-600/80 text-white text-[10px] font-semibold hover:bg-rose-500"
                              title="Remove Asset"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs font-mono">
                      Zero media assets attached.
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 6: SEO GOVERNANCE ── */}
              {activeStep === 6 && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">SEO Health Indicator</span>
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          seoHealth.score >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : seoHealth.score >= 50
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {seoHealth.score}% Complete ({seoHealth.passedCount}/{seoHealth.totalCount})
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          seoHealth.score >= 80 ? 'bg-emerald-400' : seoHealth.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${seoHealth.score}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 text-[11px] font-mono">
                      {seoHealth.checks.map((chk, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className={chk.passed ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {chk.passed ? '✓' : '○'}
                          </span>
                          <span className={chk.passed ? 'text-slate-300' : 'text-slate-500'}>{chk.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-200">Custom SEO Title</label>
                      <span
                        className={`text-[10px] font-mono ${
                          (formState.seoTitle?.length || 0) >= 30 && (formState.seoTitle?.length || 0) <= 65
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {formState.seoTitle?.length || 0} / 65 chars (Optimal: 30–65)
                      </span>
                    </div>
                    <input
                      type="text"
                      value={formState.seoTitle || ''}
                      onChange={(e) => setFormState((prev) => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder={`${formState.name || 'Product'} | Marine Creatures`}
                      className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-200">Custom Meta Description</label>
                      <span
                        className={`text-[10px] font-mono ${
                          (formState.seoDescription?.length || 0) >= 120 && (formState.seoDescription?.length || 0) <= 165
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {formState.seoDescription?.length || 0} / 165 chars (Optimal: 120–165)
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={formState.seoDescription || ''}
                      onChange={(e) => setFormState((prev) => ({ ...prev, seoDescription: e.target.value }))}
                      placeholder="Concise commercial summary written specifically for Google and social previews..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl p-3.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-200 block mb-1">Canonical URL Override (Advanced)</label>
                    <input
                      type="url"
                      value={formState.canonicalOverride || ''}
                      onChange={(e) => setFormState((prev) => ({ ...prev, canonicalOverride: e.target.value }))}
                      placeholder="Leave empty to use automatic canonical: https://marinecreatures.com/marketplace/[slug]"
                      className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs font-mono text-white"
                    />
                    <span className="text-[10px] text-amber-400/90 block mt-1">
                      ⚠️ Caution: Changing the slug or canonical modifies the public indexing target for this SKU.
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(formState.noIndex)}
                        onChange={(e) => setFormState((prev) => ({ ...prev, noIndex: e.target.checked }))}
                        className="rounded border-slate-800 text-cyan-400 focus:ring-cyan-400"
                      />
                      <span>Set `noindex, follow` (Temporarily de-index from search engines without archiving)</span>
                    </label>
                  </div>
                </div>
              )}

              {/* ── STEP 7: REVIEW & SAVE ── */}
              {activeStep === 7 && (
                <div className="space-y-4">
                  {/* Blocking Errors vs Warnings Banner */}
                  {validationResults.blockingErrors.length > 0 ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>⛔</span>
                        <span>{validationResults.blockingErrors.length} Blocking Error(s) — Cannot Save Product:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1">
                        {validationResults.blockingErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                      <span>✓</span>
                      <span>All required fields valid. Ready for database persistence.</span>
                    </div>
                  )}

                  {validationResults.warnings.length > 0 && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>Advisory Warnings ({validationResults.warnings.length}):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1">
                        {validationResults.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Pre-Save Operational Dossier Summary */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400 uppercase text-[10px]">Product Identification</span>
                      <span className="text-white font-bold">{formState.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">CANONICAL SLUG:</span>
                        <span className="text-cyan-300 font-bold">{formState.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">SKU:</span>
                        <span className="text-slate-300">{formState.sku || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">CATEGORY:</span>
                        <span className="text-slate-300">{formState.categoryLabel || formState.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">PRICING MODE:</span>
                        <span className="text-slate-300">
                          {formState.priceOnRequest ? 'Price on Request' : `₹${formState.price?.toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">STOCK UNITS:</span>
                        <span className="text-slate-300">{formState.stockCount} units</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">MEDIA ASSETS:</span>
                        <span className="text-slate-300">{formState.images?.length || 0} attached ({formState.imageStatus})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
              <div>
                {activeStep > 1 && (
                  <button
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    ← Previous Step
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>

                {activeStep < 7 ? (
                  <button
                    onClick={() => setActiveStep((prev) => Math.min(7, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProduct}
                    disabled={isSaving || !validationResults.isValid}
                    className="px-6 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/40 disabled:opacity-50 transition-all"
                  >
                    {isSaving ? 'Persisting to MongoDB...' : editingProduct ? 'Save Product Changes' : 'Publish Product to Catalog'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Archive Confirmation Modal ────────────────────────────────────── */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#090f17] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl">
              {archiveTarget.isArchived ? '↑' : '⊘'}
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {archiveTarget.isArchived ? 'Restore to Active Catalog?' : 'Archive this product?'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {archiveTarget.isArchived
                  ? `"${archiveTarget.name}" will become publicly visible and active on the marketplace.`
                  : `"${archiveTarget.name}" will no longer behave as an active catalog item. Historical orders and customer invoices will continue to reference this record safely.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setArchiveTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                disabled={isProcessingAction}
                className={`px-4 py-2 rounded-xl font-bold text-xs text-slate-950 transition-colors ${
                  archiveTarget.isArchived ? 'bg-emerald-400 hover:bg-emerald-300' : 'bg-amber-400 hover:bg-amber-300'
                }`}
              >
                {isProcessingAction
                  ? 'Updating...'
                  : archiveTarget.isArchived
                  ? 'Confirm Restore'
                  : 'Confirm Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Duplicate Confirmation Modal ──────────────────────────────────── */}
      {duplicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#090f17] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center text-xl">
              ⧉
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Duplicate Product?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Create a draft copy of &quot;{duplicateTarget.name}&quot;. A unique slug will be generated automatically,
                and the SKU will be cleared to prevent operational collision.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-slate-400">SOURCE: {duplicateTarget.id}</div>
              <div className="text-cyan-300">NEW DRAFT: {duplicateTarget.id}-copy-[nonce]</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDuplicateTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicateConfirm}
                disabled={isProcessingAction}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors"
              >
                {isProcessingAction ? 'Creating Copy...' : 'Create Draft Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
