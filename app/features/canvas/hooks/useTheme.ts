import { useSyncExternalStore, useCallback, useEffect } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

const THEME_KEY = 'termal-theme';

/** Reads the persisted theme preference, tolerating storage being unavailable (private mode). */
function readTheme(): string | null {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

/** Persists (or clears, when `value` is null) the theme preference; no-ops if storage throws. */
function writeTheme(value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, value);
  } catch {
    /* private mode / quota exceeded — preference simply won't persist */
  }
}

function getThemeSnapshot() {
  const saved = readTheme();
  return saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getThemeServerSnapshot() {
  return false;
}

function getThemeChoiceSnapshot(): ThemeChoice {
  const saved = readTheme();
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
    writeTheme(next ? 'dark' : 'light');
    window.dispatchEvent(new Event('termal-theme-change'));
  }, []);

  /** Sets theme explicitly to light, dark, or system preference. */
  const setTheme = useCallback((choice: ThemeChoice) => {
    writeTheme(choice === 'system' ? null : choice);
    window.dispatchEvent(new Event('termal-theme-change'));
  }, []);

  return { themeChoice, toggleTheme, setTheme };
}
