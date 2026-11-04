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
  onOpenSearch?: () => void;
}

export function AdminHeader({
  activeTab,
  setActiveTab,
  setSidebarOpen,
  desktopSidebarOpen,
  setDesktopSidebarOpen,
  dbStatus,
  handleLogout,
  onOpenSearch,
}: AdminHeaderProps) {
  const getTabInfo = (tab: ControlOsSection) => {
    switch (tab) {
      case 'overview':
        return {
          title: 'Control OS Overview',
          desc: 'Marine Creatures executive command center and live action alerts',
          shortTitle: 'Overview',
          phase: 'Live',
        };
      case 'sales':
      case 'crm':
        return {
          title: 'Sales Operations',
          desc: 'Orders, live concierge enquiries, Customer 360 dossiers, and follow-ups',
          shortTitle: 'Sales',
          phase: 'Live',
        };
      case 'catalog':
        return {
          title: 'Catalog Governance',
          desc: 'Livestock inventory, dry goods, care specs, and media verification',
          shortTitle: 'Catalog',
          phase: 'Live',
        };
      case 'worlds':
        return {
          title: 'Worlds Architecture CMS',
          desc: 'Private client projects and public case study publications',
          shortTitle: 'Worlds',
          phase: 'Live',
        };
      case 'operations':
        return {
          title: 'Operations & Dispatch',
          desc: 'Quarantine protocol, thermal air-cargo packing, and architectural servicing',
          shortTitle: 'Operations',
          phase: 'Live',
        };
      case 'content':
        return {
          title: 'Content & SEO Governance',
          desc: 'Announcement banners, editorial highlights, and technical SEO audit',
          shortTitle: 'Content & SEO',
          phase: 'Live',
        };
      case 'analytics':
        return {
          title: 'Commercial Intelligence',
          desc: 'Database-backed ledger yield, acquisition funnel, and demand velocity',
          shortTitle: 'Analytics',
          phase: 'Live',
        };
      case 'employees':
        return {
          title: 'Staff & Access Control (RBAC)',
          desc: 'Individual employee credentials, role permissions, and session revocation',
          shortTitle: 'Employees',
          phase: 'Live',
        };
      case 'system':
        return {
          title: 'System Governance & Fleet',
          desc: 'Audit trail, Atlas snapshots, infrastructure health, and HMAC security',
          shortTitle: 'System',
          phase: 'Live',
        };
      default:
        return {
          title: 'Control OS',
          desc: 'Marine Creatures operational overview',
          shortTitle: 'Control OS',
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
      {/* Mobile Header (Fixed, 56-64px height, 44px+ touch targets, safe-area aware) */}
      <header
        aria-label="Admin Navigation Header"
        className="lg:hidden sticky top-0 z-30 bg-[#070d14]/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 pt-[env(safe-area-inset-top,0.5rem)]"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white flex flex-col items-center justify-center gap-1 border border-slate-700/80 shadow-sm shrink-0 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            aria-label="Open mobile navigation drawer"
          >
            <span className="w-4 h-0.5 bg-cyan-400 rounded-full" />
            <span className="w-4 h-0.5 bg-white rounded-full" />
            <span className="w-3 h-0.5 bg-white rounded-full self-start ml-2" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-xs sm:text-sm text-white truncate">
                {currentTab.shortTitle}
              </h1>
              {dbStatus && !dbStatus.connected && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" title="DB Reconnecting" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate hidden xs:block">
              {currentTab.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold inline-flex items-center justify-center border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 active:scale-95 transition-all"
              title="Search OS (Ctrl+K)"
              aria-label="Global search"
            >
              <span className="text-sm">🔍</span>
            </button>
          )}

          <Link
            href="/marketplace"
            target="_blank"
            className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold inline-flex items-center justify-center border border-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 active:scale-95 transition-all"
            title="Open Storefront in new tab"
            aria-label="Open Storefront"
          >
            <span className="text-sm">🛍️</span>
          </Link>

          <button
            onClick={handleLogout}
            className="min-w-[44px] min-h-[44px] px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-red-400 active:scale-95 transition-all"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <span className="text-xs">Exit</span>
          </button>
        </div>
      </header>

      {/* Desktop & Tablet Header */}
      <header
        aria-label="Admin Operational Header"
        className="hidden lg:flex sticky top-0 z-30 bg-[#070d14]/95 backdrop-blur-xl border-b border-slate-800/80 px-6 xl:px-8 py-3.5 items-center justify-between gap-6"
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
              <h1 className="font-bold text-lg text-white tracking-tight truncate">
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
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="min-h-[44px] px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2.5 text-xs font-mono transition-all hover:border-cyan-500/50"
              title="Search Operations (Ctrl+K)"
            >
              <span>🔍</span>
              <span className="text-slate-400 font-sans">Search OS...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-400">Ctrl+K</kbd>
            </button>
          )}

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
