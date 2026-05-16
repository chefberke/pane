import type { CanvasState } from '../canvas/types';

/** Generates a UUID v4 for use as an InstantDB entity ID. */
export function uid(): string {
  return crypto.randomUUID();
}

/** Serialises canvas state to a JSON string for InstantDB storage. */
export function serializeState(state: CanvasState): string {
  return JSON.stringify(state);
}

/** Parses a stored JSON string back into canvas state. Returns null on failure. */
export function deserializeState(raw: string): CanvasState | null {
  try { return JSON.parse(raw) as CanvasState; } catch { return null; }
}
