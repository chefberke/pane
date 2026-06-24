import type { CanvasState } from '../canvas/types';

/** Generates a UUID v4 for use as an InstantDB entity ID. */
export function uid(): string {
  return crypto.randomUUID();
}

/** Serialises canvas state to a JSON string for InstantDB storage. */
export function serializeState(state: CanvasState): string {
  return JSON.stringify(state);
}

/** Parses a stored JSON string back into canvas state. Returns null on failure. Defaults frames to [] for legacy payloads. */
export function deserializeState(raw: string): CanvasState | null {
  try {
    const parsed = JSON.parse(raw) as Partial<CanvasState>;
    if (!parsed || !Array.isArray(parsed.blocks)) return null;
    return {
      blocks: parsed.blocks,
      frames: Array.isArray(parsed.frames) ? parsed.frames : [],
      connectors: Array.isArray(parsed.connectors) ? parsed.connectors : [],
      offset: parsed.offset ?? { x: 0, y: 0 },
      scale: typeof parsed.scale === 'number' ? parsed.scale : 1,
    };
  } catch {
    return null;
  }
}
