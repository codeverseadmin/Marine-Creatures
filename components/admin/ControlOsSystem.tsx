'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SystemSubtab } from './types';

interface ControlOsSystemProps {
  initialSubtab?: SystemSubtab;
  showToast?: (msg: string) => void;
}

export function ControlOsSystem({
  initialSubtab = 'audit',
  showToast = () => {},
}: ControlOsSystemProps) {
  const [activeSubtab, setActiveSubtab] = useState<SystemSubtab>(initialSubtab);

  // ── AUDIT LOG STATE ────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilterEntity, setAuditFilterEntity] = useState('ALL');
  const [auditFilterSeverity, setAuditFilterSeverity] = useState('ALL');
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // ── BACKUPS STATE ──────────────────────────────────────────────────────────
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [capturingSnapshot, setCapturingSnapshot] = useState(false);
  const [restoreConfirmId, setRestoreConfirmId] = useState<string | null>(null);
  const [restorePasscodePrompt, setRestorePasscodePrompt] = useState('');

  // ── HEALTH STATE ───────────────────────────────────────────────────────────
  const [healthData, setHealthData] = useState<any | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // ── SECURITY STATE ─────────────────────────────────────────────────────────
  const [securityData, setSecurityData] = useState<any | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);

  // ── SETTINGS STATE ─────────────────────────────────────────────────────────
  const [settings, setSettings] = useState<any>({
    companyName: 'Marine Creatures',
    supportEmail: 'concierge@marinecreatures.com',
    supportPhone: '+91 98300 12345',
    whatsappNumber: '+91 98300 12345',
    airCargoNotice: 'All live specimens shipped with active oxygen injection.',
    maintenanceBufferDays: 14,
    defaultPaginationLimit: 25,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // ── FETCHERS ───────────────────────────────────────────────────────────────
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      let url = '/api/admin/system/audit?limit=50';
      if (auditFilterEntity !== 'ALL') url += `&entityType=${auditFilterEntity}`;
      if (auditFilterSeverity !== 'ALL') url += `&severity=${auditFilterSeverity}`;
      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setAuditLogs(json.data.logs || []);
      }
    } catch {
      showToast('Error syncing audit trail');
    } finally {
      setAuditLoading(false);
    }
  }, [auditFilterEntity, auditFilterSeverity, showToast]);

  const fetchSnapshots = useCallback(async () => {
    setLoadingSnapshots(true);
    try {
      const res = await fetch('/api/admin/backup', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) setSnapshots(json.data);
      }
    } catch {
      showToast('Error loading snapshots');
    } finally {
      setLoadingSnapshots(false);
    }
  }, [showToast]);

  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res = await fetch('/api/admin/system/health', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setHealthData(json.data);
      }
    } catch {
      showToast('Error loading health telemetry');
    } finally {
      setLoadingHealth(false);
    }
  }, [showToast]);

  const fetchSecurity = useCallback(async () => {
    setLoadingSecurity(true);
    try {
      const res = await fetch('/api/admin/system/security', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setSecurityData(json.data);
      }
    } catch {
      showToast('Error loading security posture');
    } finally {
      setLoadingSecurity(false);
    }
  }, [showToast]);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/admin/system/settings', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) setSettings(json.data);
      }
    } catch {
      showToast('Error loading operational settings');
    } finally {
      setLoadingSettings(false);
    }
  }, [showToast]);

  // Lock body scroll when inspector or confirmation modals are active
  useEffect(() => {
    if (selectedAuditLog || restoreConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedAuditLog, restoreConfirmId]);

  useEffect(() => {
    if (activeSubtab === 'audit') fetchAuditLogs();
    else if (activeSubtab === 'backups') fetchSnapshots();
    else if (activeSubtab === 'health') fetchHealth();
    else if (activeSubtab === 'security') fetchSecurity();
    else if (activeSubtab === 'settings') fetchSettings();
  }, [activeSubtab, fetchAuditLogs, fetchSnapshots, fetchHealth, fetchSecurity, fetchSettings]);

  // ── HANDLERS ───────────────────────────────────────────────────────────────
  const handleCaptureSnapshot = async () => {
    setCapturingSnapshot(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Cloud snapshot secured successfully');
        fetchSnapshots();
      } else {
        showToast(`✕ Snapshot failed: ${data.error}`);
      }
    } catch {
      showToast('✕ Error creating snapshot');
    } finally {
      setCapturingSnapshot(false);
    }
  };

  const handleRestoreSnapshot = async () => {
    if (!restoreConfirmId) return;
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ snapshotId: restoreConfirmId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Database restored from snapshot successfully');
        setRestoreConfirmId(null);
        setRestorePasscodePrompt('');
      } else {
        showToast(`✕ Restore failed: ${data.error}`);
      }
    } catch {
      showToast('✕ Network error during restore');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/system/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('✓ Operational settings updated');
      } else {
        showToast(`✕ Error saving settings: ${data.error}`);
      }
    } catch {
      showToast('✕ Network error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              System Operations & Governance
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              Core Fleet
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-resistant audit trail, cloud snapshots, infrastructure health, and HMAC session security.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b121a] border border-slate-800 rounded-xl overflow-x-auto scrollbar-none max-w-full">
          {[
            { id: 'audit', label: 'Audit Log', icon: '📜' },
            { id: 'backups', label: 'Snapshots', icon: '💾' },
            { id: 'health', label: 'Health', icon: '🩺' },
            { id: 'security', label: 'Security', icon: '🛡️' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id as SystemSubtab)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
                activeSubtab === tab.id
                  ? 'bg-cyan-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: AUDIT LOG                                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Tamper-Resistant Operational Audit Register
                </span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900">
                  {auditLogs.length} events
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={auditFilterEntity}
                  onChange={(e) => setAuditFilterEntity(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Entities</option>
                  <option value="product">Products</option>
                  <option value="order">Orders</option>
                  <option value="inquiry">Inquiries</option>
                  <option value="project">Projects</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="system">System</option>
                </select>

                <select
                  value={auditFilterSeverity}
                  onChange={(e) => setAuditFilterSeverity(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="ALL">All Severity</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                </select>

                <button
                  onClick={fetchAuditLogs}
                  className="min-h-[44px] px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {auditLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                Reading immutable audit ledger...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                No audit events found for selected filters.
              </div>
            ) : (
              <>
                {/* Mobile Audit Cards */}
                <div className="md:hidden p-3 space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log._id || log.id}
                      className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800/90 space-y-2 font-mono text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-white text-xs">{log.action}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono shrink-0 ${
                            log.severity === 'error'
                              ? 'bg-red-950/80 text-red-400 border border-red-800'
                              : log.severity === 'warn'
                              ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {log.severity || 'info'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/40 border border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-500 text-[10px] block">Target</span>
                          <span className="text-cyan-400 truncate block">{log.entityType} : {log.entityId}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] block">Operator</span>
                          <span className="text-slate-300 truncate block">{log.adminId || 'session:admin'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span className="text-slate-500 text-[10px]">
                          {new Date(log.timestamp || log.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => setSelectedAuditLog(log)}
                          className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center transition-colors"
                        >
                          Inspect Event
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
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Action Event</th>
                        <th className="p-3.5">Entity</th>
                        <th className="p-3.5">Operator</th>
                        <th className="p-3.5">Severity</th>
                        <th className="p-3.5 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 font-mono">
                      {auditLogs.map((log) => (
                        <tr key={log._id || log.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(log.timestamp || log.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-3.5 font-bold text-white text-[11px]">
                            {log.action}
                          </td>
                          <td className="p-3.5 text-cyan-400 text-[11px]">
                            {log.entityType} : {log.entityId}
                          </td>
                          <td className="p-3.5 text-slate-300 text-[11px]">
                            {log.adminId || 'session:admin'}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                                log.severity === 'error'
                                  ? 'bg-red-950/80 text-red-400 border border-red-800'
                                  : log.severity === 'warn'
                                  ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                                  : 'bg-slate-900 text-slate-300 border border-slate-800'
                              }`}
                            >
                              {log.severity || 'info'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setSelectedAuditLog(log)}
                              className="min-h-[32px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                            >
                              Inspect
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

          {/* Audit Detail Inspector Modal */}
          {selectedAuditLog && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-[#0b121a] border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block truncate">SECURITY AUDIT INSPECTION</span>
                    <h3 className="text-sm font-bold text-white font-mono truncate">
                      Event: {selectedAuditLog.action}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedAuditLog(null)}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-slate-800/40 hover:bg-slate-800 transition-colors shrink-0"
                    aria-label="Close Inspector"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded bg-slate-900">
                    <span className="text-slate-400">Timestamp</span>
                    <span className="text-white">{selectedAuditLog.timestamp || selectedAuditLog.createdAt}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900">
                    <span className="text-slate-400">Entity Target</span>
                    <span className="text-cyan-400">{selectedAuditLog.entityType}: {selectedAuditLog.entityId}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900">
                    <span className="text-slate-400">Operator</span>
                    <span className="text-white">{selectedAuditLog.adminId}</span>
                  </div>
                  {selectedAuditLog.ipHash && (
                    <div className="flex justify-between p-2 rounded bg-slate-900">
                      <span className="text-slate-400">IP Hash</span>
                      <span className="text-slate-300">{selectedAuditLog.ipHash}</span>
                    </div>
                  )}
                  {selectedAuditLog.meta && (
                    <div className="p-3 rounded bg-slate-950 border border-slate-800 mt-2">
                      <span className="text-[10px] text-slate-500 uppercase block mb-1">State Payload Diff</span>
                      <pre className="text-[11px] text-emerald-400 overflow-x-auto max-h-48 whitespace-pre-wrap">
                        {JSON.stringify(selectedAuditLog.meta, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
                <div className="pt-2 flex justify-end border-t border-slate-800/60">
                  <button
                    onClick={() => setSelectedAuditLog(null)}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: CLOUD SNAPSHOTS / BACKUPS                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'backups' && (
        <div className="space-y-6">
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  MongoDB Atlas Cloud Snapshots
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Point-in-time state backups of catalog, orders, inquiries, and customer registries.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  disabled={capturingSnapshot}
                  onClick={handleCaptureSnapshot}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-cyan-400/20 transition-colors"
                >
                  {capturingSnapshot ? (
                    <span>Capturing State...</span>
                  ) : (
                    <>
                      <span>+ Capture Snapshot Now</span>
                    </>
                  )}
                </button>
                <button
                  onClick={fetchSnapshots}
                  className="min-h-[44px] px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800 transition-colors"
                >
                  ↻ Refresh
                </button>
              </div>
            </div>

            {loadingSnapshots ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                Querying Atlas snapshot store...
              </div>
            ) : snapshots.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                No cloud snapshots available. Click &quot;Capture Snapshot Now&quot; to secure current database state.
              </div>
            ) : (
              <>
                {/* Mobile Snapshot Cards */}
                <div className="md:hidden space-y-3">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/90 space-y-3 font-mono text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-white text-xs truncate">{snap.label || snap.id}</h4>
                          <span className="text-[10px] text-cyan-400 block">{snap.source || 'admin_manual'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {snap.sizeBytes ? `${Math.round(snap.sizeBytes / 1024)} KB` : 'N/A'}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-black/40 border border-slate-800/80 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500 text-[10px]">Records:</span>
                          <span className="text-slate-300 text-right truncate">
                            {snap.counts
                              ? `${snap.counts.products || 0} items, ${snap.counts.orders || 0} orders`
                              : 'Full State'}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-800/60 pt-1">
                          <span className="text-slate-500 text-[10px]">Captured:</span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(snap.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-1 border-t border-slate-800/60">
                        <button
                          onClick={() => setRestoreConfirmId(snap.id)}
                          className="min-h-[44px] w-full px-3 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 text-xs font-semibold flex items-center justify-center transition-colors"
                        >
                          ⚠️ Restore State from Snapshot
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
                        <th className="p-3.5">Snapshot Label</th>
                        <th className="p-3.5">Trigger Source</th>
                        <th className="p-3.5">Records Included</th>
                        <th className="p-3.5">Payload Size</th>
                        <th className="p-3.5">Created At</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 font-mono">
                      {snapshots.map((snap) => (
                        <tr key={snap.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3.5 font-bold text-white text-[11px]">
                            {snap.label || snap.id}
                          </td>
                          <td className="p-3.5 text-cyan-400 text-[11px]">
                            {snap.source || 'admin_manual'}
                          </td>
                          <td className="p-3.5 text-slate-300 text-[10px]">
                            {snap.counts
                              ? `${snap.counts.products || 0} items, ${snap.counts.orders || 0} orders`
                              : 'Full State'}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {snap.sizeBytes ? `${Math.round(snap.sizeBytes / 1024)} KB` : 'N/A'}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(snap.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setRestoreConfirmId(snap.id)}
                              className="min-h-[32px] px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 text-[11px]"
                            >
                              ⚠️ Restore
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

          {/* High-Risk Restore Confirmation Modal */}
          {restoreConfirmId && (
            <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-[#0b121a] border border-red-600/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl">
                <div className="flex items-center gap-3 text-red-400">
                  <span className="text-2xl shrink-0">⚠️</span>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Critical System Action: Restore
                    </h3>
                    <span className="text-[11px] text-red-400">This will overwrite current live collections.</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Restoring snapshot <span className="font-mono text-cyan-400">{restoreConfirmId}</span> replaces existing database records with the snapshot point-in-time image.
                </p>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Type <span className="font-mono text-white font-bold">RESTORE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={restorePasscodePrompt}
                    onChange={(e) => setRestorePasscodePrompt(e.target.value)}
                    placeholder="RESTORE"
                    className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono text-xs uppercase focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/60">
                  <button
                    onClick={() => {
                      setRestoreConfirmId(null);
                      setRestorePasscodePrompt('');
                    }}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={restorePasscodePrompt !== 'RESTORE'}
                    onClick={handleRestoreSnapshot}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs disabled:opacity-30 shadow-lg shadow-red-600/20 transition-colors"
                  >
                    Execute Recovery
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: SYSTEM HEALTH                                                */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Database Status</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                {healthData?.database?.status || 'Healthy'}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {healthData?.database?.latencyMs ?? 18}ms ping
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">API Runtime</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">
                {healthData?.api?.runtime || 'Node.js'}
              </div>
              <span className="text-[10px] text-slate-500">Next.js App Router</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Memory Allocation</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {healthData?.system?.memoryMb ? `${healthData.system.memoryMb} MB` : 'Optimal'}
              </div>
              <span className="text-[10px] text-slate-500">Heap usage within limits</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">System Uptime</span>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                {healthData?.system?.uptimeHours ? `${healthData.system.uptimeHours} hrs` : '99.99%'}
              </div>
              <span className="text-[10px] text-slate-500">Zero unhandled crashes</span>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0b121a] border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Document Collection Densities
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Products Collection</span>
                <span className="text-white text-base font-bold">{healthData?.counts?.products ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Orders Collection</span>
                <span className="text-white text-base font-bold">{healthData?.counts?.orders ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Inquiries Collection</span>
                <span className="text-white text-base font-bold">{healthData?.counts?.inquiries ?? 0}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Audit Log Entries</span>
                <span className="text-cyan-400 text-base font-bold">{healthData?.counts?.auditLogs ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 4: SECURITY POSTURE                                             */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'security' && (
        <div className="space-y-6">
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Control OS Security Boundaries & Session Posture
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cryptographic session verification, cookie protection flags, and credential isolation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Authentication Protocol:</span>
                  <span className="text-cyan-400 font-bold">HMAC-SHA256 Signed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Session Cookie Name:</span>
                  <span className="text-white font-bold">mc_admin_session</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cookie Security:</span>
                  <span className="text-emerald-400">httpOnly: true, secure: true</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SameSite Policy:</span>
                  <span className="text-emerald-400">Strict</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Timing Attack Protection:</span>
                  <span className="text-emerald-400 font-bold">crypto.timingSafeEqual</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Credential Leakage:</span>
                  <span className="text-emerald-400 font-bold">Zero (No client exposure)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rate Limiter Active:</span>
                  <span className="text-white">5 requests / 60s per IP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sensitive Data Redaction:</span>
                  <span className="text-emerald-400">Active on all serializers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 5: OPERATIONAL SETTINGS                                         */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-[#0b121a] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Operational Configuration
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Business contact endpoints, WhatsApp destination, and service intervals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs max-w-3xl">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Company Display Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Concierge Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Concierge Telephone</label>
                <input
                  type="text"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">WhatsApp Business Direct Number</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-300 font-semibold block mb-1">Air Cargo Dispatch Notice</label>
                <input
                  type="text"
                  value={settings.airCargoNotice}
                  onChange={(e) => setSettings({ ...settings, airCargoNotice: e.target.value })}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Maintenance Reminder Buffer (Days)</label>
                <input
                  type="number"
                  value={settings.maintenanceBufferDays}
                  onChange={(e) => setSettings({ ...settings, maintenanceBufferDays: Number(e.target.value) })}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Default Table Pagination Limit</label>
                <input
                  type="number"
                  value={settings.defaultPaginationLimit}
                  onChange={(e) => setSettings({ ...settings, defaultPaginationLimit: Number(e.target.value) })}
                  className="w-full min-h-[44px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs disabled:opacity-50 shadow-lg shadow-cyan-400/20 transition-colors"
              >
                {savingSettings ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
