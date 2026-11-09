import React, { createContext, useContext, useLayoutEffect, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import './appearance.css';
type Preference = 'dark' | 'light' | 'system';
type AppearanceState = {
  resolved: 'dark' | 'light';
  setPreference: (value: Preference) => void;
};
const AppearanceContext = createContext<AppearanceState>({
  resolved: 'dark',
  setPreference: () => {},
});
const storageKey = 'obra360_appearance';
export const useAppearance = () => useContext(AppearanceContext);
export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setValue] = useState<Preference>(() => {
    try {
      const v = localStorage.getItem(storageKey);
      return v === 'light' || v === 'system' ? v : 'dark';
    } catch {
      return 'dark';
    }
  });
  const [systemLight, setSystemLight] = useState(
    () => window.matchMedia('(prefers-color-scheme: light)').matches,
  );
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const change = () => setSystemLight(media.matches);
    media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === storageKey)
        setValue(
          event.newValue === 'light' || event.newValue === 'system' ? event.newValue : 'dark',
        );
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const resolved = preference === 'system' ? (systemLight ? 'light' : 'dark') : preference;
  useLayoutEffect(() => {
    document.documentElement.dataset.obraTheme = resolved;
    document.documentElement.style.colorScheme = resolved;
  }, [resolved]);
  const setPreference = (value: Preference) => {
    setValue(value);
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      /* The preference still applies when browser storage is unavailable. */
    }
  };
  return (
    <AppearanceContext.Provider value={{ resolved, setPreference }}>
      {children}
    </AppearanceContext.Provider>
  );
}
export function AppearanceToggle() {
  const { resolved, setPreference } = useAppearance();
  const isDark = resolved === 'dark';
  const Icon = isDark ? Sun : Moon;
  return (
    <button
      type="button"
      className="ws appearance-toggle"
      aria-label="Tema escuro"
      aria-pressed={isDark}
      title={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onClick={() => setPreference(isDark ? 'light' : 'dark')}
    >
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}
export function PublicAppearance({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="appearance-public">
        <AppearanceToggle />
      </div>
      {children}
    </>
  );
}
