'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type LightingSpectrum = 'sunlit' | 'actinic';

interface ThemeContextType {
  spectrum: LightingSpectrum;
  toggleSpectrum: () => void;
  setSpectrum: (spectrum: LightingSpectrum) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'mc_lighting_spectrum';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [spectrum, setSpectrumState] = useState<LightingSpectrum>('sunlit');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LightingSpectrum | null;
      if (saved === 'actinic' || saved === 'sunlit') {
        setSpectrumState(saved);
        document.documentElement.setAttribute('data-spectrum', saved);
      } else {
        document.documentElement.setAttribute('data-spectrum', 'sunlit');
      }
    } catch {
      // ignore
    }
  }, []);

  const setSpectrum = (mode: LightingSpectrum) => {
    setSpectrumState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
      document.documentElement.setAttribute('data-spectrum', mode);
    } catch {
      // ignore
    }
  };

  const toggleSpectrum = () => {
    const next = spectrum === 'sunlit' ? 'actinic' : 'sunlit';
    setSpectrum(next);
  };

  return (
    <ThemeContext.Provider value={{ spectrum, toggleSpectrum, setSpectrum }}>
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
