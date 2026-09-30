'use client';

import React from 'react';
import Link from 'next/link';
import { ControlOsSection } from './types';

interface AdminHeaderProps {
  activeTab: ControlOsSection;
  setActiveTab: (tab: ControlOsSection) => void;
  setSidebarOpen: (open: boolean) => void;
  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: (open: boolean) => void;
  dbStatus?: { connected: boolean; cluster?: string; database?: string; latencyMs?: number };
  handleLogout: () => void;
}

export function AdminHeader({
  activeTab,
  setActiveTab,
  setSidebarOpen,
  desktopSidebarOpen,
  setDesktopSidebarOpen,
  dbStatus,
  handleLogout,
}: AdminHeaderProps) {
  const getTabInfo = (tab: ControlOsSection) => {
    switch (tab) {
      case 'overview':
        return {
          title: 'Control OS',
          desc: 'Marine Creatures operational overview',
          phase: 'Live',
        };
      case 'catalog':
        return {
          title: 'Catalog Governance',
          desc: 'Inventory control, SKU matrix, and variant specifications',
          phase: 'Phase 3B',
        };
      case 'worlds':
        return {
          title: 'Worlds Portfolio CMS',
          desc: 'Bespoke biotope showcases and living exhibit case studies',
          phase: 'Phase 3C',
        };
      case 'operations':
        return {
          title: 'Operations & Dispatch',
          desc: 'Live quarantine tracking, thermal packing, and air cargo AWBs',
          phase: 'Phase 3D',
        };
      case 'crm':
        return {
          title: 'Client Concierge & VIP CRM',
          desc: 'Consultation intake, custom tank requests, and VIP pipelines',
          phase: 'Phase 3D',
        };
      case 'content':
        return {
          title: 'Editorial & Brand Content',
          desc: 'Announcement banners, care guides, and technical journals',
          phase: 'Phase 3E',
        };
      case 'analytics':
        return {
          title: 'Business Intelligence & Yield',
          desc: 'Commercial analytics, demand velocity, and revenue reporting',
          phase: 'Phase 3F',
        };
      case 'system':
        return {
          title: 'Fleet Telemetry & Security',
          desc: 'Database cluster health, snapshots, and operational audits',
          phase: 'Phase 3F',
        };
      default:
        return {
          title: 'Control OS',
          desc: 'Marine Creatures operational overview',
          phase: 'Live',
        };
    }
  };

  const currentTab = getTabInfo(activeTab);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <>
      {/* Mobile Header (Height 60px+, touch targets 44x44px min) */}
      <header
        aria-label="Admin Navigation Header"
        className="lg:hidden sticky top-0 z-30 bg-[#070d14]/95 backdrop-blur-md border-b border-slate-800 px-3 py-2.5 flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            aria-label="Open mobile menu"
          >
            <span className="w-4 h-0.5 bg-white rounded-full" />
            <span className="w-4 h-0.5 bg-white rounded-full" />
            <span className="w-4 h-0.5 bg-white rounded-full" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-sm text-white truncate">
                {currentTab.title}
              </h1>
              {currentTab.phase !== 'Live' && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                  {currentTab.phase}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {currentTab.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href="/marketplace"
            target="_blank"
            className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            title="Open Storefront"
          >
            <span className="text-sm">🛍️</span>
          </Link>
          <button
            onClick={handleLogout}
            className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400"
            title="Sign Out"
          >
            Exit
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header
        aria-label="Admin Operational Header"
        className="hidden lg:flex sticky top-0 z-30 bg-[#070d14]/95 backdrop-blur-xl border-b border-slate-800/80 px-8 py-3.5 items-center justify-between gap-6"
      >
        {/* Left: Sidebar Toggle & Page Title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
            className="min-h-[44px] px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2 text-xs font-medium transition-all active:scale-95 shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            title={desktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <span className="text-sm">{desktopSidebarOpen ? '◀' : '☰'}</span>
            <span>{desktopSidebarOpen ? 'Hide Nav' : 'Show Nav'}</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-lg text-white tracking-tight">
                {currentTab.title}
              </h1>
              {currentTab.phase !== 'Live' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {currentTab.phase}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {currentTab.desc}
            </p>
          </div>
        </div>

        {/* Right: Operational Telemetry & Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Admin Identity */}
          <div className="min-h-[44px] px-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-medium">Master Admin</span>
            <span className="text-[10px] text-slate-400 font-mono">({formattedDate})</span>
          </div>

          {/* Database indicator if warning */}
          {dbStatus && !dbStatus.connected && (
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className="min-h-[44px] px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
              title="Database offline alert"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Database Offline</span>
            </button>
          )}

          <Link
            href="/marketplace"
            target="_blank"
            className="min-h-[44px] px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-2 border border-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <span>🛍️</span>
            <span>View Store ↗</span>
          </Link>

          <button
            onClick={handleLogout}
            className="min-h-[44px] px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Sign Out
          </button>
        </div>
      </header>
    </>
  );
}
