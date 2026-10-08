'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AnalyticsSubtab } from './types';

interface ControlOsAnalyticsProps {
  initialSubtab?: AnalyticsSubtab;
  showToast?: (msg: string) => void;
}

export function ControlOsAnalytics({
  initialSubtab = 'business',
  showToast = () => {},
}: ControlOsAnalyticsProps) {
  const [activeSubtab, setActiveSubtab] = useState<AnalyticsSubtab>(initialSubtab);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?range=${timeRange}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setAnalyticsData(json);
        }
      }
    } catch {
      showToast('Error syncing operational analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const metrics = analyticsData?.metrics || {};
  const events = analyticsData?.eventCounts || {};
  const topProducts = analyticsData?.topSellingProducts || [];

  return (
    <div className="space-y-6">
      {/* Module Title & Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Commercial & Operational Analytics
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              Database Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real transactional throughput, lead velocity, and biotope project demand.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[#0b121a] border border-slate-800 rounded-xl">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-mono uppercase transition-all ${
                  timeRange === r
                    ? 'bg-cyan-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {r === 'all' ? 'All Time' : r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            className="min-h-[44px] px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl bg-[#0b121a] border border-slate-800 hover:bg-slate-900"
          >
            ↻ Sync
          </button>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0b121a] border border-slate-800 rounded-xl w-fit">
        {[
          { id: 'business', label: 'Business & Yield', icon: '💎' },
          { id: 'products', label: 'Product Performance', icon: '🐠' },
          { id: 'customers', label: 'Client Conversion', icon: '👥' },
          { id: 'traffic', label: 'Storefront Funnel', icon: '📊' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubtab(tab.id as AnalyticsSubtab)}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
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

      {/* Insufficient Data Notice */}
      {analyticsData?.notice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <span>ℹ️</span>
          <span>{analyticsData.notice}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center text-xs text-slate-400 font-mono bg-[#0b121a] border border-slate-800 rounded-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
          Aggregating verified ledger telemetry...
        </div>
      ) : (
        <>
          {/* ────────────────────────────────────────────────────────────────── */}
          {/* SUBTAB 1: BUSINESS OVERVIEW                                        */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {activeSubtab === 'business' && (
            <div className="space-y-6">
              {/* Primary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Revenue</span>
                  <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                    ₹{(metrics.totalRevenue || 0).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500">Verified order gross</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Orders Fulfilled</span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {metrics.ordersCount || 0}
                  </div>
                  <span className="text-[10px] text-slate-500">Avg ticket: ₹{(metrics.avgOrderValue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Concierge Inquiries</span>
                  <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                    {metrics.totalEnquiries || 0}
                  </div>
                  <span className="text-[10px] text-slate-500">{metrics.qualifiedLeads || 0} qualified leads</span>
                </div>
                <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Active Worlds Projects</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {metrics.projectsCount || 0}
                  </div>
                  <span className="text-[10px] text-slate-500">{metrics.maintenanceCount || 0} maintenance accounts</span>
                </div>
              </div>

              {/* High-Level Commercial Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-[#0b121a] border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Commercial Yield & Conversion Velocity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Inquiry-to-Order Conversion Rate</span>
                      <span className="font-mono text-cyan-400 font-bold">{metrics.leadConversionRate || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full"
                        style={{ width: `${Math.min(100, metrics.leadConversionRate || 0)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400">Live Specimens in Active Catalog</span>
                      <span className="font-mono text-white font-bold">{metrics.productsCount || 0} SKUs</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Ongoing Architectural Installations</span>
                      <span className="font-mono text-white font-bold">{metrics.projectsCount || 0} Sites</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0b121a] border border-slate-800 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Top Grossing Products
                  </h3>
                  {topProducts.length === 0 ? (
                    <div className="text-xs text-slate-500 font-mono py-6 text-center">
                      No order items recorded in this window.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {topProducts.map((p: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/40 border border-slate-800"
                        >
                          <div>
                            <div className="font-medium text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.count} units delivered</div>
                          </div>
                          <div className="font-mono text-cyan-400 font-bold">
                            ₹{(p.revenue || 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* SUBTAB 2: PRODUCT PERFORMANCE                                      */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {activeSubtab === 'products' && (
            <div className="space-y-6">
              <div className="bg-[#0b121a] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Catalog Product Engagement</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Aggregate telemetry tracking specimen interest and checkout completion.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Product Page Views</span>
                    <div className="text-xl font-bold font-mono text-white mt-1">{events.productViews || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Added to Cart</span>
                    <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{events.addToCart || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Wishlist Saves</span>
                    <div className="text-xl font-bold font-mono text-pink-400 mt-1">{events.wishlistToggles || 0}</div>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900/80 text-[10px] font-mono text-slate-400 uppercase">
                        <th className="p-3">Rank</th>
                        <th className="p-3">Specimen Name</th>
                        <th className="p-3">Units Sold</th>
                        <th className="p-3 text-right">Gross Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {topProducts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-6 text-center text-slate-500 font-mono">
                            Insufficient sales telemetry in this time window.
                          </td>
                        </tr>
                      ) : (
                        topProducts.map((p: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-900/30">
                            <td className="p-3 font-mono text-slate-500">#{i + 1}</td>
                            <td className="p-3 font-medium text-white">{p.name}</td>
                            <td className="p-3 font-mono text-slate-300">{p.count}</td>
                            <td className="p-3 font-mono text-cyan-400 text-right font-bold">
                              ₹{(p.revenue || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* SUBTAB 3: CUSTOMER ENGAGEMENT                                      */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {activeSubtab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-[#0b121a] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Client Relationship Telemetry</h3>
                <p className="text-xs text-slate-400 mb-6">
                  VIP customer acquisition, architectural consultation pipelines, and recurring maintenance accounts.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Total Inquiries</span>
                    <div className="text-xl font-bold font-mono text-white mt-1">{metrics.totalEnquiries || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Qualified VIPs</span>
                    <div className="text-xl font-bold font-mono text-cyan-400 mt-1">{metrics.qualifiedLeads || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">WhatsApp Consults</span>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{events.whatsappClicks || 0}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Conversion Rate</span>
                    <div className="text-xl font-bold font-mono text-amber-400 mt-1">{metrics.leadConversionRate || 0}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────────────── */}
          {/* SUBTAB 4: STOREFRONT FUNNEL TRAFFIC                                */}
          {/* ────────────────────────────────────────────────────────────────── */}
          {activeSubtab === 'traffic' && (
            <div className="space-y-6">
              <div className="bg-[#0b121a] border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Storefront Acquisition Funnel</h3>
                <p className="text-xs text-slate-400 mb-6">
                  Telemetry tracking visitor movement from specimen inspection to fulfillment dispatch.
                </p>

                <div className="space-y-4 max-w-xl">
                  {[
                    { step: '1. Product Views', count: events.productViews || 0, color: 'bg-cyan-400' },
                    { step: '2. Add to Cart', count: events.addToCart || 0, color: 'bg-blue-400' },
                    { step: '3. Checkout Initiated', count: events.checkoutStarts || 0, color: 'bg-indigo-400' },
                    { step: '4. Orders Placed', count: events.ordersPlaced || metrics.ordersCount || 0, color: 'bg-emerald-400' },
                    { step: '5. Direct WhatsApp Inquiries', count: events.whatsappClicks || 0, color: 'bg-teal-400' },
                  ].map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium">{f.step}</span>
                        <span className="font-mono text-white font-bold">{f.count}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${f.color} rounded-full`}
                          style={{
                            width: `${Math.max(
                              4,
                              Math.min(
                                100,
                                events.productViews > 0
                                  ? Math.round((f.count / (events.productViews || 1)) * 100)
                                  : 10
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
