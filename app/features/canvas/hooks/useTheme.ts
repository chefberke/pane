import { useSyncExternalStore, useCallback, useEffect } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

function getThemeSnapshot() {
  const saved = localStorage.getItem('termal-theme');
  return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getThemeServerSnapshot() {
  return false;
}

function getThemeChoiceSnapshot(): ThemeChoice {
  const saved = localStorage.getItem('termal-theme');
  if (saved === 'dark') return 'dark';
  if (saved === 'light') return 'light';
  return 'system';
}

function getThemeChoiceServerSnapshot(): ThemeChoice {
  return 'system';
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
  const themeChoice = useSyncExternalStore(subscribeTheme, getThemeChoiceSnapshot, getThemeChoiceServerSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  /** Toggles between dark and light mode, persisting the preference. */
  const toggleTheme = useCallback(() => {
    const next = !getThemeSnapshot();
    localStorage.setItem('termal-theme', next ? 'dark' : 'light');
    window.dispatchEvent(new Event('termal-theme-change'));
  }, []);

  /** Sets theme explicitly to light, dark, or system preference. */
  const setTheme = useCallback((choice: ThemeChoice) => {
    if (choice === 'system') {
      localStorage.removeItem('termal-theme');
    } else {
      localStorage.setItem('termal-theme', choice);
    }
    window.dispatchEvent(new Event('termal-theme-change'));
  }, []);

  return { isDark, themeChoice, toggleTheme, setTheme };
}
