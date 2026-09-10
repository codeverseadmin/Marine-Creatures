'use client';

import React from 'react';
import Link from 'next/link';
import { AdminTab, TabItem } from './types';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  desktopSidebarOpen: boolean;
  setDesktopSidebarOpen: (open: boolean) => void;
  tabItems: TabItem[];
  handleLogout: () => void;
}

export function AdminSidebar({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  desktopSidebarOpen,
  setDesktopSidebarOpen,
  tabItems,
  handleLogout,
}: AdminSidebarProps) {
  return (
    <>
      {/* Slide-over Hamburger Drawer (Mobile Only) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 sm:w-80 max-w-[85vw] bg-[#05111a] border-r border-slate-800 p-5 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-lg">
                    🌊
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-base">Control Center</h2>
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                      ● Live Mode
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-base"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Menu Items */}
              <nav className="space-y-2">
                {tabItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950 shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>

                      {typeof item.count === 'number' && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            isActive
                              ? 'bg-slate-950 text-cyan-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Controls */}
            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <Link
                href="/marketplace"
                target="_blank"
                className="w-full h-11 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>🛍️</span>
                <span>Open Storefront ↗</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full h-11 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/30"
              >
                <span>🔒</span>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Persistent Left Sidebar */}
      {desktopSidebarOpen ? (
        <aside className="hidden lg:flex w-72 bg-[#05111a] border-r border-slate-800/80 p-6 flex-col justify-between shrink-0 sticky top-0 h-screen z-30 shadow-2xl">
          <div className="space-y-8">
            {/* Logo Wordmark + Close Button */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,184,217,0.2)]">
                  🌊
                </div>
                <div>
                  <h2 className="font-display font-bold text-white text-base tracking-wide">
                    Marine Creatures
                  </h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                      Control Center
                    </span>
                  </div>
                </div>
              </div>

              {/* Close Sidebar Button */}
              <button
                onClick={() => setDesktopSidebarOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors shrink-0 border border-slate-700"
                title="Close navigation sidebar"
                aria-label="Close navigation sidebar"
              >
                ✕
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block px-3 mb-2">
                ADMIN NAVIGATION
              </span>
              {tabItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20 font-bold scale-[1.02]'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {typeof item.count === 'number' && (
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-slate-950 text-cyan-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Sidebar Bottom Controls */}
          <div className="pt-5 border-t border-slate-800 space-y-3">
            <Link
              href="/marketplace"
              target="_blank"
              className="w-full h-11 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-sm"
            >
              <span>🛍️</span>
              <span>Open Storefront ↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full h-11 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/30 transition-all shadow-sm"
            >
              <span>🔒</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      ) : (
        /* Minimized Desktop Sidebar Reopen Button */
        <div className="hidden lg:flex fixed left-3 top-3 z-40">
          <button
            onClick={() => setDesktopSidebarOpen(true)}
            className="h-10 px-3.5 rounded-2xl bg-[#05111a] hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 border border-slate-700 shadow-xl transition-all"
            title="Open navigation sidebar"
          >
            <span className="text-base">☰</span>
            <span>Menu</span>
          </button>
        </div>
      )}
    </>
  );
}
