'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/lib/context/CatalogContext';
import { Product } from '@/lib/data/products';
import { ProductFormModal } from '../modals/ProductFormModal';

interface ProductsTabProps {
  passcode: string;
  showToast: (msg: string) => void;
  createTrigger?: number;
}

export function ProductsTab({ passcode, showToast, createTrigger }: ProductsTabProps) {
  const { products, addProduct, updateProduct, deleteProduct } = useCatalog();

  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [adminViewMode, setAdminViewMode] = useState<'grid' | 'table'>('grid');

  // Product Form Modal State
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.scientificName && p.scientificName.toLowerCase().includes(productSearch.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()));

      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, productSearch, categoryFilter]);

  const handleEditProductClick = (product: Product) => {
    const existingMedia = product.media && product.media.length > 0
      ? product.media
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

  useEffect(() => {
    if (createTrigger && createTrigger > 0) {
      handleNewProductClick();
    }
  }, [createTrigger]);

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
      itemType: (productForm.category || 'marine-life') === 'marine-life' ? 'live' : 'dry',
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
      deliveryInfo: (productForm.category || 'marine-life') === 'marine-life'
        ? {
            estimatedDays: 'Next-Day Express Dispatch Across India',
            shippingMethod: 'Oxygenated Insulated Thermal Pod Courier',
            guaranteeText: '100% Live Arrival Guaranteed',
          }
        : {
            estimatedDays: '2–5 Business Days',
            shippingMethod: 'Standard Tracked Courier',
            guaranteeText: 'Safe Delivery & Damage Protection Guarantee',
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

  const handleQuickStockChange = (p: Product, delta: number) => {
    const newStock = Math.max(0, p.stockCount + delta);
    updateProduct(p.id, {
      stockCount: newStock,
      inStock: newStock > 0,
    });
  };

  return (
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

      {/* Product Edit / Create Modal */}
      <ProductFormModal
        isOpen={isEditingProduct}
        editingProductId={editingProductId}
        productForm={productForm}
        setProductForm={setProductForm}
        onClose={() => {
          setIsEditingProduct(false);
          setEditingProductId(null);
        }}
        onSave={handleSaveProduct}
        passcode={passcode}
        showToast={showToast}
      />

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

      {/* Products Presentation (Table or Grid) */}
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
        /* Table View for Desktop */
        <div className="bg-[#071520] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Price</th>
                  <th className="py-3.5 px-3">Stock Units</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map((p) => {
                  const isOut = !p.inStock || p.stockCount <= 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-cover bg-black shrink-0 border border-slate-800"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-white text-sm block truncate max-w-xs sm:max-w-sm">
                              {p.name}
                            </span>
                            {p.scientificName && (
                              <span className="text-[11px] text-slate-400 italic block truncate max-w-xs">
                                {p.scientificName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 capitalize font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold">
                          {p.category.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-cyan-400 text-sm">
                          ₹{p.price.toLocaleString('en-IN')}
                        </span>
                        {p.originalPrice && (
                          <span className="text-[10px] text-slate-500 line-through block">
                            ₹{p.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(p, -1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs"
                          >
                            −
                          </button>
                          <span className={`w-8 text-center font-mono font-bold ${isOut ? 'text-red-400' : 'text-white'}`}>
                            {p.stockCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickStockChange(p, 1)}
                            className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => {
                            const newInStock = !p.inStock;
                            updateProduct(p.id, { inStock: newInStock });
                            showToast(newInStock ? 'Marked In Stock' : 'Marked Out of Stock');
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            p.inStock
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}
                        >
                          <span>{p.inStock ? '●' : '○'}</span>
                          <span>{p.inStock ? 'Active' : 'Hidden'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/marketplace/${p.id}`}
                            target="_blank"
                            className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1"
                          >
                            <span>↗</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleEditProductClick(p)}
                            className="h-8 px-3 rounded-lg bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-300 text-xs font-semibold border border-cyan-400/30"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete "${p.name}" from catalog?`)) {
                                deleteProduct(p.id);
                                showToast(`Deleted "${p.name}"`);
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
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const isOut = !p.inStock || p.stockCount <= 0;

            return (
              <div
                key={p.id}
                className="bg-[#071520] border border-slate-800 rounded-3xl p-5 hover:border-slate-700 transition-all shadow-md flex flex-col justify-between gap-4"
              >
                {/* Top Row: Thumbnail + Title + Price */}
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
  );
}

export default ProductsTab;
