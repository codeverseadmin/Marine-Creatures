'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'day' | 'night';
export type LightingSpectrum = 'sunlit' | 'actinic';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  // Backward compatibility aliases
  spectrum: LightingSpectrum;
  setSpectrum: (spectrum: LightingSpectrum) => void;
  toggleSpectrum: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'mc_theme_mode';
const SPECTRUM_STORAGE_KEY = 'mc_lighting_spectrum';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('night');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (savedTheme === 'day' || savedTheme === 'night') {
        setThemeState(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.setAttribute('data-spectrum', savedTheme === 'day' ? 'sunlit' : 'actinic');
      } else {
        // Read initial state if inline script in head set it
        const currentAttr = document.documentElement.getAttribute('data-theme') as ThemeMode | null;
        if (currentAttr === 'day' || currentAttr === 'night') {
          setThemeState(currentAttr);
        } else {
          document.documentElement.setAttribute('data-theme', 'night');
          document.documentElement.setAttribute('data-spectrum', 'actinic');
        }
      }
    } catch {
      // Ignore localStorage exceptions in private browsing
    }
  }, []);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);
      localStorage.setItem(SPECTRUM_STORAGE_KEY, mode === 'day' ? 'sunlit' : 'actinic');
      document.documentElement.setAttribute('data-theme', mode);
      document.documentElement.setAttribute('data-spectrum', mode === 'day' ? 'sunlit' : 'actinic');
    } catch {
      // Ignore
    }
  };

  const toggleTheme = () => {
    const next = theme === 'day' ? 'night' : 'day';
    setTheme(next);
  };

  // Backward compatibility aliases
  const spectrum: LightingSpectrum = theme === 'day' ? 'sunlit' : 'actinic';
  const setSpectrum = (s: LightingSpectrum) => setTheme(s === 'sunlit' ? 'day' : 'night');
  const toggleSpectrum = () => toggleTheme();

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        spectrum,
        setSpectrum,
        toggleSpectrum,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
