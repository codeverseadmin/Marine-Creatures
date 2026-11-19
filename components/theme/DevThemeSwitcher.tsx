'use client';

import React, { useEffect, useState } from 'react';
import { useTheme, ThemeMode } from '@/lib/context/ThemeContext';
import { usePathname } from 'next/navigation';

export function DevThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Check environment variable flag
    const envFlag = process.env.NEXT_PUBLIC_THEME_TEST_MODE === 'true';

    // 2. Check development environment
    const isDev = process.env.NODE_ENV === 'development';

    // 3. Check testing URL parameter override (?theme_test=true) or local testing toggle
    const searchParams = new URLSearchParams(window.location.search);
    const queryFlag = searchParams.get('theme_test') === 'true';
    const localFlag = localStorage.getItem('mc_theme_test_mode') === 'true';

    if (queryFlag) {
      try {
        localStorage.setItem('mc_theme_test_mode', 'true');
      } catch {
        // ignore
      }
    }

    if (envFlag || isDev || queryFlag || localFlag) {
      setEnabled(true);
    }
  }, []);

  // Do not show on admin / Control OS or invoice pages
  if (!mounted || !enabled || pathname.startsWith('/admin') || pathname.startsWith('/invoice')) {
    return null;
  }

  return (
    <aside
      className="fixed bottom-24 right-3 sm:right-6 md:bottom-6 md:right-6 z-[9990] select-none animate-fadeIn"
      aria-label="Development Theme Switcher"
    >
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--color-secondary)]/95 border border-[var(--color-border)] shadow-[0_12px_36px_rgba(0,0,0,0.5),0_0_20px_rgba(0,184,217,0.15)] backdrop-blur-xl text-xs">
        {/* Development badge */}
        <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-1.5 py-1 text-[9px] uppercase font-bold tracking-[0.2em] text-[var(--color-accent)] border-r border-[var(--color-border)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
          <span>DEV THEME</span>
        </div>

        {/* Day Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setTheme('day')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
            theme === 'day'
              ? 'bg-[var(--color-accent)] text-white shadow-[0_2px_12px_rgba(0,184,217,0.35)] font-bold'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary)]/50'
          }`}
          aria-pressed={theme === 'day'}
          title="Switch to Day Mode (The Living Ocean)"
        >
          <span className="text-sm">☀</span>
          <span className="tracking-wider">DAY</span>
        </button>

        {/* Night Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setTheme('night')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 ${
            theme === 'night'
              ? 'bg-[var(--color-accent)] text-white shadow-[0_2px_12px_rgba(0,184,217,0.35)] font-bold'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-primary)]/50'
          }`}
          aria-pressed={theme === 'night'}
          title="Switch to Night Mode (The Mysterious Deep)"
        >
          <span className="text-sm">☾</span>
          <span className="tracking-wider">NIGHT</span>
        </button>
      </div>
    </aside>
  );
}

