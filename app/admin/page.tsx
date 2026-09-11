'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCatalog } from '@/lib/context/CatalogContext';
import { useOrder } from '@/lib/context/OrderContext';
import { AdminTab, TabItem } from '@/components/admin/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ProductsTab } from '@/components/admin/tabs/ProductsTab';
import OrdersTab from '@/components/admin/tabs/OrdersTab';
import BannersTab from '@/components/admin/tabs/BannersTab';
import InquiriesTab from '@/components/admin/tabs/InquiriesTab';
import OverviewTab from '@/components/admin/tabs/OverviewTab';
import SystemTab, { DbStatus } from '@/components/admin/tabs/SystemTab';

export default function AdminDashboardPage() {
  const { products, banners, inquiries } = useCatalog();
  const { orders } = useOrder();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  // Navigation & layout state
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);
  const [createProductTrigger, setCreateProductTrigger] = useState(0);

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // MongoDB Atlas Connection & Health State
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [checkingDb, setCheckingDb] = useState(false);
  const [seedingDb, setSeedingDb] = useState(false);

  const checkDatabaseHealth = useCallback(async () => {
    setCheckingDb(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data);
    } catch (e: any) {
      setDbStatus({ connected: false, status: 'error', error: e.message });
    } finally {
      setCheckingDb(false);
    }
  }, []);

  const handleSeedDatabase = async () => {
    setSeedingDb(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('✓ MongoDB Atlas successfully seeded with products & banners!');
        checkDatabaseHealth();
      } else {
        alert('Seed notice: ' + (data.error || 'Check network connection'));
      }
    } catch (e: any) {
      alert('Seed request error: ' + e.message);
    } finally {
      setSeedingDb(false);
    }
  };

  // Check session storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('mc_admin_authenticated');
      if (auth === 'true') {
        setIsAuthenticated(true);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkDatabaseHealth();
    }
  }, [isAuthenticated, checkDatabaseHealth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanPasscode = passcode.trim();
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: cleanPasscode }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setAuthError(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('mc_admin_authenticated', 'true');
        }
        showToast('✓ Control Center Authenticated');
      } else {
        setAuthError(true);
      }
    } catch {
      setAuthError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('mc_admin_authenticated');
    }
  };

  // Auth Screen (Clean & Mobile-Ready + Luxury Split for Laptop/Desktop)
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#02070c] text-white flex flex-col justify-center px-4 py-8 relative">
        {/* Background glow accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/10 blur-[140px] pointer-events-none rounded-full" />

        <div className="w-full max-w-sm lg:max-w-4xl mx-auto relative z-10">
          <div className="bg-[#07131d] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column (Desktop / Laptop Only) */}
            <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#061824] via-[#040e16] to-[#02070c] p-8 flex-col justify-between border-r border-slate-800/80">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(0,184,217,0.25)]">
                    🌊
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-lg tracking-wide">Marine Creatures</h2>
                    <span className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">
                      Control Center
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Executive Operations &amp; Management
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Manage captive-bred marine fish, coral frags, &amp; lighting tech</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Amazon-style 5-stage live dispatch pipeline with AWB editing</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>1-Tap WhatsApp dispatch notices &amp; client lead management</span>
                    </div>
                    <div className="flex items-start gap-3 text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold">✓</span>
                      <span>Encrypted session authentication &amp; local JSON backups</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>OPERATIONS CONSOLE</span>
                <span>SECURE ENCRYPTED</span>
              </div>
            </div>

            {/* Right Column: Passcode Form (Mobile & Laptop) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
              <div className="text-center lg:text-left mb-6">
                <div className="lg:hidden w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(0,184,217,0.15)]">
                  <span className="text-2xl">🔒</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Admin Sign In
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Enter master passcode to unlock control center
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2 uppercase tracking-wider">
                    Master Admin Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? 'text' : 'password'}
                      placeholder="Enter secret passcode"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      className="w-full h-13 sm:h-14 px-4 pr-12 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-500 text-base focus:outline-none focus:border-cyan-400 transition-colors"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-white p-1.5"
                    >
                      {showPasscode ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {authError && (
                    <p className="text-xs text-red-400 mt-2 font-medium flex items-center gap-1">
                      <span>✕</span> Incorrect passcode. Please try again.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full h-13 sm:h-14 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm tracking-wider uppercase transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                >
                  <span>Unlock Control Center</span>
                  <span>→</span>
                </button>
              </form>

              <div className="pt-4 mt-6 border-t border-slate-800 text-center lg:text-left">
                <Link
                  href="/"
                  className="text-xs text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5 py-1"
                >
                  <span>←</span>
                  <span>Back to Customer Storefront</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const tabItems: TabItem[] = [
    { id: 'products', label: 'Products & Inventory', count: products.length, icon: '🐠' },
    { id: 'orders', label: 'Orders & Dispatches', count: orders.length, icon: '📦' },
    { id: 'banners', label: 'Announcement Slides', count: banners.length, icon: '🎬' },
    { id: 'inquiries', label: 'Client Inquiries', count: inquiries.length, icon: '📬' },
    { id: 'overview', label: 'Analytics & Stats', icon: '📊' },
    { id: 'system', label: 'Backup & Restore', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-[#02070c] text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-black">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 pointer-events-none">
          <div className="bg-cyan-400 text-slate-950 px-5 py-3 rounded-2xl shadow-2xl font-bold text-sm text-center">
            {notification}
          </div>
        </div>
      )}

      {/* Main Admin Frame */}
      <div className="flex-1 flex min-h-screen">
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

        <div className="flex-1 flex flex-col min-w-0 bg-[#02070c]">
          <AdminHeader
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            setSidebarOpen={setSidebarOpen}
            desktopSidebarOpen={desktopSidebarOpen}
            setDesktopSidebarOpen={setDesktopSidebarOpen}
            dbStatus={dbStatus || undefined}
            checkingDb={checkingDb}
            checkDatabaseHealth={checkDatabaseHealth}
            handleLogout={handleLogout}
          />

          <main className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
            {activeTab === 'products' && (
              <ProductsTab
                passcode={passcode}
                showToast={showToast}
                createTrigger={createProductTrigger}
              />
            )}

            {activeTab === 'orders' && (
              <OrdersTab showToast={showToast} />
            )}

            {activeTab === 'banners' && (
              <BannersTab passcode={passcode} showToast={showToast} />
            )}

            {activeTab === 'inquiries' && (
              <InquiriesTab showToast={showToast} />
            )}

            {activeTab === 'overview' && (
              <OverviewTab
                onNewProduct={() => {
                  setActiveTab('products');
                  setCreateProductTrigger((prev) => prev + 1);
                }}
                onSwitchTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'system' && (
              <SystemTab
                dbStatus={dbStatus}
                checkingDb={checkingDb}
                seedingDb={seedingDb}
                checkDatabaseHealth={checkDatabaseHealth}
                handleSeedDatabase={handleSeedDatabase}
                showToast={showToast}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
