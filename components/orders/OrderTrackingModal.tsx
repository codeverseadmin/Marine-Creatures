'use client';

import React, { useState } from 'react';
import { useOrder, TRACKING_STEPS_META, OrderProgressStep } from '@/lib/context/OrderContext';
import { SITE_CONFIG } from '@/lib/config';

export function OrderTrackingModal() {
  const { orders, activeOrder, setActiveOrder, isTrackingOpen, setIsTrackingOpen, findOrder } = useOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState(false);

  if (!isTrackingOpen) return null;

  const currentOrder = activeOrder || orders[0];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = findOrder(searchQuery);
    if (match) {
      setActiveOrder(match);
      setSearchError(false);
    } else {
      setSearchError(true);
    }
  };

  const stepsOrder: OrderProgressStep[] = ['placed', 'quarantine', 'packed', 'dispatched', 'delivered'];
  const currentStepIdx = currentOrder ? stepsOrder.indexOf(currentOrder.currentStep) : 0;

  const handleWhatsAppOrderSupport = () => {
    if (!currentOrder) return;
    const msg = `Hi Marine Creatures Concierge! I am tracking Order #${currentOrder.id} for ${currentOrder.customerName} (${currentOrder.city}).\n\nCould you please share a live update or AWB dispatch status?`;
    window.open(`https://wa.me/${SITE_CONFIG.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[99994] overflow-y-auto bg-black/85 backdrop-blur-xl p-4 sm:p-6 lg:p-8 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-[#040C12] border border-white/15 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-slate-950 via-[#071722] to-slate-950">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 text-cyan-400 flex items-center justify-center text-lg">
              📦
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Live Dispatch &amp; Order Tracker
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400 text-slate-950 uppercase tracking-wider">
                  Amazon Style
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time quarantine, climate pod packing &amp; express air cargo telemetry.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTrackingOpen(false)}
            className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:border-white text-white flex items-center justify-center text-sm transition-all"
            aria-label="Close tracking modal"
          >
            ✕
          </button>
        </div>

        {/* Search / Switch Orders Bar */}
        <div className="p-4 sm:px-6 bg-slate-900/70 border-b border-white/5 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
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
                  className={`h-8 px-2.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
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
          <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
            Could not find an order matching &ldquo;{searchQuery}&rdquo;. Try searching with &ldquo;MC-8921&rdquo;.
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 touch-momentum">
          {currentOrder ? (
            <>
              {/* Order Meta Header Card */}
              <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm sm:text-base font-bold text-cyan-400">
                      Order #{currentOrder.id}
                    </span>
                    <span className="text-xs text-slate-500">• {currentOrder.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Recipient: <strong className="text-white">{currentOrder.customerName}</strong> ({currentOrder.city}, {currentOrder.pincode})
                  </p>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
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
                    const log = currentOrder.statusHistory.find((h) => h.status === stepKey);
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

              {/* Items in this Order */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Specimens in Thermal Pod ({currentOrder.items.length})
                </h4>
                <div className="space-y-2.5">
                  {currentOrder.items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="p-3.5 rounded-2xl border border-white/10 bg-slate-950/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-white/10 shrink-0 bg-black"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase font-semibold text-cyan-400 block truncate">
                            {product.categoryLabel}
                          </span>
                          <h5 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {product.name}
                          </h5>
                          <span className="text-xs text-slate-400">
                            Qty: <strong className="text-white">{quantity}</strong>
                          </span>
                        </div>
                      </div>

                      <span className="font-display text-sm sm:text-base text-white font-medium shrink-0">
                        ₹{(product.price * quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-slate-400">Total Order Value:</span>
                  <span className="font-display text-lg sm:text-xl font-bold text-white">
                    ₹{currentOrder.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-xs text-slate-400">No order selected. Enter an Order ID above to track.</p>
            </div>
          )}
        </div>

        {/* Footer Support Action */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>🛡️</span>
            <span>48-Hour Live Arrival Guarantee (LAG) Active on Air Cargo</span>
          </div>

          <button
            onClick={handleWhatsAppOrderSupport}
            className="w-full sm:w-auto h-11 px-5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 hover:bg-cyan-400/20 active:scale-95 text-xs text-cyan-300 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <span>💬</span>
            <span>WhatsApp Dispatch Concierge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
