'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PromotionsSubtab } from './types';

interface ControlOsPromotionsProps {
  initialSubtab?: PromotionsSubtab;
  showToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
  currentUser?: any;
}

interface ICoupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscount?: number;
  minSubtotal: number;
  startDate: string;
  expiryDate: string;
  status: 'draft' | 'active' | 'paused' | 'expired' | 'exhausted' | 'deactivated';
  totalUsageLimit?: number;
  perCustomerUsageLimit?: number;
  customerEligibility: 'all' | 'first_order' | 'existing';
  productRestrictions?: {
    includedProductIds?: string[];
    includedCategories?: string[];
    includedBrands?: string[];
    excludedProductIds?: string[];
    excludedCategories?: string[];
  };
  totalRedemptions: number;
  totalDiscountGranted: number;
  internalNotes?: string;
  createdBy?: string;
  createdAt: string;
}

interface IAnalytics {
  summary: {
    totalCoupons: number;
    activeCoupons: number;
    pausedCoupons: number;
    expiredCoupons: number;
    totalRedemptions: number;
    totalDiscountGranted: number;
    grossMerchandiseValue: number;
    netOrderRevenue: number;
  };
  topCoupons: Array<{
    code: string;
    couponId: string;
    redemptionCount: number;
    totalDiscount: number;
    totalRevenue: number;
  }>;
  recentRedemptions: Array<{
    id: string;
    couponCode: string;
    orderId: string;
    customerPhone: string;
    discountAmount: number;
    orderTotal: number;
    status: string;
    redeemedAt: string;
  }>;
}

export function ControlOsPromotions({
  initialSubtab = 'coupons',
  showToast,
  currentUser,
}: ControlOsPromotionsProps) {
  const [subtab, setSubtab] = useState<PromotionsSubtab>(initialSubtab);
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [analytics, setAnalytics] = useState<IAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<ICoupon | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);

  // Deactivation confirmation modal
  const [deactivatingCoupon, setDeactivatingCoupon] = useState<ICoupon | null>(null);
  const [deactivatingLoading, setDeactivatingLoading] = useState(false);

  // Redemptions inspector modal
  const [inspectedCoupon, setInspectedCoupon] = useState<ICoupon | null>(null);
  const [inspectedRedemptions, setInspectedRedemptions] = useState<any[]>([]);
  const [loadingInspected, setLoadingInspected] = useState(false);

  // Form Fields State
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [formDiscountValue, setFormDiscountValue] = useState<number | ''>(10);
  const [formMaxDiscount, setFormMaxDiscount] = useState<number | ''>('');
  const [formMinSubtotal, setFormMinSubtotal] = useState<number | ''>(0);
  const [formStartDate, setFormStartDate] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formStatus, setFormStatus] = useState<'draft' | 'active' | 'paused'>('active');
  const [formTotalLimit, setFormTotalLimit] = useState<number | ''>('');
  const [formPerCustomerLimit, setFormPerCustomerLimit] = useState<number | ''>(1);
  const [formCustomerEligibility, setFormCustomerEligibility] = useState<'all' | 'first_order' | 'existing'>('all');
  const [formIncludedCategories, setFormIncludedCategories] = useState('');
  const [formExcludedCategories, setFormExcludedCategories] = useState('');
  const [formIncludedProducts, setFormIncludedProducts] = useState('');
  const [formExcludedProducts, setFormExcludedProducts] = useState('');
  const [formInternalNotes, setFormInternalNotes] = useState('');

  // Lock background body scroll when any modal is active
  useEffect(() => {
    if (isEditorOpen || inspectedCoupon || deactivatingCoupon) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isEditorOpen, inspectedCoupon, deactivatingCoupon]);

  // ── Fetch Coupons ──────────────────────────────────────────────────────────
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '100');

      const res = await fetch(`/api/admin/promotions?${params.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCoupons(json.data);
      } else {
        if (showToast) showToast('error', 'Failed to load coupons', json.error || 'Server error');
      }
    } catch (err: any) {
      if (showToast) showToast('error', 'Network error', err.message);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  // ── Fetch Analytics ────────────────────────────────────────────────────────
  const fetchAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/admin/promotions/analytics');
      const json = await res.json();
      if (json.success && json.data) {
        setAnalytics(json.data);
      }
    } catch (err: any) {
      console.warn('Analytics fetch error:', err.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
    fetchAnalytics();
  }, [fetchCoupons, fetchAnalytics]);

  // ── Open Editor ────────────────────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDescription('');
    setFormDiscountType('percentage');
    setFormDiscountValue(10);
    setFormMaxDiscount('');
    setFormMinSubtotal(0);

    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    setFormStartDate(now.toISOString().slice(0, 10));
    setFormExpiryDate(future.toISOString().slice(0, 10));

    setFormStatus('active');
    setFormTotalLimit('');
    setFormPerCustomerLimit(1);
    setFormCustomerEligibility('all');
    setFormIncludedCategories('');
    setFormExcludedCategories('');
    setFormIncludedProducts('');
    setFormExcludedProducts('');
    setFormInternalNotes('');
    setEditorError(null);
    setIsEditorOpen(true);
  };

  const openEditModal = (coupon: ICoupon) => {
    setEditingCoupon(coupon);
    setFormCode(coupon.code);
    setFormDescription(coupon.description || '');
    setFormDiscountType(coupon.discountType);
    setFormDiscountValue(coupon.discountValue);
    setFormMaxDiscount(coupon.maxDiscount !== undefined ? coupon.maxDiscount : '');
    setFormMinSubtotal(coupon.minSubtotal || 0);

    setFormStartDate(coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : '');
    setFormExpiryDate(coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : '');

    setFormStatus(['draft', 'active', 'paused'].includes(coupon.status) ? (coupon.status as any) : 'active');
    setFormTotalLimit(coupon.totalUsageLimit !== undefined ? coupon.totalUsageLimit : '');
    setFormPerCustomerLimit(coupon.perCustomerUsageLimit !== undefined ? coupon.perCustomerUsageLimit : 1);
    setFormCustomerEligibility(coupon.customerEligibility || 'all');

    setFormIncludedCategories((coupon.productRestrictions?.includedCategories || []).join(', '));
    setFormExcludedCategories((coupon.productRestrictions?.excludedCategories || []).join(', '));
    setFormIncludedProducts((coupon.productRestrictions?.includedProductIds || []).join(', '));
    setFormExcludedProducts((coupon.productRestrictions?.excludedProductIds || []).join(', '));
    setFormInternalNotes(coupon.internalNotes || '');
    setEditorError(null);
    setIsEditorOpen(true);
  };

  // ── Save Coupon (Create or Update) ─────────────────────────────────────────
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim()) {
      setEditorError('Coupon code is required.');
      return;
    }
    if (formDiscountValue === '' || Number(formDiscountValue) <= 0) {
      setEditorError('Discount value must be greater than zero.');
      return;
    }
    if (!formExpiryDate) {
      setEditorError('Expiry date is required.');
      return;
    }

    setSavingCoupon(true);
    setEditorError(null);

    const payload = {
      code: formCode.trim().toUpperCase(),
      description: formDescription.trim(),
      discountType: formDiscountType,
      discountValue: Number(formDiscountValue),
      maxDiscount: formMaxDiscount !== '' ? Number(formMaxDiscount) : undefined,
      minSubtotal: formMinSubtotal !== '' ? Number(formMinSubtotal) : 0,
      startDate: formStartDate ? new Date(formStartDate).toISOString() : new Date().toISOString(),
      expiryDate: new Date(formExpiryDate).toISOString(),
      status: formStatus,
      totalUsageLimit: formTotalLimit !== '' ? Number(formTotalLimit) : undefined,
      perCustomerUsageLimit: formPerCustomerLimit !== '' ? Number(formPerCustomerLimit) : 1,
      customerEligibility: formCustomerEligibility,
      productRestrictions: {
        includedCategories: formIncludedCategories.split(',').map((s) => s.trim()).filter(Boolean),
        excludedCategories: formExcludedCategories.split(',').map((s) => s.trim()).filter(Boolean),
        includedProductIds: formIncludedProducts.split(',').map((s) => s.trim()).filter(Boolean),
        excludedProductIds: formExcludedProducts.split(',').map((s) => s.trim()).filter(Boolean),
      },
      internalNotes: formInternalNotes.trim(),
    };

    try {
      const url = editingCoupon ? `/api/admin/promotions/${editingCoupon.id}` : '/api/admin/promotions';
      const method = editingCoupon ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        if (showToast) {
          showToast(
            'success',
            editingCoupon ? 'Coupon Updated' : 'Coupon Created',
            `Coupon ${payload.code} has been successfully saved.`
          );
        }
        setIsEditorOpen(false);
        fetchCoupons();
        fetchAnalytics();
      } else {
        setEditorError(json.error || 'Failed to save coupon.');
      }
    } catch (err: any) {
      setEditorError(err.message || 'Network communication error.');
    } finally {
      setSavingCoupon(false);
    }
  };

  // ── Toggle Status (Active / Paused) ────────────────────────────────────────
  const handleToggleStatus = async (coupon: ICoupon) => {
    const nextStatus = coupon.status === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch(`/api/admin/promotions/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        if (showToast) {
          showToast(
            'success',
            nextStatus === 'active' ? 'Coupon Activated' : 'Coupon Paused',
            `Coupon ${coupon.code} is now ${nextStatus}.`
          );
        }
        fetchCoupons();
        fetchAnalytics();
      } else {
        if (showToast) showToast('error', 'Status Update Failed', json.error);
      }
    } catch (err: any) {
      if (showToast) showToast('error', 'Network Error', err.message);
    }
  };

  // ── Deactivate Coupon ──────────────────────────────────────────────────────
  const handleConfirmDeactivate = async () => {
    if (!deactivatingCoupon) return;
    setDeactivatingLoading(true);
    try {
      const res = await fetch(`/api/admin/promotions/${deactivatingCoupon.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        if (showToast) {
          showToast('success', 'Coupon Deactivated', `Coupon ${deactivatingCoupon.code} has been deactivated.`);
        }
        setDeactivatingCoupon(null);
        fetchCoupons();
        fetchAnalytics();
      } else {
        if (showToast) showToast('error', 'Deactivation Failed', json.error);
      }
    } catch (err: any) {
      if (showToast) showToast('error', 'Network Error', err.message);
    } finally {
      setDeactivatingLoading(false);
    }
  };

  // ── Inspect Redemptions ────────────────────────────────────────────────────
  const handleInspectRedemptions = async (coupon: ICoupon) => {
    setInspectedCoupon(coupon);
    setLoadingInspected(true);
    try {
      const res = await fetch(`/api/admin/promotions/${coupon.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setInspectedRedemptions(json.data.redemptions || []);
      }
    } catch (err: any) {
      console.warn('Error loading coupon redemptions:', err.message);
    } finally {
      setLoadingInspected(false);
    }
  };

  // ── Status Badge Styler ────────────────────────────────────────────────────
  const renderStatusBadge = (status: ICoupon['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            ● ACTIVE
          </span>
        );
      case 'paused':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            ❚❚ PAUSED
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            ◌ DRAFT
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            ✕ EXPIRED
          </span>
        );
      case 'exhausted':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            ▲ EXHAUSTED
          </span>
        );
      case 'deactivated':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-500 border border-slate-700">
            ✕ DEACTIVATED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Subtab Navigation & Top Action Strip ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          {(['coupons', 'analytics', 'redemptions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSubtab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                subtab === tab
                  ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab === 'coupons' ? '🏷️' : tab === 'analytics' ? '📊' : '📜'}</span>
              <span>{tab === 'coupons' ? 'Coupons Registry' : tab === 'analytics' ? 'Campaign Analytics' : 'Redemptions Ledger'}</span>
            </button>
          ))}
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all self-start sm:self-auto"
        >
          <span>＋</span>
          <span>Create Coupon</span>
        </button>
      </div>

      {/* ── Analytics KPI Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#07131e] border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Campaigns
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-white font-mono">
              {analytics?.summary.activeCoupons ?? '—'}
            </span>
            <span className="text-xs font-mono text-emerald-400 font-semibold">
              {analytics?.summary.totalCoupons ?? 0} total
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#07131e] border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Total Redemptions
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              {analytics?.summary.totalRedemptions ?? '—'}
            </span>
            <span className="text-xs text-slate-500 font-mono">Completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#07131e] border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Discounts Granted
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              ₹{(analytics?.summary.totalDiscountGranted ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-emerald-400/70 font-mono">Savings</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#07131e] border border-slate-800/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Net Campaign Revenue
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-300 font-mono">
              ₹{(analytics?.summary.netOrderRevenue ?? 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-amber-400/70 font-mono">Realized</span>
          </div>
        </div>
      </div>

      {/* ── SUBTAB 1: COUPONS REGISTRY ─────────────────────────────────────── */}
      {subtab === 'coupons' && (
        <div className="space-y-4">
          {/* Search & Filters FilterBar */}
          <div className="p-3 rounded-2xl bg-[#07131e] border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search by code or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-xl bg-black/40 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <span className="absolute left-2.5 top-2.5 text-xs text-slate-500">🔍</span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
              {['all', 'active', 'paused', 'draft', 'expired', 'exhausted', 'deactivated'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    statusFilter === st
                      ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40'
                      : 'text-slate-400 hover:text-white bg-slate-900/40 border border-transparent'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Coupons Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#07131e] overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                Querying authoritative promotions database...
              </div>
            ) : coupons.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <span className="text-3xl block">🏷️</span>
                <p className="text-sm font-semibold text-slate-300">No promotion coupons found</p>
                <p className="text-xs text-slate-500">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your search query or status filter.'
                    : 'Create your first promotional discount coupon to get started.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="p-3 pl-4">Coupon Code</th>
                      <th className="p-3">Discount</th>
                      <th className="p-3">Min Subtotal</th>
                      <th className="p-3">Eligibility</th>
                      <th className="p-3">Usage</th>
                      <th className="p-3">Validity</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {coupons.map((c) => {
                      const isExpired = new Date(c.expiryDate) < new Date();
                      const usagePercent =
                        c.totalUsageLimit && c.totalUsageLimit > 0
                          ? Math.min(100, Math.round((c.totalRedemptions / c.totalUsageLimit) * 100))
                          : null;

                      return (
                        <tr key={c.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white tracking-wider text-sm">
                                {c.code}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(c.code);
                                  if (showToast) showToast('info', 'Code Copied', `${c.code} copied to clipboard`);
                                }}
                                className="text-slate-500 hover:text-cyan-400 transition-colors text-xs"
                                title="Copy code"
                              >
                                📋
                              </button>
                            </div>
                            {c.description && (
                              <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">{c.description}</p>
                            )}
                          </td>

                          <td className="p-3 font-mono">
                            <span className="font-bold text-emerald-400">
                              {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue.toLocaleString('en-IN')}`}
                            </span>
                            {c.discountType === 'percentage' && c.maxDiscount && (
                              <span className="text-[10px] text-slate-400 block">
                                Max ₹{c.maxDiscount.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          <td className="p-3 font-mono text-slate-300">
                            {c.minSubtotal > 0 ? `₹${c.minSubtotal.toLocaleString('en-IN')}` : '₹0 (None)'}
                          </td>

                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-900 border border-slate-800 text-slate-300">
                              {c.customerEligibility === 'first_order'
                                ? 'First Order'
                                : c.customerEligibility === 'existing'
                                ? 'Existing Only'
                                : 'All Clients'}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="font-mono text-slate-300 text-[11px]">
                              <span className="font-bold text-white">{c.totalRedemptions}</span>
                              {c.totalUsageLimit ? ` / ${c.totalUsageLimit}` : ' (Unlimited)'}
                            </div>
                            {usagePercent !== null && (
                              <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
                                <div
                                  className={`h-full ${usagePercent >= 100 ? 'bg-orange-400' : 'bg-cyan-400'}`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-[11px] font-mono text-slate-400">
                            <div>{new Date(c.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
                            <div className={isExpired ? 'text-rose-400 font-bold' : ''}>
                              → {new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                          </td>

                          <td className="p-3">{renderStatusBadge(c.status)}</td>

                          <td className="p-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleInspectRedemptions(c)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                                title="View redemptions"
                              >
                                📜
                              </button>

                              {c.status !== 'deactivated' && (
                                <button
                                  onClick={() => handleToggleStatus(c)}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                                    c.status === 'active'
                                      ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                  }`}
                                  title={c.status === 'active' ? 'Pause coupon' : 'Activate coupon'}
                                >
                                  {c.status === 'active' ? '❚❚' : '▶'}
                                </button>
                              )}

                              <button
                                onClick={() => openEditModal(c)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                                title="Edit parameters"
                              >
                                ✏️
                              </button>

                              {c.status !== 'deactivated' && (
                                <button
                                  onClick={() => setDeactivatingCoupon(c)}
                                  className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-medium"
                                  title="Deactivate coupon"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUBTAB 2: CAMPAIGN ANALYTICS ───────────────────────────────────── */}
      {subtab === 'analytics' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800/80 bg-[#07131e] p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
              Top Performing Promotional Campaigns
            </h3>
            {loadingAnalytics ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading campaign analytics...</div>
            ) : !analytics?.topCoupons || analytics.topCoupons.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No redemption data available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                      <th className="p-3">Rank</th>
                      <th className="p-3">Coupon Code</th>
                      <th className="p-3">Completed Redemptions</th>
                      <th className="p-3">Total Discount Granted</th>
                      <th className="p-3">Order Revenue Generated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {analytics.topCoupons.map((tc, idx) => (
                      <tr key={tc.code} className="hover:bg-slate-900/30">
                        <td className="p-3 text-slate-500">#{idx + 1}</td>
                        <td className="p-3 font-bold text-white">{tc.code}</td>
                        <td className="p-3 text-cyan-300 font-bold">{tc.redemptionCount}</td>
                        <td className="p-3 text-emerald-400">₹{tc.totalDiscount.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-amber-300">₹{tc.totalRevenue.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUBTAB 3: REDEMPTIONS LEDGER ───────────────────────────────────── */}
      {subtab === 'redemptions' && (
        <div className="rounded-2xl border border-slate-800/80 bg-[#07131e] p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
            Authoritative Redemptions Ledger
          </h3>
          {!analytics?.recentRedemptions || analytics.recentRedemptions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No coupon redemptions recorded in the ledger yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Coupon Code</th>
                    <th className="p-3">Customer Phone</th>
                    <th className="p-3">Discount Amount</th>
                    <th className="p-3">Final Order Total</th>
                    <th className="p-3">Redemption Date</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {analytics.recentRedemptions.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/30">
                      <td className="p-3 font-bold text-cyan-300">#{r.orderId}</td>
                      <td className="p-3 font-bold text-amber-300">{r.couponCode}</td>
                      <td className="p-3 text-slate-300">{r.customerPhone}</td>
                      <td className="p-3 text-emerald-400">-₹{r.discountAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-white">₹{r.orderTotal.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-slate-400">
                        {new Date(r.redeemedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: CREATE / EDIT COUPON ──────────────────────────────────── */}
      {isEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setIsEditorOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0b1622] border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-auto max-h-[92vh] sm:max-h-[90vh] my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleSaveCoupon} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Modal Header (Pinned) */}
              <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0b1622]">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏷️</span>
                  <h3 className="text-base font-bold text-white">
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create New Promotional Coupon'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body (Scrollable with min-h-0 and overscroll-contain) */}
              <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs overscroll-contain">
                {editorError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{editorError}</span>
                  </div>
                )}

                {/* Row 1: Code + Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Coupon Code *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CORAL20"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Alphanumeric, case-insensitive (e.g. CORAL20)
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Initial Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="active">Active (Available for checkout)</option>
                      <option value="draft">Draft (Inactive)</option>
                      <option value="paused">Paused (Temporarily disabled)</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Description */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Public Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Special 15% inaugural client reward"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Row 3: Discount Type + Value + Max Cap */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Discount Type *
                    </label>
                    <select
                      value={formDiscountType}
                      onChange={(e) => setFormDiscountType(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Monetary (₹ INR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Discount Value * {formDiscountType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={formDiscountType === 'percentage' ? 100 : undefined}
                      value={formDiscountValue}
                      onChange={(e) => setFormDiscountValue(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Max Cap (₹, optional)
                    </label>
                    <input
                      type="number"
                      min={1}
                      disabled={formDiscountType !== 'percentage'}
                      placeholder="No cap"
                      value={formMaxDiscount}
                      onChange={(e) => setFormMaxDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono disabled:opacity-30 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Row 4: Minimum Subtotal & Customer Tier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Min Merchandise Subtotal (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formMinSubtotal}
                      onChange={(e) => setFormMinSubtotal(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Customer Eligibility
                    </label>
                    <select
                      value={formCustomerEligibility}
                      onChange={(e) => setFormCustomerEligibility(e.target.value as any)}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="all">All Clients</option>
                      <option value="first_order">First Order Only</option>
                      <option value="existing">Existing Clients Only</option>
                    </select>
                  </div>
                </div>

                {/* Row 5: Start & Expiry Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Row 6: Usage Limits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Total Global Usage Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      value={formTotalLimit}
                      onChange={(e) => setFormTotalLimit(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Per-Customer Usage Limit
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formPerCustomerLimit}
                      onChange={(e) => setFormPerCustomerLimit(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-black/50 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Row 7: Category Restrictions */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                    Category Restrictions (Comma-separated)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                        Included Categories (e.g. marine-life, corals)
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank for all categories"
                        value={formIncludedCategories}
                        onChange={(e) => setFormIncludedCategories(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-rose-400 block mb-1">
                        Excluded Categories (Strict Override)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. lighting, equipment"
                        value={formExcludedCategories}
                        onChange={(e) => setFormExcludedCategories(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 8: Product Restrictions */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">
                    Product Restrictions (Comma-separated IDs)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">
                        Included Product IDs
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank for all products"
                        value={formIncludedProducts}
                        onChange={(e) => setFormIncludedProducts(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-rose-400 block mb-1">
                        Excluded Product IDs (Strict Override)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. nemo-extreme-led"
                        value={formExcludedProducts}
                        onChange={(e) => setFormExcludedProducts(e.target.value)}
                        className="w-full h-9 px-3 rounded-xl bg-black/40 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 9: Internal Notes */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Internal Administrative Notes (Never exposed to customers)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Campaign reference, client agreement rationale..."
                    value={formInternalNotes}
                    onChange={(e) => setFormInternalNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Modal Footer (Pinned) */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-bold uppercase tracking-wider shadow-lg transition-colors"
                >
                  {savingCoupon ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CONFIRM DEACTIVATION ──────────────────────────────────── */}
      {deactivatingCoupon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setDeactivatingCoupon(null)}
        >
          <div
            className="bg-[#0b1622] border border-rose-500/30 rounded-2xl sm:rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-rose-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-bold text-white">Deactivate Coupon?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to deactivate <strong className="text-white font-mono">{deactivatingCoupon.code}</strong>?
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              🔒 In accordance with data preservation rules, the coupon will be marked as <strong className="text-white font-mono">deactivated</strong> rather than deleted. Historical order and invoice records referencing this coupon will remain completely intact.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivatingCoupon(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deactivatingLoading}
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                {deactivatingLoading ? 'Deactivating...' : 'Confirm Deactivation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: INSPECT REDEMPTIONS ───────────────────────────────────── */}
      {inspectedCoupon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
          onClick={() => setInspectedCoupon(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-[#0b1622] border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col h-auto max-h-[92vh] sm:max-h-[88vh] my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-[#0b1622]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">📜</span>
                  <h3 className="text-base font-bold text-white">
                    Redemption History: <span className="font-mono text-cyan-300">{inspectedCoupon.code}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total Redemptions: {inspectedCoupon.totalRedemptions} • Granted: ₹{inspectedCoupon.totalDiscountGranted.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedCoupon(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
              {loadingInspected ? (
                <div className="p-8 text-center text-xs text-slate-400 font-mono">Loading redemption records...</div>
              ) : inspectedRedemptions.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-6 text-center">No redemptions recorded for this coupon yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-semibold">
                        <th className="p-2.5">Order ID</th>
                        <th className="p-2.5">Client Phone</th>
                        <th className="p-2.5">Eligible Subtotal</th>
                        <th className="p-2.5">Discount</th>
                        <th className="p-2.5">Order Total</th>
                        <th className="p-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {inspectedRedemptions.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-900/30">
                          <td className="p-2.5 text-cyan-300 font-bold">#{r.orderId}</td>
                          <td className="p-2.5 text-slate-300">{r.customerPhone}</td>
                          <td className="p-2.5 text-slate-400">₹{r.eligibleSubtotal?.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-emerald-400 font-bold">-₹{r.discountAmount?.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-white">₹{r.orderTotal?.toLocaleString('en-IN')}</td>
                          <td className="p-2.5 text-slate-400">
                            {new Date(r.redeemedAt || r.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={() => setInspectedCoupon(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

