'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ControlOsSection } from './types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: ControlOsSection, subtab?: string) => void;
}

interface SearchResult {
  type: 'product' | 'order' | 'customer' | 'enquiry' | 'project' | 'case_study';
  id: string;
  title: string;
  subtitle: string;
  targetTab: string;
}

export function GlobalSearchModal({ isOpen, onClose, onNavigate }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation & Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        const item = results[selectedIndex];
        handleSelect(item);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Live search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query.trim())}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.results)) {
            setResults(json.results);
            setSelectedIndex(0);
          }
        }
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: SearchResult) => {
    onClose();
    if (item.type === 'order') {
      onNavigate('sales', 'orders');
    } else if (item.type === 'enquiry') {
      onNavigate('sales', 'enquiries');
    } else if (item.type === 'customer') {
      onNavigate('sales', 'customers');
    } else if (item.type === 'product') {
      onNavigate('catalog', 'products');
    } else if (item.type === 'project') {
      onNavigate('worlds', 'projects');
    } else if (item.type === 'case_study') {
      onNavigate('worlds', 'case-studies');
    } else {
      onNavigate('overview');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'order':
        return { label: 'ORDER', bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
      case 'product':
        return { label: 'PRODUCT', bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' };
      case 'customer':
        return { label: 'CUSTOMER', bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' };
      case 'enquiry':
        return { label: 'ENQUIRY', bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
      case 'project':
        return { label: 'PROJECT', bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30' };
      case 'case_study':
        return { label: 'CASE STUDY', bg: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
      default:
        return { label: 'ITEM', bg: 'bg-slate-700/50 text-slate-300 border-slate-600' };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-4 pt-16 sm:pt-24"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-[#071018] border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-[#091520]">
          <span className="text-slate-400 text-lg">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search orders (MC-8921), products, customers, enquiries, or projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {loading && (
            <span className="text-xs text-cyan-400 animate-pulse font-mono">Searching…</span>
          )}
          <button
            onClick={onClose}
            className="px-2 py-1 text-[11px] font-mono text-slate-400 border border-slate-700 rounded-md hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {query.trim().length >= 2 && results.length === 0 && !loading && (
            <div className="py-10 text-center text-xs text-slate-400">
              No administrative records matching &ldquo;{query}&rdquo;
            </div>
          )}

          {query.trim().length < 2 && (
            <div className="p-4 text-xs text-slate-400 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Quick Search Tips
              </span>
              <p>• Type order ID (e.g. &ldquo;MC-8921&rdquo;) to inspect shipment</p>
              <p>• Type client phone number to view Customer 360 profile</p>
              <p>• Type species name (e.g. &ldquo;Tang&rdquo;, &ldquo;Clownfish&rdquo;) to manage catalog inventory</p>
            </div>
          )}

          {results.map((item, idx) => {
            const badge = getTypeBadge(item.type);
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                  isSelected ? 'bg-cyan-500/15 border border-cyan-500/30' : 'hover:bg-slate-850 border border-transparent'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.subtitle}</p>
                </div>

                <div className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 shrink-0">
                  <span>Open</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Keybinds */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-slate-400 font-mono">Control OS Global Index</span>
        </div>
      </div>
    </div>
  );
}
