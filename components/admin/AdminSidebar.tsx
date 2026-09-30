'use client';

import React from 'react';
import Link from 'next/link';
import { ControlOsSection, TabItem } from './types';

interface AdminSidebarProps {
  activeTab: ControlOsSection;
  setActiveTab: (tab: ControlOsSection) => void;
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
  tabItems,
  handleLogout,
}: AdminSidebarProps) {
  return (
    <>
      {/* Mobile Slide-over Drawer */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <aside
            aria-label="Mobile Navigation"
            className="relative w-72 max-w-[85vw] bg-[#070d14] border-r border-slate-800 p-5 flex flex-col justify-between z-10 shadow-2xl overflow-y-auto"
          >
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-lg text-cyan-400 font-bold shrink-0">
                    MC
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm tracking-wide">Control OS</h2>
                    <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">
                      Marine Creatures
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  aria-label="Close navigation menu"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Navigation List */}
              <nav aria-label="Control OS Modules" className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block px-2 mb-2 font-mono">
                  CONTROL OS MODULES
                </span>
                {tabItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              isActive
                                ? 'bg-slate-950 text-cyan-300'
                                : item.isImplemented
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Drawer Bottom Controls */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2 mt-6">
              <Link
                href="/marketplace"
                target="_blank"
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <span>🛍️</span>
                <span>Open Storefront ↗</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full min-h-[44px] px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <span>🔒</span>
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Fixed Left Sidebar */}
      {desktopSidebarOpen && (
        <aside
          aria-label="Desktop Navigation"
          className="hidden lg:flex w-64 bg-[#070d14] border-r border-slate-800/80 p-5 flex-col justify-between shrink-0 sticky top-0 h-screen z-20 shadow-xl overflow-y-auto"
        >
          <div className="space-y-6">
            {/* Logo & Operational ID */}
            <div className="flex items-center gap-3 pb-5 border-b border-slate-800/80">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-sm font-mono font-bold text-cyan-400 shadow-sm shrink-0">
                OS
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-white text-sm tracking-wide truncate">
                  Control OS
                </h2>
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block truncate">
                  Marine Creatures
                </span>
              </div>
            </div>

            {/* Navigation Modules */}
            <nav aria-label="Control OS Modules" className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block px-2 mb-2 font-mono">
                CONTROL OS MODULES
              </span>
              {tabItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-slate-950 text-cyan-300'
                              : item.isImplemented
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Sidebar Bottom Controls */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <Link
              href="/marketplace"
              target="_blank"
              className="w-full min-h-[44px] px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <span>🛍️</span>
              <span>Open Storefront ↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full min-h-[44px] px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <span>🔒</span>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
}
