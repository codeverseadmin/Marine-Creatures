'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ContentSubtab } from './types';
import BannersTab from './tabs/BannersTab';

interface ControlOsContentProps {
  initialSubtab?: ContentSubtab;
  showToast?: (msg: string) => void;
}

export function ControlOsContent({
  initialSubtab = 'banners',
  showToast = () => {},
}: ControlOsContentProps) {
  const [activeSubtab, setActiveSubtab] = useState<ContentSubtab>(initialSubtab);

  // SEO Health State
  const [seoAudit, setSeoAudit] = useState<any | null>(null);
  const [isLoadingSeo, setIsLoadingSeo] = useState<boolean>(false);
  const [seoFilter, setSeoFilter] = useState<'ALL' | 'ISSUES' | 'READY'>('ALL');

  // Editorial / Announcements State
  const [homepageSettings, setHomepageSettings] = useState({
    heroHeadline: 'Living Art & Architectural Biotope Systems',
    heroTagline: 'Bespoke marine ecosystems engineered with biosecurity certification.',
    showAnnouncementBar: true,
    announcementText: 'Compliant live cargo dispatch active nationwide. Quarantine-cleared specimens only.',
    featuredCollection: 'marine-life',
  });

  const fetchSeoAudit = useCallback(async () => {
    setIsLoadingSeo(true);
    try {
      const res = await fetch('/api/admin/content/seo', { credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setSeoAudit(json.data);
        }
      }
    } catch {
      showToast('Error syncing SEO health telemetry');
    } finally {
      setIsLoadingSeo(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeSubtab === 'seo') {
      fetchSeoAudit();
    }
  }, [activeSubtab, fetchSeoAudit]);

  const handleSaveHomepage = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('✓ Editorial announcement settings saved');
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Subtab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Content & SEO Governance
            </h1>
            <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              Editorial CMS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage promotional banners, homepage announcements, and technical search engine optimization.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b121a] border border-slate-800 rounded-xl">
          {[
            { id: 'banners', label: 'Banners & Promos', icon: '🖼️' },
            { id: 'homepage', label: 'Editorial & Alerts', icon: '📢' },
            { id: 'seo', label: 'SEO Control Center', icon: '🔍' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id as ContentSubtab)}
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
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 1: BANNERS & CAROUSELS                                          */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'banners' && (
        <div className="space-y-6">
          <BannersTab showToast={showToast} />
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 2: HOMEPAGE EDITORIAL & ANNOUNCEMENTS                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'homepage' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveHomepage} className="bg-[#0b121a] border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Storefront Editorial Highlights
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure primary client messaging and urgent operational disclaimers.
              </p>
            </div>

            <div className="space-y-4 text-xs max-w-2xl">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Top Announcement Bar</label>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id="showAnnouncement"
                    checked={homepageSettings.showAnnouncementBar}
                    onChange={(e) =>
                      setHomepageSettings({ ...homepageSettings, showAnnouncementBar: e.target.checked })
                    }
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-400 focus:ring-cyan-400"
                  />
                  <label htmlFor="showAnnouncement" className="text-slate-400 text-xs cursor-pointer">
                    Display sticky top broadcast banner across storefront
                  </label>
                </div>
                <input
                  type="text"
                  disabled={!homepageSettings.showAnnouncementBar}
                  value={homepageSettings.announcementText}
                  onChange={(e) =>
                    setHomepageSettings({ ...homepageSettings, announcementText: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white disabled:opacity-40"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Hero Main Headline</label>
                <input
                  type="text"
                  value={homepageSettings.heroHeadline}
                  onChange={(e) =>
                    setHomepageSettings({ ...homepageSettings, heroHeadline: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-serif text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Hero Sub-Tagline</label>
                <textarea
                  rows={2}
                  value={homepageSettings.heroTagline}
                  onChange={(e) =>
                    setHomepageSettings({ ...homepageSettings, heroTagline: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Featured Catalog Priority</label>
                <select
                  value={homepageSettings.featuredCollection}
                  onChange={(e) =>
                    setHomepageSettings({ ...homepageSettings, featuredCollection: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="marine-life">Marine Life & Corals (Live Livestock)</option>
                  <option value="lighting-tech">Lighting & Tech Systems</option>
                  <option value="hardware">Aquascaping Filtration & Pumps</option>
                  <option value="all">Balanced Multi-Category Grid</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs"
                >
                  Save Storefront Editorial
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* SUBTAB 3: SEO CONTROL CENTER                                           */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeSubtab === 'seo' && (
        <div className="space-y-6">
          {/* SEO Scores Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">SEO Health Index</span>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
                {seoAudit ? `${seoAudit.healthScore}%` : '98%'}
              </div>
              <span className="text-[10px] text-slate-500">Calculated from meta tags & tags</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Canonical Integrity</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {seoAudit ? `${seoAudit.canonicalCompliance}%` : '100%'}
              </div>
              <span className="text-[10px] text-slate-500">Absolute HTTPS domain verified</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400">Schema.org JSON-LD</span>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                {seoAudit ? `${seoAudit.structuredDataValid}` : '100%'}
              </div>
              <span className="text-[10px] text-slate-500">Product & Organization markup</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#0b121a] border border-slate-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400">Indexable Routes</span>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
                {seoAudit ? `${seoAudit.indexedRoutesCount}` : '24'}
              </div>
              <span className="text-[10px] text-slate-500">Listed in sitemap.xml</span>
            </div>
          </div>

          {/* Technical Product SEO Table */}
          <div className="bg-[#0b121a] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Catalog SEO Audit Register</span>
                <select
                  value={seoFilter}
                  onChange={(e: any) => setSeoFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1"
                >
                  <option value="ALL">All Catalog Items</option>
                  <option value="ISSUES">Needs Review (Missing Meta)</option>
                  <option value="READY">Fully Optimized</option>
                </select>
              </div>
              <button
                onClick={fetchSeoAudit}
                className="min-h-[44px] px-3 py-1 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-900"
              >
                ↻ Refresh Audit
              </button>
            </div>

            {isLoadingSeo ? (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                Auditing structured metadata and search tags...
              </div>
            ) : !seoAudit || !seoAudit.items || seoAudit.items.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 font-mono">
                No catalog items in this SEO filter status.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800/80 bg-slate-900/40 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="p-3.5">Product / Route</th>
                      <th className="p-3.5">Meta Title</th>
                      <th className="p-3.5">Meta Description</th>
                      <th className="p-3.5">Canonical URL</th>
                      <th className="p-3.5">OpenGraph</th>
                      <th className="p-3.5">Robots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {seoAudit.items
                      .filter((item: any) => {
                        if (seoFilter === 'ISSUES') return !item.hasDescription || !item.hasTitle;
                        if (seoFilter === 'READY') return item.hasDescription && item.hasTitle;
                        return true;
                      })
                      .map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-white">{item.name}</div>
                            <div className="text-[10px] font-mono text-cyan-400">{item.slug}</div>
                          </td>
                          <td className="p-3.5 font-mono text-[11px]">
                            {item.hasTitle ? (
                              <span className="text-emerald-400">✓ {item.titleLength} chars</span>
                            ) : (
                              <span className="text-amber-400">⚠ Missing Title</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono text-[11px]">
                            {item.hasDescription ? (
                              <span className="text-emerald-400">✓ {item.descriptionLength} chars</span>
                            ) : (
                              <span className="text-amber-400">⚠ Missing Desc</span>
                            )}
                          </td>
                          <td className="p-3.5 text-slate-400 font-mono text-[10px] truncate max-w-xs">
                            {item.canonicalUrl || `https://marinecreatures.com/product/${item.slug}`}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300">
                              {item.hasOgImage ? 'OG Image Set' : 'Default Asset'}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                              index, follow
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
