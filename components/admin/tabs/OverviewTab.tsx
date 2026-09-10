'use client';

import React from 'react';
import { useCatalog } from '@/lib/context/CatalogContext';
import { useOrder } from '@/lib/context/OrderContext';
import { AdminTab } from '../types';

interface OverviewTabProps {
  onNewProduct: () => void;
  onSwitchTab: (tab: AdminTab) => void;
}

export default function OverviewTab({ onNewProduct, onSwitchTab }: OverviewTabProps) {
  const { products, banners, inquiries } = useCatalog();
  const { orders } = useOrder();

  const totalInventoryValue = products.reduce(
    (sum, p) => sum + (p.price || 0) * (p.stockCount || 0),
    0
  );

  const outOfStockItems = products.filter(
    (p) => !p.inStock || (p.stockCount !== undefined && p.stockCount <= 0)
  );

  return (
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
            onClick={onNewProduct}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-cyan-400/50 transition-colors flex items-center gap-3.5"
          >
            <span className="text-2xl">➕</span>
            <div>
              <h4 className="text-sm font-bold text-white">Add New Product</h4>
              <p className="text-xs text-slate-400">Post new corals, fish, or lights</p>
            </div>
          </button>

          <button
            onClick={() => onSwitchTab('orders')}
            className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left hover:border-cyan-400/50 transition-colors flex items-center gap-3.5"
          >
            <span className="text-2xl">📦</span>
            <div>
              <h4 className="text-sm font-bold text-white">Live Dispatches</h4>
              <p className="text-xs text-slate-400">{orders.length} orders tracked</p>
            </div>
          </button>

          <button
            onClick={() => onSwitchTab('inquiries')}
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
  );
}
