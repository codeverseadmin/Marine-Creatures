'use client';

import React from 'react';
import Link from 'next/link';
import { AdminTab } from './types';

interface AdminHeaderProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  setSidebarOpen: (open: boolean) => void;
  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: (open: boolean) => void;
  dbStatus?: { connected: boolean; cluster?: string; database?: string; latencyMs?: number };
  checkingDb: boolean;
  checkDatabaseHealth: () => void;
  handleLogout: () => void;
}

export function AdminHeader({
  activeTab,
  setActiveTab,
  setSidebarOpen,
  desktopSidebarOpen,
  setDesktopSidebarOpen,
  dbStatus,
  checkingDb,
  checkDatabaseHealth,
  handleLogout,
}: AdminHeaderProps) {
  const getTabTitle = (tab: AdminTab, isDesktop = false) => {
    switch (tab) {
      case 'products':
        return isDesktop ? 'Product Catalog & Inventory Studio' : 'Product Inventory';
      case 'orders':
        return isDesktop ? 'Live Orders & Air Cargo Dispatches' : 'Orders & Dispatches';
      case 'banners':
        return isDesktop ? 'Homepage Announcement Slides' : 'Announcement Slides';
      case 'inquiries':
        return isDesktop ? 'VIP Client Consultation Leads' : 'Client Inquiries';
      case 'overview':
        return isDesktop ? 'Store Operations & Analytics' : 'Store Metrics';
      case 'system':
        return isDesktop ? 'Backup, Export & Database Tools' : 'System & Backup';
      default:
        return 'Admin Console';
    }
  };

  return (
    <>
      {/* Top Mobile Header (Phone / Tablet Only) */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#05111a]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-sm"
            aria-label="Open navigation menu"
          >
            <span className="w-5 h-0.5 bg-white rounded-full" />
            <span className="w-5 h-0.5 bg-white rounded-full" />
            <span className="w-5 h-0.5 bg-white rounded-full" />
          </button>

          <div>
            <h1 className="font-bold text-base text-white capitalize">
              {getTabTitle(activeTab, false)}
            </h1>
            <p className="text-[11px] text-slate-400">Marine Creatures Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/marketplace"
            target="_blank"
            className="h-10 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 border border-slate-700"
          >
            <span>🛍️</span>
            <span>Store ↗</span>
          </Link>
          <button
            onClick={handleLogout}
            className="h-10 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Top Desktop Header (Laptop / Desktop Only) */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-[#05111a]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 xl:px-8 py-3.5 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button (Open / Close) */}
          <button
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
            className={`h-10 px-3.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-semibold active:scale-95 shadow-sm ${
              desktopSidebarOpen
                ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                : 'bg-cyan-400 text-slate-950 font-bold border-cyan-300 shadow-cyan-400/20'
            }`}
            title={desktopSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
            aria-label="Toggle navigation sidebar"
          >
            <span className="text-sm">{desktopSidebarOpen ? '◀' : '☰'}</span>
            <span>{desktopSidebarOpen ? 'Hide Nav' : 'Show Nav'}</span>
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span>ADMIN</span>
              <span>/</span>
              <span className="text-cyan-400 font-bold uppercase">{activeTab}</span>
            </div>
            <h1 className="font-bold text-lg xl:text-xl text-white capitalize mt-0.5">
              {getTabTitle(activeTab, true)}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* MongoDB Atlas Cloud Status Pill */}
          {dbStatus?.connected ? (
            <span
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5"
              title={`Connected to MongoDB ${dbStatus.cluster} (${dbStatus.database}) in ${dbStatus.latencyMs}ms`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>MongoDB Live ({dbStatus.latencyMs}ms)</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setActiveTab('system');
                checkDatabaseHealth();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Click to view MongoDB Atlas connection settings"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>MongoDB: {checkingDb ? 'Checking...' : 'Atlas Setup'}</span>
            </button>
          )}

          <span className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Catalog Active</span>
          </span>

          <Link
            href="/marketplace"
            target="_blank"
            className="h-10 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-2 border border-slate-700 shadow-sm transition-all"
          >
            <span>🛍️</span>
            <span>Storefront Preview ↗</span>
          </Link>

          <button
            onClick={handleLogout}
            className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
    </>
  );
}
