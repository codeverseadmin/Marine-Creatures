'use client';

import React, { useState } from 'react';
import { useCatalog } from '@/lib/context/CatalogContext';
import { useOrder } from '@/lib/context/OrderContext';

export interface DbStatus {
  connected: boolean;
  status: string;
  cluster?: string;
  database?: string;
  latencyMs?: number;
  counts?: { products: number; orders: number; inquiries: number; banners: number };
  error?: string;
  notice?: string;
}

interface SystemTabProps {
  dbStatus: DbStatus | null;
  checkingDb: boolean;
  seedingDb: boolean;
  checkDatabaseHealth: () => Promise<void>;
  handleSeedDatabase: () => Promise<void>;
  showToast: (message: string) => void;
}

export default function SystemTab({
  dbStatus,
  checkingDb,
  seedingDb,
  checkDatabaseHealth,
  handleSeedDatabase,
  showToast,
}: SystemTabProps) {
  const { products, banners, inquiries, resetToDefaults, exportDataJson, importDataJson } = useCatalog();
  const { orders, ownerSignature, setOwnerSignature } = useOrder();

  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleDownloadBackup = () => {
    const data = exportDataJson();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `marine_creatures_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('✓ Backup file downloaded');
  };

  const handleImportJson = () => {
    if (!importJsonText) return;
    const success = importDataJson(importJsonText);
    if (success) {
      setImportStatus('✓ Data restored successfully!');
      setImportJsonText('');
      setTimeout(() => setImportStatus(null), 3000);
      showToast('✓ Catalog data imported');
    } else {
      setImportStatus('✕ Invalid JSON format.');
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      {/* Owner Signature & Invoice Branding */}
      <div className="bg-[#071520] border border-cyan-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
        <div>
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <span>✍️</span>
            <span>Owner Signature &amp; Invoice Branding</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            This signature and the official dispatch seal automatically appear on all approved customer tax invoices.
          </p>
        </div>

        {/* Current Signature Preview */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
              Active Signatory Signature:
            </span>
            <div className="h-14 flex items-center bg-white/95 px-4 rounded-xl border border-slate-700/50 min-w-[200px] justify-center shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ownerSignature || '/signature.png'}
                alt="Owner Signature"
                className="max-h-12 max-w-[180px] object-contain"
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {ownerSignature && ownerSignature !== '/signature.png'
                ? 'Custom uploaded handwritten signature'
                : 'Official handwritten signature (Suraj Shasmal)'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <label className="h-10 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md active:scale-95">
              <span>📁</span>
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === 'string') {
                        setOwnerSignature(reader.result);
                        showToast('✓ Owner signature updated for all invoices!');
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>

            {ownerSignature && ownerSignature !== '/signature.png' && (
              <button
                type="button"
                onClick={() => {
                  setOwnerSignature('/signature.png');
                  showToast('Reset to default handwritten signature');
                }}
                className="h-10 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Reset Default
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MongoDB Atlas Cloud Database Control Card */}
      <div className="bg-[#071520] border border-cyan-400/20 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
              🍃
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>MongoDB Atlas Cloud Database</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-cyan-400/10 text-cyan-300 border border-cyan-400/30">
                  CLUSTER0
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                Cloud persistence for products, customer orders, tax invoices, and leads.
              </p>
            </div>
          </div>

          {dbStatus?.connected ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Connected ({dbStatus.latencyMs}ms)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Awaiting Atlas IP Access</span>
            </span>
          )}
        </div>

        {/* Database Telemetry Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Database</span>
            <span className="text-xs font-mono font-bold text-white block mt-0.5">marine_creatures</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Products Cloud</span>
            <span className="text-xs font-mono font-bold text-cyan-400 block mt-0.5">
              {dbStatus?.counts?.products ?? products.length} Live
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Orders Cloud</span>
            <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">
              {dbStatus?.counts?.orders ?? orders.length} Active
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Inquiries Cloud</span>
            <span className="text-xs font-mono font-bold text-purple-400 block mt-0.5">
              {dbStatus?.counts?.inquiries ?? inquiries.length} Leads
            </span>
          </div>
        </div>

        {/* Notice when IP needs whitelisting */}
        {!dbStatus?.connected && (
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <span>⚠️</span>
              <span>MongoDB Atlas Network Access Configuration:</span>
            </div>
            <p className="leading-relaxed text-amber-200/90 text-[11px]">
              MongoDB Atlas requires authorizing client IP addresses before granting connection. In your MongoDB Atlas Dashboard under <strong>Security &gt; Network Access</strong>:
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
              <span className="bg-black/50 px-2.5 py-1 rounded-lg border border-amber-500/30 text-white">
                Recommended: 0.0.0.0/0 (Allow Everywhere)
              </span>
              <span className="text-slate-400">or Current IP:</span>
              <span className="bg-black/50 px-2.5 py-1 rounded-lg border border-amber-500/30 text-cyan-300 font-bold">
                14.194.112.94
              </span>
            </div>
            <p className="text-[10px] text-amber-400/80">
              * The web app is currently operating with automatic local-first fallback, so all your operations, orders, and invoices continue working smoothly!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={checkDatabaseHealth}
            disabled={checkingDb}
            className="h-11 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all border border-slate-700"
          >
            <span>🔄</span>
            <span>{checkingDb ? 'Testing...' : 'Test Handshake & Ping'}</span>
          </button>

          <button
            type="button"
            onClick={handleSeedDatabase}
            disabled={seedingDb}
            className="h-11 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 active:scale-95 transition-all shadow-md"
          >
            <span>🌱</span>
            <span>{seedingDb ? 'Seeding...' : 'Seed / Sync All Data to Atlas'}</span>
          </button>
        </div>
      </div>

      <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3">
        <h4 className="text-base font-bold text-white">Export Catalog Backup</h4>
        <p className="text-xs text-slate-400">
          Download a JSON backup of all customized products, prices, and banners to your device.
        </p>
        <button
          onClick={handleDownloadBackup}
          className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 shadow-md transition-all"
        >
          <span>📥</span>
          <span>Download Backup (.JSON)</span>
        </button>
      </div>

      <div className="bg-[#071520] border border-slate-800 rounded-3xl p-5 space-y-3">
        <h4 className="text-base font-bold text-white">Restore from JSON</h4>
        <textarea
          rows={3}
          placeholder="Paste JSON string here..."
          value={importJsonText}
          onChange={(e) => setImportJsonText(e.target.value)}
          className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-400 resize-none"
        />
        {importStatus && (
          <p className="text-xs font-bold text-emerald-400">{importStatus}</p>
        )}
        <button
          onClick={handleImportJson}
          disabled={!importJsonText}
          className="w-full sm:w-auto h-12 px-6 rounded-2xl border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-slate-950 font-bold text-xs uppercase tracking-wider disabled:opacity-40 transition-colors"
        >
          Restore JSON Data
        </button>
      </div>

      <div className="bg-red-950/20 border border-red-500/30 rounded-3xl p-5 space-y-3">
        <h4 className="text-base font-bold text-red-400">Factory Reset</h4>
        <p className="text-xs text-slate-400">
          Reset everything back to original demo products and banners.
        </p>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all products and banners to defaults?')) {
              resetToDefaults();
              showToast('Catalog reset to defaults');
            }
          }}
          className="h-11 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider"
        >
          Reset To Factory Defaults
        </button>
      </div>
    </div>
  );
}
