'use client';

import React from 'react';
import { OverviewDashboardData, ControlOsSection } from './types';

interface ControlOsOverviewProps {
  data: OverviewDashboardData;
  isLoading: boolean;
  onRefresh: () => void;
  onNavigateSection: (section: ControlOsSection) => void;
}

export function ControlOsOverview({
  data,
  isLoading,
  onRefresh,
  onNavigateSection,
}: ControlOsOverviewProps) {
  const { metrics, actionCenter, enquiries, orders, catalog, demand, system, recentActivity } = data;

  const currentDateFormatted = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* ── Top Utility / Action Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              Operational Status: Live &amp; Synchronized
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Control OS Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time business telemetry and actionable operational pipelines
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
            title="Refresh database metrics"
          >
            <span className={`text-cyan-400 text-sm ${isLoading ? 'animate-spin' : ''}`}>↻</span>
            <span>{isLoading ? 'Syncing...' : 'Sync Database'}</span>
          </button>

          <div className="h-9 px-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center">
            {currentDateFormatted}
          </div>
        </div>
      </div>

      {/* ── 1. ACTION CENTER (Highest Visual Priority) ── */}
      <section aria-labelledby="action-center-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <h2 id="action-center-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Operational Action Center
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                actionCenter.count > 0
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {actionCenter.count} {actionCenter.count === 1 ? 'Action Required' : 'Actions Required'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Direct Database Pipeline
          </span>
        </div>

        {actionCenter.count === 0 ? (
          <div className="p-6 rounded-2xl bg-[#0c131c] border border-emerald-500/20 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-lg shrink-0">
              ✓
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">All caught up</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero bottlenecks. All inquiries acknowledged, dispatches synchronized, and backups current.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionCenter.items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-[#0c131c] border border-slate-800 hover:border-slate-700 transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      item.severity === 'high'
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                        : item.severity === 'medium'
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : 'bg-slate-400'
                    }`}
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.subtitle}
                    </p>
                    {item.meta && (
                      <span className="inline-block text-[10px] font-mono text-slate-400 mt-2">
                        {item.meta}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigateSection(item.targetTab as ControlOsSection)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[11px] font-medium text-slate-300 hover:text-white shrink-0 transition-colors"
                >
                  Inspect →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. KEY METRICS GRID (4 Primary Operational Dimensions) ── */}
      <section aria-labelledby="key-metrics-heading">
        <h2 id="key-metrics-heading" className="sr-only">Key Operational Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Metric 1: New Enquiries */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b121a] border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">New Enquiries</span>
              <span className="text-base">📬</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono">
                {metrics.newEnquiries}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {metrics.totalEnquiries} total
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Awaiting Consultation</span>
              <span className={metrics.newEnquiries > 0 ? 'text-amber-400 font-semibold' : 'text-slate-400'}>
                {metrics.newEnquiries > 0 ? 'Requires Reply' : 'Up to date'}
              </span>
            </div>
          </div>

          {/* Metric 2: Active Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b121a] border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Active Orders</span>
              <span className="text-base">📦</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono">
                {metrics.activeOrders}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {metrics.totalOrders} total
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Pipeline Status</span>
              <span className="text-cyan-400 font-semibold">Active Dispatch</span>
            </div>
          </div>

          {/* Metric 3: Active Products */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b121a] border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Active Products</span>
              <span className="text-base">🐠</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-4xl font-extrabold text-white font-mono">
                {metrics.activeProducts}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({metrics.totalProducts} catalog)
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Storefront Status</span>
              <span className="text-emerald-400 font-semibold">100% Verified</span>
            </div>
          </div>

          {/* Metric 4: Pending Actions */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b121a] border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Pending Actions</span>
              <span className="text-base">⚡</span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span
                className={`text-2xl sm:text-4xl font-extrabold font-mono ${
                  metrics.pendingActions > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {metrics.pendingActions}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                tasks in queue
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Queue Urgency</span>
              <span className={metrics.pendingActions > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {metrics.pendingActions > 0 ? 'Action Queue Open' : 'Clear'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. TWO-COLUMN OPERATIONAL SPLIT (Recent Orders & Enquiries) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Orders (7 cols) */}
        <section aria-labelledby="recent-orders-heading" className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📦</span>
              <h2 id="recent-orders-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Recent Orders &amp; Dispatches
              </h2>
            </div>
            <button
              onClick={() => onNavigateSection('operations')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1"
            >
              <span>View All in Operations (Phase 3C)</span>
              <span>→</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0b121a] border border-slate-800 overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No orders registered in the system.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="py-2.5 px-3 sm:px-4">Ref</th>
                      <th className="py-2.5 px-3 sm:px-4">Customer</th>
                      <th className="py-2.5 px-3 sm:px-4">Status</th>
                      <th className="py-2.5 px-3 sm:px-4 text-right">Amount</th>
                      <th className="py-2.5 px-3 sm:px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 sm:px-4 font-mono font-bold text-white whitespace-nowrap">
                          {order.id}
                        </td>
                        <td className="py-3 px-3 sm:px-4">
                          <div className="font-medium text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">
                            {order.customerName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px] sm:max-w-[180px]">
                            {order.city} • {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${
                              order.currentStep === 'DELIVERED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : order.currentStep === 'DISPATCHED'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : order.currentStep === 'QUARANTINE'
                                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {order.currentStep}
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right font-mono font-semibold text-white whitespace-nowrap">
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {order.createdAt ? order.createdAt.split(' ').slice(0, 3).join(' ') : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Recent Enquiries (5 cols) */}
        <section aria-labelledby="recent-enquiries-heading" className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">💬</span>
              <h2 id="recent-enquiries-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Recent Client Enquiries
              </h2>
            </div>
            <button
              onClick={() => onNavigateSection('crm')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1"
            >
              <span>View All in CRM (Phase 3C)</span>
              <span>→</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0b121a] border border-slate-800 p-4 divide-y divide-slate-800/60">
            {enquiries.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No customer inquiries received yet.
              </div>
            ) : (
              enquiries.map((inq) => (
                <div key={inq.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white truncate">
                      {inq.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                        inq.status === 'new'
                          ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {inq.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-cyan-400 font-medium truncate">
                    {inq.serviceType}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>Scope: {inq.tankSize}</span>
                    <span>{inq.createdAt}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* ── 4. CATALOG SUMMARY & DEMAND INTELLIGENCE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Catalog Breakdown (7 cols) */}
        <section aria-labelledby="catalog-summary-heading" className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">📊</span>
              <h2 id="catalog-summary-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Catalog Inventory Distribution
              </h2>
            </div>
            <button
              onClick={() => onNavigateSection('catalog')}
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium flex items-center gap-1"
            >
              <span>Manage in Catalog (Phase 3B)</span>
              <span>→</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#0b121a] border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
              <span className="text-slate-400">Active Live Storefront Products</span>
              <span className="font-mono font-bold text-white text-sm">
                {catalog.totalActive} Active Units
              </span>
            </div>

            <div className="space-y-2.5">
              {catalog.categories.slice(0, 7).map((cat) => {
                const percentage = Math.round((cat.count / (catalog.totalActive || 1)) * 100);
                return (
                  <div key={cat.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium truncate max-w-[220px]">
                        {cat.label}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {cat.count} items ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-cyan-400/80 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: Demand & Business Activity Reality (5 cols) */}
        <section aria-labelledby="demand-intelligence-heading" className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎯</span>
              <h2 id="demand-intelligence-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Service &amp; Specimen Demand
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Aggregated from inquiries
            </span>
          </div>

          <div className="rounded-2xl bg-[#0b121a] border border-slate-800 p-5 space-y-4">
            {demand.hasSufficientData ? (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300">
                  Most Requested Custom Services:
                </h3>
                <div className="space-y-2">
                  {demand.topServices.map((item, idx) => (
                    <div
                      key={item.service}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-5 h-5 rounded-md bg-cyan-400/10 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200 font-medium truncate">
                          {item.service}
                        </span>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold shrink-0 ml-2">
                        {item.count} {item.count === 1 ? 'lead' : 'leads'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Not enough activity yet to construct demand rankings.
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block mb-0.5">Business Activity Policy:</strong>
              Monthly trend telemetry will compile as multi-month operational history accumulates in Control OS. Zero artificial trends or fabricated growth numbers.
            </div>
          </div>
        </section>
      </div>

      {/* ── 5. SYSTEM HEALTH & AUDIT STATUS ── */}
      <section aria-labelledby="system-health-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">🛡️</span>
            <h2 id="system-health-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
              System Infrastructure &amp; Security Health
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
            All Core Subsystems Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Subsystem 1: Database */}
          <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Database Engine
              </span>
              <span className="text-sm font-bold text-white block">
                {system.database.cluster}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Latency: <strong className="text-emerald-400">{system.database.latencyMs}ms</strong>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {system.database.status}
            </span>
          </div>

          {/* Subsystem 2: API Layer */}
          <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                API Layer
              </span>
              <span className="text-sm font-bold text-white block">
                {system.api.runtime}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Server-side SSR / SSG
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {system.api.status}
            </span>
          </div>

          {/* Subsystem 3: Authentication */}
          <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Session Security
              </span>
              <span className="text-sm font-bold text-white block">
                {system.auth.protocol.split(' ')[0]}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Cookie: <span className="font-mono text-cyan-400">{system.auth.sessionCookie}</span>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {system.auth.status}
            </span>
          </div>

          {/* Subsystem 4: Backup Status */}
          <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800 flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                Backup Telemetry
              </span>
              <span className="text-sm font-bold text-white block">
                {system.backup.latestSnapshot ? 'Snapshot Captured' : 'Initial Pending'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {system.backup.totalSnapshots} Cloud Snapshots
              </span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                system.backup.latestSnapshot
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {system.backup.status}
            </span>
          </div>
        </div>
      </section>

      {/* ── 6. RECENT CHRONOLOGICAL ACTIVITY STREAM ── */}
      {recentActivity.length > 0 && (
        <section aria-labelledby="activity-stream-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">⏱️</span>
            <h2 id="activity-stream-heading" className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Recent Operational Events
            </h2>
          </div>

          <div className="rounded-2xl bg-[#0b121a] border border-slate-800 p-4 space-y-3">
            {recentActivity.map((event) => (
              <div
                key={event.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between text-xs py-2 border-b border-slate-800/40 last:border-b-0 gap-1 sm:gap-4"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      event.type === 'order' ? 'bg-cyan-400' : 'bg-emerald-400'
                    }`}
                  />
                  <span className="font-semibold text-white">{event.text}</span>
                  <span className="text-slate-400 truncate max-w-xs">{event.detail}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 self-start sm:self-auto">
                  {event.timestamp}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
