'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { OperationsSubtab } from './types';

interface ControlOsOperationsProps {
  initialSubtab?: OperationsSubtab;
  showToast?: (msg: string) => void;
}

export function ControlOsOperations({
  initialSubtab = 'quarantine',
  showToast = () => {},
}: ControlOsOperationsProps) {
  const [activeSubtab, setActiveSubtab] = useState<OperationsSubtab>(initialSubtab);

  // Quarantine State
  const [quarantineItems, setQuarantineItems] = useState<any[]>([]);
  const [quarantineMetrics, setQuarantineMetrics] = useState({ active: 0, pendingReview: 0, cleared: 0, failed: 0 });
  const [isLoadingQuarantine, setIsLoadingQuarantine] = useState(false);
  const [quarantineFilter, setQuarantineFilter] = useState('ALL');

  // Dispatch State
  const [dispatchOrders, setDispatchOrders] = useState<any[]>([]);
  const [dispatchMetrics, setDispatchMetrics] = useState({ readyToPack: 0, packed: 0, inTransit: 0, delivered: 0 });
  const [isLoadingDispatch, setIsLoadingDispatch] = useState(false);
  const [editingAwbOrder, setEditingAwbOrder] = useState<any | null>(null);
  const [awbInput, setAwbInput] = useState('');
  const [courierInput, setCourierInput] = useState('');
  const [etaInput, setEtaInput] = useState('');

  // Maintenance State
  const [maintenanceRecords, setMaintenanceRecords] = useState<any[]>([]);
  const [maintenanceMetrics, setMaintenanceMetrics] = useState({ scheduled: 0, inProgress: 0, completed: 0, overdue: 0 });
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);
  const [isNewMaintenanceModalOpen, setIsNewMaintenanceModalOpen] = useState(false);
  const [newMaintenanceForm, setNewMaintenanceForm] = useState({
    customerName: '',
    customerPhone: '',
    projectCode: '',
    aquariumSummary: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    serviceType: 'ROUTINE',
    technician: 'Senior Biologist',
    notes: '',
  });

  // ── Fetch Quarantine Data ──────────────────────────────────────────────────
  const fetchQuarantine = useCallback(async () => {
    setIsLoadingQuarantine(true);
    try {
      const res = await fetch(`/api/admin/operations/quarantine?status=${quarantineFilter}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const list = Array.isArray(json.data) ? json.data : (json.data?.items || []);
          setQuarantineItems(list);
          if (json.data?.metrics) {
            setQuarantineMetrics(json.data.metrics);
          } else {
            setQuarantineMetrics({
              active: list.length,
              pendingReview: list.filter((i: any) => i.currentStep === 'quarantine').length,
              cleared: list.filter((i: any) => i.currentStep === 'packed' || i.isApproved).length,
              failed: 0,
            });
          }
        }
      }
    } catch {
      showToast('Error syncing quarantine telemetry');
    } finally {
      setIsLoadingQuarantine(false);
    }
  }, [quarantineFilter, showToast]);

  // ── Fetch Dispatch Data ────────────────────────────────────────────────────
  const fetchDispatch = useCallback(async () => {
    setIsLoadingDispatch(true);
    try {
      const res = await fetch('/api/admin/operations/dispatch', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const list = Array.isArray(json.data) ? json.data : (json.data?.orders || []);
          setDispatchOrders(list);
          if (json.data?.metrics) {
            setDispatchMetrics(json.data.metrics);
          } else {
            setDispatchMetrics({
              readyToPack: list.filter((o: any) => o.currentStep === 'quarantine').length,
              packed: list.filter((o: any) => o.currentStep === 'packed').length,
              inTransit: list.filter((o: any) => o.currentStep === 'dispatched').length,
              delivered: list.filter((o: any) => o.currentStep === 'delivered').length,
            });
          }
        }
      }
    } catch {
      showToast('Error syncing dispatch logistics');
    } finally {
      setIsLoadingDispatch(false);
    }
  }, [showToast]);

  // ── Fetch Maintenance Data ─────────────────────────────────────────────────
  const fetchMaintenance = useCallback(async () => {
    setIsLoadingMaintenance(true);
    try {
      const res = await fetch('/api/admin/operations/maintenance', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          const list = Array.isArray(json.data) ? json.data : (json.data?.records || []);
          setMaintenanceRecords(list);
          if (json.data?.metrics) {
            setMaintenanceMetrics(json.data.metrics);
          }
        }
      }
    } catch {
      showToast('Error syncing maintenance schedule');
    } finally {
      setIsLoadingMaintenance(false);
    }
  }, [showToast]);

  // Lock body scroll when modals are active
  useEffect(() => {
    if (editingAwbOrder || isNewMaintenanceModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [editingAwbOrder, isNewMaintenanceModalOpen]);

  // Sync on tab change
  useEffect(() => {
    if (activeSubtab === 'quarantine') fetchQuarantine();
    else if (activeSubtab === 'dispatch') fetchDispatch();
    else if (activeSubtab === 'maintenance' || activeSubtab === 'schedule') fetchMaintenance();
  }, [activeSubtab, fetchQuarantine, fetchDispatch, fetchMaintenance]);

  // ── Handlers for Quarantine ────────────────────────────────────────────────
  const handleUpdateQuarantineState = async (orderId: string, itemSku: string, action: 'PASS' | 'FAIL' | 'EXTEND') => {
    try {
      const res = await fetch('/api/admin/operations/quarantine', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, itemSku, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✓ Quarantine status updated: ${action}`);
        fetchQuarantine();
      } else {
        showToast(`✕ Update failed: ${data.error || 'Server error'}`);
      }
    } catch {
      showToast('✕ Network error updating quarantine status');
    }
  };

  // ── Handlers for Dispatch ──────────────────────────────────────────────────
  const handleUpdateDispatch = async (orderId: string, newStep?: string) => {
    try {
      const body: any = { orderId };
      if (newStep) body.step = newStep;
      if (editingAwbOrder?.id === orderId) {
        body.awb = awbInput;
        body.courier = courierInput;
        body.eta = etaInput;
      }

      const res = await fetch('/api/admin/operations/dispatch', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Dispatch details updated');
        setEditingAwbOrder(null);
        fetchDispatch();
      } else {
        showToast(`✕ Dispatch update error: ${data.error}`);
      }
    } catch {
      showToast('✕ Network error saving dispatch');
    }
  };

  // ── Handlers for Maintenance ───────────────────────────────────────────────
  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/operations/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newMaintenanceForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Service appointment scheduled');
        setIsNewMaintenanceModalOpen(false);
        setNewMaintenanceForm({
          customerName: '',
          customerPhone: '',
          projectCode: '',
          aquariumSummary: '',
          scheduledDate: new Date().toISOString().split('T')[0],
          serviceType: 'ROUTINE',
          technician: 'Senior Biologist',
          notes: '',
        });
        fetchMaintenance();
      } else {
        showToast(`✕ Scheduling error: ${data.error}`);
      }
    } catch {
      showToast('✕ Network error scheduling service');
    }
  };

  const handleUpdateMaintenanceStatus = async (recordId: string, status: string) => {
    try {
      const res = await fetch('/api/admin/operations/maintenance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ recordId, status }),
      });
      if (res.ok) {
        showToast(`✓ Service marked ${status}`);
        fetchMaintenance();
      }
    } catch {
      showToast('✕ Error updating service status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Operations Center
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              Live Logistics
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Biological quarantine protocol, pressurized air-cargo dispatch, and architectural servicing.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b121a] border border-slate-800 rounded-xl overflow-x-auto scrollbar-none max-w-full">
          {[
            { id: 'quarantine', label: 'Quarantine Protocol', icon: '🧪' },
            { id: 'dispatch', label: 'Dispatch & Cargo', icon: '✈️' },
            { id: 'maintenance', label: 'Maintenance Log', icon: '🔧' },
            { id: 'schedule', label: 'Calendar Schedule', icon: '📅' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id as OperationsSubtab)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
                activeSubtab === tab.id
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: QUARANTINE PROTOCOL                                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'quarantine' && (
        <div className="space-y-6">
          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Under Observation</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{quarantineMetrics.active}</div>
              <span className="text-[10px] text-slate-500">Live marine specimens</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Needs Vet Review</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{quarantineMetrics.pendingReview}</div>
              <span className="text-[10px] text-slate-500">Days target reached</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Cleared for Dispatch</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{quarantineMetrics.cleared}</div>
              <span className="text-[10px] text-slate-500">Biological cert approved</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">Failed / Isolated</span>
              <div className="text-2xl font-bold font-mono text-red-400 mt-1">{quarantineMetrics.failed}</div>
              <span className="text-[10px] text-slate-500">Pathogen detected</span>
            </div>
          </div>

          {/* Operational Quarantine Table */}
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Specimen Quarantine Register</span>
                <select
                  value={quarantineFilter}
                  onChange={(e) => setQuarantineFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Batches</option>
                  <option value="ACTIVE">Active Quarantine</option>
                  <option value="CLEARED">Cleared</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <button
                onClick={fetchQuarantine}
                className="min-h-[44px] px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-slate-800/80 transition-colors self-start sm:self-auto"
              >
                ↻ Refresh Register
              </button>
            </div>

            {isLoadingQuarantine ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                Reading biosecurity isolation telemetry...
              </div>
            ) : quarantineItems.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                No specimens currently in this quarantine filter status.
              </div>
            ) : (
              <>
                {/* Mobile Quarantine Cards */}
                <div className="md:hidden p-3 space-y-3">
                  {quarantineItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/90 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-white truncate">
                            {item.productName || item.name || (item.specimens?.[0]?.name ? `${item.specimens[0].name}${item.specimens.length > 1 ? ` (+${item.specimens.length - 1} more)` : ''}` : 'Marine Specimen Batch')}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 block">{item.sku || item.orderId || 'LIVE-SPECIMEN'}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                            item.status === 'CLEARED'
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                              : item.status === 'FAILED'
                              ? 'bg-red-950/70 text-red-400 border border-red-800'
                              : 'bg-amber-950/70 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {item.status || 'IN_OBSERVATION'}
                        </span>
                      </div>

                      {/* Associated Order & Protocol */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-slate-800 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">Order / Client</span>
                          <span className="font-mono text-cyan-400 font-semibold block truncate">{item.orderId || 'Direct Batch'}</span>
                          <span className="text-slate-400 text-[10px] truncate block">{item.customerName || 'Concierge Hold'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">Protocol</span>
                          <span className="text-slate-300 text-[10px] block line-clamp-2">
                            {item.protocol || 'Copper + Praziquantel + Form.'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
                          <span>Observation Progress</span>
                          <span className="text-cyan-400 font-semibold">Day {item.daysElapsed || 1} / {item.quarantineDays || 14}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-400 rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.round(((item.daysElapsed || 1) / (item.quarantineDays || 14)) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Mobile Actions with 44px+ touch targets */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => handleUpdateQuarantineState(item.orderId, item.sku, 'PASS')}
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center transition-colors"
                        >
                          ✓ Certify Clean
                        </button>
                        <button
                          onClick={() => handleUpdateQuarantineState(item.orderId, item.sku, 'EXTEND')}
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono flex items-center justify-center transition-colors"
                        >
                          +7 Days
                        </button>
                        <button
                          onClick={() => handleUpdateQuarantineState(item.orderId, item.sku, 'FAIL')}
                          className="min-h-[44px] col-span-2 sm:col-span-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono flex items-center justify-center transition-colors"
                        >
                          Isolate
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preserved Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="p-3.5">Specimen / Item</th>
                        <th className="p-3.5">Associated Order</th>
                        <th className="p-3.5">In Quarantine</th>
                        <th className="p-3.5">Prophylaxis Protocol</th>
                        <th className="p-3.5">Biological Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {quarantineItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{item.productName || item.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{item.sku || 'LIVE-SPECIMEN'}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-mono text-cyan-400">{item.orderId || 'Direct Batch'}</span>
                            <div className="text-[10px] text-slate-500">{item.customerName || 'Concierge Hold'}</div>
                          </td>
                          <td className="p-3.5 font-mono">
                            <div>Day {item.daysElapsed || 1} / {item.quarantineDays || 14}</div>
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                              <div
                                className="h-full bg-cyan-400 rounded-full"
                                style={{
                                  width: `${Math.min(100, Math.round(((item.daysElapsed || 1) / (item.quarantineDays || 14)) * 100))}%`,
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                              {item.protocol || 'Copper + Praziquantel + Form.'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                                item.status === 'CLEARED'
                                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                                  : item.status === 'FAILED'
                                  ? 'bg-red-950/70 text-red-400 border border-red-800'
                                  : 'bg-amber-950/70 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {item.status || 'IN_OBSERVATION'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleUpdateQuarantineState(item.orderId, item.sku, 'PASS')}
                              className="min-h-[36px] px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium"
                            >
                              ✓ Certify Clean
                            </button>
                            <button
                              onClick={() => handleUpdateQuarantineState(item.orderId, item.sku, 'EXTEND')}
                              className="min-h-[36px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px]"
                            >
                              +7 Days
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: AIR CARGO DISPATCH & LOGISTICS                               */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'dispatch' && (
        <div className="space-y-6">
          {/* Dispatch Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Ready to Pack</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{dispatchMetrics.readyToPack}</div>
              <span className="text-[10px] text-slate-500">Quarantine certified</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">Packed / Oxygenated</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{dispatchMetrics.packed}</div>
              <span className="text-[10px] text-slate-500">Insulated thermal crates</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">In Cargo Transit</span>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{dispatchMetrics.inTransit}</div>
              <span className="text-[10px] text-slate-500">AWB assigned</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Delivered</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{dispatchMetrics.delivered}</div>
              <span className="text-[10px] text-slate-500">Safe acclimation verified</span>
            </div>
          </div>

          {/* Dispatch Order Table */}
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Air Cargo & Courier Queue</span>
              <button
                onClick={fetchDispatch}
                className="min-h-[44px] px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 border border-slate-800/80 transition-colors self-start sm:self-auto"
              >
                ↻ Refresh Logistics
              </button>
            </div>

            {isLoadingDispatch ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                Querying carrier manifests...
              </div>
            ) : dispatchOrders.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                No active orders in dispatch pipeline.
              </div>
            ) : (
              <>
                {/* Mobile Dispatch Cards */}
                <div className="md:hidden p-3 space-y-3">
                  {dispatchOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/90 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono text-cyan-400 font-bold text-sm block">{order.orderId || order.id}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{order.items?.length || 1} live parcel(s)</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                            order.currentStep === 'DELIVERED'
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                              : order.currentStep === 'DISPATCHED'
                              ? 'bg-blue-950/70 text-blue-400 border border-blue-800'
                              : order.currentStep === 'PACKED'
                              ? 'bg-amber-950/70 text-amber-400 border border-amber-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {order.currentStep || 'READY_TO_PACK'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Consignee:</span>
                          <span className="text-white font-medium">{order.customerName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Destination:</span>
                          <span className="text-slate-200">{order.city || 'Domestic Airport'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Carrier / AWB:</span>
                          <span className="font-mono text-right">
                            {order.awb ? (
                              <span className="text-cyan-400 font-semibold">{order.awb}</span>
                            ) : (
                              <span className="text-slate-500 italic text-[11px]">No AWB assigned</span>
                            )}
                            <span className="block text-[10px] text-slate-500">{order.courierName || 'SpiceJet Cargo'}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-800/60 pt-1">
                          <span className="text-slate-400 text-[11px]">ETA / Flight:</span>
                          <span className="text-slate-300 font-mono text-[11px]">{order.eta || 'Same-day arrival'}</span>
                        </div>
                      </div>

                      {/* Mobile Actions with 44px+ touch targets */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            setEditingAwbOrder(order);
                            setAwbInput(order.awb || '');
                            setCourierInput(order.courierName || 'SpiceJet Cargo');
                            setEtaInput(order.eta || '');
                          }}
                          className="min-h-[44px] flex-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center justify-center transition-colors"
                        >
                          Assign AWB / Tracking
                        </button>
                        {order.currentStep === 'PACKED' && (
                          <button
                            onClick={() => handleUpdateDispatch(order.id, 'DISPATCHED')}
                            className="min-h-[44px] flex-1 px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center justify-center transition-colors"
                          >
                            Dispatch Cargo ✈
                          </button>
                        )}
                        {order.currentStep === 'DISPATCHED' && (
                          <button
                            onClick={() => handleUpdateDispatch(order.id, 'DELIVERED')}
                            className="min-h-[44px] flex-1 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center justify-center transition-colors"
                          >
                            Confirm Arrival ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preserved Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="p-3.5">Order ID</th>
                        <th className="p-3.5">Consignee & City</th>
                        <th className="p-3.5">Fulfillment Step</th>
                        <th className="p-3.5">Carrier / AWB</th>
                        <th className="p-3.5">ETA / Flight</th>
                        <th className="p-3.5 text-right">Logistics Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {dispatchOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3.5">
                            <span className="font-mono text-cyan-400 font-bold">{order.orderId || order.id}</span>
                            <div className="text-[10px] text-slate-500">{order.items?.length || 1} live parcels</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{order.customerName}</div>
                            <div className="text-[10px] text-slate-400">{order.city || 'Domestic Airport'}</div>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                                order.currentStep === 'DELIVERED'
                                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                                  : order.currentStep === 'DISPATCHED'
                                  ? 'bg-blue-950/70 text-blue-400 border border-blue-800'
                                  : order.currentStep === 'PACKED'
                                  ? 'bg-amber-950/70 text-amber-400 border border-amber-800'
                                  : 'bg-slate-900 text-slate-300 border border-slate-800'
                              }`}
                            >
                              {order.currentStep || 'READY_TO_PACK'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-mono text-slate-200">
                              {order.awb ? (
                                <span className="text-cyan-400 font-bold">{order.awb}</span>
                              ) : (
                                <span className="text-slate-500 italic">No AWB assigned</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">{order.courierName || 'SpiceJet Cargo'}</div>
                          </td>
                          <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                            {order.eta || 'Same-day arrival'}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingAwbOrder(order);
                                setAwbInput(order.awb || '');
                                setCourierInput(order.courierName || 'SpiceJet Cargo');
                                setEtaInput(order.eta || '');
                              }}
                              className="min-h-[36px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                            >
                              Assign AWB
                            </button>
                            {order.currentStep === 'PACKED' && (
                              <button
                                onClick={() => handleUpdateDispatch(order.id, 'DISPATCHED')}
                                className="min-h-[36px] px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[11px]"
                              >
                                Dispatch Cargo ✈
                              </button>
                            )}
                            {order.currentStep === 'DISPATCHED' && (
                              <button
                                onClick={() => handleUpdateDispatch(order.id, 'DELIVERED')}
                                className="min-h-[36px] px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px]"
                              >
                                Confirm Arrival ✓
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Edit AWB Modal */}
          {editingAwbOrder && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-[#0b121a] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">CARGO DISPATCH LOGISTICS</span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Assign Air Waybill / Tracking
                    </h3>
                  </div>
                  <button
                    onClick={() => setEditingAwbOrder(null)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors"
                    aria-label="Close AWB Editor"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Carrier / Flight Partner</label>
                    <input
                      type="text"
                      value={courierInput}
                      onChange={(e) => setCourierInput(e.target.value)}
                      placeholder="e.g. SpiceJet Cargo Express"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Air Waybill (AWB) Number</label>
                    <input
                      type="text"
                      value={awbInput}
                      onChange={(e) => setAwbInput(e.target.value)}
                      placeholder="e.g. AWB-7729-DEL-CCU"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Estimated Arrival (ETA)</label>
                    <input
                      type="text"
                      value={etaInput}
                      onChange={(e) => setEtaInput(e.target.value)}
                      placeholder="e.g. Today 18:30 IST"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/60">
                  <button
                    onClick={() => setEditingAwbOrder(null)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateDispatch(editingAwbOrder.id)}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 transition-colors"
                  >
                    Save Logistics
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: MAINTENANCE LOG & AQUARIUM SERVICING                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'maintenance' && (
        <div className="space-y-6">
          {/* Maintenance Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Scheduled Visits</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{maintenanceMetrics.scheduled}</div>
              <span className="text-[10px] text-slate-500">Upcoming calendar</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">In Servicing</span>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">{maintenanceMetrics.inProgress}</div>
              <span className="text-[10px] text-slate-500">On-site biologist</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Completed This Month</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{maintenanceMetrics.completed}</div>
              <span className="text-[10px] text-slate-500">Certified stable</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">Overdue Service</span>
              <div className="text-2xl font-bold font-mono text-red-400 mt-1">{maintenanceMetrics.overdue}</div>
              <span className="text-[10px] text-slate-500">Requires follow-up</span>
            </div>
          </div>

          {/* Maintenance Table */}
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Aquarium Servicing Manifest</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsNewMaintenanceModalOpen(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 transition-colors"
                >
                  + Schedule Service
                </button>
                <button
                  onClick={fetchMaintenance}
                  className="min-h-[44px] px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 border border-slate-800/80 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {isLoadingMaintenance ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                Loading service records...
              </div>
            ) : maintenanceRecords.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                No active maintenance appointments recorded.
              </div>
            ) : (
              <>
                {/* Mobile Maintenance Cards */}
                <div className="md:hidden p-3 space-y-3">
                  {maintenanceRecords.map((record) => (
                    <div
                      key={record._id || record.id}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/90 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-white truncate">{record.customerName}</h4>
                          <span className="text-[10px] font-mono text-cyan-400 block truncate">
                            {record.projectCode || record.aquariumSummary || '3000L Living Reef'}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider shrink-0 ${
                            record.status === 'completed'
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                              : record.status === 'in_progress'
                              ? 'bg-blue-950/70 text-blue-400 border border-blue-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-black/40 border border-slate-800 text-[11px]">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">Service Date</span>
                          <span className="text-slate-200 font-mono">
                            {new Date(record.scheduledDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">Service Tier</span>
                          <span className="text-cyan-300 font-medium">
                            {record.serviceType || 'ROUTINE'}
                          </span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-800/60">
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">Biologist / Lead</span>
                          <span className="text-slate-300">{record.technician || 'Senior Aquarist'}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-800/60">
                          <span className="text-slate-500 block text-[10px] uppercase font-mono">Water Telemetry</span>
                          {record.waterParameters ? (
                            <span className="font-mono text-[10px] text-cyan-400">
                              Sal: {record.waterParameters.salinity || '1.025'} | pH: {record.waterParameters.ph || '8.2'} | dKH: {record.waterParameters.alkalinity || '8.5'}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic text-[10px]">Pending on-site test</span>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      {record.status !== 'completed' && (
                        <div className="pt-1 border-t border-slate-800/80">
                          <button
                            onClick={() => handleUpdateMaintenanceStatus(record._id || record.id, 'completed')}
                            className="min-h-[44px] w-full px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center transition-colors"
                          >
                            ✓ Sign Off & Certify Stability
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Preserved Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        <th className="p-3.5">Client & System</th>
                        <th className="p-3.5">Service Date</th>
                        <th className="p-3.5">Service Tier</th>
                        <th className="p-3.5">Biologist / Lead</th>
                        <th className="p-3.5">Water Parameters</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {maintenanceRecords.map((record) => (
                        <tr key={record._id || record.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{record.customerName}</div>
                            <div className="text-[10px] font-mono text-cyan-400">{record.projectCode || record.aquariumSummary || '3000L Living Reef'}</div>
                          </td>
                          <td className="p-3.5 font-mono text-slate-300">
                            {new Date(record.scheduledDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                              {record.serviceType || 'ROUTINE'}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {record.technician || 'Senior Aquarist'}
                          </td>
                          <td className="p-3.5 font-mono text-[10px] text-slate-400">
                            {record.waterParameters ? (
                              <span>
                                Sal: {record.waterParameters.salinity || '1.025'} | pH: {record.waterParameters.ph || '8.2'} | dKH: {record.waterParameters.alkalinity || '8.5'}
                              </span>
                            ) : (
                              <span className="italic text-slate-600">Pending test</span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                                record.status === 'completed'
                                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                                  : record.status === 'in_progress'
                                  ? 'bg-blue-950/70 text-blue-400 border border-blue-800'
                                  : 'bg-slate-900 text-slate-300 border border-slate-800'
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            {record.status !== 'completed' && (
                              <button
                                onClick={() => handleUpdateMaintenanceStatus(record._id || record.id, 'completed')}
                                className="min-h-[36px] px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px]"
                              >
                                ✓ Sign Off
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* New Maintenance Appointment Modal */}
          {isNewMaintenanceModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <form onSubmit={handleCreateMaintenance} className="bg-[#0b121a] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">BIOLOGICAL SERVICING</span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Schedule Architectural Maintenance
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewMaintenanceModalOpen(false)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors"
                    aria-label="Close Schedule Modal"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Customer / Client Name *</label>
                    <input
                      type="text"
                      required
                      value={newMaintenanceForm.customerName}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, customerName: e.target.value })}
                      placeholder="e.g. Alipore Penthouse"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Client Phone Number</label>
                    <input
                      type="text"
                      value={newMaintenanceForm.customerPhone}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, customerPhone: e.target.value })}
                      placeholder="+91 98300 00000"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Project Code</label>
                    <input
                      type="text"
                      value={newMaintenanceForm.projectCode}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, projectCode: e.target.value })}
                      placeholder="e.g. CP-2025-001"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Scheduled Date *</label>
                    <input
                      type="date"
                      required
                      value={newMaintenanceForm.scheduledDate}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, scheduledDate: e.target.value })}
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Service Type</label>
                    <select
                      value={newMaintenanceForm.serviceType}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, serviceType: e.target.value })}
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    >
                      <option value="ROUTINE">Routine Service & Water Testing</option>
                      <option value="PARAMETER_TESTING">Comprehensive ICP Parameter Tuning</option>
                      <option value="DEEP_CLEAN">Deep Clean & Bio-Media Flush</option>
                      <option value="EQUIPMENT_OVERHAUL">Equipment / Pump Overhaul</option>
                      <option value="EMERGENCY">Emergency Response</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Assigned Biologist</label>
                    <input
                      type="text"
                      value={newMaintenanceForm.technician}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, technician: e.target.value })}
                      placeholder="e.g. Lead Aquarist"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Aquarium System Summary</label>
                    <input
                      type="text"
                      value={newMaintenanceForm.aquariumSummary}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, aquariumSummary: e.target.value })}
                      placeholder="e.g. 5,000L Acropora Reef with Apex Automation"
                      className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Notes / Instructions</label>
                    <textarea
                      rows={2}
                      value={newMaintenanceForm.notes}
                      onChange={(e) => setNewMaintenanceForm({ ...newMaintenanceForm, notes: e.target.value })}
                      placeholder="Special instructions for the visit..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setIsNewMaintenanceModalOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-400/20 transition-colors"
                  >
                    Confirm Schedule
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 4: CALENDAR SCHEDULE AGENDA                                     */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'schedule' && (
        <div className="space-y-6">
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Upcoming Operations Agenda</h3>
            <p className="text-xs text-slate-400 mb-6">
              Consolidated chronological itinerary of client maintenance appointments and live dispatch arrivals.
            </p>

            <div className="space-y-4">
              {maintenanceRecords.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">
                  No upcoming items on the service schedule.
                </div>
              ) : (
                maintenanceRecords.map((rec) => (
                  <div
                    key={rec._id || rec.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center font-mono">
                        <span className="text-[9px] uppercase text-slate-400">
                          {new Date(rec.scheduledDate).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-sm font-bold text-cyan-400">
                          {new Date(rec.scheduledDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-xs">{rec.customerName}</div>
                        <div className="text-[11px] text-slate-400">
                          {rec.serviceType} • {rec.aquariumSummary || rec.projectCode || 'Standard Servicing'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">
                        {rec.technician || 'Biologist Team'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          rec.status === 'completed'
                            ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950/70 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
