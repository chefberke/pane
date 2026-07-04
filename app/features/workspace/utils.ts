import type { Block } from '@/app/features/types';
import type { CanvasState } from '../canvas/types';
import type { ExportedWorkspace, WorkspaceExportEnvelope, ImportPreview } from './types';
import { EXPORT_FORMAT, EXPORT_VERSION } from './constants';
import { backfillFrameParents } from '../frames/utils';

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
      // Backfill stored frame nesting from geometry for legacy payloads; idempotent, so re-hydration
      // (incl. remote sync) never clobbers an intentional un-nest once explicit values are persisted.
      frames: backfillFrameParents(Array.isArray(parsed.frames) ? parsed.frames : []),
      connectors: Array.isArray(parsed.connectors) ? parsed.connectors : [],
      offset: parsed.offset ?? { x: 0, y: 0 },
      scale: typeof parsed.scale === 'number' ? parsed.scale : 1,
    };
  } catch {
    return null;
  }
}

/** An empty canvas state, used as a fallback for workspaces that have never been saved. */
export function emptyCanvasState(): CanvasState {
  return { blocks: [], frames: [], connectors: [], offset: { x: 0, y: 0 }, scale: 1 };
}

/** Strips transient runtime-only flags (e.g. a block's `loading`) so exported blocks don't re-fetch forever after import. */
export function sanitizeState(state: CanvasState): CanvasState {
  return {
    ...state,
    blocks: state.blocks.map((b) => {
      if (!(b as { loading?: boolean }).loading) return b;
      const copy: Block = { ...b };
      delete (copy as { loading?: boolean }).loading;
      return copy;
    }),
  };
}

/** Wraps one or more workspaces in the versioned export envelope. `exportedAt` is passed in to keep this pure. */
export function buildExportEnvelope(workspaces: ExportedWorkspace[], exportedAt: number): WorkspaceExportEnvelope {
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt, workspaces };
}

/** Builds a filesystem-safe `.pane.json` filename from a workspace name (or a default for bulk exports). */
export function exportFilename(name: string | null): string {
  const base = (name ?? 'workspaces')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'canvas';
  return `${base}.pane.json`;
}

/**
 * Parses a raw import string into the workspaces to create. Accepts either a full
 * export envelope or a bare CanvasState (someone pasting just a canvas). Each state
 * is validated via deserializeState; invalid entries are skipped and reported in `errors`.
 */
export function parseImport(raw: string): ImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { workspaces: [], errors: ['File is not valid JSON.'] };
  }

  const candidates: { name: string; state: unknown }[] = [];
  const envelope = parsed as Partial<WorkspaceExportEnvelope> | null;
  if (envelope && Array.isArray(envelope.workspaces)) {
    for (const w of envelope.workspaces) {
      const item = w as Partial<ExportedWorkspace>;
      candidates.push({ name: typeof item?.name === 'string' ? item.name : 'Imported canvas', state: item?.state });
    }
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { blocks?: unknown }).blocks)) {
    candidates.push({ name: 'Imported canvas', state: parsed });
  } else {
    return { workspaces: [], errors: ['Unrecognized file — expected a pane workspace export.'] };
  }

  const workspaces: ExportedWorkspace[] = [];
  const errors: string[] = [];
  candidates.forEach((c, i) => {
    const state = c.state && typeof c.state === 'object' ? deserializeState(JSON.stringify(c.state)) : null;
    if (!state) {
      errors.push(`"${c.name}" (canvas ${i + 1}) has invalid content and was skipped.`);
      return;
    }
    workspaces.push({ name: c.name, state: sanitizeState(state) });
  });

  return { workspaces, errors };
}
