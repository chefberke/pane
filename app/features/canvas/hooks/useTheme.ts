import { useSyncExternalStore, useCallback, useEffect } from 'react';

function getThemeSnapshot() {
  const saved = localStorage.getItem('termal-theme');
  return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getThemeServerSnapshot() {
  return false;
}

function subscribeTheme(callback: () => void) {
  window.addEventListener('termal-theme-change', callback);
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', callback);
  return () => {
    window.removeEventListener('termal-theme-change', callback);
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', callback);
  };
}

/** Manages dark/light theme state with localStorage persistence and system-preference detection. */
export function useTheme() {
  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  /** Toggles between dark and light mode, persisting the preference. */
  const toggleTheme = useCallback(() => {
    const next = !getThemeSnapshot();
    localStorage.setItem('termal-theme', next ? 'dark' : 'light');
    window.dispatchEvent(new Event('termal-theme-change'));
  }, []);

  return { isDark, toggleTheme };
}
