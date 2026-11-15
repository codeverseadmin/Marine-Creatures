'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SalesSubtab } from './types';
import { ProductThumbnail } from '@/components/ui/ProductThumbnail';
import PorPriceSettlementModal from './PorPriceSettlementModal';
import { isPartnerShipmentOrder, POPULAR_CARRIER_PARTNERS } from '@/lib/fulfillment-utils';

interface ControlOsSalesProps {
  initialSubtab?: SalesSubtab;
  showToast: (msg: string) => void;
}

export function ControlOsSales({ initialSubtab = 'orders', showToast }: ControlOsSalesProps) {
  const [subtab, setSubtab] = useState<SalesSubtab>(initialSubtab);

  // ─── Orders State ──────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStepFilter, setOrderStepFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [editingAwbOrderId, setEditingAwbOrderId] = useState<string | null>(null);
  const [awbInput, setAwbInput] = useState('');
  const [courierInput, setCourierInput] = useState('IndiGo CarGo Priority Express');
  const [stepCounts, setStepCounts] = useState<Record<string, number>>({});
  const [porSettlementOrder, setPorSettlementOrder] = useState<any | null>(null);
  const [pendingActionAfterPricing, setPendingActionAfterPricing] = useState<(() => void) | null>(null);

  // ─── Fulfillment / Shipment Modal State ─────────────────────────────────────
  const [fulfillmentModalOrder, setFulfillmentModalOrder] = useState<any | null>(null);
  const [isShipmentViaPartner, setIsShipmentViaPartner] = useState<boolean>(false);
  const [fulfillmentCourierInput, setFulfillmentCourierInput] = useState<string>('Priority Air Cargo Express');
  const [fulfillmentAwbInput, setFulfillmentAwbInput] = useState<string>('');
  const [fulfillmentEtaInput, setFulfillmentEtaInput] = useState<string>('Tomorrow via Priority Air Cargo');
  const [savingFulfillment, setSavingFulfillment] = useState<boolean>(false);

  // ─── Enquiries State ───────────────────────────────────────────────────────
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);
  const [enquirySearch, setEnquirySearch] = useState('');
  const [enquiryStageFilter, setEnquiryStageFilter] = useState('all');
  const [pipelineCounts, setPipelineCounts] = useState<Record<string, number>>({});
  const [followUpModalEnquiry, setFollowUpModalEnquiry] = useState<any | null>(null);
  const [followUpDateInput, setFollowUpDateInput] = useState('');
  const [followUpNoteInput, setFollowUpNoteInput] = useState('');

  // ─── Customers State ───────────────────────────────────────────────────────
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [activeCustomerDossier, setActiveCustomerDossier] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [customerTagInput, setCustomerTagInput] = useState('');

  // ─── Follow-ups State ──────────────────────────────────────────────────────
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);
  const [followUpTimeframe, setFollowUpTimeframe] = useState('today');
  const [followUpCounts, setFollowUpCounts] = useState<Record<string, number>>({});

  // ─── Fetch Orders ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams();
      if (orderStepFilter !== 'all') params.set('step', orderStepFilter);
      if (orderSearch) params.set('search', orderSearch);

      const res = await fetch(`/api/admin/orders?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setOrders(json.data || []);
          if (json.stepBreakdown) setStepCounts(json.stepBreakdown);
        }
      }
    } catch {
      showToast('Error syncing orders');
    } finally {
      setLoadingOrders(false);
    }
  }, [orderStepFilter, orderSearch, showToast]);

  // ─── Fetch Enquiries ───────────────────────────────────────────────────────
  const fetchEnquiries = useCallback(async () => {
    setLoadingEnquiries(true);
    try {
      const params = new URLSearchParams();
      if (enquiryStageFilter !== 'all') params.set('status', enquiryStageFilter);
      if (enquirySearch) params.set('search', enquirySearch);

      const res = await fetch(`/api/admin/enquiries?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setEnquiries(json.data || []);
          if (json.pipelineCounts) setPipelineCounts(json.pipelineCounts);
        }
      }
    } catch {
      showToast('Error syncing enquiries');
    } finally {
      setLoadingEnquiries(false);
    }
  }, [enquiryStageFilter, enquirySearch, showToast]);

  // ─── Fetch Customers ───────────────────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const params = new URLSearchParams();
      if (customerSearch) params.set('search', customerSearch);

      const res = await fetch(`/api/admin/customers?${params.toString()}`, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCustomers(json.data || []);
        }
      }
    } catch {
      showToast('Error syncing customers');
    } finally {
      setLoadingCustomers(false);
    }
  }, [customerSearch, showToast]);

  // ─── Fetch Customer 360 Dossier ───────────────────────────────────────────
  const fetchCustomerDossier = async (phone: string) => {
    setLoadingDossier(true);
    try {
      const res = await fetch(`/api/admin/customers?phone=${encodeURIComponent(phone)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setActiveCustomerDossier(json.data);
        }
      }
    } catch {
      showToast('Error loading customer dossier');
    } finally {
      setLoadingDossier(false);
    }
  };

  // ─── Fetch Follow-ups ──────────────────────────────────────────────────────
  const fetchFollowUps = useCallback(async () => {
    setLoadingFollowUps(true);
    try {
      const res = await fetch(`/api/admin/follow-ups?timeframe=${followUpTimeframe}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setFollowUps(json.data || []);
          if (json.counts) setFollowUpCounts(json.counts);
        }
      }
    } catch {
      showToast('Error syncing follow-ups');
    } finally {
      setLoadingFollowUps(false);
    }
  }, [followUpTimeframe, showToast]);

  useEffect(() => {
    if (subtab === 'orders') fetchOrders();
    if (subtab === 'enquiries') fetchEnquiries();
    if (subtab === 'customers') fetchCustomers();
    if (subtab === 'follow-ups') fetchFollowUps();
  }, [subtab, fetchOrders, fetchEnquiries, fetchCustomers, fetchFollowUps]);

  // Scroll lock when any modal is open
  useEffect(() => {
    if (selectedOrder || followUpModalEnquiry || activeCustomerDossier || porSettlementOrder || fulfillmentModalOrder) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedOrder, followUpModalEnquiry, activeCustomerDossier, porSettlementOrder, fulfillmentModalOrder]);

  // Order state transition
  const handleAdvanceStep = async (orderId: string, nextStep: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: orderId, currentStep: nextStep }),
      });
      if (res.ok) {
        showToast(`✓ Order advanced to ${nextStep.toUpperCase()}`);
        fetchOrders();
      } else {
        const json = await res.json();
        showToast(`⚠️ ${json.error || 'Failed to update step'}`);
      }
    } catch {
      showToast('Error updating order');
    }
  };

  // Order AWB assignment
  const handleSaveAwb = async (orderId: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: orderId,
          awbNumber: awbInput,
          courierName: courierInput,
        }),
      });
      if (res.ok) {
        showToast('✓ Tracking AWB saved');
        setEditingAwbOrderId(null);
        fetchOrders();
      }
    } catch {
      showToast('Error saving AWB');
    }
  };

  // ─── Fulfillment Configuration Handlers ─────────────────────────────────────
  const openFulfillmentModal = useCallback((order: any) => {
    const isPartner = isPartnerShipmentOrder(order);
    setIsShipmentViaPartner(isPartner);
    setFulfillmentCourierInput(order.courierName || 'Priority Air Cargo Express');
    setFulfillmentAwbInput(order.awbNumber || '');
    setFulfillmentEtaInput(order.estimatedDelivery || (isPartner ? 'Tomorrow via Priority Air Cargo' : 'Direct Concierge Handover'));
    setFulfillmentModalOrder(order);
  }, []);

  const handleSaveFulfillment = async () => {
    if (!fulfillmentModalOrder) return;
    if (isShipmentViaPartner && !fulfillmentAwbInput.trim()) {
      showToast('⚠️ Please enter an Air Waybill (AWB) or Shipment ID for partner cargo.');
      return;
    }
    setSavingFulfillment(true);
    try {
      const payload: any = {
        id: fulfillmentModalOrder.id,
        isShippedViaPartner: isShipmentViaPartner,
        fulfillmentType: isShipmentViaPartner ? 'partner_shipment' : 'direct_delivery',
        courierName: isShipmentViaPartner ? (fulfillmentCourierInput.trim() || 'Priority Air Cargo Express') : '',
        awbNumber: isShipmentViaPartner ? fulfillmentAwbInput.trim() : '',
        estimatedDelivery: fulfillmentEtaInput.trim() || (isShipmentViaPartner ? 'Within 24-48 Hours' : 'Direct Concierge Handover'),
      };

      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showToast(
          isShipmentViaPartner
            ? `✓ Partner Shipment saved (${payload.courierName} • ${payload.awbNumber})`
            : `✓ Configured as Direct Local Handover (No carrier partner required)`
        );
        if (selectedOrder && selectedOrder.id === fulfillmentModalOrder.id) {
          setSelectedOrder((prev: any) => prev ? { ...prev, ...payload } : null);
        }
        setFulfillmentModalOrder(null);
        await fetchOrders();
      } else {
        showToast(json.error || 'Failed to save fulfillment configuration');
      }
    } catch {
      showToast('Network error saving fulfillment configuration');
    } finally {
      setSavingFulfillment(false);
    }
  };

  // ─── POR Pricing Helpers & Handlers ─────────────────────────────────────────
  const orderHasUnresolvedPor = useCallback((order: any): boolean => {
    if (!order) return false;
    if (order.hasUnresolvedPorItems) return true;
    return (order.items || []).some(
      (it: any) =>
        (it.priceOnRequest || it.pricingStatus === 'PENDING_POR' || (it.product && it.product.price === 0) || it.price === 0) &&
        (!it.agreedUnitPrice || it.agreedUnitPrice <= 0)
    );
  }, []);

  const orderHasAnyPor = useCallback((order: any): boolean => {
    if (!order) return false;
    return (order.items || []).some(
      (it: any) =>
        it.priceOnRequest ||
        it.pricingStatus === 'PENDING_POR' ||
        (it.product && it.product.price === 0) ||
        it.price === 0 ||
        Boolean(it.agreedUnitPrice)
    );
  }, []);

  const handleOpenPricingModal = useCallback((order: any, pendingAction?: () => void) => {
    setPorSettlementOrder(order);
    setPendingActionAfterPricing(pendingAction ? () => pendingAction : null);
  }, []);

  const handleGenerateInvoiceClick = useCallback((order: any) => {
    if (orderHasUnresolvedPor(order)) {
      showToast('⚠️ Price On Request settlement is pending. Settle agreed prices before generating invoice.');
      handleOpenPricingModal(order, () => {
        window.open(`/invoice/${order.id}`, '_blank');
      });
    } else {
      window.open(`/invoice/${order.id}`, '_blank');
    }
  }, [orderHasUnresolvedPor, handleOpenPricingModal, showToast]);

  const handleSavePricingFromModal = async (
    itemsToUpdate: Array<{ id: string; name: string; agreedUnitPrice: number }>,
    isFullSettlement: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (!porSettlementOrder) return { success: false, error: 'No order selected.' };

    try {
      const res = await fetch(`/api/admin/orders/${porSettlementOrder.id}/por-pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: itemsToUpdate,
          expectedVersion: porSettlementOrder.pricingVersion,
          pricedBy: 'Admin Concierge',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Failed to save agreed pricing.' };
      }

      await fetchOrders();

      if (isFullSettlement) {
        showToast(`✓ Pricing settled and official invoice generated for #${porSettlementOrder.id}`);
        if (pendingActionAfterPricing) {
          pendingActionAfterPricing();
          setPendingActionAfterPricing(null);
        } else {
          window.open(`/invoice/${porSettlementOrder.id}`, '_blank');
        }
      } else {
        const remainingCount = (porSettlementOrder.items || []).filter((it: any) => {
          const isPor = it.priceOnRequest || it.pricingStatus === 'PENDING_POR' || (it.product && it.product.price === 0) || it.price === 0;
          const updated = itemsToUpdate.find((u) => u.id === (it.id || it.product?.id) || u.name === (it.name || it.product?.name));
          return isPor && !updated;
        }).length;
        showToast(`✓ Saved partial pricing. ${remainingCount} item(s) still pending settlement.`);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving agreed pricing.' };
    }
  };

  // Enquiry status change
  const handleEnquiryStatusChange = async (enquiryId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: enquiryId, status }),
      });
      if (res.ok) {
        showToast(`✓ Enquiry moved to ${status.toUpperCase()}`);
        fetchEnquiries();
      }
    } catch {
      showToast('Error updating enquiry');
    }
  };

  // Create follow-up from enquiry
  const handleCreateEnquiryFollowUp = async () => {
    if (!followUpModalEnquiry || !followUpDateInput) return;
    try {
      const res = await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: followUpModalEnquiry.id,
          followUpDate: followUpDateInput,
          followUpNote: followUpNoteInput,
        }),
      });
      if (res.ok) {
        showToast('✓ Follow-up task scheduled');
        setFollowUpModalEnquiry(null);
        setFollowUpDateInput('');
        setFollowUpNoteInput('');
        fetchEnquiries();
      }
    } catch {
      showToast('Error scheduling follow-up');
    }
  };

  // Complete follow-up task
  const handleCompleteFollowUp = async (id: string) => {
    try {
      const res = await fetch('/api/admin/follow-ups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status: 'completed' }),
      });
      if (res.ok) {
        showToast('✓ Follow-up marked completed');
        fetchFollowUps();
      }
    } catch {
      showToast('Error updating follow-up');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sales Sub-navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            onClick={() => setSubtab('orders')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center ${
              subtab === 'orders' ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Orders &amp; Shipments ({orders.length})
          </button>
          <button
            onClick={() => setSubtab('enquiries')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center ${
              subtab === 'enquiries' ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Concierge Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setSubtab('customers')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center ${
              subtab === 'customers' ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Customer 360 Dossiers
          </button>
          <button
            onClick={() => setSubtab('follow-ups')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center ${
              subtab === 'follow-ups' ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Follow-ups {followUpCounts.overdue ? `(${followUpCounts.overdue} Overdue)` : ''}
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden sm:block shrink-0">
          Module: SALES_OPERATIONS_OS
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. ORDERS VIEW                                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {subtab === 'orders' && (
        <div className="space-y-4">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#07131e] p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search Order ID, customer, phone, city..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full sm:w-64 min-h-[44px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={fetchOrders}
                className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 shrink-0"
              >
                Search
              </button>
            </div>

            {/* Step Filter Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {['all', 'placed', 'quarantine', 'packed', 'dispatched', 'delivered'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStepFilter(st)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 transition-colors flex items-center ${
                    orderStepFilter === st
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st} {stepCounts[st] !== undefined ? `(${stepCounts[st]})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Operational Table & Mobile Cards */}
          {loadingOrders ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse font-mono">
              Loading active orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center bg-[#07131e] rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No orders found matching the filter criteria.
            </div>
          ) : (
            <>
              {/* Mobile Orders Card View (< 768px) */}
              <div className="md:hidden space-y-3">
                {orders.map((o) => {
                  const nextStepMap: Record<string, string> = {
                    placed: 'quarantine',
                    quarantine: 'packed',
                    packed: 'dispatched',
                    dispatched: 'delivered',
                  };
                  const nextStep = nextStepMap[o.currentStep];

                  return (
                    <div
                      key={o.id}
                      className="bg-[#07131e] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                    >
                      {/* Card Header: ID, Step Badge, Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-cyan-400 text-sm">#{o.id}</span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{o.createdAt}</span>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            o.currentStep === 'delivered'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : o.currentStep === 'dispatched'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                              : o.currentStep === 'packed'
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                              : o.currentStep === 'quarantine'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {o.currentStep}
                        </span>
                      </div>

                      {/* Customer & Destination */}
                      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white truncate">{o.customerName}</span>
                          <a href={`tel:${o.phone}`} className="font-mono text-cyan-400 text-[11px] hover:underline">
                            {o.phone}
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          📍 {o.city} • {o.pincode || 'Metro'}
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                          <strong className="text-slate-300">{o.items?.length || 0} specimens: </strong>
                          <span className="truncate inline-block max-w-[200px] align-bottom">
                            {o.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Financial & Logistics Info */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Amount</span>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            ₹{o.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block mb-0.5">Fulfillment / Shipment</span>
                          <button
                            type="button"
                            onClick={() => openFulfillmentModal(o)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-all active:scale-95"
                            title="Click to configure shipment vs direct handover"
                          >
                            {isPartnerShipmentOrder(o) ? (
                              <div className="text-right">
                                <span className="font-mono text-[11px] font-bold text-cyan-300 block">
                                  ✈️ {o.awbNumber || 'Pending AWB'}
                                </span>
                                <span className="text-[9px] text-slate-400 block truncate max-w-[130px]">
                                  {o.courierName || 'Partner Cargo'} ✏️
                                </span>
                              </div>
                            ) : (
                              <div className="text-right">
                                <span className="text-[11px] font-semibold text-emerald-400 block">
                                  🚚 Direct Handover
                                </span>
                                <span className="text-[9px] text-slate-500 block">
                                  No Partner Carrier ✏️
                                </span>
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Mobile Actions Bar (44px touch targets) */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                        {nextStep ? (
                          <button
                            onClick={() => handleAdvanceStep(o.id, nextStep)}
                            className="min-h-[44px] px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase transition-colors flex items-center justify-center text-center"
                          >
                            → {nextStep}
                          </button>
                        ) : (
                          <div className="min-h-[44px] flex items-center justify-center text-[10px] text-emerald-400 font-mono">
                            ✓ Complete
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => handleGenerateInvoiceClick(o)}
                          className={`min-h-[44px] px-2 rounded-xl text-xs font-semibold flex items-center justify-center text-center border transition-all ${
                            orderHasUnresolvedPor(o)
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 font-bold shadow-sm'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          }`}
                          title={orderHasUnresolvedPor(o) ? 'Mandatory: Settle POR pricing before generating invoice' : 'Open Invoice'}
                        >
                          {orderHasUnresolvedPor(o) ? '🔒 Settle Price' : 'Invoice ↗'}
                        </button>

                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="min-h-[44px] px-2 rounded-xl bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-400/30 text-cyan-300 text-xs font-semibold flex items-center justify-center text-center"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Orders Table View (>= 768px) */}
              <div className="hidden md:block bg-[#07131e] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#040c14] border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    <tr>
                      <th className="p-3 pl-4">Order ID</th>
                      <th className="p-3">Customer &amp; City</th>
                      <th className="p-3">Specimens &amp; Items</th>
                      <th className="p-3">Total Value</th>
                      <th className="p-3">Lifecycle Step</th>
                      <th className="p-3">Cargo / AWB</th>
                      <th className="p-3 pr-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {orders.map((o) => {
                      const nextStepMap: Record<string, string> = {
                        placed: 'quarantine',
                        quarantine: 'packed',
                        packed: 'dispatched',
                        dispatched: 'delivered',
                      };
                      const nextStep = nextStepMap[o.currentStep];

                      return (
                        <tr key={o.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-3 pl-4 font-mono font-bold text-cyan-400">
                            #{o.id}
                            <span className="block text-[10px] text-slate-400 font-normal mt-0.5">{o.createdAt}</span>
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-white block">{o.customerName}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{o.phone} • {o.city}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-white">{o.items?.length || 0} specimens</span>
                              {orderHasUnresolvedPor(o) && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  POR Pending
                                </span>
                              )}
                            </div>
                            <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                              {o.items?.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-emerald-400">
                            <div>₹{o.totalAmount?.toLocaleString('en-IN')}</div>
                            {orderHasUnresolvedPor(o) && (
                              <span className="block text-[10px] text-amber-400/90 font-mono font-normal">
                                (POR Partial)
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-block border ${
                                o.currentStep === 'delivered'
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : o.currentStep === 'dispatched'
                                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                  : o.currentStep === 'packed'
                                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                  : o.currentStep === 'quarantine'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {o.currentStep}
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => openFulfillmentModal(o)}
                              className="text-left group hover:bg-slate-800/80 p-1.5 rounded-lg border border-slate-800/60 hover:border-slate-700 transition-all block w-full"
                              title="Click to configure shipment vs direct handover"
                            >
                              {isPartnerShipmentOrder(o) ? (
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-[11px] font-bold text-cyan-300">
                                      ✈️ {o.awbNumber || 'Pending AWB'}
                                    </span>
                                    <span className="text-[10px] text-cyan-400 opacity-60 group-hover:opacity-100">✏️</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block truncate max-w-[140px] mt-0.5">
                                    {o.courierName || 'Priority Air Cargo'}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-emerald-400">
                                      🚚 Direct Handover
                                    </span>
                                    <span className="text-[10px] text-emerald-400 opacity-60 group-hover:opacity-100">✏️</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 block mt-0.5">
                                    No Partner Carrier
                                  </span>
                                </div>
                              )}
                            </button>
                          </td>
                          <td className="p-3 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {nextStep && (
                                <button
                                  onClick={() => handleAdvanceStep(o.id, nextStep)}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase transition-colors"
                                  title={`Advance to ${nextStep}`}
                                >
                                  → {nextStep}
                                </button>
                              )}
                              {orderHasUnresolvedPor(o) ? (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateInvoiceClick(o)}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                                  title="Mandatory: Settle pending POR pricing before generating invoice"
                                >
                                  <span>🔒</span>
                                  <span>Settle Price</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleGenerateInvoiceClick(o)}
                                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors cursor-pointer"
                                  title="Open Invoice"
                                >
                                  Invoice ↗
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                              >
                                Details
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
            </>
          )}

          {/* Order Details Modal Drawer */}
          {selectedOrder && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setSelectedOrder(null)}
            >
              <div
                className="bg-[#07131e] border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-2xl w-full max-h-[92vh] sm:max-h-[85vh] overflow-y-auto space-y-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Order #{selectedOrder.id}</span>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        {selectedOrder.currentStep.toUpperCase()}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedOrder.createdAt}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-sm transition-colors"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                  <div className="bg-[#050f18] p-3.5 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                      Customer Dossier
                    </span>
                    <h4 className="font-bold text-white text-sm">{selectedOrder.customerName}</h4>
                    <a href={`tel:${selectedOrder.phone}`} className="text-cyan-400 font-mono mt-0.5 block hover:underline">
                      {selectedOrder.phone}
                    </a>
                    <p className="text-slate-300 mt-1">{selectedOrder.address}, {selectedOrder.city} - {selectedOrder.pincode}</p>
                  </div>
                  <div className="bg-[#050f18] p-3.5 rounded-xl border border-slate-800 relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                        Logistics &amp; Fulfillment
                      </span>
                      <button
                        type="button"
                        onClick={() => openFulfillmentModal(selectedOrder)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>⚙️</span>
                        <span>Configure</span>
                      </button>
                    </div>
                    {isPartnerShipmentOrder(selectedOrder) ? (
                      <div className="space-y-1">
                        <p className="text-slate-300">
                          <strong className="text-white">Mode:</strong> <span className="text-cyan-400 font-medium">✈️ Partner Cargo</span>
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-white">Carrier:</strong> {selectedOrder.courierName || 'Priority Air Cargo Express'}
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-white">AWB:</strong>{' '}
                          <span className="font-mono text-cyan-300 font-bold">{selectedOrder.awbNumber || 'Pending'}</span>
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-white">ETA:</strong> {selectedOrder.estimatedDelivery || 'Within 24-48 Hours'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-slate-300">
                          <strong className="text-white">Mode:</strong> <span className="text-emerald-400 font-semibold">🚚 Direct Handover</span>
                        </p>
                        <p className="text-slate-400 text-[11px]">
                          Local concierge delivery / store handover. No partner courier or AWB on invoice.
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-white">Handover ETA:</strong> {selectedOrder.estimatedDelivery || 'Direct Concierge Handover'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items in order */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Specimens &amp; Hardware ({selectedOrder.items?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#050f18] border border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <ProductThumbnail product={item.product || item} sizeClassName="w-10 h-10 rounded-lg" />
                          <div>
                            <h5 className="font-semibold text-white text-xs">{item.name}</h5>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] text-slate-400">Qty: {item.quantity}</span>
                              {(item.priceOnRequest || item.pricingStatus === 'PENDING_POR' || item.price === 0) && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                  item.agreedUnitPrice
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                }`}>
                                  {item.agreedUnitPrice ? `Agreed ₹${item.agreedUnitPrice}` : 'POR Pending'}
                                </span>
                              )}
                              {item.warranty?.hasWarranty ? (
                                <span className="text-[10px] text-cyan-400 font-mono">
                                  🛡️ {item.warranty.durationValue} {item.warranty.durationUnit} ({item.warranty.provider === 'manufacturer' ? 'Mfg' : 'Seller'})
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  No Warranty
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* History timeline */}
                {selectedOrder.history?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Fulfillment Log
                    </h4>
                    <div className="space-y-1.5">
                      {selectedOrder.history.map((h: any, i: number) => (
                        <div key={i} className="text-[11px] p-2 rounded bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800 text-slate-300 shrink-0">
                            {h.step}
                          </span>
                          <span className="text-slate-300 flex-1">{h.note}</span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{h.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-slate-800">
                  {orderHasUnresolvedPor(selectedOrder) ? (
                    <button
                      type="button"
                      onClick={() => {
                        const ord = selectedOrder;
                        setSelectedOrder(null);
                        handleOpenPricingModal(ord);
                      }}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <span>🔒</span>
                      <span>Settle Pending Product Pricing</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        window.open(`/invoice/${selectedOrder.id}`, '_blank');
                      }}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <span>📄</span>
                      <span>View Official Invoice ↗</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. ENQUIRIES VIEW                                                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {subtab === 'enquiries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#07131e] p-3 rounded-2xl border border-slate-800">
            <input
              type="text"
              placeholder="Search leads by name, phone, service, location..."
              value={enquirySearch}
              onChange={(e) => setEnquirySearch(e.target.value)}
              className="w-full sm:w-72 min-h-[44px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {['all', 'new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((st) => (
                <button
                  key={st}
                  onClick={() => setEnquiryStageFilter(st)}
                  className={`min-h-[36px] px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 transition-colors flex items-center ${
                    enquiryStageFilter === st
                      ? 'bg-cyan-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st} {pipelineCounts[st] !== undefined ? `(${pipelineCounts[st]})` : ''}
                </button>
              ))}
            </div>
          </div>

          {loadingEnquiries ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse font-mono">
              Loading concierge inquiries...
            </div>
          ) : enquiries.length === 0 ? (
            <div className="p-12 text-center bg-[#07131e] rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No inquiries found matching this stage.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="bg-[#07131e] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {enq.type?.replace('_', ' ') || 'CONSULTATION'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{enq.createdAt}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{enq.name}</h4>
                    <a href={`tel:${enq.phone}`} className="text-cyan-400 text-xs font-mono font-semibold block hover:underline">
                      {enq.phone}
                    </a>
                    {enq.email && <p className="text-[11px] text-slate-400">{enq.email}</p>}
                    {enq.location && <p className="text-[11px] text-slate-400">📍 {enq.location}</p>}
                  </div>

                  {enq.serviceType && (
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <p><strong className="text-white">Service:</strong> {enq.serviceType}</p>
                      {enq.tankSize && <p><strong className="text-white">Volume:</strong> {enq.tankSize}</p>}
                      {enq.notes && <p className="text-slate-400 text-[11px] mt-1">{enq.notes}</p>}
                    </div>
                  )}

                  {/* Stage Dropdown + Actions */}
                  <div className="pt-3 border-t border-slate-800 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
                    <select
                      value={enq.status}
                      onChange={(e) => handleEnquiryStatusChange(enq.id, e.target.value)}
                      className="min-h-[44px] bg-black border border-slate-700 text-white text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
                    >
                      <option value="new">NEW</option>
                      <option value="contacted">CONTACTED</option>
                      <option value="qualified">QUALIFIED</option>
                      <option value="proposal">PROPOSAL</option>
                      <option value="won">WON</option>
                      <option value="lost">LOST</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setFollowUpModalEnquiry(enq);
                          setFollowUpDateInput(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                        }}
                        className="min-h-[44px] flex-1 xs:flex-initial px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center border border-slate-700"
                        title="Schedule Follow-up"
                      >
                        ⏰ Follow-up
                      </button>

                      <a
                        href={`https://wa.me/${enq.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                          `Hello ${enq.name}, Suraj here from Marine Creatures regarding your ${enq.serviceType || 'aquarium'} inquiry.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="min-h-[44px] flex-1 xs:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Schedule Follow-up Modal */}
          {followUpModalEnquiry && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setFollowUpModalEnquiry(null)}
            >
              <div
                className="bg-[#07131e] border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-bold text-white text-sm">
                    Schedule Follow-up for {followUpModalEnquiry.name}
                  </h3>
                  <button
                    onClick={() => setFollowUpModalEnquiry(null)}
                    className="min-w-[40px] min-h-[40px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={followUpDateInput}
                      onChange={(e) => setFollowUpDateInput(e.target.value)}
                      className="w-full min-h-[44px] px-3 rounded-xl bg-black border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                      Action Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Call to confirm tank dimensions and send proposal quote..."
                      value={followUpNoteInput}
                      onChange={(e) => setFollowUpNoteInput(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black border border-slate-700 text-white text-xs resize-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setFollowUpModalEnquiry(null)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateEnquiryFollowUp}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs"
                  >
                    Save Follow-up
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. CUSTOMER 360 DOSSIER VIEW                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {subtab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#07131e] p-3 rounded-2xl border border-slate-800">
            <input
              type="text"
              placeholder="Search customer dossiers by name, phone, city, VIP tags..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full sm:w-80 min-h-[44px] px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={fetchCustomers}
              className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 shrink-0"
            >
              Refresh Dossiers
            </button>
          </div>

          {loadingCustomers ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse font-mono">
              Loading Customer 360 index...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center bg-[#07131e] rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No customers found. Customers are registered automatically when orders or inquiries arrive.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => fetchCustomerDossier(c.phone)}
                  className="bg-[#07131e] border border-slate-800 hover:border-cyan-400/40 rounded-2xl p-4 space-y-3 cursor-pointer transition-all hover:shadow-xl group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400">#{c.id}</span>
                    <span className="text-[10px] text-cyan-400 font-mono group-hover:underline">View 360 →</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                      {c.name}
                    </h4>
                    <p className="text-cyan-400 font-mono text-xs">{c.phone}</p>
                    <p className="text-slate-400 text-xs">{c.city} • {c.address || 'Address pending'}</p>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 border-t border-slate-800 text-center text-[10px] font-mono">
                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block">Orders</span>
                      <strong className="text-white">{c.totalOrdersCount || 0}</strong>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block">Spend</span>
                      <strong className="text-emerald-400">₹{(c.totalSpend || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 block">Leads</span>
                      <strong className="text-amber-400">{c.enquiriesCount || 0}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Customer 360 Dossier Modal */}
          {activeCustomerDossier && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={() => setActiveCustomerDossier(null)}
            >
              <div
                className="bg-[#07131e] border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 max-w-3xl w-full max-h-[92vh] sm:max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-xl text-cyan-400 font-bold shrink-0">
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">{activeCustomerDossier.name}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                          CUSTOMER 360
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {activeCustomerDossier.phone} • {activeCustomerDossier.city}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveCustomerDossier(null)}
                    className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-sm transition-colors"
                    aria-label="Close dossier"
                  >
                    ✕
                  </button>
                </div>

                {/* Metrics strip */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 text-center text-xs font-mono">
                  <div className="bg-[#050f18] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Total Spend</span>
                    <strong className="text-emerald-400 text-sm">₹{activeCustomerDossier.totalSpend?.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="bg-[#050f18] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Orders Placed</span>
                    <strong className="text-white text-sm">{activeCustomerDossier.totalOrdersCount}</strong>
                  </div>
                  <div className="bg-[#050f18] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Living Exhibits</span>
                    <strong className="text-purple-400 text-sm">{activeCustomerDossier.projectsCount}</strong>
                  </div>
                  <div className="bg-[#050f18] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Maintenance Logs</span>
                    <strong className="text-cyan-400 text-sm">{activeCustomerDossier.maintenanceCount}</strong>
                  </div>
                  <div className="bg-[#050f18] p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Coupons Used</span>
                    <strong className="text-amber-400 text-sm">{activeCustomerDossier.couponRedemptionsCount || 0}</strong>
                  </div>
                </div>

                {/* Orders history */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Orders ({activeCustomerDossier.orders?.length || 0})
                  </h4>
                  {activeCustomerDossier.orders?.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No historical orders recorded.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeCustomerDossier.orders.map((ord: any) => (
                        <div key={ord.id} className="p-3 rounded-xl bg-[#050f18] border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono font-bold text-cyan-400">#{ord.id}</span>
                            <span className="text-slate-400 ml-2">({ord.items?.length} items)</span>
                            <span className="text-slate-500 text-[10px] block mt-0.5">{ord.createdAt}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400 block">₹{ord.totalAmount?.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] uppercase font-mono text-cyan-300">{ord.currentStep}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coupon Redemptions History */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Promotional Coupon Redemptions ({activeCustomerDossier.couponRedemptions?.length || 0})
                  </h4>
                  {(!activeCustomerDossier.couponRedemptions || activeCustomerDossier.couponRedemptions.length === 0) ? (
                    <p className="text-xs text-slate-500 italic">No coupons redeemed by this client.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeCustomerDossier.couponRedemptions.map((red: any) => (
                        <div key={red.id} className="p-3 rounded-xl bg-[#050f18] border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-300">🏷️ {red.couponCode}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                -₹{red.discountAmount?.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block mt-1">
                              Order: #{red.orderId} • Order Total: ₹{red.orderTotal?.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                              {red.status || 'completed'}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-1">
                              {new Date(red.redeemedAt || red.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enquiries & Projects */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Concierge Enquiries ({activeCustomerDossier.enquiries?.length || 0})
                  </h4>
                  {activeCustomerDossier.enquiries?.map((enq: any) => (
                    <div key={enq.id} className="p-3 rounded-xl bg-[#050f18] border border-slate-800 text-xs space-y-1 mb-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white">{enq.serviceType || 'Consultation'}</span>
                        <span className="text-[10px] font-mono text-amber-400">{enq.status.toUpperCase()}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{enq.notes || 'No notes'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. FOLLOW-UPS VIEW                                                  */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {subtab === 'follow-ups' && (
        <div className="space-y-4">
          <div className="bg-[#07131e] p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setFollowUpTimeframe('today')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  followUpTimeframe === 'today' ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Today ({followUpCounts.today || 0})
              </button>
              <button
                onClick={() => setFollowUpTimeframe('overdue')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  followUpTimeframe === 'overdue' ? 'bg-rose-500 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Overdue ({followUpCounts.overdue || 0})
              </button>
              <button
                onClick={() => setFollowUpTimeframe('upcoming')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  followUpTimeframe === 'upcoming' ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Upcoming ({followUpCounts.upcoming || 0})
              </button>
              <button
                onClick={() => setFollowUpTimeframe('completed')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  followUpTimeframe === 'completed' ? 'bg-emerald-500 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Completed ({followUpCounts.completed || 0})
              </button>
            </div>
          </div>

          {loadingFollowUps ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse font-mono">
              Loading follow-up schedule...
            </div>
          ) : followUps.length === 0 ? (
            <div className="p-12 text-center bg-[#07131e] rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No follow-ups in this timeframe. Outstanding customer callbacks and quote checks appear here.
            </div>
          ) : (
            <div className="space-y-2.5">
              {followUps.map((flw) => (
                <div
                  key={flw.id}
                  className="bg-[#07131e] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                        flw.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {flw.priority}
                      </span>
                      <h4 className="font-bold text-white text-xs">{flw.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Due: {new Date(flw.dueDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-cyan-400 font-mono">{flw.customerName} • {flw.customerPhone}</p>
                    {flw.notes && <p className="text-slate-400 text-[11px]">{flw.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <a
                      href={`https://wa.me/${flw.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hi ${flw.customerName}, following up regarding your Marine Creatures consultation!`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="min-h-[44px] flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>💬</span>
                      <span>WhatsApp</span>
                    </a>
                    {flw.status === 'pending' && (
                      <button
                        onClick={() => handleCompleteFollowUp(flw.id)}
                        className="min-h-[44px] flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center"
                      >
                        ✓ Complete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POR Price Settlement Modal */}
      {porSettlementOrder && (
        <PorPriceSettlementModal
          order={porSettlementOrder}
          isOpen={Boolean(porSettlementOrder)}
          onClose={() => {
            setPorSettlementOrder(null);
            setPendingActionAfterPricing(null);
          }}
          onSavePricing={handleSavePricingFromModal}
        />
      )}

      {/* ── Fulfillment & Shipment Configuration Modal ─────────────────────── */}
      {fulfillmentModalOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="fulfillment-modal-title"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div className="bg-[#0b1420] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative text-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                  ORDER FULFILLMENT SETTINGS
                </span>
                <h3 id="fulfillment-modal-title" className="text-base sm:text-lg font-bold text-white">
                  Dispatch &amp; Shipment Method
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order <span className="font-mono text-cyan-300 font-bold">#{fulfillmentModalOrder.id}</span> • {fulfillmentModalOrder.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFulfillmentModalOrder(null)}
                className="min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors"
                aria-label="Close Modal"
              >
                ✕
              </button>
            </div>

            {/* Destination summary */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Consignee Destination</span>
                <span className="font-semibold text-slate-200">
                  {fulfillmentModalOrder.city} • PIN: {fulfillmentModalOrder.pincode}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Total Order</span>
                <span className="font-mono text-emerald-400 font-bold">
                  ₹{fulfillmentModalOrder.totalAmount?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Mode Selection Cards */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Select Dispatch Option:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Option 1: Direct Handover */}
                <button
                  type="button"
                  onClick={() => {
                    setIsShipmentViaPartner(false);
                    if (!fulfillmentEtaInput || fulfillmentEtaInput.includes('Priority Air Cargo')) {
                      setFulfillmentEtaInput('Direct Concierge Handover');
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !isShipmentViaPartner
                      ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🚚</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      !isShipmentViaPartner ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      No Partner
                    </span>
                  </div>
                  <h4 className="font-bold text-xs mt-2 text-white">Direct Local Delivery</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    In-house delivery or pickup. No courier partner or AWB details required.
                  </p>
                </button>

                {/* Option 2: Partner Shipment */}
                <button
                  type="button"
                  onClick={() => {
                    setIsShipmentViaPartner(true);
                    if (!fulfillmentCourierInput) {
                      setFulfillmentCourierInput('Priority Air Cargo Express');
                    }
                    if (!fulfillmentEtaInput || fulfillmentEtaInput.includes('Direct Concierge')) {
                      setFulfillmentEtaInput('Tomorrow via Priority Air Cargo');
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isShipmentViaPartner
                      ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">✈️</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isShipmentViaPartner ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}>
                      Cargo Partner
                    </span>
                  </div>
                  <h4 className="font-bold text-xs mt-2 text-white">Partner Cargo Shipment</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Commercial carrier (Air Cargo/Courier). Collects Carrier &amp; AWB tracking ID.
                  </p>
                </button>
              </div>
            </div>

            {/* Conditional Fields */}
            {isShipmentViaPartner ? (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Partner Logistics Parameters (Shown on Official Invoice)
                </span>

                {/* Carrier Partner */}
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">
                    Carrier Partner Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fulfillmentCourierInput}
                    onChange={(e) => setFulfillmentCourierInput(e.target.value)}
                    placeholder="e.g. Priority Air Cargo Express"
                    className="w-full min-h-[40px] bg-[#050f18] border border-slate-700 rounded-xl px-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                  {/* Quick Select Carrier Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {POPULAR_CARRIER_PARTNERS.map((carrier) => (
                      <button
                        key={carrier}
                        type="button"
                        onClick={() => setFulfillmentCourierInput(carrier)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                          fulfillmentCourierInput === carrier
                            ? 'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {carrier}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Air Waybill (AWB) */}
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">
                    Air Waybill (AWB) / Shipment ID <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={fulfillmentAwbInput}
                    onChange={(e) => setFulfillmentAwbInput(e.target.value)}
                    placeholder="e.g. EXP-AIR-7729-CCU"
                    className="w-full min-h-[40px] bg-[#050f18] border border-slate-700 rounded-xl px-3 font-mono text-cyan-300 font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Air Cargo Waybill assigned by airline/courier partner. Printed on customer manifest.
                  </span>
                </div>

                {/* Estimated Delivery / ETA */}
                <div>
                  <label className="text-slate-300 block mb-1 font-medium">
                    Estimated Delivery / Flight ETA
                  </label>
                  <input
                    type="text"
                    value={fulfillmentEtaInput}
                    onChange={(e) => setFulfillmentEtaInput(e.target.value)}
                    placeholder="e.g. Tomorrow via Priority Air Cargo"
                    className="w-full min-h-[40px] bg-[#050f18] border border-slate-700 rounded-xl px-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span>✓</span>
                  <span>Direct Concierge Delivery Active</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  No carrier partner or AWB tracking code will be required or collected. The customer invoice will be generated cleanly for direct local delivery without air cargo placeholders.
                </p>
                <div>
                  <label className="text-slate-300 block mb-1 font-medium text-[11px]">
                    Handover ETA / Delivery Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={fulfillmentEtaInput}
                    onChange={(e) => setFulfillmentEtaInput(e.target.value)}
                    placeholder="e.g. Direct Concierge Handover"
                    className="w-full min-h-[40px] bg-[#050f18] border border-slate-700 rounded-xl px-3 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setFulfillmentModalOrder(null)}
                disabled={savingFulfillment}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFulfillment}
                disabled={savingFulfillment}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {savingFulfillment ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Save &amp; Update Invoice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
