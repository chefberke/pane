import { useState, useCallback, useEffect } from 'react';

/** Manages dark/light theme state with localStorage persistence and system-preference detection. */
export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('termal-theme');
    const initial = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  /** Toggles between dark and light mode, persisting the preference. */
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('termal-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return { isDark, toggleTheme };
}
