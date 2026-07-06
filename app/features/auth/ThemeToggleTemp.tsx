'use client';
// ponytail: TEMPORARY auth-only theme tester — delete this file + its import/usage in AuthCard when done.
import { useState } from 'react';
import { Sun, Moon } from 'lucide-react';

/** Temporary floating light/dark toggle so the auth screens can be checked in both themes. */
export default function ThemeToggleTemp() {
  const [dark, setDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );

  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    setDark(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="fixed top-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border"
      style={{
        background: 'var(--color-surface-control-active)',
        borderColor: 'var(--color-border-subtle)',
        color: 'var(--color-text-primary)',
      }}
    >
      {dark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
    </button>
  );
}
