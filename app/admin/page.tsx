'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ControlOsSection, TabItem, OverviewDashboardData } from '@/components/admin/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminBottomNav } from '@/components/admin/AdminBottomNav';
import { ControlOsOverview } from '@/components/admin/ControlOsOverview';
import { ControlOsSales } from '@/components/admin/ControlOsSales';
import { ControlOsCatalog } from '@/components/admin/ControlOsCatalog';
import { ControlOsWorlds } from '@/components/admin/ControlOsWorlds';
import { ControlOsOperations } from '@/components/admin/ControlOsOperations';
import { ControlOsContent } from '@/components/admin/ControlOsContent';
import { ControlOsAnalytics } from '@/components/admin/ControlOsAnalytics';
import { ControlOsEmployees } from '@/components/admin/ControlOsEmployees';
import { ControlOsSystem } from '@/components/admin/ControlOsSystem';
import { GlobalSearchModal } from '@/components/admin/GlobalSearchModal';

interface AdminPageProps {
  initialTab?: ControlOsSection;
  initialSubtab?: string;
}

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  isOwner: boolean;
  isBootstrap: boolean;
}

export default function AdminPage({ initialTab = 'overview', initialSubtab }: AdminPageProps) {
  // Authentication & session state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Login form state
  const [loginMode, setLoginMode] = useState<'employee' | 'passcode'>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Navigation state
  const [activeTab, setActiveTab] = useState<ControlOsSection>(initialTab);
  const [activeSubtab, setActiveSubtab] = useState<string | undefined>(initialSubtab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  // Fetch current user profile
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setCurrentUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

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
        setCurrentUser(null);
        return false;
      }

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setOverviewData(json.data);
        setIsAuthenticated(true);
        await fetchCurrentUser();
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
  }, [fetchCurrentUser]);

  // Initial authentication check on component mount & read tab param from URL
  useEffect(() => {
    fetchOverviewData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') as ControlOsSection | null;
      const sub = params.get('subtab');
      if (
        tab &&
        [
          'overview',
          'sales',
          'catalog',
          'worlds',
          'operations',
          'crm',
          'content',
          'analytics',
          'employees',
          'system',
        ].includes(tab)
      ) {
        setActiveTab(tab);
      }
      if (sub) {
        setActiveSubtab(sub);
      }
    }
  }, [fetchOverviewData]);

  // Global Ctrl+K / Cmd+K search listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handle Login submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogin(true);
    setAuthError(null);

    try {
      const payload =
        loginMode === 'employee'
          ? { email: email.trim(), password }
          : { passcode: passcode.trim() };

      if (loginMode === 'employee' && (!email.trim() || !password)) {
        setAuthError('Please enter both your email address and password');
        setIsSubmittingLogin(false);
        return;
      }

      if (loginMode === 'passcode' && !passcode.trim()) {
        setAuthError('Please enter administrative passcode');
        setIsSubmittingLogin(false);
        return;
      }

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setPassword('');
        setPasscode('');
        showToast('✓ Control OS session authenticated');
        await fetchOverviewData();
      } else {
        setAuthError(data.error || 'Authentication denied. Please check your credentials.');
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
      setCurrentUser(null);
      setPasscode('');
      setPassword('');
      showToast('Logged out of Control OS');
    }
  };

  // Control OS Navigation Items
  const allTabItems: TabItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: '📊',
      badge: 'Active',
      isImplemented: true,
      description: 'Operational overview and live action center',
    },
    {
      id: 'sales',
      label: 'Sales',
      icon: '💳',
      badge: 'Active',
      isImplemented: true,
      description: 'Orders, live concierge enquiries, Customer 360 dossiers, and follow-ups',
    },
    {
      id: 'catalog',
      label: 'Catalog',
      icon: '🐠',
      badge: 'Active',
      isImplemented: true,
      description: 'Product catalog governance, livestock, inventory, and media',
    },
    {
      id: 'worlds',
      label: 'Worlds',
      icon: '🏛️',
      badge: 'Active',
      isImplemented: true,
      description: 'Living exhibits and bespoke biotope portfolio',
    },
    {
      id: 'operations',
      label: 'Operations',
      icon: '📦',
      badge: 'Active',
      isImplemented: true,
      description: 'Live specimen quarantine, air cargo dispatch, and architectural servicing',
    },
    {
      id: 'content',
      label: 'Content',
      icon: '🎬',
      badge: 'Active',
      isImplemented: true,
      description: 'Editorial journal, announcement banners, and technical SEO health',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: '📈',
      badge: 'Active',
      isImplemented: true,
      description: 'Database-backed business intelligence, funnel telemetry, and yield analysis',
    },
    {
      id: 'employees',
      label: 'Staff & Roles',
      icon: '👥',
      badge: 'Active',
      isImplemented: true,
      description: 'Employee access control, custom roles, and security authorization matrix',
    },
    {
      id: 'system',
      label: 'System',
      icon: '⚙️',
      badge: 'Active',
      isImplemented: true,
      description: 'Fleet infrastructure health, cloud snapshots, audit logs, and security',
    },
  ];

  // Permission-aware tab filtering
  const visibleTabItems = allTabItems.filter((item) => {
    if (!currentUser) return true;
    if (currentUser.isOwner || currentUser.isBootstrap) return true;
    if (item.id === 'overview') return true;

    const perms = currentUser.permissions || [];
    switch (item.id) {
      case 'employees':
        return perms.includes('employees.read') || perms.includes('roles.read');
      case 'sales':
      case 'crm':
        return ['orders.read', 'enquiries.read', 'customers.read', 'follow_ups.read'].some((p) =>
          perms.includes(p)
        );
      case 'catalog':
        return ['products.read', 'inventory.read', 'media.read'].some((p) => perms.includes(p));
      case 'worlds':
        return perms.includes('worlds.read');
      case 'operations':
        return ['quarantine.read', 'dispatch.read', 'maintenance.read'].some((p) =>
          perms.includes(p)
        );
      case 'content':
        return ['content.read', 'seo.read'].some((p) => perms.includes(p));
      case 'analytics':
        return perms.includes('analytics.read');
      case 'system':
        return ['audit.read', 'health.read', 'security.read', 'settings.read', 'backup.manage'].some(
          (p) => perms.includes(p)
        );
      default:
        return true;
    }
  });

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
                  Role-Based Access Control and operational telemetry.
                </p>
              </div>
            </div>

            {/* Login Mode Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('employee');
                  setAuthError(null);
                }}
                className={`min-h-[38px] rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  loginMode === 'employee'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>👤</span>
                <span>Staff Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('passcode');
                  setAuthError(null);
                }}
                className={`min-h-[38px] rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  loginMode === 'passcode'
                    ? 'bg-slate-800 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🔑</span>
                <span>Founder / Passcode</span>
              </button>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {loginMode === 'employee' ? (
                <>
                  <div>
                    <label
                      htmlFor="email-input"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2"
                    >
                      Staff Email Address
                    </label>
                    <input
                      id="email-input"
                      type="email"
                      placeholder="name@marinecreatures.local"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
                      autoFocus
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password-input"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-300 block mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-12 px-4 pr-14 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-medium text-slate-400 hover:text-white transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="passcode-input"
                      className="text-xs font-semibold uppercase tracking-wider text-slate-300 block"
                    >
                      Founder Passcode
                    </label>
                    <span className="text-[10px] font-mono text-cyan-400">Bootstrap / Recovery</span>
                  </div>
                  <div className="relative">
                    <input
                      id="passcode-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter administrative master passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full h-12 px-4 pr-14 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors font-mono"
                      autoFocus
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-xs font-medium text-slate-400 hover:text-white transition-colors"
                      aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              )}

              {authError && (
                <p
                  className="text-xs text-red-400 mt-2 font-medium flex items-center gap-1.5"
                  role="alert"
                >
                  <span>✕</span>
                  <span>{authError}</span>
                </p>
              )}

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
              <span className="font-mono text-[10px]">HMAC-SHA256 • RBAC</span>
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
          className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 pointer-events-none"
        >
          <div className="bg-cyan-400 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs font-mono text-center">
            {notification}
          </div>
        </div>
      )}

      {/* Control OS Layout Wrapper */}
      <div className="flex flex-1 min-h-screen">
        {/* Responsive Left Navigation Sidebar */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setActiveSubtab(undefined);
          }}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          desktopSidebarOpen={desktopSidebarOpen}
          setDesktopSidebarOpen={setDesktopSidebarOpen}
          tabItems={visibleTabItems}
          handleLogout={handleLogout}
        />

        {/* Main Content Workspace Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#06090e]">
          {/* Top Operational Header */}
          <AdminHeader
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setActiveSubtab(undefined);
            }}
            setSidebarOpen={setSidebarOpen}
            desktopSidebarOpen={desktopSidebarOpen}
            setDesktopSidebarOpen={setDesktopSidebarOpen}
            dbStatus={{
              connected: overviewData?.system.database.status === 'healthy',
              cluster: overviewData?.system.database.cluster,
              database: overviewData?.system.database.database,
              latencyMs: overviewData?.system.database.latencyMs,
            }}
            handleLogout={handleLogout}
            onOpenSearch={() => setIsSearchOpen(true)}
          />

          {/* Active Module Screen */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8">
            {/* Overview Command Center Module */}
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

            {/* Sales Operations Module */}
            {(activeTab === 'sales' || activeTab === 'crm') && (
              <ControlOsSales
                initialSubtab={activeSubtab as any}
                showToast={showToast}
              />
            )}

            {/* Catalog Governance Module */}
            {activeTab === 'catalog' && (
              <ControlOsCatalog
                onReturnToOverview={() => setActiveTab('overview')}
                showToast={showToast}
              />
            )}

            {/* Worlds Architecture CMS */}
            {activeTab === 'worlds' && (
              <ControlOsWorlds />
            )}

            {/* Operations & Dispatch Module */}
            {activeTab === 'operations' && (
              <ControlOsOperations
                initialSubtab={activeSubtab as any}
                showToast={showToast}
              />
            )}

            {/* Content & SEO Module */}
            {activeTab === 'content' && (
              <ControlOsContent
                initialSubtab={activeSubtab as any}
                showToast={showToast}
              />
            )}

            {/* Analytics & Telemetry Module */}
            {activeTab === 'analytics' && (
              <ControlOsAnalytics
                initialSubtab={activeSubtab as any}
                showToast={showToast}
              />
            )}

            {/* Employees & Access Control Module */}
            {activeTab === 'employees' && (
              <ControlOsEmployees
                showToast={showToast}
                currentUser={currentUser}
              />
            )}

            {/* System Governance & Fleet Module */}
            {activeTab === 'system' && (
              <ControlOsSystem
                initialSubtab={activeSubtab as any}
                showToast={showToast}
              />
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Operational Quick Access) */}
      <AdminBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMenu={() => setSidebarOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        pendingActionCount={overviewData?.actionCenter.count || 0}
      />

      {/* Global Command Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(section, subtab) => {
          setActiveTab(section);
          if (subtab) setActiveSubtab(subtab);
        }}
      />
    </div>
  );
}
