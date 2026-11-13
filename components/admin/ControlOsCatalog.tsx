'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Product, ProductMedia } from '@/lib/data/products';
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
  initialSubtab?: string;
}

export function ControlOsCatalog({ onReturnToOverview, showToast = () => {}, initialSubtab }: ControlOsCatalogProps) {
  // ── Navigation & View State ────────────────────────────────────────────────
  const [catalogView, setCatalogView] = useState<'products' | 'media'>(
    initialSubtab === 'media' ? 'media' : 'products'
  );

  useEffect(() => {
    if (initialSubtab === 'media') {
      setCatalogView('media');
    } else if (initialSubtab === 'products') {
      setCatalogView('products');
    }
  }, [initialSubtab]);
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
    warranty: {
      enabled: false,
      provider: 'manufacturer',
      durationValue: 1,
      durationUnit: 'years',
      terms: '',
      internalNotes: '',
    },
    seoTitle: '',
    seoDescription: '',
    canonicalOverride: '',
    noIndex: false,
  });

  // Action Confirmation Modals
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [duplicateTarget, setDuplicateTarget] = useState<Product | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Media Uploading & Asset State (Images & Videos)
  interface UploadQueueItem {
    id: string;
    file: File;
    name: string;
    size: number;
    isVideo: boolean;
    format: string;
    status: 'pending' | 'optimizing' | 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
    url?: string;
  }

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [isDraggingDropZone, setIsDraggingDropZone] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; title: string } | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Global Media Library & Asset Repository State
  const [mediaLibraryItems, setMediaLibraryItems] = useState<any[]>([]);
  const [mediaLibraryCounts, setMediaLibraryCounts] = useState<{
    total: number;
    images: number;
    videos: number;
    verified: number;
    blueprint: number;
    customUploads: number;
  }>({
    total: 0,
    images: 0,
    videos: 0,
    verified: 0,
    blueprint: 0,
    customUploads: 0,
  });
  const [isLoadingMediaLibrary, setIsLoadingMediaLibrary] = useState(false);
  const [mediaLibraryError, setMediaLibraryError] = useState<string | null>(null);
  const [mediaLibraryFilter, setMediaLibraryFilter] = useState<string>('all');
  const [mediaLibraryType, setMediaLibraryType] = useState<'all' | 'image' | 'video'>('all');
  const [mediaLibrarySearch, setMediaLibrarySearch] = useState('');
  const [debouncedMediaSearch, setDebouncedMediaSearch] = useState('');
  const [mediaDeleteTarget, setMediaDeleteTarget] = useState<any | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  // ── Debounce Search ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 280);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedMediaSearch(mediaLibrarySearch.trim());
    }, 280);
    return () => clearTimeout(handler);
  }, [mediaLibrarySearch]);

  // Scroll lock when modal dialogs are active
  useEffect(() => {
    if (isEditorOpen || archiveTarget || duplicateTarget || previewVideo || mediaDeleteTarget) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isEditorOpen, archiveTarget, duplicateTarget, previewVideo, mediaDeleteTarget]);

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

  // ── Fetch Authoritative Media Library from MongoDB ─────────────────────────
  const fetchMediaLibrary = useCallback(async () => {
    setIsLoadingMediaLibrary(true);
    setMediaLibraryError(null);
    try {
      const params = new URLSearchParams();
      if (mediaLibraryFilter !== 'all') params.set('filter', mediaLibraryFilter);
      if (mediaLibraryType !== 'all') params.set('mediaType', mediaLibraryType);
      if (debouncedMediaSearch) params.set('search', debouncedMediaSearch);

      const res = await fetch(`/api/admin/media?${params.toString()}`, {
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
        setMediaLibraryItems(json.data || []);
        if (json.counts) {
          setMediaLibraryCounts(json.counts);
        }
      } else {
        throw new Error(json.error || 'Failed to parse media response');
      }
    } catch (err: any) {
      setMediaLibraryError(err.message || 'Operational media synchronization error');
    } finally {
      setIsLoadingMediaLibrary(false);
    }
  }, [mediaLibraryFilter, mediaLibraryType, debouncedMediaSearch]);

  useEffect(() => {
    if (catalogView === 'media') {
      fetchMediaLibrary();
    }
  }, [catalogView, fetchMediaLibrary]);

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
    setMediaError(null);
    setIsMediaLoading(false);
    setPreviewImage(null);
    setPreviewVideo(null);
    setUploadQueue([]);
    setNewImageUrl('');
    setFormState({
      name: '',
      id: '',
      slug: '',
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
      videos: [],
      media: [],
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
      warranty: {
        enabled: false,
        provider: 'manufacturer',
        durationValue: 1,
        durationUnit: 'years',
        terms: '',
        internalNotes: '',
      },
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
    setMediaError(null);
    setIsMediaLoading(false);
    setPreviewImage(null);
    setPreviewVideo(null);
    setUploadQueue([]);
    setNewImageUrl('');
    setFormState({
      ...prod,
      images: Array.isArray(prod.images) ? [...prod.images] : [],
      videos: Array.isArray(prod.videos) ? [...prod.videos] : [],
      media: Array.isArray(prod.media) ? [...prod.media] : [],
      slug: (prod as any).slug || prod.id,
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
      warranty: prod.warranty || {
        enabled: false,
        provider: 'manufacturer',
        durationValue: 1,
        durationUnit: 'years',
        terms: '',
        internalNotes: '',
      },
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
        const generated = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        updates.id = generated;
        (updates as any).slug = generated;
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

  // ── Product Media Synchronization Lifecycle ───────────────────────────────
  const fetchProductMedia = useCallback(async (productId: string) => {
    if (!productId) return;
    setIsMediaLoading(true);
    setMediaError(null);
    try {
      const res = await fetch(`/api/admin/media?productId=${encodeURIComponent(productId)}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setMediaError('Admin session expired. Please sign in again.');
        return;
      }
      if (res.status === 404) {
        // Record is new or unsaved, maintain existing form state
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to synchronize product media (HTTP ${res.status})`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        const { images, imageStatus } = json.data;
        setFormState((prev) => {
          const current = prev.images || [];
          const backendImages = Array.isArray(images) ? images : [];
          // Preserve any newly added uploads from the current session
          const resolvedImages = current.length > backendImages.length ? current : backendImages;
          return {
            ...prev,
            images: resolvedImages,
            imageStatus: imageStatus || (resolvedImages.length > 0 ? 'VERIFIED' : prev.imageStatus),
          };
        });
      }
    } catch (err: any) {
      console.error('Failed to synchronize product media:', err);
      setMediaError(err.message || 'Failed to load media assets from server');
    } finally {
      setIsMediaLoading(false);
    }
  }, []);

  // Synchronize media assets whenever Step 5 becomes active
  useEffect(() => {
    const targetId = editingProduct?.id || formState.id;
    if (isEditorOpen && activeStep === 5 && targetId) {
      fetchProductMedia(targetId);
    }
  }, [isEditorOpen, activeStep, editingProduct?.id, formState.id, fetchProductMedia]);

  // ── Media Handlers (Unified Image & Video Upload Pipeline) ───────────────────
  const ALLOWED_MEDIA_MIME = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
  ];
  const ALLOWED_MEDIA_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mov'];
  const MAX_MEDIA_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  // Combined product visual assets (images + videos)
  const combinedAssets = useMemo(() => {
    const list: Array<{ id: string; type: 'image' | 'video'; url: string; title?: string }> = [];
    const seenUrls = new Set<string>();

    if (Array.isArray(formState.media) && formState.media.length > 0) {
      formState.media.forEach((m, idx) => {
        if (m.url && !seenUrls.has(m.url)) {
          seenUrls.add(m.url);
          const isVid = m.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(m.url);
          list.push({
            id: m.id || `m-${idx}`,
            type: isVid ? 'video' : 'image',
            url: m.url,
            title: m.title || (isVid ? `Specimen Video ${idx + 1}` : `Asset ${idx + 1}`),
          });
        }
      });
    }

    (formState.images || []).forEach((img, idx) => {
      if (img && !seenUrls.has(img)) {
        seenUrls.add(img);
        const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(img);
        list.push({
          id: `img-${idx}`,
          type: isVid ? 'video' : 'image',
          url: img,
          title: isVid ? `Specimen Video ${idx + 1}` : `Asset ${idx + 1}`,
        });
      }
    });

    (formState.videos || []).forEach((vid, idx) => {
      if (vid && !seenUrls.has(vid)) {
        seenUrls.add(vid);
        list.push({
          id: `vid-${idx}`,
          type: 'video',
          url: vid,
          title: `Specimen Video ${idx + 1}`,
        });
      }
    });

    return list;
  }, [formState.media, formState.images, formState.videos]);

  const updateProductAssets = (
    newList: Array<{ id: string; type: 'image' | 'video'; url: string; title?: string }>
  ) => {
    const images = newList.filter((a) => a.type === 'image').map((a) => a.url);
    const videos = newList.filter((a) => a.type === 'video').map((a) => a.url);
    const media: ProductMedia[] = newList.map((a) => ({
      id: a.id,
      type: a.type,
      url: a.url,
      title: a.title,
    }));

    setFormState((prev) => ({
      ...prev,
      images,
      videos,
      media,
      imageStatus:
        images.length > 0
          ? 'VERIFIED'
          : prev.imageStatus === 'VERIFIED'
          ? 'NEEDS_MEDIA_ASSET'
          : prev.imageStatus,
    }));
  };

  const handleSetPrimaryAsset = (index: number) => {
    if (index < 0 || index >= combinedAssets.length) return;
    const assets = [...combinedAssets];
    const [selected] = assets.splice(index, 1);
    updateProductAssets([selected, ...assets]);
    showToast(
      selected.type === 'video'
        ? '✓ Video moved to top of media sequence'
        : '✓ Set as primary marketplace thumbnail'
    );
  };

  const handleMoveAsset = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= combinedAssets.length) return;
    const assets = [...combinedAssets];
    const temp = assets[index];
    assets[index] = assets[targetIndex];
    assets[targetIndex] = temp;
    updateProductAssets(assets);
  };

  const handleRemoveAsset = (indexToRemove: number) => {
    const assets = combinedAssets.filter((_, i) => i !== indexToRemove);
    updateProductAssets(assets);
    showToast('Asset removed');
  };

  // Backwards compatible aliases
  const handleRemoveImage = handleRemoveAsset;
  const handleSetPrimaryImage = handleSetPrimaryAsset;
  const handleMoveImage = handleMoveAsset;

  const handleCopyUrl = (url: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2500);
      showToast('✓ Media asset URL copied to clipboard');
    }
  };

  // Upload Queue Worker
  const executeUploadQueue = async (
    itemsToUpload: UploadQueueItem[],
    isStandalone = false
  ) => {
    if (itemsToUpload.length === 0) return;

    setIsUploadingMedia(true);
    setMediaError(null);
    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToUpload) {
      setUploadQueue((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: item.isVideo ? 'uploading' : 'optimizing' } : i
        )
      );

      let fileToUpload: File | Blob = item.file;
      if (!item.isVideo && item.file.type !== 'image/svg+xml') {
        try {
          fileToUpload = await optimizeImageForUpload(item.file, 1600, 0.85);
        } catch {
          fileToUpload = item.file;
        }
      }

      setUploadQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i))
      );

      try {
        const formData = new FormData();
        formData.append('file', fileToUpload, item.name);
        formData.append('type', item.isVideo ? 'video' : 'image');

        const targetId = !isStandalone ? editingProduct?.id || formState.id : undefined;
        if (targetId) {
          formData.append('productId', targetId);
        }

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (res.status === 401) {
          throw new Error('Admin session expired. Please sign in again.');
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed for "${item.name}" (HTTP ${res.status})`);
        }

        const json = await res.json();
        if (!json.url) {
          throw new Error('Server did not return a valid asset URL.');
        }

        setUploadQueue((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, status: 'success', url: json.url } : i))
        );
        successCount++;

        if (!isStandalone) {
          setFormState((prev) => {
            const currentImages = prev.images || [];
            const currentVideos = prev.videos || [];
            const currentMedia = prev.media || [];
            const newMediaItem: ProductMedia = {
              id: json.mediaId || `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: item.isVideo ? 'video' : 'image',
              url: json.url,
              title: item.name,
            };

            return {
              ...prev,
              images: item.isVideo ? currentImages : [...currentImages, json.url],
              videos: item.isVideo ? [...currentVideos, json.url] : currentVideos,
              media: [...currentMedia, newMediaItem],
              imageStatus: 'VERIFIED',
            };
          });
        }
      } catch (err: any) {
        failCount++;
        setUploadQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: err.message || 'Upload failed' } : i
          )
        );
      }
    }

    setIsUploadingMedia(false);

    if (isStandalone) {
      fetchMediaLibrary();
    }

    if (successCount > 0 && failCount === 0) {
      showToast(`✓ Uploaded ${successCount} asset(s) successfully`);
    } else if (successCount > 0 && failCount > 0) {
      showToast(`⚠ Uploaded ${successCount} asset(s), ${failCount} failed`);
    } else if (failCount > 0) {
      setMediaError(`Failed to upload ${failCount} asset(s). See details below to retry.`);
    }
  };

  const handleFilesSelected = (files: File[], isStandalone = false) => {
    if (!files || files.length === 0) return;

    const newQueueItems: UploadQueueItem[] = files.map((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext);
      const isValidMime = file.type ? ALLOWED_MEDIA_MIME.includes(file.type) : ALLOWED_MEDIA_EXTS.includes(ext);
      const isTooLarge = file.size > MAX_MEDIA_FILE_SIZE;

      let initialStatus: UploadQueueItem['status'] = 'pending';
      let initialError: string | undefined = undefined;

      if (isTooLarge) {
        initialStatus = 'error';
        initialError = `Exceeds 25MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB)`;
      } else if (!isValidMime) {
        initialStatus = 'error';
        initialError = `Unsupported format (${file.type || ext}). Allowed: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, MOV`;
      }

      return {
        id: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        size: file.size,
        isVideo,
        format: ext || (isVideo ? 'video' : 'image'),
        status: initialStatus,
        progress: 0,
        error: initialError,
      };
    });

    setUploadQueue((prev) => [...prev, ...newQueueItems]);

    const pendingItems = newQueueItems.filter((i) => i.status === 'pending');
    if (pendingItems.length > 0) {
      executeUploadQueue(pendingItems, isStandalone);
    } else {
      const errors = newQueueItems.filter((i) => i.error).map((i) => `"${i.name}": ${i.error}`);
      setMediaError(errors.join('; '));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(Array.from(e.target.files), false);
      e.target.value = '';
    }
  };

  const handleRetryFailedUploads = (isStandalone = false) => {
    const failedItems = uploadQueue.filter(
      (item) => item.status === 'error' && item.file.size <= MAX_MEDIA_FILE_SIZE
    );
    if (failedItems.length === 0) return;

    setUploadQueue((prev) =>
      prev.map((i) =>
        failedItems.some((f) => f.id === i.id) ? { ...i, status: 'pending', error: undefined } : i
      )
    );

    executeUploadQueue(failedItems, isStandalone);
  };

  const handleAddExternalImageUrl = () => {
    const raw = newImageUrl.trim();
    if (!raw) return;

    let isValid = false;
    try {
      if (raw.startsWith('/')) {
        isValid = true;
      } else {
        const parsed = new URL(raw);
        isValid = parsed.protocol === 'http:' || parsed.protocol === 'https:';
      }
    } catch {
      isValid = false;
    }

    if (!isValid) {
      setMediaError(
        'Invalid URL format. Please enter a valid HTTP/HTTPS web address or absolute path (e.g. https://.../photo.jpg or video.mp4).'
      );
      return;
    }

    const isVid = /\.(mp4|webm|mov)(\?|$)/i.test(raw);
    setMediaError(null);

    const newMediaItem: ProductMedia = {
      id: `media-ext-${Date.now()}`,
      type: isVid ? 'video' : 'image',
      url: raw,
      title: raw.split('/').pop()?.split('?')[0] || (isVid ? 'External Video' : 'External Asset'),
    };

    setFormState((prev) => {
      const currentImages = prev.images || [];
      const currentVideos = prev.videos || [];
      const currentMedia = prev.media || [];
      return {
        ...prev,
        images: isVid ? currentImages : [...currentImages, raw],
        videos: isVid ? [...currentVideos, raw] : currentVideos,
        media: [...currentMedia, newMediaItem],
        imageStatus: prev.imageStatus === 'NEEDS_MEDIA_ASSET' ? 'VERIFIED' : prev.imageStatus,
      };
    });
    setNewImageUrl('');
    showToast(`✓ Added external ${isVid ? 'video' : 'image'} reference`);
  };

  const handleDeleteMediaAsset = async (asset: any) => {
    if (!asset || !asset.id) return;
    setIsDeletingMedia(true);
    try {
      const cleanId = asset.id.replace(/^upload-/, '');
      const res = await fetch(`/api/admin/media/${cleanId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to delete media asset (HTTP ${res.status})`);
      }
      showToast(`✓ Deleted "${asset.parentName || asset.id}"`);
      setMediaDeleteTarget(null);
      fetchMediaLibrary();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setIsDeletingMedia(false);
    }
  };

  // ── SEO Health Calculation ─────────────────────────────────────────────────
  const seoHealth = useMemo(() => {
    const title = (formState.seoTitle || formState.name || '').trim();
    const desc = (formState.seoDescription || formState.shortDesc || '').trim();
    const effectiveSlug = (((formState as any).slug || formState.id || '') as string).trim();
    const hasSlug = Boolean(effectiveSlug);
    const hasImages = Array.isArray(formState.images) && formState.images.length > 0;
    const hasFullDesc = Boolean((formState.description || '').trim());
    const isPOR = Boolean(formState.priceOnRequest);
    const validPrice = isPOR || (typeof formState.price === 'number' && formState.price > 0);

    const checks = [
      { label: 'SEO Title (30–65 chars)', passed: title.length >= 30 && title.length <= 70 },
      { label: 'Meta Description (120–165 chars)', passed: desc.length >= 100 && desc.length <= 175 },
      { label: 'Clean Canonical Slug', passed: hasSlug && /^[a-z0-9-]+$/.test(effectiveSlug) && !/^-|-$/.test(effectiveSlug) },
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
    const effectiveSlug = (((formState as any).slug || formState.id || '') as string).trim();
    if (!effectiveSlug) {
      blockingErrors.push('Product Slug / ID is required.');
    } else if (!/^[a-z0-9-]+$/.test(effectiveSlug)) {
      blockingErrors.push('Slug may only contain lowercase letters, numbers, and hyphens.');
    } else if (/^-|-$/.test(effectiveSlug)) {
      blockingErrors.push('Slug cannot begin or end with a hyphen.');
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

      const canonicalId = editingProduct ? editingProduct.id : (formState.id || '').trim().toLowerCase();
      const currentSlug = (((formState as any).slug || formState.id || canonicalId) as string)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const payload = {
        ...formState,
        canonicalId,
        id: canonicalId,
        _id: (editingProduct as any)?._id,
        slug: currentSlug,
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

      {/* ── View Switcher: Catalog SKUs vs Media & Video Library ──────────── */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          type="button"
          onClick={() => setCatalogView('products')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            catalogView === 'products'
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>🐠</span>
          <span>Catalog SKUs</span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              catalogView === 'products' ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {metrics.totalProducts}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setCatalogView('media');
            fetchMediaLibrary();
          }}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            catalogView === 'media'
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>🎬</span>
          <span>Media & Video Library</span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              catalogView === 'media' ? 'bg-slate-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {mediaLibraryCounts.total > 0 ? mediaLibraryCounts.total : 'Live'}
          </span>
        </button>
      </div>

      {/* ── Catalog SKUs View ──────────────────────────────────────────────── */}
      {catalogView === 'products' && (
        <>
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
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
              className="min-h-[42px] flex-1 sm:flex-none bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-slate-300 focus:outline-none"
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
              className="min-h-[42px] flex-1 sm:flex-none bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="archived">Archived Only</option>
              <option value="needs_review">Needs Review</option>
            </select>

            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className={`min-h-[42px] px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0 ${
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

                  {/* Mobile Action Buttons (Grid 2-col on small, 4-col on sm) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/60">
                    <Link
                      href={`/marketplace/${p.id}`}
                      target="_blank"
                      className="min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center text-xs hover:text-white"
                    >
                      View ↗
                    </Link>
                    <button
                      onClick={() => handleOpenEditProduct(p)}
                      className="min-h-[44px] rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-semibold text-xs flex items-center justify-center hover:bg-cyan-400/20"
                    >
                      Edit Spec
                    </button>
                    <button
                      onClick={() => setDuplicateTarget(p)}
                      className="min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center text-xs hover:text-white"
                    >
                      Copy ⧉
                    </button>
                    <button
                      onClick={() => setArchiveTarget(p)}
                      className="min-h-[44px] rounded-xl bg-slate-900 border border-slate-800 text-slate-300 flex items-center justify-center text-xs hover:text-white"
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
    </>
  )}

      {/* ── Media & Video Library View ────────────────────────────────────────── */}
      {catalogView === 'media' && (
        <div className="space-y-6">
          {/* Media Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <button
              onClick={() => {
                setMediaLibraryType('all');
                setMediaLibraryFilter('all');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                mediaLibraryType === 'all' && mediaLibraryFilter === 'all'
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm'
                  : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Assets</div>
              <div className="text-xl font-bold font-mono text-white mt-1">{mediaLibraryCounts.total}</div>
              <div className="text-[10px] text-cyan-400 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                All repository media
              </div>
            </button>

            <button
              onClick={() => setMediaLibraryType('image')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                mediaLibraryType === 'image'
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-300 shadow-sm'
                  : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Photographs</div>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">{mediaLibraryCounts.images}</div>
              <div className="text-[10px] text-blue-400/80 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                JPEG · PNG · WebP · SVG
              </div>
            </button>

            <button
              onClick={() => setMediaLibraryType('video')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                mediaLibraryType === 'video'
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-sm'
                  : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Specimen Videos</div>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">{mediaLibraryCounts.videos}</div>
              <div className="text-[10px] text-purple-400/80 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                MP4 · WebM · QuickTime
              </div>
            </button>

            <button
              onClick={() => {
                setMediaLibraryType('all');
                setMediaLibraryFilter('verified');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                mediaLibraryFilter === 'verified'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-sm'
                  : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Verified Real</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{mediaLibraryCounts.verified}</div>
              <div className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Authentic Photography
              </div>
            </button>

            <button
              onClick={() => {
                setMediaLibraryType('all');
                setMediaLibraryFilter('custom_uploads');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                mediaLibraryFilter === 'custom_uploads'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 shadow-sm'
                  : 'bg-[#070d14] border-slate-800/80 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Atlas Uploads</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">{mediaLibraryCounts.customUploads}</div>
              <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                High-performance binary
              </div>
            </button>
          </div>

          {/* Standalone Drag & Drop Upload Zone (Images & Videos) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingDropZone(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingDropZone(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingDropZone(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFilesSelected(Array.from(e.dataTransfer.files), true);
              }
            }}
            className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 bg-[#070d14] ${
              isDraggingDropZone
                ? 'border-cyan-400 bg-cyan-950/20'
                : 'border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <input
              type="file"
              id="global-media-upload"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelected(Array.from(e.target.files), true);
                  e.target.value = '';
                }
              }}
              disabled={isUploadingMedia}
              className="hidden"
            />

            <div className="space-y-1">
              <div className="text-3xl">📁 🎥</div>
              <h3 className="font-bold text-white text-sm">
                Upload Specimen Photographs & Videos to Media Storage
              </h3>
              <p className="text-xs text-slate-400 max-w-xl mx-auto">
                Drag and drop files here, or browse. Accepts images (JPEG, PNG, WebP, GIF, SVG) and videos (MP4, WebM, MOV) up to 25MB each.
              </p>
            </div>

            <label
              htmlFor="global-media-upload"
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-lg transition-all ${
                isUploadingMedia
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-950/40'
              }`}
            >
              {isUploadingMedia ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing & Uploading...</span>
                </>
              ) : (
                <>
                  <span>＋</span>
                  <span>Select Photos & Videos</span>
                </>
              )}
            </label>
          </div>

          {/* Upload Queue Progress for Standalone View */}
          {uploadQueue.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#070d14] border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800/80">
                <span>
                  Upload Batch ({uploadQueue.filter((i) => i.status === 'success').length}/{uploadQueue.length} Finished)
                </span>
                <div className="flex items-center gap-2">
                  {uploadQueue.some((i) => i.status === 'error') && (
                    <button
                      type="button"
                      onClick={() => handleRetryFailedUploads(true)}
                      disabled={isUploadingMedia}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      ↻ Retry Failed
                    </button>
                  )}
                  {!isUploadingMedia && (
                    <button
                      type="button"
                      onClick={() => setUploadQueue([])}
                      className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {uploadQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{item.isVideo ? '🎥' : '📷'}</span>
                      <div className="truncate">
                        <span className="text-white font-medium truncate block">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.isVideo ? 'VIDEO' : 'PHOTO'} · {item.format.toUpperCase()} ·{' '}
                          {(item.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'pending' && <span className="text-[11px] text-slate-500 font-mono">Queued</span>}
                      {item.status === 'optimizing' && (
                        <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          Optimizing...
                        </span>
                      )}
                      {item.status === 'uploading' && (
                        <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          Uploading...
                        </span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          ✓ Uploaded
                        </span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-[11px] text-rose-400 font-medium" title={item.error}>
                          ✕ {item.error || 'Failed'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filtering Controls */}
          <div className="bg-[#070d14] border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Media Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search media by asset name, product title, ID, or URL..."
                  value={mediaLibrarySearch}
                  onChange={(e) => setMediaLibrarySearch(e.target.value)}
                  className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 transition-colors"
                />
              </div>

              {/* Media Type Filter */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setMediaLibraryType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mediaLibraryType === 'all'
                      ? 'bg-cyan-400 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Types
                </button>
                <button
                  type="button"
                  onClick={() => setMediaLibraryType('image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mediaLibraryType === 'image'
                      ? 'bg-cyan-400 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Photos
                </button>
                <button
                  type="button"
                  onClick={() => setMediaLibraryType('video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    mediaLibraryType === 'video'
                      ? 'bg-cyan-400 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Videos
                </button>
              </div>

              {/* Source Filter */}
              <select
                value={mediaLibraryFilter}
                onChange={(e) => setMediaLibraryFilter(e.target.value)}
                className="min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white font-medium"
              >
                <option value="all">Source: All Repository Media</option>
                <option value="custom_uploads">Source: Atlas Custom Uploads</option>
                <option value="product">Source: Catalog Products</option>
                <option value="case_study">Source: Architectural Exhibits</option>
                <option value="verified">Classification: Verified Real Only</option>
                <option value="blueprint">Classification: Blueprint / Vector</option>
              </select>
            </div>
          </div>

          {/* Media Items Grid */}
          {isLoadingMediaLibrary ? (
            <div className="p-12 text-center rounded-2xl bg-[#070d14] border border-slate-800 space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Synchronizing media catalog from MongoDB Cluster0...</p>
            </div>
          ) : mediaLibraryItems.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mediaLibraryItems.map((item) => {
                const isVideo = item.type === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(item.url || '');
                return (
                  <div
                    key={item.id}
                    className="relative rounded-2xl overflow-hidden border border-slate-800/80 bg-[#070d14] hover:border-slate-700 group transition-all flex flex-col justify-between"
                  >
                    {/* Media Thumbnail */}
                    <div
                      className="cursor-pointer overflow-hidden aspect-square bg-slate-950 flex items-center justify-center relative"
                      onClick={() => {
                        if (isVideo) {
                          setPreviewVideo({
                            url: item.url,
                            title: item.parentName || 'Specimen Video',
                          });
                        } else if (item.url) {
                          setPreviewImage(item.url);
                        }
                      }}
                      title={isVideo ? 'Click to play video' : 'Click to preview photo'}
                    >
                      {isVideo ? (
                        <>
                          <video
                            src={item.url}
                            preload="metadata"
                            muted
                            className="w-full h-full object-cover pointer-events-none opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-lg pl-0.5">
                              ▶
                            </div>
                          </div>
                        </>
                      ) : item.url ? (
                        <img
                          src={item.url}
                          alt={item.parentName || 'Media'}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.opacity = '0.5';
                          }}
                        />
                      ) : (
                        <div className="p-3 text-center text-[10px] text-slate-500 font-mono">
                          SVG Blueprint
                        </div>
                      )}

                      {/* Format Badge */}
                      <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shadow ${
                            isVideo ? 'bg-purple-500/90 text-white' : 'bg-slate-900/90 text-slate-300'
                          }`}
                        >
                          {isVideo ? '🎥 VIDEO' : '📷 PHOTO'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900/80 text-cyan-300 font-mono text-[9px] uppercase">
                          {item.format || (isVideo ? 'MP4' : 'IMAGE')}
                        </span>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="p-2.5 space-y-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate" title={item.parentName}>
                          {item.parentName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate" title={item.parentId}>
                          {item.sourceType === 'database_upload'
                            ? `Atlas: ${item.parentId}`
                            : item.sourceType === 'product'
                            ? `Product: ${item.parentId}`
                            : `Exhibit: ${item.parentId}`}
                        </p>
                        {item.size ? (
                          <p className="text-[9px] text-slate-400 font-mono">
                            {(item.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item.url)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                          title="Copy Asset URL"
                        >
                          {copiedUrl === item.url ? '✓' : '📋'}
                          <span>URL</span>
                        </button>

                        {item.sourceType === 'database_upload' && (
                          <button
                            type="button"
                            onClick={() => setMediaDeleteTarget(item)}
                            className="px-2 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-[10px] font-semibold transition-colors"
                            title="Delete custom uploaded asset"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-[#070d14] border border-dashed border-slate-800 space-y-2">
              <span className="text-2xl block">🔍</span>
              <p className="text-white font-medium text-xs">No media assets found matching the selected filters.</p>
              <p className="text-slate-500 text-[11px]">
                Try adjusting your search query, switching media types, or uploading a new specimen file above.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit Product Multi-Section Governance Drawer / Modal ─────── */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-[#090f17] border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[94vh] sm:max-h-[92vh] sm:h-auto overflow-hidden my-0 sm:my-auto">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>{editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Step {activeStep} of 7
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate max-w-[200px] xs:max-w-xs sm:max-w-none">
                  {editingProduct ? `Governance ID: ${editingProduct.id}` : 'Create an authoritative catalog record'}
                </p>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            {/* Stepper Navigation Pills */}
            <div className="px-3 sm:px-6 py-2.5 bg-slate-950/60 border-b border-slate-800/60 overflow-x-auto flex items-center gap-2 shrink-0 scrollbar-none">
              {[
                { step: 1, label: '01 Basic' },
                { step: 2, label: '02 Catalog' },
                { step: 3, label: '03 Pricing & Stock' },
                { step: 4, label: '04 Specs & Warranty' },
                { step: 5, label: '05 Media' },
                { step: 6, label: '06 SEO Health' },
                { step: 7, label: '07 Review & Save' },
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveStep(s.step)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-colors flex items-center ${
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
                    {editingProduct ? (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-slate-200">
                            Governance ID (Database Key)
                          </label>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono border border-cyan-500/20">
                            IMMUTABLE
                          </span>
                        </div>
                        <div className="w-full min-h-[42px] bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-cyan-400/90 flex items-center select-all">
                          {editingProduct.id}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          Authoritative internal database identity
                        </span>
                      </div>
                    ) : null}

                    <div>
                      <label className="font-semibold text-slate-200 block mb-1">
                        {editingProduct ? 'Public Marketplace Slug' : 'Canonical Slug / ID'} <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={((formState as any).slug ?? formState.id) || ''}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
                          setFormState((prev) => ({
                            ...prev,
                            slug: val,
                            ...(editingProduct ? {} : { id: val }),
                          }));
                        }}
                        onBlur={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
                          setFormState((prev) => ({
                            ...prev,
                            slug: val,
                            ...(editingProduct ? {} : { id: val }),
                          }));
                        }}
                        placeholder="e.g. purple-tang-l"
                        className="w-full min-h-[42px] bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-3.5 text-xs font-mono text-cyan-300"
                      />
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Public URL: /marketplace/{(((formState as any).slug || formState.id || 'slug') as string).replace(/^-+|-+$/g, '')}
                      </span>
                    </div>

                    <div className={editingProduct ? 'sm:col-span-2' : ''}>
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
                          <label className="font-semibold text-slate-200 block mb-1">Operating Voltage / Input</label>
                          <input
                            type="text"
                            value={formState.specifications?.['Voltage'] || ''}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                specifications: { ...prev.specifications, Voltage: e.target.value },
                              }))
                            }
                            placeholder="e.g. AC 100–240V, 50/60Hz"
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

                  {/* ── DEDICATED WARRANTY CONFIGURATION SECTION (MC-FEATURE-PRODUCT-WARRANTY-V1) ── */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 pt-4 mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                          <span>🛡️</span>
                          <span>Product Warranty Governance &amp; Configuration</span>
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Configure product-specific warranty claims, duration, customer-facing terms, and internal service notes.
                        </p>
                      </div>
                      <span className={`self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                        formState.warranty?.enabled
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {formState.warranty?.enabled ? '✓ WARRANTY ENABLED' : '⊘ NO WARRANTY (DISABLED)'}
                      </span>
                    </div>

                    {/* 1. Warranty Applicable Toggle */}
                    <div className="space-y-2">
                      <label className="font-semibold text-slate-200 block text-xs">
                        Warranty Applicable <span className="text-rose-400">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormState((prev) => ({
                            ...prev,
                            warranty: {
                              ...(prev.warranty || { durationValue: 1, durationUnit: 'years', provider: 'manufacturer', terms: '', internalNotes: '' }),
                              enabled: false,
                            },
                          }))}
                          className={`min-h-[42px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            !formState.warranty?.enabled
                              ? 'bg-slate-800 text-white border-slate-600 shadow'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span>⊘</span>
                          <span>Disabled (No Warranty)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormState((prev) => ({
                            ...prev,
                            warranty: {
                              ...(prev.warranty || { terms: '', internalNotes: '' }),
                              enabled: true,
                              provider: prev.warranty?.provider || 'manufacturer',
                              durationValue: prev.warranty?.durationValue || 1,
                              durationUnit: prev.warranty?.durationUnit || 'years',
                            },
                          }))}
                          className={`min-h-[42px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                            formState.warranty?.enabled
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40 shadow'
                              : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          <span>🛡️</span>
                          <span>Enabled (Active Warranty)</span>
                        </button>
                      </div>
                      {!formState.warranty?.enabled && (
                        <p className="text-[11px] text-slate-500 italic pt-0.5">
                          When disabled, duration and warranty claims are never advertised as active benefits. Default for new products.
                        </p>
                      )}
                    </div>

                    {/* 2. Active Warranty Configuration Fields (Visible when enabled) */}
                    {formState.warranty?.enabled && (
                      <div className="space-y-4 pt-3 border-t border-slate-800/60">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Warranty Provider */}
                          <div>
                            <label className="font-semibold text-slate-200 block mb-1">
                              Warranty Provider <span className="text-rose-400">*</span>
                            </label>
                            <select
                              value={formState.warranty?.provider || 'manufacturer'}
                              onChange={(e) => setFormState((prev) => ({
                                ...prev,
                                warranty: {
                                  ...(prev.warranty || { enabled: true, durationValue: 1, durationUnit: 'years' }),
                                  provider: e.target.value as 'manufacturer' | 'seller',
                                },
                              }))}
                              className="w-full min-h-[42px] bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                            >
                              <option value="manufacturer">Manufacturer Warranty</option>
                              <option value="seller">Seller / Marine Creatures Warranty</option>
                            </select>
                          </div>

                          {/* Warranty Duration: Value & Unit */}
                          <div>
                            <label className="font-semibold text-slate-200 block mb-1">
                              Warranty Duration <span className="text-rose-400">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                min="1"
                                max="120"
                                value={formState.warranty?.durationValue ?? 1}
                                onChange={(e) => setFormState((prev) => ({
                                  ...prev,
                                  warranty: {
                                    ...(prev.warranty || { enabled: true, provider: 'manufacturer', durationUnit: 'years' }),
                                    durationValue: Math.max(1, parseInt(e.target.value) || 1),
                                  },
                                }))}
                                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs font-mono text-white"
                                placeholder="1"
                              />
                              <select
                                value={formState.warranty?.durationUnit || 'years'}
                                onChange={(e) => setFormState((prev) => ({
                                  ...prev,
                                  warranty: {
                                    ...(prev.warranty || { enabled: true, provider: 'manufacturer', durationValue: 1 }),
                                    durationUnit: e.target.value as 'days' | 'months' | 'years',
                                  },
                                }))}
                                className="w-full min-h-[42px] bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl px-3 text-xs text-white"
                              >
                                <option value="days">Days</option>
                                <option value="months">Months</option>
                                <option value="years">Years</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Customer-Facing Warranty Terms */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-slate-200 block">
                              Customer-Facing Warranty Terms &amp; Coverage
                            </label>
                            <span className="text-[10px] text-cyan-400 font-mono">Publicly Accessible</span>
                          </div>
                          <textarea
                            rows={3}
                            value={formState.warranty?.terms || ''}
                            onChange={(e) => setFormState((prev) => ({
                              ...prev,
                              warranty: {
                                ...(prev.warranty || { enabled: true }),
                                terms: e.target.value,
                              },
                            }))}
                            placeholder="Enter clear, customer-facing warranty coverage, claim requirements, and exclusions (e.g. 1 year coverage against electrical transformer failure; excludes physical breakage)..."
                            className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 resize-y"
                          />
                        </div>

                        {/* Internal Warranty Notes (Admin-only) */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-amber-300 block">
                              Internal Warranty Notes &amp; RMA Protocol
                            </label>
                            <span className="text-[10px] text-amber-400/90 font-mono px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30">
                              🔒 Admin-Only • Never Exposed to Public
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            value={formState.warranty?.internalNotes || ''}
                            onChange={(e) => setFormState((prev) => ({
                              ...prev,
                              warranty: {
                                ...(prev.warranty || { enabled: true }),
                                internalNotes: e.target.value,
                              },
                            }))}
                            placeholder="Private supplier RMA escalation contact, distributor credit agreement reference, supplier ticket link..."
                            className="w-full bg-slate-950 border border-amber-500/30 focus:border-amber-400 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 resize-y"
                          />
                        </div>
                      </div>
                    )}

                    {/* 3. Variant Overrides Section (when product has variants) */}
                    {formState.variants && formState.variants.length > 0 && (
                      <div className="pt-4 border-t border-slate-800/80 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                            <span>⚙️</span>
                            <span>Variant-Level Warranty Overrides ({formState.variants.length} Variants)</span>
                          </h5>
                          <span className="text-[10px] text-slate-400 font-mono">Inherits product setting by default</span>
                        </div>

                        <div className="space-y-2">
                          {formState.variants.map((variant, vIdx) => {
                            const hasOverride = variant.warranty !== undefined;
                            return (
                              <div key={variant.id || vIdx} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-bold text-white text-xs">{variant.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono ml-2">ID: {variant.id}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedVariants = [...(formState.variants || [])];
                                      if (hasOverride) {
                                        delete updatedVariants[vIdx].warranty;
                                      } else {
                                        updatedVariants[vIdx].warranty = {
                                          enabled: formState.warranty?.enabled ?? false,
                                          provider: formState.warranty?.provider || 'manufacturer',
                                          durationValue: formState.warranty?.durationValue || 1,
                                          durationUnit: formState.warranty?.durationUnit || 'years',
                                          terms: formState.warranty?.terms || '',
                                          internalNotes: '',
                                        };
                                      }
                                      setFormState((prev) => ({ ...prev, variants: updatedVariants }));
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all text-slate-300 bg-slate-800 border-slate-700 hover:text-white"
                                  >
                                    {hasOverride ? 'Reset to Inherit Product Warranty' : '⚙️ Custom Variant Override'}
                                  </button>
                                </div>

                                {hasOverride && variant.warranty && (
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/60">
                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Coverage</label>
                                      <select
                                        value={variant.warranty.enabled ? 'true' : 'false'}
                                        onChange={(e) => {
                                          const updated = [...(formState.variants || [])];
                                          updated[vIdx].warranty = { ...updated[vIdx].warranty!, enabled: e.target.value === 'true' };
                                          setFormState((prev) => ({ ...prev, variants: updated }));
                                        }}
                                        className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-[11px] text-white"
                                      >
                                        <option value="true">Warranty Enabled</option>
                                        <option value="false">No Warranty</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Provider</label>
                                      <select
                                        value={variant.warranty.provider || 'manufacturer'}
                                        onChange={(e) => {
                                          const updated = [...(formState.variants || [])];
                                          updated[vIdx].warranty = { ...updated[vIdx].warranty!, provider: e.target.value as any };
                                          setFormState((prev) => ({ ...prev, variants: updated }));
                                        }}
                                        className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-[11px] text-white"
                                      >
                                        <option value="manufacturer">Manufacturer</option>
                                        <option value="seller">Seller</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="text-[10px] text-slate-400 block mb-0.5">Duration</label>
                                      <div className="flex gap-1">
                                        <input
                                          type="number"
                                          min="1"
                                          value={variant.warranty.durationValue || 1}
                                          onChange={(e) => {
                                            const updated = [...(formState.variants || [])];
                                            updated[vIdx].warranty = { ...updated[vIdx].warranty!, durationValue: parseInt(e.target.value) || 1 };
                                            setFormState((prev) => ({ ...prev, variants: updated }));
                                          }}
                                          className="w-16 h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-[11px] text-white font-mono"
                                        />
                                        <select
                                          value={variant.warranty.durationUnit || 'years'}
                                          onChange={(e) => {
                                            const updated = [...(formState.variants || [])];
                                            updated[vIdx].warranty = { ...updated[vIdx].warranty!, durationUnit: e.target.value as any };
                                            setFormState((prev) => ({ ...prev, variants: updated }));
                                          }}
                                          className="w-full h-8 bg-slate-900 border border-slate-700 rounded-lg px-2 text-[11px] text-white"
                                        >
                                          <option value="days">Days</option>
                                          <option value="months">Months</option>
                                          <option value="years">Years</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEP 5: MEDIA MANAGEMENT ── */}
              {activeStep === 5 && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-200 block text-sm">
                        Product Photography & Visual Assets
                      </span>
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

                  {/* Actionable Media Error Banner (Step-scoped) */}
                  {mediaError && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0">⚠️</span>
                        <div>
                          <strong className="block font-semibold text-red-300">Media Operation Error</strong>
                          <p className="text-red-200/90 mt-0.5">{mediaError}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaError(null);
                          const targetId = editingProduct?.id || formState.id;
                          if (targetId) fetchProductMedia(targetId);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-semibold shrink-0 transition-colors"
                      >
                        Retry Sync
                      </button>
                    </div>
                  )}

                  {/* Upload Drop Zone & Drag-and-Drop Area (Images & Videos) */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingDropZone(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingDropZone(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingDropZone(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleFilesSelected(Array.from(e.dataTransfer.files), false);
                      }
                    }}
                    className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center space-y-3 ${
                      isDraggingDropZone
                        ? 'border-cyan-400 bg-cyan-950/20'
                        : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="file"
                      id="catalog-file-upload"
                      multiple
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm,video/quicktime"
                      onChange={handleFileUpload}
                      disabled={isUploadingMedia}
                      className="hidden"
                    />

                    <div className="space-y-1">
                      <div className="text-2xl">📁 🎥</div>
                      <div className="font-semibold text-slate-200 text-xs">
                        Drag & Drop Photos & Videos, or Click to Browse
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Accepted Formats: JPEG, PNG, WebP, GIF, SVG · MP4, WebM, QuickTime MOV (Max 25MB per file)
                      </p>
                    </div>

                    <label
                      htmlFor="catalog-file-upload"
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer shadow-md transition-colors ${
                        isUploadingMedia
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                      }`}
                    >
                      {isUploadingMedia ? (
                        <>
                          <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Processing & Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span>📁</span>
                          <span>Select Photos & Videos</span>
                        </>
                      )}
                    </label>

                    {/* External URL Input */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 max-w-lg mx-auto pt-2">
                      <input
                        type="url"
                        placeholder="Or paste external asset URL (e.g. https://.../photo.jpg or video.mp4)..."
                        value={newImageUrl}
                        onChange={(e) => {
                          setNewImageUrl(e.target.value);
                          if (mediaError) setMediaError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddExternalImageUrl();
                          }
                        }}
                        className="w-full sm:flex-1 min-h-[38px] bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs text-white placeholder:text-slate-500 focus:border-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={handleAddExternalImageUrl}
                        className="w-full sm:w-auto px-4 min-h-[38px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold shrink-0 transition-colors"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Upload Queue Progress & Individual Results */}
                  {uploadQueue.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>
                          Upload Queue ({uploadQueue.filter((i) => i.status === 'success').length}/
                          {uploadQueue.length} Completed)
                        </span>
                        <div className="flex items-center gap-2">
                          {uploadQueue.some((i) => i.status === 'error') && (
                            <button
                              type="button"
                              onClick={() => handleRetryFailedUploads(false)}
                              disabled={isUploadingMedia}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-[11px] font-semibold transition-colors disabled:opacity-50"
                            >
                              ↻ Retry Failed
                            </button>
                          )}
                          {!isUploadingMedia && (
                            <button
                              type="button"
                              onClick={() => setUploadQueue([])}
                              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                            >
                              Clear Queue
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {uploadQueue.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm shrink-0">{item.isVideo ? '🎥' : '📷'}</span>
                              <div className="truncate">
                                <span className="text-white font-medium truncate block">{item.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.isVideo ? 'VIDEO' : 'PHOTO'} · {item.format.toUpperCase()} ·{' '}
                                  {(item.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {item.status === 'pending' && (
                                <span className="text-[11px] text-slate-500 font-mono">Queued</span>
                              )}
                              {item.status === 'optimizing' && (
                                <span className="text-[11px] text-amber-400 font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                  Optimizing...
                                </span>
                              )}
                              {item.status === 'uploading' && (
                                <span className="text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                                  Uploading...
                                </span>
                              )}
                              {item.status === 'success' && (
                                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                                  ✓ Uploaded
                                </span>
                              )}
                              {item.status === 'error' && (
                                <span className="text-[11px] text-rose-400 font-medium" title={item.error}>
                                  ✕ {item.error || 'Failed'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {isMediaLoading ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
                      <div className="inline-block w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-slate-400 font-mono">
                        Synchronizing media assets for {editingProduct?.id || formState.id}...
                      </p>
                    </div>
                  ) : combinedAssets.length > 0 ? (
                    /* Visual Assets Gallery Sequence (Photos & Videos) */
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Attached Visual Assets ({combinedAssets.length})</span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          {combinedAssets.filter((a) => a.type === 'image').length} Photo(s) ·{' '}
                          {combinedAssets.filter((a) => a.type === 'video').length} Video(s)
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {combinedAssets.map((asset, idx) => (
                          <div
                            key={`${asset.url}-${idx}`}
                            className={`relative rounded-xl overflow-hidden border bg-slate-900 group transition-all ${
                              idx === 0
                                ? 'border-cyan-400 ring-2 ring-cyan-400/20 shadow-lg shadow-cyan-950/30'
                                : 'border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div
                              className="cursor-pointer overflow-hidden aspect-video sm:aspect-square bg-slate-950 flex items-center justify-center relative"
                              onClick={() => {
                                if (asset.type === 'video') {
                                  setPreviewVideo({
                                    url: asset.url,
                                    title: asset.title || `Specimen Video ${idx + 1}`,
                                  });
                                } else {
                                  setPreviewImage(asset.url);
                                }
                              }}
                              title={
                                asset.type === 'video'
                                  ? 'Click to play specimen video'
                                  : 'Click to view high-resolution photo'
                              }
                            >
                              {asset.type === 'video' ? (
                                <>
                                  <video
                                    src={asset.url}
                                    preload="metadata"
                                    muted
                                    className="w-full h-full object-cover pointer-events-none opacity-80"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-sm shadow-lg pl-0.5">
                                      ▶
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img
                                  src={asset.url}
                                  alt={asset.title || `Asset ${idx + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.opacity = '0.5';
                                  }}
                                />
                              )}
                            </div>

                            {/* Position & Type Badges */}
                            <div className="absolute top-2 left-2 flex items-center gap-1 pointer-events-none">
                              {idx === 0 ? (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono text-[9px] font-bold shadow">
                                  PRIMARY
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900/80 backdrop-blur-xs text-slate-400 font-mono text-[9px]">
                                  #{idx + 1}
                                </span>
                              )}
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold shadow ${
                                  asset.type === 'video'
                                    ? 'bg-purple-500/90 text-white'
                                    : 'bg-slate-900/80 text-slate-300'
                                }`}
                              >
                                {asset.type === 'video' ? '🎥 VIDEO' : '📷 PHOTO'}
                              </span>
                            </div>

                            {/* Hover / Persistent Action Bar */}
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2 flex items-center justify-between gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSetPrimaryAsset(idx)}
                                      className="px-1.5 py-1 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold hover:bg-cyan-500/30 transition-colors"
                                      title="Set as First in Sequence"
                                    >
                                      Main
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleMoveAsset(idx, 'left')}
                                      className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold hover:bg-slate-700 transition-colors"
                                      title="Move earlier"
                                    >
                                      ←
                                    </button>
                                  </>
                                )}
                                {idx < combinedAssets.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveAsset(idx, 'right')}
                                    className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold hover:bg-slate-700 transition-colors"
                                    title="Move later"
                                  >
                                    →
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCopyUrl(asset.url)}
                                  className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold hover:bg-slate-700 transition-colors"
                                  title="Copy URL"
                                >
                                  {copiedUrl === asset.url ? '✓' : '📋'}
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveAsset(idx)}
                                className="px-2 py-1 rounded bg-rose-600/80 text-white text-[10px] font-semibold hover:bg-rose-500 transition-colors"
                                title="Remove Asset"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : !mediaError ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
                      <span className="text-2xl block">📷 🎥</span>
                      <p className="text-slate-300 font-medium text-xs">
                        No photographic or video assets currently attached to this catalog record.
                      </p>
                      <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                        Drag and drop photos or specimen videos above, or provide an external URL. The marketplace
                        will display an authoritative blueprint fallback until verified imagery is attached.
                      </p>
                    </div>
                  ) : null}
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
                        <span className="text-slate-500 block text-[10px]">GOVERNANCE ID:</span>
                        <span className="text-cyan-300 font-bold">{editingProduct?.id || formState.id}</span>
                        {Boolean((formState as any).slug && (formState as any).slug !== (editingProduct?.id || formState.id)) && (
                          <span className="text-emerald-400 block text-[10px] mt-0.5 font-mono">
                            SLUG: {(formState as any).slug}
                          </span>
                        )}
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
                      <div className="col-span-2 pt-1 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-slate-500 text-[10px]">WARRANTY STATUS:</span>
                        <span className={`text-[11px] font-mono font-bold ${formState.warranty?.enabled ? 'text-emerald-400' : 'text-slate-400'}`}>
                          {formState.warranty?.enabled
                            ? `🛡️ ${formState.warranty.durationValue} ${formState.warranty.durationUnit} (${formState.warranty.provider === 'seller' ? 'Seller' : 'Manufacturer'})`
                            : '⊘ No Warranty'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-2 shrink-0">
              <div>
                {activeStep > 1 && (
                  <button
                    onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                    className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center"
                  >
                    ← Prev
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center"
                >
                  Cancel
                </button>

                {activeStep < 7 ? (
                  <button
                    onClick={() => setActiveStep((prev) => Math.min(7, prev + 1))}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold flex items-center"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProduct}
                    disabled={isSaving || !validationResults.isValid}
                    className="min-h-[44px] px-4 sm:px-6 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/40 disabled:opacity-50 transition-all flex items-center"
                  >
                    {isSaving ? 'Persisting...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── High-Resolution Media Preview Lightbox Modal ─────────────────── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#090f17] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                  📷 PHOTO PREVIEW
                </span>
                <span className="text-xs font-semibold text-slate-200">Asset High-Resolution Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[70vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={previewImage}
                alt="Enlarged Visual Asset"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <span className="truncate max-w-md text-slate-500">{previewImage}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewImage)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedUrl === previewImage ? '✓ Copied' : '📋 Copy URL'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── High-Resolution Specimen Video Preview Player Modal ───────────── */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#090f17] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-4 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                  🎥 SPECIMEN VIDEO
                </span>
                <span className="text-xs font-semibold text-slate-200 truncate">{previewVideo.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideo(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[65vh] flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <video
                src={previewVideo.url}
                controls
                playsInline
                preload="metadata"
                autoPlay={false}
                className="max-h-[65vh] w-auto max-w-full rounded-xl bg-black"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1">
              <span className="truncate max-w-md text-slate-500">{previewVideo.url}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyUrl(previewVideo.url)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedUrl === previewVideo.url ? '✓ Copied' : '📋 Copy URL'}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Media Asset Confirmation Modal ─────────────────────────── */}
      {mediaDeleteTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#090f17] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center text-xl">
              🗑
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Delete Media Asset?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete &quot;{mediaDeleteTarget.parentName || mediaDeleteTarget.id}&quot;?
                This will remove the binary asset from high-performance MongoDB storage. This action cannot be undone.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
              <div className="text-slate-400">ID: {mediaDeleteTarget.id}</div>
              <div className="text-slate-500 truncate">URL: {mediaDeleteTarget.url}</div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setMediaDeleteTarget(null)}
                disabled={isDeletingMedia}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMediaAsset(mediaDeleteTarget)}
                disabled={isDeletingMedia}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                {isDeletingMedia ? 'Deleting...' : 'Delete Permanently'}
              </button>
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
