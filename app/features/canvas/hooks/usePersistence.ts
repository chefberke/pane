'use client';
import { useEffect, useRef } from 'react';
import type { Block, Frame, Connector } from '@/app/features/types';
import type { CanvasState } from '../types';
import { SAVE_DEBOUNCE_MS } from '../constants';
import { reconcileById } from '../utils';

interface Params {
  initialState?: CanvasState | null;
  /** Bumps whenever the stored state changes on the server (another device saved). Omit for non-synced canvases. */
  syncedAt?: number;
  onSave?: (state: CanvasState) => void;
  canEdit: boolean;
  blocks: Block[];
  frames: Frame[];
  connectors: Connector[];
  offset: { x: number; y: number };
  scale: number;
  setBlocks: (blocks: Block[]) => void;
  setFrames: (frames: Frame[]) => void;
  setConnectors: (connectors: Connector[]) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
}

/** Serialises the persisted *content* (blocks/frames/connectors) — used to detect real edits, ignoring per-device viewport changes. */
function contentKey(blocks: Block[], frames: Frame[], connectors: Connector[]): string {
  return JSON.stringify({ blocks, frames, connectors });
}

/**
 * Hydrates canvas state from `initialState`, re-hydrates when another device saves
 * (keyed on `syncedAt`) as long as this device has no unsaved edits, and debounces
 * saves — flushing any pending save on unmount / tab close so nothing is lost.
 */
export function usePersistence({
  initialState, syncedAt, onSave, canEdit,
  blocks, frames, connectors, offset, scale,
  setBlocks, setFrames, setConnectors, setScale, setOffset,
}: Params) {
  // Serialised content that matches what's on the server (from a load or our last save).
  // Stays null until the first hydrate settles, which also gates saving so we never
  // overwrite real data with an empty canvas before hydration runs.
  const syncedContentRef = useRef<string | null>(null);
  const hasHydratedRef = useRef(false);

  // Mirror the latest values so the unmount/beforeunload flush can read them without
  // re-subscribing its effect on every render.
  const latest = useRef({ blocks, frames, connectors, offset, scale, onSave, canEdit });
  latest.current = { blocks, frames, connectors, offset, scale, onSave, canEdit };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate on mount and re-hydrate when the server state advances — but never while
  // this device has local edits in flight, so we don't clobber someone actively editing.
  useEffect(() => {
    const firstHydrate = !hasHydratedRef.current;

    if (!initialState) {
      // Brand-new / empty canvas: nothing to load, but mark hydrated so saving is enabled.
      if (firstHydrate) {
        syncedContentRef.current = contentKey([], [], []);
        hasHydratedRef.current = true;
      }
      return;
    }

    const incoming = contentKey(initialState.blocks, initialState.frames ?? [], initialState.connectors ?? []);
    if (!firstHydrate) {
      if (incoming === syncedContentRef.current) return; // echo of our own save — ignore
      const cur = latest.current;
      const localDirty = syncedContentRef.current !== null
        && contentKey(cur.blocks, cur.frames, cur.connectors) !== syncedContentRef.current;
      if (localDirty) return; // active editor here wins; their save will sync out
    }

    // Reconcile by id so unchanged blocks keep their object reference — a remote save then only
    // re-renders the blocks that actually changed, not every block on the canvas.
    const nextBlocks = reconcileById(latest.current.blocks, initialState.blocks);
    const nextFrames = reconcileById(latest.current.frames, initialState.frames ?? []);
    const nextConnectors = reconcileById(latest.current.connectors, initialState.connectors ?? []);
    setBlocks(nextBlocks);
    setFrames(nextFrames);
    setConnectors(nextConnectors);
    // Mirror the just-hydrated content into `latest.current` synchronously. React hasn't committed
    // the setState above yet, so an unmount/beforeunload flush (or a debounced save) firing before
    // the next render would otherwise read the STALE pre-hydrate state (e.g. an empty canvas) while
    // syncedContentRef already points at the new snapshot — and save that emptiness over the real
    // data. This happens in dev StrictMode's mount→unmount→remount, and can race in prod too.
    latest.current = { ...latest.current, blocks: nextBlocks, frames: nextFrames, connectors: nextConnectors };
    if (firstHydrate) {
      // Apply the stored viewport once. Later remote syncs keep the local viewport so a
      // collaborator's pan/zoom doesn't yank this screen around.
      if (initialState.scale !== 1) setScale(initialState.scale);
      if (initialState.offset.x !== 0 || initialState.offset.y !== 0) setOffset(initialState.offset);
    }
    syncedContentRef.current = incoming;
    hasHydratedRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncedAt]);

  // Debounced save — fires only on real content edits (not pure pan/zoom, not hydration).
  useEffect(() => {
    if (!onSave || !canEdit || !hasHydratedRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      // Read the *current* state at fire time (not this effect's stale closure): a save scheduled
      // while the canvas was momentarily empty (e.g. before the real state hydrated in) must not
      // fire an empty-blocks save against an already-advanced snapshot and clobber the real data.
      // Serialising here (once per debounce window, not per keystroke/pan frame) also keeps content
      // diffing off the hot render path.
      const cur = latest.current;
      const key = contentKey(cur.blocks, cur.frames, cur.connectors);
      if (syncedContentRef.current !== null && key === syncedContentRef.current) return;
      cur.onSave?.({ blocks: cur.blocks, frames: cur.frames, connectors: cur.connectors, offset: cur.offset, scale: cur.scale });
      syncedContentRef.current = key;
    }, SAVE_DEBOUNCE_MS);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [blocks, frames, connectors, offset, scale, onSave, canEdit]);

  // Flush a pending save when the canvas unmounts or the tab closes, so a quick
  // navigation right after an edit doesn't drop it (the debounce cleanup above would
  // otherwise just cancel the timer).
  useEffect(() => {
    const flush = () => {
      const cur = latest.current;
      if (!cur.onSave || !cur.canEdit) return;
      const key = contentKey(cur.blocks, cur.frames, cur.connectors);
      if (syncedContentRef.current !== null && key === syncedContentRef.current) return;
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      cur.onSave({ blocks: cur.blocks, frames: cur.frames, connectors: cur.connectors, offset: cur.offset, scale: cur.scale });
      syncedContentRef.current = key;
    };
    window.addEventListener('beforeunload', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
