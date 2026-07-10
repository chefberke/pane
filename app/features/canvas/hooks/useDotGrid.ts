import { useSyncExternalStore, useCallback } from 'react';

const DOT_GRID_KEY = 'termal-dot-grid';

/** Reads the persisted dot-grid preference, tolerating storage being unavailable (private mode). */
function readDotGrid(): string | null {
  try {
    return localStorage.getItem(DOT_GRID_KEY);
  } catch {
    return null;
  }
}

/** Persists the dot-grid preference (default off = key absent); no-ops if storage throws. */
function writeDotGrid(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DOT_GRID_KEY, 'on');
    else localStorage.removeItem(DOT_GRID_KEY);
  } catch {
    /* private mode / quota exceeded — preference simply won't persist */
  }
}

function getSnapshot() {
  return readDotGrid() === 'on';
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  window.addEventListener('termal-dot-grid-change', callback);
  return () => window.removeEventListener('termal-dot-grid-change', callback);
}

/** Manages the canvas dot-grid on/off preference with localStorage persistence (dots on by default). */
export function useDotGrid() {
  const showDots = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  /** Shows or hides the dot grid, persisting the preference. */
  const setShowDots = useCallback((value: boolean) => {
    writeDotGrid(value);
    window.dispatchEvent(new Event('termal-dot-grid-change'));
  }, []);

  return { showDots, setShowDots };
}
