'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useOrder,
  CustomerOrder,
  OrderProgressStep,
  TRACKING_STEPS_META,
} from '@/lib/context/OrderContext';

interface OrdersTabProps {
  showToast: (message: string) => void;
}

const ORDER_STEPS_SEQUENCE: OrderProgressStep[] = [
  'placed',
  'quarantine',
  'packed',
  'dispatched',
  'delivered',
];

export default function OrdersTab({ showToast }: OrdersTabProps) {
  const { orders, updateOrderStatus, updateOrderTracking, deleteOrder, approveOrder } = useOrder();

  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [editingTrackingOrderId, setEditingTrackingOrderId] = useState<string | null>(null);
  const [trackingForm, setTrackingForm] = useState({ awb: '', courier: '' });

  const getNextStep = (current: OrderProgressStep): OrderProgressStep | null => {
    const idx = ORDER_STEPS_SEQUENCE.indexOf(current);
    if (idx >= 0 && idx < ORDER_STEPS_SEQUENCE.length - 1) {
      return ORDER_STEPS_SEQUENCE[idx + 1];
    }
    return null;
  };

  const handleSendWhatsAppAlert = (order: CustomerOrder) => {
    const stepMeta = TRACKING_STEPS_META[order.currentStep];
    const itemsSummary = order.items.map((i) => `• ${i.product.name} (x${i.quantity})`).join('\n');
    const message = `🌊 *MARINE CREATURES DISPATCH UPDATE*\n\nHello *${order.customerName}*,\n\nYour order *#${order.id}* has been updated to:\n🔹 *${stepMeta.icon} ${stepMeta.label.toUpperCase()}*\n_${stepMeta.description}_\n\n📋 *Specimens & Gear:*\n${itemsSummary}\n\n💰 *Total:* ₹${order.totalAmount.toLocaleString('en-IN')}\n📍 *Destination:* ${order.city} (${order.pincode})\n${order.awbNumber ? `\n✈️ *Courier:* ${order.courierName || 'Priority Air Cargo'}\n🔖 *Air Waybill (AWB):* ${order.awbNumber}` : ''}\n⏳ *Est. Arrival:* ${order.estimatedDelivery}\n\nTrack live on our portal anytime.\nMarine Creatures Concierge`;

    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSendInvoiceWhatsApp = (order: CustomerOrder) => {
    const isPackedOrLater = ['packed', 'dispatched', 'delivered'].includes(order.currentStep);
    if (!isPackedOrLater) {
      showToast('⚠️ Invoice strictly unlocks once order reaches "Step 3: Thermal Pod Packed"');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marine-creatures-sand.vercel.app';
    const invoiceUrl = `${origin}/invoice/${order.id}`;
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    const message = `🌊 *MARINE CREATURES — OFFICIAL TAX INVOICE & DISPATCH CONFIRMATION* 🌊\n\nDear *${order.customerName}*,\nYour order *#${order.id}* has been verified & approved by Marine Creatures Concierge.\n\n🧾 *Tax Invoice No:* ${order.invoiceNumber || `INV-${order.id}`}\n📅 *Date:* ${order.approvedAt || order.createdAt}\n📦 *Total Amount:* ₹${order.totalAmount.toLocaleString('en-IN')} (All-inclusive)\n📍 *Delivery Address:* ${order.address}, ${order.city} (${order.pincode})\n✈️ *Carrier:* ${order.courierName || 'Priority Air Cargo'} ${order.awbNumber ? `(AWB: ${order.awbNumber})` : ''}\n\n📄 *View / Download Your Official Tax Invoice:* \n${invoiceUrl}\n\nYour specimens are in specialized oxygenated thermal pods. Marine Creatures — Bringing ocean at your door step!`;

    const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleSaveTracking = (orderId: string) => {
    updateOrderTracking(orderId, trackingForm.awb, trackingForm.courier);
    setEditingTrackingOrderId(null);
    showToast(`✓ Tracking details updated for #${orderId}`);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.phone.includes(orderSearch) ||
      order.city.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus =
      orderStatusFilter === 'all' || order.currentStep === orderStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📦</span>
            <span>Orders &amp; Live Dispatches</span>
          </h2>
          <p className="text-xs text-slate-400">
            Manage live customer orders, advance Amazon-style 5-stage milestones, and send WhatsApp dispatch alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-300">
            Total Orders: {orders.length}
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
            Active: {orders.filter((o) => o.currentStep !== 'delivered').length}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm select-none pointer-events-none">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search order #, customer, phone, city..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-10 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 transition-colors"
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All' },
            { id: 'placed', label: 'Confirmed' },
            { id: 'quarantine', label: 'Quarantine' },
            { id: 'packed', label: 'Packed' },
            { id: 'dispatched', label: 'Dispatched' },
            { id: 'delivered', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setOrderStatusFilter(tab.id)}
              className={`h-11 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                orderStatusFilter === tab.id
                  ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#071520] border border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <span className="text-4xl">📦</span>
          <h3 className="text-base font-bold text-white">No Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {orderSearch || orderStatusFilter !== 'all'
              ? 'No orders match your filter criteria.'
              : 'Orders placed by customers through the checkout drawer will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const currentMeta = TRACKING_STEPS_META[order.currentStep];
            const nextStep = getNextStep(order.currentStep);
            const nextMeta = nextStep ? TRACKING_STEPS_META[nextStep] : null;
            const isEditingTracking = editingTrackingOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-[#071520] border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-5 shadow-xl hover:border-cyan-500/30 transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col gap-3 pb-4 border-b border-slate-800/80">
                  {/* Row 1: Order ID, Created Date & Status + Delete */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black text-cyan-400 tracking-tight">
                        #{order.id}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                        {order.createdAt}
                      </span>
                    </div>

                    {/* Current Status Badge + Delete Button */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                          order.currentStep === 'delivered'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : order.currentStep === 'dispatched'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                        }`}
                      >
                        <span className="text-sm">{currentMeta.icon}</span>
                        <span>{currentMeta.label}</span>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Delete order #${order.id}?`)) {
                            deleteOrder(order.id);
                            showToast(`Order #${order.id} deleted`);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center text-xs transition-colors shrink-0 border border-red-500/20"
                        title="Delete Order"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Customer Contact & Location Chips */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span>👤</span>
                      <span>{order.customerName}</span>
                    </span>
                    <a
                      href={`https://wa.me/${order.phone.replace(/\D/g, '').length === 10 ? '91' + order.phone.replace(/\D/g, '') : order.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1 bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800/80 transition-colors"
                      title="Chat with customer on WhatsApp"
                    >
                      <span>📞</span>
                      <span>+91 {order.phone}</span>
                      <span className="text-[10px] text-emerald-400 font-bold ml-0.5">💬</span>
                    </a>
                    <span className="text-slate-300 flex items-center gap-1 bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800/80">
                      <span>📍</span>
                      <span>{order.address ? `${order.address}, ` : ''}{order.city} ({order.pincode})</span>
                    </span>
                  </div>

                  {/* Row 3: Order Approval & Official Tax Invoice Actions */}
                  {(() => {
                    const isPackedOrLater = ['packed', 'dispatched', 'delivered'].includes(order.currentStep);
                    return (
                      <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          {order.isApproved ? (
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5 text-xs shadow-sm">
                              <span>✓</span>
                              <span>Approved &amp; Invoiced ({order.invoiceNumber || `INV-${order.id}`})</span>
                            </span>
                          ) : isPackedOrLater ? (
                            <button
                              onClick={() => {
                                approveOrder(order.id);
                                showToast(`✓ Order #${order.id} Approved! Official Invoice generated.`);
                              }}
                              className="h-8 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold flex items-center gap-1.5 text-xs shadow-md active:scale-95 transition-all"
                            >
                              <span>⚡</span>
                              <span>Approve Order &amp; Issue Tax Invoice</span>
                            </button>
                          ) : (
                            <span
                              className="h-8 px-3 rounded-xl bg-slate-900/90 border border-amber-500/30 text-amber-400 font-medium flex items-center gap-1.5 text-xs cursor-not-allowed"
                              title="Invoice strictly unlocks once the order is advanced to Step 3: Thermal Pod Packed"
                            >
                              <span>🔒</span>
                              <span>Invoice Locked (Advance to &quot;Step 3: Packed&quot; first)</span>
                            </span>
                          )}

                          {order.orderNotes && (
                            <span className="text-[11px] text-slate-400 italic bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/60">
                              Note: {order.orderNotes}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {isPackedOrLater ? (
                            <>
                              <Link
                                href={`/invoice/${order.id}`}
                                target="_blank"
                                className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                              >
                                <span>🧾</span>
                                <span>View Invoice ↗</span>
                              </Link>

                              <button
                                onClick={() => handleSendInvoiceWhatsApp(order)}
                                className="h-8 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                                title="Send Invoice PDF link to customer via WhatsApp"
                              >
                                <span>💬</span>
                                <span>WhatsApp Invoice</span>
                              </button>
                            </>
                          ) : (
                            <span
                              className="h-8 px-2.5 rounded-xl bg-slate-950 text-slate-500 border border-slate-800/80 text-[11px] font-medium flex items-center gap-1 cursor-not-allowed"
                              title="Invoice will unlock after marking as Step 3: Thermal Pod Packed"
                            >
                              <span>🔒</span>
                              <span>Invoice unlocks after packaging</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Interactive Milestone Progress Control */}
                <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs uppercase font-extrabold tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>Milestone Progression Control</span>
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tap any milestone below or advance 1-tap to next stage
                      </p>
                    </div>

                    {nextStep && nextMeta && (
                      <button
                        onClick={() => {
                          updateOrderStatus(order.id, nextStep);
                          showToast(`✓ Advanced #${order.id} to "${nextMeta.label}"`);
                        }}
                        className="w-full sm:w-auto h-11 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shrink-0"
                      >
                        <span>1-Tap Advance:</span>
                        <span className="text-sm">{nextMeta.icon}</span>
                        <span className="underline decoration-slate-950/30 underline-offset-2">{nextMeta.label}</span>
                        <span className="text-sm">→</span>
                      </button>
                    )}
                  </div>

                  {/* 5 Milestone Step Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                    {ORDER_STEPS_SEQUENCE.map((stepKey, idx) => {
                      const meta = TRACKING_STEPS_META[stepKey];
                      const isCurrent = order.currentStep === stepKey;
                      const isPassed =
                        ORDER_STEPS_SEQUENCE.indexOf(order.currentStep) >= idx;
                      const isLastStepOnMobile = idx === 4;

                      return (
                        <button
                          key={stepKey}
                          onClick={() => {
                            updateOrderStatus(order.id, stepKey);
                            showToast(`✓ Status updated to ${meta.label}`);
                          }}
                          className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all text-xs flex flex-col gap-1.5 relative overflow-hidden ${
                            isLastStepOnMobile ? 'col-span-2 sm:col-span-1' : ''
                          } ${
                            isCurrent
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400/50'
                              : isPassed
                              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                              : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-base">{meta.icon}</span>
                            <span className="text-[10px] font-mono opacity-70 bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800/60">
                              Step {idx + 1}
                            </span>
                          </div>
                          <span className="font-bold leading-tight line-clamp-1 text-xs sm:text-[13px]">
                            {meta.label}
                          </span>
                          <span className="text-[10px] font-semibold flex items-center gap-1">
                            {isCurrent ? (
                              <span className="text-cyan-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
                                Active
                              </span>
                            ) : isPassed ? (
                              <span className="text-emerald-400">✓ Completed</span>
                            ) : (
                              <span className="text-slate-500">Pending</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Order Items & Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Items List */}
                  <div className="space-y-2">
                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                      Order Items ({order.items.length})
                    </span>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60"
                        >
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                            <img
                              src={item.product.images[0] || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80'}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.product.name}
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Qty: {item.quantity} × ₹{item.product.price.toLocaleString('en-IN')}
                            </p>
                          </div>
                          <span className="text-xs sm:text-sm font-mono font-bold text-cyan-300 shrink-0">
                            ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex items-center justify-between text-xs font-bold text-white px-1">
                      <span>Total Value:</span>
                      <span className="text-base text-cyan-400 font-mono">
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Tracking & Dispatch Controls */}
                  <div className="space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block">
                        Shipping &amp; AWB Details
                      </span>

                      {isEditingTracking ? (
                        <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-400/50 space-y-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 uppercase block mb-1">
                              Air Waybill / AWB Number
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. BLR-EXP-99281"
                              value={trackingForm.awb}
                              onChange={(e) =>
                                setTrackingForm({ ...trackingForm, awb: e.target.value })
                              }
                              className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 uppercase block mb-1">
                              Courier / Airline Cargo Partner
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. IndiGo CarGo / Air India Cargo"
                              value={trackingForm.courier}
                              onChange={(e) =>
                                setTrackingForm({ ...trackingForm, courier: e.target.value })
                              }
                              className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleSaveTracking(order.id)}
                              className="flex-1 h-8 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs"
                            >
                              Save AWB
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTrackingOrderId(null)}
                              className="h-8 px-3 rounded-lg bg-slate-800 text-slate-300 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-400 shrink-0">Carrier:</span>
                            <span className="font-semibold text-white text-right truncate">
                              {order.courierName || 'BlueDart Apex Express'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-400 shrink-0">Air Waybill (AWB):</span>
                            <span className="font-mono font-bold text-cyan-300 text-right truncate">
                              {order.awbNumber || 'Generating...'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-slate-400 shrink-0">Est. Arrival:</span>
                            <span className="text-white text-right truncate">
                              {order.estimatedDelivery}
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setTrackingForm({
                                awb: order.awbNumber || '',
                                courier: order.courierName || '',
                              });
                              setEditingTrackingOrderId(order.id);
                            }}
                            className="w-full mt-2 h-9 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                          >
                            <span>✏️</span>
                            <span>Edit AWB &amp; Courier</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* WhatsApp Dispatch Alert Trigger */}
                    <button
                      onClick={() => handleSendWhatsAppAlert(order)}
                      className="w-full h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
                    >
                      <span>💬</span>
                      <span>Send WhatsApp Dispatch Alert</span>
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
