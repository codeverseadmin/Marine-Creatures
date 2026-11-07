'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useOrder, TRACKING_STEPS_META, OrderProgressStep, CustomerOrder, StatusUpdateLog } from '@/lib/context/OrderContext';
import { SITE_CONFIG } from '@/lib/config';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';

function mapTrackDataToCustomerOrder(t: any, existingOrder?: CustomerOrder | null): CustomerOrder {
  const stepsOrder: OrderProgressStep[] = ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'];
  const currentTargetIdx = stepsOrder.indexOf(t.currentStep || 'placed');

  const statusHistory: StatusUpdateLog[] = Array.isArray(t.statusHistory) && t.statusHistory.length > 0
    ? t.statusHistory.map((s: any) => {
        const sStep = (s.status || s.step || 'placed') as OrderProgressStep;
        const sIdx = stepsOrder.indexOf(sStep);
        const meta = TRACKING_STEPS_META[sStep] || { label: sStep, description: '' };
        return {
          status: sStep,
          title: s.title || meta.label,
          description: s.note || s.description || meta.description,
          timestamp: s.timestamp || (sIdx <= currentTargetIdx ? (t.createdAt || 'Logged') : 'Pending'),
          completed: sIdx <= currentTargetIdx,
        };
      })
    : stepsOrder.map((step, idx) => {
        const meta = TRACKING_STEPS_META[step];
        return {
          status: step,
          title: meta.label,
          description: meta.description,
          timestamp: idx <= currentTargetIdx ? (t.createdAt || 'Logged') : 'Pending',
          completed: idx <= currentTargetIdx,
        };
      });

  const items = Array.isArray(t.items) && t.items.length > 0
    ? t.items.map((it: any) => {
        const isPor = Boolean(
          it.priceOnRequest ||
          it.pricingStatus === 'PENDING_POR' ||
          it.price === 0
        );
        const unitPrice = typeof it.agreedUnitPrice === 'number' && it.agreedUnitPrice > 0
          ? it.agreedUnitPrice
          : (it.price || 0);

        return {
          product: {
            id: it.id || 'item',
            name: it.name || 'Marine Specimen',
            category: it.category || 'marine-life',
            categoryLabel: it.category || 'Marine Life',
            stockCount: 10,
            inStock: true,
            price: unitPrice,
            images: it.image ? [it.image] : [],
            shortDesc: '',
            description: '',
            priceOnRequest: isPor,
          },
          quantity: it.quantity || 1,
          priceOnRequest: isPor,
          agreedUnitPrice: it.agreedUnitPrice,
          pricingStatus: it.pricingStatus,
          pricedAt: it.pricedAt,
          pricedBy: it.pricedBy,
        };
      })
    : (existingOrder?.items || []);

  return {
    id: t.id,
    customerName: existingOrder?.customerName || t.customerMaskedName || 'Valued Client',
    phone: existingOrder?.phone || '',
    address: existingOrder?.address || 'Verified Destination Address',
    city: t.city || existingOrder?.city || '',
    pincode: existingOrder?.pincode || '',
    orderNotes: existingOrder?.orderNotes,
    subtotal: t.subtotal ?? existingOrder?.subtotal ?? t.totalAmount,
    totalAmount: t.totalAmount ?? existingOrder?.totalAmount ?? 0,
    currentStep: (t.currentStep as OrderProgressStep) || 'placed',
    isApproved: Boolean(t.isApproved ?? existingOrder?.isApproved),
    createdAt: t.createdAt || existingOrder?.createdAt || '',
    estimatedDelivery: t.estimatedDelivery || existingOrder?.estimatedDelivery || '1–2 Business Days (Express Air Cargo)',
    courierName: t.courierName || existingOrder?.courierName,
    awbNumber: t.awbNumber || existingOrder?.awbNumber,
    invoiceNumber: t.isApproved ? (existingOrder?.invoiceNumber || `INV-${t.id}`) : undefined,
    invoiceToken: existingOrder?.invoiceToken,
    hasUnresolvedPorItems: Boolean(t.hasUnresolvedPorItems ?? existingOrder?.hasUnresolvedPorItems),
    statusHistory,
    items,
  };
}

export function OrderTrackingModal() {
  const { orders, activeOrder, setActiveOrder, isTrackingOpen, setIsTrackingOpen, findOrder } = useOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Background live revalidation for open tracking modal
  const fetchLiveTracking = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(orderId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const result = await res.json();
      if (result.success && result.data) {
        setActiveOrder((prev: CustomerOrder | null) => mapTrackDataToCustomerOrder(result.data, prev));
      }
    } catch {
      // Background revalidation fails gracefully
    }
  }, [setActiveOrder]);

  // Initial and periodic (10s) polling + window focus sync while modal is open
  useEffect(() => {
    if (!isTrackingOpen) return;

    const targetId = activeOrder?.id || orders[0]?.id;
    if (targetId) {
      fetchLiveTracking(targetId);
    }

    const interval = setInterval(() => {
      const curId = activeOrder?.id || orders[0]?.id;
      if (curId) {
        fetchLiveTracking(curId);
      }
    }, 10000);

    const handleFocus = () => {
      const curId = activeOrder?.id || orders[0]?.id;
      if (curId) {
        fetchLiveTracking(curId);
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isTrackingOpen, activeOrder?.id, orders, fetchLiveTracking]);

  // Lock body scroll and pause Lenis while modal is open
  useEffect(() => {
    if (!isTrackingOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    // Pause Lenis smooth scroll so it does not intercept wheel events
    const lenis = (window as unknown as { lenis?: { stop: () => void; start: () => void } }).lenis;
    lenis?.stop();

    // Reset scroll to top whenever modal opens
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    // Close on Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTrackingOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      lenis?.start();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isTrackingOpen, setIsTrackingOpen]);

  // Reset scroll to top when active order changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [activeOrder?.id]);

  if (!isTrackingOpen) return null;

  const currentOrder = activeOrder || orders[0];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // 1. Query dedicated public order tracking endpoint FIRST (bypasses stale localStorage)
    try {
      const res = await fetch(`/api/orders/track?orderId=${encodeURIComponent(query)}`, {
        cache: 'no-store',
      });
      const result = await res.json();
      if (result.success && result.data) {
        const localMatch = findOrder(query);
        const mapped = mapTrackDataToCustomerOrder(result.data, localMatch);
        setActiveOrder(mapped);
        setSearchError(false);
        return;
      }
    } catch {
      // Network error — fall back to local memory if available
    }

    // 2. Fall back to local memory if server query returned 404 or network was offline
    const match = findOrder(query);
    if (match) {
      setActiveOrder(match);
      setSearchError(false);
      return;
    }

    setSearchError(true);
  };

  const stepsOrder: OrderProgressStep[] = ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'];
  const currentStepIdx = currentOrder ? stepsOrder.indexOf(currentOrder.currentStep) : 0;

  const handleWhatsAppOrderSupport = () => {
    if (!currentOrder) return;
    const msg = `Hi Marine Creatures Concierge! I am tracking Order #${currentOrder.id} for ${currentOrder.customerName} (${currentOrder.city}).\n\nCould you please share a live update or AWB dispatch status?`;
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-[99994] overflow-hidden bg-black/85 backdrop-blur-xl p-3 sm:p-6 lg:p-8 flex items-center justify-center overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-tracking-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setIsTrackingOpen(false);
        }
      }}
    >
      <div
        className="relative w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-[#040C12] border border-white/15 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)] lg:max-h-[92dvh] h-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header — Non-scrolling */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#071722] to-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center text-lg shrink-0">
              📦
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="order-tracking-modal-title" className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Order &amp; Delivery Tracking
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 uppercase tracking-wider shrink-0">
                  Live Status
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track your shipment from climate pod packaging to your doorstep.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTrackingOpen(false)}
            className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:border-white text-white flex items-center justify-center text-sm transition-all shrink-0 ml-2"
            aria-label="Close tracking modal"
          >
            ✕
          </button>
        </div>

        {/* Search / Switch Orders Bar — Non-scrolling */}
        <div className="p-3.5 sm:px-6 bg-slate-900/70 border-b border-white/5 flex flex-col sm:flex-row gap-2.5 items-center justify-between shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by Order ID (e.g. MC-8921) or phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchError(false);
              }}
              className="flex-1 h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="h-10 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider shrink-0"
            >
              Track
            </button>
          </form>

          {/* Quick list of customer's active orders */}
          {orders.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1">
              <span className="text-[11px] text-slate-400 shrink-0">Your Orders:</span>
              {orders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setActiveOrder(o)}
                  className={`h-8 px-2.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all shrink-0 ${
                    currentOrder?.id === o.id
                      ? 'bg-cyan-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  {o.id}
                </button>
              ))}
            </div>
          )}
        </div>

        {searchError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 shrink-0">
            Could not find an order matching &ldquo;{searchQuery}&rdquo;. Try searching with &ldquo;MC-8921&rdquo;.
          </div>
        )}

        {/* Body Container — THE SOLE vertical scroll container */}
        <div
          ref={scrollContainerRef}
          tabIndex={0}
          role="region"
          aria-label="Order tracking details"
          data-lenis-prevent="true"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-6 sm:pb-8 space-y-6 touch-momentum focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/30"
        >
          {currentOrder ? (
            <>
              {/* Order Meta Header Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-sm sm:text-base font-bold text-cyan-400">
                      Order #{currentOrder.id}
                    </span>
                    <span className="text-xs text-slate-500">• {currentOrder.createdAt}</span>
                    {currentOrder.isApproved ? (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold">
                        ✓ Invoiced ({currentOrder.invoiceNumber || `INV-${currentOrder.id}`})
                      </span>
                    ) : (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold">
                        ● Order Placed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    Recipient: <strong className="text-white">{currentOrder.customerName}</strong>
                    {currentOrder.phone && <span> (📞 +91 {currentOrder.phone})</span>}
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    📍 Delivery Address: <span className="text-slate-200">{currentOrder.address ? `${currentOrder.address}, ` : ''}{currentOrder.city} ({currentOrder.pincode})</span>
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimated Delivery</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400 flex items-center sm:justify-end gap-1">
                      <span>⚡</span>
                      <span>{currentOrder.estimatedDelivery}</span>
                    </span>
                    {currentOrder.awbNumber && (
                      <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                        AWB: <strong className="text-white">{currentOrder.awbNumber}</strong> ({currentOrder.courierName})
                      </span>
                    )}
                  </div>

                  {currentOrder.isApproved ? (
                    <Link
                      href={currentOrder.invoiceToken ? `/invoice/${currentOrder.id}?token=${currentOrder.invoiceToken}` : `/invoice/${currentOrder.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 px-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <span>🧾</span>
                      <span>View Invoice &amp; Manifest ↗</span>
                    </Link>
                  ) : (
                    <span
                      className="h-9 px-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 text-[11px] font-medium inline-flex items-center gap-1.5 cursor-not-allowed"
                      title="Invoice is released once approved by Marine Creatures concierge"
                    >
                      <span>🔒</span>
                      <span>Invoice pending approval</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Amazon-Style Multi-Step Visual Progress Bar */}
              <div className="p-5 sm:p-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-b from-[#061824] to-slate-950 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    Live Shipping Status Telemetry
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Stage {currentStepIdx + 1} of {stepsOrder.length}
                  </span>
                </div>

                {/* Horizontal Step Bar (Desktop) */}
                <div className="hidden md:flex items-center justify-between relative px-4">
                  {/* Connecting Line */}
                  <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-slate-800 -z-0">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${(currentStepIdx / (stepsOrder.length - 1)) * 100}%` }}
                    />
                  </div>

                  {stepsOrder.map((stepKey, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const meta = TRACKING_STEPS_META[stepKey];
                    const log = currentOrder.statusHistory?.find((h) => h.status === stepKey);
                    return (
                      <div key={stepKey} className="relative z-10 flex flex-col items-center text-center max-w-[110px]">
                        <div
                          className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                            isCurrent
                              ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_20px_rgba(0,184,217,0.8)] scale-110'
                              : isDone
                              ? 'bg-emerald-500 text-white border-emerald-400 shadow-md'
                              : 'bg-slate-900 text-slate-500 border-slate-700'
                          }`}
                        >
                          {isDone && !isCurrent ? '✓' : meta.icon}
                        </div>
                        <span className={`text-[11px] font-bold mt-2 leading-tight ${isCurrent ? 'text-cyan-300' : isDone ? 'text-white' : 'text-slate-500'}`}>
                          {meta.label}
                        </span>
                        {log?.timestamp && log.timestamp !== 'Pending' && (
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 max-w-[105px] truncate block">
                            {log.timestamp}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Vertical Step Bar (Mobile / Responsive) */}
                <div className="md:hidden space-y-4 pt-1">
                  {stepsOrder.map((stepKey, idx) => {
                    const isDone = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const meta = TRACKING_STEPS_META[stepKey];
                    const log = currentOrder.statusHistory?.find((h) => h.status === stepKey);
                    return (
                      <div key={stepKey} className="flex items-start gap-3.5 relative">
                        {/* Dot / Icon */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold border-2 shrink-0 ${
                            isCurrent
                              ? 'bg-cyan-400 text-slate-950 border-white shadow-[0_0_15px_rgba(0,184,217,0.8)]'
                              : isDone
                              ? 'bg-emerald-500 text-white border-emerald-400'
                              : 'bg-slate-900 text-slate-600 border-slate-800'
                          }`}
                        >
                          {isDone && !isCurrent ? '✓' : meta.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs font-bold ${isCurrent ? 'text-cyan-300' : isDone ? 'text-white' : 'text-slate-500'}`}>
                              {meta.label}
                            </h4>
                            {log?.timestamp && (
                              <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {log?.description || meta.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* POR Unresolved Notification Banner */}
              {currentOrder.hasUnresolvedPorItems && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs flex items-center gap-3">
                  <span className="text-xl shrink-0">⏳</span>
                  <div>
                    <strong className="block text-amber-200 font-semibold mb-0.5">Rare Specimen Pricing Under Review</strong>
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      This order includes rare Price on Request (POR) specimens. Our concierge is finalizing the agreed pricing. The final executive invoice will be issued upon specimen packaging.
                    </p>
                  </div>
                </div>
              )}

              {/* Items in this Order */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Specimens in Thermal Pod ({currentOrder.items?.length || 0})
                </h4>
                <div className="space-y-2.5">
                  {currentOrder.items?.map((item, idx) => {
                    const { product, quantity } = item;
                    const isPor = Boolean(item.priceOnRequest || product.priceOnRequest || (product.price === 0 && !item.agreedUnitPrice));
                    const unitPrice = typeof item.agreedUnitPrice === 'number' && item.agreedUnitPrice > 0
                      ? item.agreedUnitPrice
                      : (product.price || 0);

                    return (
                      <div
                        key={product.id || idx}
                        className="p-3.5 rounded-2xl border border-white/10 bg-slate-950/60 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <ProductThumbnail
                            product={product}
                            sizeClassName="w-14 h-14 rounded-xl shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] uppercase font-semibold text-cyan-400 truncate">
                                {product.categoryLabel}
                              </span>
                              {isPor && !item.agreedUnitPrice && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                                  POR
                                </span>
                              )}
                              {item.agreedUnitPrice && item.agreedUnitPrice > 0 && isPor && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                                  ✓ Agreed Quote
                                </span>
                              )}
                            </div>
                            <h5 className="text-xs sm:text-sm font-semibold text-white truncate">
                              {product.name}
                            </h5>
                            <span className="text-xs text-slate-400">
                              Qty: <strong className="text-white">{quantity}</strong>
                            </span>
                          </div>
                        </div>

                        {unitPrice > 0 ? (
                          <div className="text-right shrink-0">
                            <span className="font-display text-sm sm:text-base text-white font-medium block">
                              ₹{(unitPrice * quantity).toLocaleString('en-IN')}
                            </span>
                            {isPor && (
                              <span className="text-[10px] text-cyan-400 font-mono">
                                ₹{unitPrice.toLocaleString('en-IN')}/ea
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20 shrink-0">
                            Quote Pending
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {currentOrder.totalAmount > 0 && (
                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Total Order Value:</span>
                    <span className="font-display text-lg sm:text-xl font-bold text-white">
                      ₹{currentOrder.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs text-slate-400">No order selected. Enter an Order ID above to track.</p>
            </div>
          )}
        </div>

        {/* Footer Support Action — Non-scrolling / Fixed within modal layout */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>🛡️</span>
            <span>48-Hour Live Arrival Guarantee (LAG) Active on Air Cargo</span>
          </div>

          <button
            onClick={handleWhatsAppOrderSupport}
            className="w-full sm:w-auto h-11 px-5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 active:scale-95 text-xs text-cyan-300 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
          >
            <span>💬</span>
            <span>WhatsApp Dispatch Concierge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
