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
  const getTabInfo = (tab: AdminTab) => {
    switch (tab) {
      case 'orders':
        return { title: 'Orders', desc: 'Manage customer orders and deliveries' };
      case 'products':
        return { title: 'Products', desc: 'Manage fish, corals, and gear stock' };
      case 'banners':
        return { title: 'Banner Slides', desc: 'Homepage announcement banners' };
      case 'inquiries':
        return { title: 'Customer Inquiries', desc: 'Client messages and custom tank requests' };
      case 'overview':
        return { title: 'Store Overview', desc: 'Quick summary of sales and catalog' };
      case 'system':
        return { title: 'Settings & Backup', desc: 'Database connection and data backups' };
      default:
        return { title: 'Admin Console', desc: 'Store Management' };
    }
  };

  const currentTab = getTabInfo(activeTab);

  return (
    <>
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#05111a]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex flex-col items-center justify-center gap-1 border border-slate-700 shadow-sm shrink-0"
            aria-label="Open navigation menu"
          >
            <span className="w-5 h-0.5 bg-white rounded-full" />
            <span className="w-5 h-0.5 bg-white rounded-full" />
            <span className="w-5 h-0.5 bg-white rounded-full" />
          </button>

          <div className="min-w-0">
            <h1 className="font-bold text-base text-white truncate">
              {currentTab.title}
            </h1>
            <p className="text-[11px] text-slate-400 truncate">Marine Creatures Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/marketplace"
            target="_blank"
            className="h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-700"
          >
            <span>🛍️</span>
            <span>Store ↗</span>
          </Link>
          <button
            onClick={handleLogout}
            className="h-9 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex sticky top-0 z-30 bg-[#05111a]/95 backdrop-blur-xl border-b border-slate-800/80 px-8 py-4 items-center justify-between gap-6">
        {/* Left: Sidebar Toggle & Page Title */}
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => setDesktopSidebarOpen(!desktopSidebarOpen)}
            className="h-10 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-2 text-xs font-medium transition-all active:scale-95 shadow-sm shrink-0"
            title={desktopSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            <span className="text-sm">{desktopSidebarOpen ? '◀' : '☰'}</span>
            <span>{desktopSidebarOpen ? 'Hide Nav' : 'Show Nav'}</span>
          </button>

          <div className="min-w-0">
            <h1 className="font-bold text-xl text-white tracking-tight">
              {currentTab.title}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {currentTab.desc}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Database status warning only if offline */}
          {dbStatus && !dbStatus.connected && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('system');
                checkDatabaseHealth();
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Click to check database connection"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Database Offline</span>
            </button>
          )}

          <Link
            href="/marketplace"
            target="_blank"
            className="h-10 px-4 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-2 border border-slate-700 shadow-sm transition-all"
          >
            <span>🛍️</span>
            <span>View Store ↗</span>
          </Link>

          <button
            onClick={handleLogout}
            className="h-10 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>
    </>
  );
}
