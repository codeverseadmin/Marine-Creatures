'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ControlOsSection, TabItem, OverviewDashboardData } from '@/components/admin/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ControlOsOverview } from '@/components/admin/ControlOsOverview';
import { ControlOsPlaceholder } from '@/components/admin/ControlOsPlaceholder';

export default function AdminPage() {
  // Authentication & session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState<ControlOsSection>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);

  // Dashboard data state
  const [overviewData, setOverviewData] = useState<OverviewDashboardData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  // Notification toast state
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Fetch overview data from server using signed httpOnly session cookie
  const fetchOverviewData = useCallback(async () => {
    setIsLoadingOverview(true);
    setOverviewError(null);
    try {
      const res = await fetch('/api/admin/overview', {
        method: 'GET',
        credentials: 'include',
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        setOverviewData(null);
        return false;
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setOverviewData(json.data);
        setIsAuthenticated(true);
        return true;
      } else {
        throw new Error(json.error || 'Failed to parse overview response');
      }
    } catch (err: any) {
      setOverviewError(err.message || 'Operational data synchronization error');
      return false;
    } finally {
      setIsLoadingOverview(false);
      setIsVerifyingAuth(false);
    }
  }, []);

  // Initial authentication check on component mount
  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError('Please enter administrative passcode');
      return;
    }

    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const cleanPasscode = passcode.trim();
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ passcode: cleanPasscode }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPasscode('');
        showToast('✓ Control OS session authenticated');
        await fetchOverviewData();
      } else {
        setAuthError(data.error || 'Invalid passcode. Access denied.');
      }
    } catch {
      setAuthError('Connection error during authentication.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // ignore
    } finally {
      setIsAuthenticated(false);
      setOverviewData(null);
      setPasscode('');
      showToast('Logged out of Control OS');
    }
  };

  // Control OS Navigation Items
  const tabItems: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      badge: 'Active',
      isImplemented: true,
      description: 'Operational overview and live action center',
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: '🐠',
      badge: 'Phase 3B',
      isImplemented: false,
      phaseDependency: 'Phase 3B',
      description: 'Product catalog governance and SKU matrix',
    },
    {
      id: 'worlds',
      label: 'Worlds',
      icon: '🏛️',
      badge: 'Phase 3C',
      isImplemented: false,
      phaseDependency: 'Phase 3C',
      description: 'Living exhibits and bespoke biotope portfolio',
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: '📦',
      badge: 'Phase 3D',
      isImplemented: false,
      phaseDependency: 'Phase 3D',
      description: 'Live specimen quarantine and air cargo dispatch',
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: '💬',
      badge: 'Phase 3D',
      isImplemented: false,
      phaseDependency: 'Phase 3D',
      description: 'Client concierge and VIP architectural inquiries',
    },
    {
      id: 'content',
      label: 'Content',
      icon: '🎬',
      badge: 'Phase 3E',
      isImplemented: false,
      phaseDependency: 'Phase 3E',
      description: 'Editorial journal, care guides, and announcement banners',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      badge: 'Phase 3F',
      isImplemented: false,
      phaseDependency: 'Phase 3F',
      description: 'Commercial intelligence and yield analysis',
    },
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      badge: 'Phase 3F',
      isImplemented: false,
      phaseDependency: 'Phase 3F',
      description: 'Fleet infrastructure health, backups, and security',
    },
  ];

  // 1. Initial Authentication Verifying Screen (Clean, Fast)
  if (isVerifyingAuth) {
    return (
      <main className="min-h-screen bg-[#06090e] text-slate-300 flex items-center justify-center p-4 font-mono text-xs">
        <div className="flex items-center gap-3 p-5 rounded-2xl bg-[#0b121a] border border-slate-800 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Verifying Control OS administrative session...</span>
        </div>
      </main>
    );
  }

  // 2. Unauthenticated Admin Login Screen (Professional, Linear/Bloomberg Aesthetic)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col justify-center px-4 py-8 font-sans selection:bg-cyan-400 selection:text-black">
        <div className="w-full max-w-sm sm:max-w-md mx-auto">
          {/* Card Surface */}
          <div className="bg-[#0b121a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
                  OS
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                  Restricted Access
                </span>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                  Marine Creatures Control OS
                </h1>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Authorized personnel access to private business telemetry and operational controls.
                </p>
              </div>
            </div>

            {/* Passcode Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="passcode-input"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2"
                >
                  Master Passcode
                </label>
                <div className="relative">
                  <input
                    id="passcode-input"
                    type={showPasscode ? 'text' : 'password'}
                    placeholder="Enter administrative passcode"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full h-12 px-4 pr-14 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    {showPasscode ? 'Hide' : 'Show'}
                  </button>
                </div>

                {authError && (
                  <p className="text-xs text-red-400 mt-2 font-medium flex items-center gap-1.5" role="alert">
                    <span>✕</span>
                    <span>{authError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingLogin}
                className="w-full min-h-[44px] h-12 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmittingLogin ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Authenticate Session</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* Footer Notice & Return Link */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <Link
                href="/"
                className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1 min-h-[44px]"
              >
                <span>←</span>
                <span>Customer Storefront</span>
              </Link>
              <span className="font-mono text-[10px]">HMAC-SHA256</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 3. Authenticated Control OS Admin Shell
  return (
    <div className="min-h-screen bg-[#06090e] text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 pointer-events-none"
        >
          <div className="bg-cyan-400 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs font-mono text-center">
            {notification}
          </div>
        </div>
      )}

      {/* Main Admin Frame */}
      <div className="flex-1 flex min-h-screen">
        {/* Left Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          desktopSidebarOpen={desktopSidebarOpen}
          setDesktopSidebarOpen={setDesktopSidebarOpen}
          tabItems={tabItems}
          handleLogout={handleLogout}
        />

        {/* Content Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#06090e]">
          {/* Top Utility Header */}
          <AdminHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSidebarOpen={setSidebarOpen}
            desktopSidebarOpen={desktopSidebarOpen}
            setDesktopSidebarOpen={setDesktopSidebarOpen}
            dbStatus={
              overviewData
                ? {
                    connected: overviewData.system.database.status === 'Healthy',
                    cluster: overviewData.system.database.cluster,
                    database: overviewData.system.database.database,
                    latencyMs: overviewData.system.database.latencyMs,
                  }
                : undefined
            }
            handleLogout={handleLogout}
          />

          {/* Main Operational Surface */}
          <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
            {activeTab === 'overview' && (
              <>
                {overviewError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Telemetry Error: {overviewError}</span>
                    </div>
                    <button
                      onClick={fetchOverviewData}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium text-xs transition-colors"
                    >
                      Retry Sync
                    </button>
                  </div>
                )}

                {overviewData ? (
                  <ControlOsOverview
                    data={overviewData}
                    isLoading={isLoadingOverview}
                    onRefresh={fetchOverviewData}
                    onNavigateSection={(section) => setActiveTab(section)}
                  />
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block mr-2 animate-ping" />
                    Synchronizing live database telemetry...
                  </div>
                )}
              </>
            )}

            {/* Phased Modules Placeholder (CATALOG, WORLDS, OPERATIONS, CRM, CONTENT, ANALYTICS, SYSTEM) */}
            {activeTab !== 'overview' && (
              <ControlOsPlaceholder
                section={activeTab}
                onReturnToOverview={() => setActiveTab('overview')}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
