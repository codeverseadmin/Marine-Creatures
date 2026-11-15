'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  useOrder,
  CustomerOrder,
  OrderProgressStep,
  TRACKING_STEPS_META,
} from '@/lib/context/OrderContext';
import { useInvoicePdfShare } from '@/lib/hooks/useInvoicePdfShare';
import PorPriceSettlementModal from '@/components/admin/PorPriceSettlementModal';
import { isPartnerShipmentOrder } from '@/lib/fulfillment-utils';

interface OrdersTabProps {
  showToast: (message: string) => void;
}

const ORDER_STEPS: { key: OrderProgressStep; label: string; stepNumber: number; icon: string }[] = [
  { key: 'placed', label: 'Confirmed', stepNumber: 1, icon: '🧾' },
  { key: 'quarantine', label: 'Quarantine', stepNumber: 2, icon: '🔬' },
  { key: 'packed', label: 'Packed', stepNumber: 3, icon: '📦' },
  { key: 'dispatched', label: 'Dispatched', stepNumber: 4, icon: '✈️' },
  { key: 'delivered', label: 'Delivered', stepNumber: 5, icon: '🐠' },
];

export default function OrdersTab({ showToast }: OrdersTabProps) {
  const {
    orders,
    updateOrderStatus,
    updateOrderTracking,
    setOrderPorPricing,
    deleteOrder,
    approveOrder,
    refreshOrders,
  } = useOrder();

  // ── PDF share state — tracked per-order ID ──────────────────────────────
  const [sharingOrderId, setSharingOrderId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [desktopNoticeOrderId, setDesktopNoticeOrderId] = useState<string | null>(null);

  // ── POR Pricing Settlement Modal State ─────────────────────────────────────
  const [pricingModalOrder, setPricingModalOrder] = useState<CustomerOrder | null>(null);
  const [pendingActionAfterPricing, setPendingActionAfterPricing] = useState<(() => void) | null>(null);

  const orderHasUnresolvedPor = useCallback((order: CustomerOrder): boolean => {
    if (order.hasUnresolvedPorItems) return true;
    return (order.items || []).some(
      (it) =>
        (it.priceOnRequest || it.pricingStatus === 'PENDING_POR' || it.product?.price === 0) &&
        (!it.agreedUnitPrice || it.agreedUnitPrice <= 0)
    );
  }, []);

  const orderHasAnyPor = useCallback((order: CustomerOrder): boolean => {
    return (order.items || []).some(
      (it) => it.priceOnRequest || it.pricingStatus === 'PENDING_POR' || it.product?.price === 0 || it.agreedUnitPrice
    );
  }, []);

  const handleOpenPricingModal = useCallback((order: CustomerOrder, pendingAction?: () => void) => {
    setPricingModalOrder(order);
    setPendingActionAfterPricing(pendingAction ? () => pendingAction : null);
  }, []);

  const {
    state: shareState,
    dispatchMode,
    downloadedFilename,
    share: sharePdf,
    dismissNotice,
  } = useInvoicePdfShare({
    onStateChange: (state, message, mode) => {
      if (state === 'loading' || state === 'sharing') return;
      if (state === 'done') {
        if (mode === 'desktop-download') {
          showToast('✓ Invoice PDF downloaded. WhatsApp opened.');
        } else {
          showToast('✓ Invoice shared via WhatsApp.');
        }
        setSharingOrderId(null);
      }
      if (state === 'error') {
        setShareError(message || 'Invoice PDF dispatch failed');
        setSharingOrderId(null);
      }
      if (state === 'idle') {
        setSharingOrderId(null);
      }
    },
  });

  const handleShareInvoicePdf = useCallback(async (order: CustomerOrder) => {
    if (sharingOrderId) return;

    // Intercept: Prevent generating or sending invoice if order contains unresolved POR specimens
    if (orderHasUnresolvedPor(order)) {
      showToast('⚠️ Please agree on POR pricing before dispatching invoice');
      handleOpenPricingModal(order, () => handleShareInvoicePdf(order));
      return;
    }

    setSharingOrderId(order.id);
    setShareError(null);
    setDesktopNoticeOrderId(order.id);

    await sharePdf(order.id, {
      customerName:  order.customerName,
      phone:         order.phone,
      invoiceNumber: order.invoiceNumber,
      totalAmount:   order.totalAmount,
      courierName:   order.courierName,
      awbNumber:     order.awbNumber,
      approvedAt:    order.approvedAt,
      createdAt:     order.createdAt,
    });
  }, [sharingOrderId, sharePdf, orderHasUnresolvedPor, handleOpenPricingModal, showToast]);

  const handleSavePricingFromModal = async (
    itemsToUpdate: Array<{ id: string; name: string; agreedUnitPrice: number }>,
    isFullSettlement: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!pricingModalOrder) return { success: false, error: 'No order selected.' };

    const result = await setOrderPorPricing(
      pricingModalOrder.id,
      itemsToUpdate,
      'Admin Concierge',
      pricingModalOrder.pricingVersion
    );

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to save agreed POR pricing.' };
    }

    if (isFullSettlement) {
      showToast(`✓ Pricing settled and official invoice generated for #${pricingModalOrder.id}`);
      if (pendingActionAfterPricing) {
        pendingActionAfterPricing();
        setPendingActionAfterPricing(null);
      }
    } else {
      const remainingCount = (pricingModalOrder.items || []).filter((it) => {
        const isPor = it.priceOnRequest || it.pricingStatus === 'PENDING_POR' || it.product?.price === 0;
        const updated = itemsToUpdate.find((u) => u.id === (it.product.id || (it as any).id) || u.name === it.product.name);
        return isPor && !updated;
      }).length;
      showToast(`✓ Saved partial pricing. ${remainingCount} item(s) still pending settlement.`);
    }

    return { success: true };
  };

  const handleGenerateInvoiceClick = useCallback((order: CustomerOrder) => {
    if (orderHasUnresolvedPor(order)) {
      showToast('⚠️ Price On Request settlement is pending. Please confirm agreed prices.');
      handleOpenPricingModal(order, () => {
        window.open(`/invoice/${order.id}`, '_blank');
      });
    } else {
      window.open(`/invoice/${order.id}`, '_blank');
    }
  }, [orderHasUnresolvedPor, handleOpenPricingModal, showToast]);

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState<{ awb: string; courier: string; isPartner: boolean }>({
    awb: '',
    courier: '',
    isPartner: false,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync from database on mount
  React.useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshOrders();
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('✓ Orders refreshed');
    }, 400);
  };

  const getNextStep = (current: OrderProgressStep): { key: OrderProgressStep; label: string } | null => {
    const idx = ORDER_STEPS.findIndex((s) => s.key === current);
    if (idx >= 0 && idx < ORDER_STEPS.length - 1) {
      return ORDER_STEPS[idx + 1];
    }
    return null;
  };

  const handleSaveTracking = (orderId: string) => {
    updateOrderTracking(
      orderId,
      trackingForm.isPartner ? trackingForm.awb.trim() : '',
      trackingForm.isPartner ? (trackingForm.courier.trim() || 'Priority Air Cargo Express') : '',
      { isShippedViaPartner: trackingForm.isPartner }
    );
    setEditingTrackingOrderId(null);
    showToast(
      trackingForm.isPartner
        ? `✓ Partner Cargo tracking updated for #${orderId}`
        : `✓ Configured as Direct Handover for #${orderId}`
    );
  };

  const filteredOrders = orders.filter((order) => {
    const query = orderSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      order.id.toLowerCase().includes(query) ||
      order.customerName.toLowerCase().includes(query) ||
      order.phone.includes(query) ||
      order.city.toLowerCase().includes(query);

    const matchesStatus =
      orderStatusFilter === 'all' || order.currentStep === orderStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* ── Top Bar & Stats ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>📦</span>
            <span>Customer Orders</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View orders, advance delivery stages, and send updates to customers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <span className={isRefreshing ? 'animate-spin text-cyan-400' : ''}>↻</span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <span className="h-10 px-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center">
            Total: <strong className="text-cyan-400 ml-1.5">{orders.length}</strong>
          </span>
        </div>
      </div>

      {/* ── Search Bar & Filter Tabs ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by customer name, mobile number, city, or order ID..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-[#071520] border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'placed', label: 'Confirmed', count: orders.filter((o) => o.currentStep === 'placed').length },
            { id: 'quarantine', label: 'Quarantine', count: orders.filter((o) => o.currentStep === 'quarantine').length },
            { id: 'packed', label: 'Packed', count: orders.filter((o) => o.currentStep === 'packed').length },
            { id: 'dispatched', label: 'Dispatched', count: orders.filter((o) => o.currentStep === 'dispatched').length },
            { id: 'delivered', label: 'Delivered', count: orders.filter((o) => o.currentStep === 'delivered').length },
          ].map((tab) => {
            const isActive = orderStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setOrderStatusFilter(tab.id)}
                className={`h-9 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Orders List ──────────────────────────────────────────────── */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#071520] border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <span className="text-4xl block">📦</span>
          <h3 className="text-base font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {orderSearch || orderStatusFilter !== 'all'
              ? 'No orders match your search or filter.'
              : 'New customer orders will appear here automatically.'}
          </p>
          {(orderSearch || orderStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setOrderSearch('');
                setOrderStatusFilter('all');
              }}
              className="text-xs font-semibold text-cyan-400 underline pt-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const currentStepIdx = ORDER_STEPS.findIndex((s) => s.key === order.currentStep);
            const currentMeta = TRACKING_STEPS_META[order.currentStep];
            const nextStep = getNextStep(order.currentStep);
            const isEditingTracking = editingTrackingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-[#071520] border border-slate-800/90 rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl hover:border-slate-700 transition-all"
              >
                {/* 1. Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg sm:text-xl font-bold text-cyan-400 tracking-tight">
                      #{order.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {order.createdAt}
                    </span>
                    {order.isApproved && (
                      <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                        ✓ Invoiced
                      </span>
                    )}
                    {orderHasUnresolvedPor(order) ? (
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <span>⚠️</span>
                        <span>POR Pricing Required</span>
                      </span>
                    ) : orderHasAnyPor(order) ? (
                      <span className="text-[11px] font-semibold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                        <span>✓</span>
                        <span>Agreed POR Pricing</span>
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Current Status Pill */}
                    <div className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <span>{currentMeta.icon}</span>
                      <span>{currentMeta.label}</span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm(`Delete order #${order.id}?`)) {
                          deleteOrder(order.id);
                          showToast(`Order #${order.id} deleted`);
                        }
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 flex items-center justify-center text-xs transition-colors"
                      title="Delete Order"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* 2. Customer Info & Ordered Items Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Customer & Delivery Address */}
                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block">
                      Customer &amp; Delivery Details
                    </span>

                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">👤 Name:</span>
                        <strong className="text-white font-semibold">{order.customerName}</strong>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-400">📞 Phone:</span>
                        <span className="text-white font-mono">{order.phone}</span>
                        <a
                          href={`https://wa.me/${order.phone.replace(/\D/g, '').length === 10 ? '91' + order.phone.replace(/\D/g, '') : order.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 transition-colors"
                          title="Open WhatsApp chat with customer"
                        >
                          <span>💬</span>
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      <div className="flex items-start gap-2 pt-1">
                        <span className="text-slate-400 shrink-0">📍 Address:</span>
                        <span className="text-slate-200">
                          {order.address ? `${order.address}, ` : ''}{order.city} ({order.pincode})
                        </span>
                      </div>

                      {order.orderNotes && (
                        <div className="pt-2 text-xs text-amber-300/90 italic">
                          Special Note: &ldquo;{order.orderNotes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Ordered Items */}
                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
                        Items Ordered ({order.items.length})
                      </span>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {order.items.map((item, idx) => {
                          const isPor = Boolean(
                            item.priceOnRequest ||
                            item.pricingStatus === 'PENDING_POR' ||
                            item.product.price === 0
                          );
                          const isAgreed = typeof item.agreedUnitPrice === 'number' && item.agreedUnitPrice > 0;
                          const effectiveUnitPrice = isAgreed ? item.agreedUnitPrice! : item.product.price;

                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-3 text-xs py-1.5 border-b border-slate-900 last:border-0"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img
                                  src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100&q=80'}
                                  alt={item.product.name}
                                  className="w-8 h-8 rounded-lg object-cover bg-slate-800 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <p className="font-semibold text-white truncate">{item.product.name}</p>
                                    {isPor && !isAgreed && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        POR
                                      </span>
                                    )}
                                    {isPor && isAgreed && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                        ✓ Agreed
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-400">Qty: {item.quantity}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {effectiveUnitPrice > 0 ? (
                                  <>
                                    <span className="font-mono font-bold text-cyan-300 block">
                                      ₹{(effectiveUnitPrice * item.quantity).toLocaleString('en-IN')}
                                    </span>
                                    {isAgreed && isPor && (
                                      <span className="text-[10px] text-slate-400 block">
                                        (₹{effectiveUnitPrice.toLocaleString('en-IN')}/ea)
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-amber-400 font-mono text-[11px]">Pricing Required</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Total Amount:</span>
                      <span className="text-base sm:text-lg font-bold text-cyan-400 font-mono">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Linear Milestone Stepper (Clickable, Intuitive) */}
                <div className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/70">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>Delivery Status Milestones</span>
                    </span>

                    {nextStep && (
                      <button
                        onClick={() => {
                          updateOrderStatus(order.id, nextStep.key);
                          showToast(`✓ Updated to ${nextStep.label}`);
                        }}
                        className="h-9 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                      >
                        <span>Advance to {nextStep.label}</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>

                  {/* 5-Step Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {ORDER_STEPS.map((step, idx) => {
                      const isCurrent = order.currentStep === step.key;
                      const isPassed = currentStepIdx > idx;

                      return (
                        <button
                          key={step.key}
                          onClick={() => {
                            updateOrderStatus(order.id, step.key);
                            showToast(`✓ Order #${order.id} marked as ${step.label}`);
                          }}
                          className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col gap-1 ${
                            isCurrent
                              ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md ring-1 ring-cyan-400/40'
                              : isPassed
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/30'
                              : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{step.icon}</span>
                            <span className="text-[10px] opacity-70">Step {step.stepNumber}</span>
                          </div>
                          <span className="font-bold text-xs truncate">{step.label}</span>
                          <span className="text-[10px] font-medium">
                            {isCurrent ? (
                              <span className="text-cyan-300 font-bold">● Current</span>
                            ) : isPassed ? (
                              <span className="text-emerald-400">✓ Done</span>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Actions & Tracking Row */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800/80">
                  {/* Primary Customer Actions */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Set / Edit POR Pricing Button */}
                      {orderHasAnyPor(order) && (
                        <button
                          type="button"
                          onClick={() => handleOpenPricingModal(order)}
                          className={`h-10 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm ${
                            orderHasUnresolvedPor(order)
                              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                              : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                          }`}
                        >
                          <span>🏷️</span>
                          <span>{orderHasUnresolvedPor(order) ? 'Set Agreed Pricing' : 'Edit Agreed Pricing'}</span>
                        </button>
                      )}

                      {/* Primary Generate / View Invoice Action */}
                      <button
                        type="button"
                        onClick={() => handleGenerateInvoiceClick(order)}
                        className={`h-10 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                          orderHasUnresolvedPor(order)
                            ? 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                        }`}
                        title={
                          orderHasUnresolvedPor(order)
                            ? 'Mandatory: Settle pending POR pricing before generating invoice'
                            : 'View or print official customer invoice'
                        }
                      >
                        <span>{orderHasUnresolvedPor(order) ? '🔒' : '🧾'}</span>
                        <span>{orderHasUnresolvedPor(order) ? 'Generate Invoice (POR Pending)' : 'Generate Invoice ↗'}</span>
                      </button>

                      {/* ── WhatsApp PDF Share Button ─────────────────────── */}
                      <button
                        onClick={() => handleShareInvoicePdf(order)}
                        disabled={sharingOrderId === order.id}
                        className={`h-10 px-4 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 shadow-md ${
                          sharingOrderId === order.id
                            ? 'bg-emerald-600/60 text-slate-300 cursor-wait'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        }`}
                        title="Generate executive PDF and send via WhatsApp"
                      >
                        {sharingOrderId === order.id ? (
                          <>
                            <span className="animate-spin text-sm">⏳</span>
                            <span>Preparing Invoice PDF…</span>
                          </>
                        ) : (
                          <>
                            <span>📄</span>
                            <span>Send Invoice via WhatsApp</span>
                          </>
                        )}
                      </button>

                      {!order.isApproved && (
                        <button
                          onClick={() => {
                            if (orderHasUnresolvedPor(order)) {
                              showToast('⚠️ Please agree on POR pricing before approving order');
                              handleOpenPricingModal(order, () => {
                                approveOrder(order.id);
                                showToast(`✓ Order #${order.id} Approved!`);
                              });
                              return;
                            }
                            approveOrder(order.id);
                            showToast(`✓ Order #${order.id} Approved!`);
                          }}
                          className="h-10 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all"
                        >
                          <span>⚡</span>
                          <span>Approve Order</span>
                        </button>
                      )}
                    </div>

                    {/* Desktop WhatsApp Manual Attachment Instructions Notice */}
                    {desktopNoticeOrderId === order.id && downloadedFilename && (
                      <div className="mt-2 p-3.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-emerald-300 font-semibold">
                          <span className="flex items-center gap-1.5">
                            <span>📥</span>
                            <span>Downloaded: <strong>{downloadedFilename}</strong></span>
                          </span>
                          <button
                            onClick={() => {
                              setDesktopNoticeOrderId(null);
                              dismissNotice();
                            }}
                            className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded text-xs"
                            title="Dismiss notice"
                          >
                            ✕ Dismiss
                          </button>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          WhatsApp conversation has been opened in a new tab for <strong>+91 {order.phone}</strong>. Please attach the downloaded file <strong>{downloadedFilename}</strong> and press Send.
                        </p>
                      </div>
                    )}

                    {/* Share error banner */}
                    {shareError && sharingOrderId === null && (
                      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                        <span>⚠️</span>
                        <span>{shareError}</span>
                        <button
                          onClick={() => setShareError(null)}
                          className="ml-auto text-red-400 hover:text-white"
                        >✕</button>
                      </div>
                    )}
                  </div>

                  {/* Courier / AWB Tracking Section */}
                  <div className="flex items-center gap-2">
                    {isEditingTracking ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-900 p-2.5 rounded-xl border border-cyan-400/40">
                        {/* Dispatch Mode Toggle */}
                        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                          <button
                            type="button"
                            onClick={() => setTrackingForm({ ...trackingForm, isPartner: false })}
                            className={`px-2 py-1 rounded-md font-medium transition-all ${
                              !trackingForm.isPartner
                                ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            🚚 Direct
                          </button>
                          <button
                            type="button"
                            onClick={() => setTrackingForm({ ...trackingForm, isPartner: true, courier: trackingForm.courier || 'Priority Air Cargo Express' })}
                            className={`px-2 py-1 rounded-md font-medium transition-all ${
                              trackingForm.isPartner
                                ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            ✈️ Partner Cargo
                          </button>
                        </div>

                        {trackingForm.isPartner ? (
                          <>
                            <input
                              type="text"
                              placeholder="AWB #"
                              value={trackingForm.awb}
                              onChange={(e) => setTrackingForm({ ...trackingForm, awb: e.target.value })}
                              className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-28 focus:outline-none focus:border-cyan-400 font-mono"
                            />
                            <input
                              type="text"
                              placeholder="Courier Name"
                              value={trackingForm.courier}
                              onChange={(e) => setTrackingForm({ ...trackingForm, courier: e.target.value })}
                              className="h-8 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white w-32 focus:outline-none focus:border-cyan-400"
                            />
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic px-1">
                            Direct local delivery (no courier/AWB on invoice)
                          </span>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={() => handleSaveTracking(order.id)}
                            className="h-8 px-3 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTrackingOrderId(null)}
                            className="h-8 px-2 rounded-lg bg-slate-800 text-slate-300 text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">
                          {isPartnerShipmentOrder(order) ? (
                            <span className="font-mono text-cyan-300">
                              ✈️ AWB: {order.awbNumber || 'Pending'} ({order.courierName || 'Partner Cargo'})
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-medium">
                              🚚 Direct Handover (No Partner Carrier)
                            </span>
                          )}
                        </span>
                        <button
                          onClick={() => {
                            const isPartner = isPartnerShipmentOrder(order);
                            setTrackingForm({
                              awb: order.awbNumber || '',
                              courier: order.courierName || '',
                              isPartner,
                            });
                            setEditingTrackingOrderId(order.id);
                          }}
                          className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium transition-colors"
                        >
                          ✏️ Edit Fulfillment
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Mandatory POR Agreed Pricing Settlement Modal ─────────────── */}
      {pricingModalOrder && (
        <PorPriceSettlementModal
          order={pricingModalOrder}
          isOpen={Boolean(pricingModalOrder)}
          onClose={() => setPricingModalOrder(null)}
          onSavePricing={handleSavePricingFromModal}
          onInvoiceGenerated={(orderId) => {
            window.open(`/invoice/${orderId}`, '_blank');
          }}
        />
      )}
    </div>
  );
}
