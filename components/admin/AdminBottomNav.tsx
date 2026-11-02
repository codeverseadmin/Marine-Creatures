'use client';

import React from 'react';
import { ControlOsSection } from './types';

interface AdminBottomNavProps {
  activeTab: ControlOsSection;
  setActiveTab: (tab: ControlOsSection) => void;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  pendingActionCount?: number;
}

export function AdminBottomNav({
  activeTab,
  setActiveTab,
  onOpenMenu,
  onOpenSearch,
  pendingActionCount = 0,
}: AdminBottomNavProps) {
  const primaryTabs: Array<{
    id: ControlOsSection;
    label: string;
    icon: string;
    badge?: number;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      badge: pendingActionCount > 0 ? pendingActionCount : undefined,
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: '💳',
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: '🐠',
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: '📦',
    },
  ];

  const isMoreActive = !['overview', 'sales', 'catalog', 'operations', 'crm'].includes(activeTab);

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#070d14]/95 backdrop-blur-xl border-t border-slate-800/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
    >
      <div className="grid grid-cols-5 h-16 max-w-lg mx-auto px-1">
        {primaryTabs.map((item) => {
          const isActive = activeTab === item.id || (item.id === 'sales' && activeTab === 'crm');
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all rounded-xl my-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <div className="relative text-lg leading-none">
                <span>{item.icon}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-bold font-mono flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 truncate max-w-[64px] ${isActive ? 'font-bold text-cyan-300' : 'text-slate-400 font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
            </button>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          onClick={onOpenMenu}
          className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all rounded-xl my-1 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
            isMoreActive
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 active:scale-95'
          }`}
          aria-label="Open full navigation drawer"
        >
          <div className="text-lg leading-none">
            <span>☰</span>
          </div>
          <span className={`text-[10px] tracking-tight mt-1 truncate max-w-[64px] ${isMoreActive ? 'font-bold text-cyan-300' : 'text-slate-400 font-medium'}`}>
            {isMoreActive ? activeTab.slice(0, 1).toUpperCase() + activeTab.slice(1) : 'More'}
          </span>
          {isMoreActive && (
            <span className="absolute bottom-0 w-8 h-0.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          )}
        </button>
      </div>
    </nav>
  );
}

