import type { CanvasState, Viewport } from '../types';
import { MIN_SCALE, MAX_SCALE } from '../constants';

const KEY = 'pane-canvas-v1';
const LEGACY_KEY = 'termal-blocks';
const VIEWPORT_KEY_PREFIX = 'pane-viewport:';

export type { CanvasState };

/** Loads canvas state from localStorage, migrating legacy key if present. */
export function loadCanvasState(): CanvasState | null {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blocks: any[] = JSON.parse(legacy);
      localStorage.removeItem(LEGACY_KEY);
      const state: CanvasState = { blocks, frames: [], offset: { x: 0, y: 0 }, scale: 1 };
      localStorage.setItem(KEY, JSON.stringify(state));
      return state;
    }
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as CanvasState;
  } catch { /* ignore */ }
  return null;
}

/** Persists canvas state to localStorage. */
export function saveCanvasState(state: CanvasState): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

/** Removes the anonymous canvas state from localStorage. */
export function clearCanvasState(): void {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

/** Loads this device's saved viewport for `key`; validates finite offset/scale (scale clamped to [MIN_SCALE, MAX_SCALE]), returns null if absent or malformed. */
export function loadViewport(key: string): Viewport | null {
  try {
    const raw = localStorage.getItem(VIEWPORT_KEY_PREFIX + key);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Viewport>;
    const x = v?.offset?.x, y = v?.offset?.y, s = v?.scale;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(s)) return null;
    return { offset: { x: x!, y: y! }, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, s!)) };
  } catch { return null; }
}

/** Persists this device's viewport for `key` to localStorage. */
export function saveViewport(key: string, viewport: Viewport): void {
  try { localStorage.setItem(VIEWPORT_KEY_PREFIX + key, JSON.stringify(viewport)); } catch { /* ignore */ }
}
