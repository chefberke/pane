import type { Block } from '@/app/features/types';

const KEY = 'pane-canvas-v1';
const LEGACY_KEY = 'termal-blocks';

export interface CanvasState {
  blocks: Block[];
  offset: { x: number; y: number };
  scale: number;
}

/** Loads canvas state from localStorage, migrating legacy key if present. */
export function loadCanvasState(): CanvasState | null {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const blocks: Block[] = JSON.parse(legacy);
      localStorage.removeItem(LEGACY_KEY);
      const state: CanvasState = { blocks, offset: { x: 0, y: 0 }, scale: 1 };
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
