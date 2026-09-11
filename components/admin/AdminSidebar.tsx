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
          />

          {/* Drawer Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-[#05111a] border-r border-slate-800 p-5 flex flex-col justify-between z-10 shadow-2xl">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-lg">
                    🌊
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm">Marine Creatures</h2>
                    <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
                      Admin Panel
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Menu Items */}
              <nav className="space-y-1.5">
                {tabItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>

                      {typeof item.count === 'number' && (
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
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
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/marketplace"
                target="_blank"
                className="w-full h-10 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
              >
                <span>🛍️</span>
                <span>Open Storefront ↗</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full h-10 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/20"
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
        <aside className="hidden lg:flex w-64 bg-[#05111a] border-r border-slate-800/80 p-5 flex-col justify-between shrink-0 sticky top-0 h-screen z-20 shadow-xl">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3 pb-5 border-b border-slate-800/80">
              <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-xl shadow-sm">
                🌊
              </div>
              <div>
                <h2 className="font-bold text-white text-sm tracking-wide">
                  Marine Creatures
                </h2>
                <span className="text-[10px] text-cyan-400 font-semibold uppercase tracking-wider block">
                  Store Management
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block px-2 mb-2">
                SECTIONS
              </span>
              {tabItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-400 text-slate-950 font-bold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>

                    {typeof item.count === 'number' && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
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
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <Link
              href="/marketplace"
              target="_blank"
              className="w-full h-10 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all shadow-sm"
            >
              <span>🛍️</span>
              <span>Open Storefront ↗</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full h-10 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 border border-red-500/20 transition-all"
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
