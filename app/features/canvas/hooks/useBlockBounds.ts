'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Block, Frame } from '@/app/features/types';
import type { Rect } from '../../frames/types';
import { blockCollapsedAncestorFrame } from '../../frames/utils';
import { FRAME_COLLAPSED_W, FRAME_COLLAPSED_H } from '../../frames/constants';
import { BLOCK_SIZES } from '../constants';

/** A block's true rendered size, reported by its BlockContainer. */
type Size = { width: number; height: number };

/**
 * Tracks each block's true rendered size (reported by BlockContainer) and builds the id→world-rect map
 * used for connector routing, the toolbar midpoint, and drop hit-testing. Measured size wins over the
 * block's explicit width/height, which in turn wins over the BLOCK_SIZES default — so tall content-driven
 * cards hit-test against their real bounds, not a stale default height. A block hidden inside a collapsed
 * frame is unmounted (no measured size), so it instead reports its enclosing frame's collapsed pill rect —
 * otherwise connectors would keep anchoring to the block's stale pre-collapse position.
 */
export function useBlockBounds(blocks: Block[], frames: Frame[]): {
  rectById: Map<string, Rect>;
  reportSize: (id: string, size: Size | null) => void;
} {
  const [sizes, setSizes] = useState<Map<string, Size>>(() => new Map());

  const reportSize = useCallback((id: string, size: Size | null) => {
    // A null report means the card unmounted. We deliberately RETAIN the last measured size here (sticky):
    // viewport culling unmounts off-screen blocks, and dropping their measured size would revert their rect
    // to the default and make connectors anchored to them jump. Sizes of genuinely deleted blocks are pruned
    // by the effect below instead. (Collapsed-frame blocks are handled by the collapsedFrame branch in rectById.)
    if (size === null) return;
    setSizes(prev => {
      const cur = prev.get(id);
      if (cur && cur.width === size.width && cur.height === size.height) return prev;
      const next = new Map(prev);
      next.set(id, size);
      return next;
    });
  }, []);

  // Garbage-collect measured sizes for blocks that no longer exist so the sticky map can't grow unbounded
  // across a create/delete-heavy session. This synchronizes the size cache with the external block list;
  // it returns the previous map unchanged (no render) unless a block was actually removed — hence the
  // targeted disable of the set-state-in-effect heuristic, which can't see that this is a rare GC pass.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSizes(prev => {
      if (prev.size === 0) return prev;
      const ids = new Set(blocks.map(b => b.id));
      let stale = false;
      for (const id of prev.keys()) if (!ids.has(id)) { stale = true; break; }
      if (!stale) return prev;
      const next = new Map(prev);
      for (const id of next.keys()) if (!ids.has(id)) next.delete(id);
      return next;
    });
  }, [blocks]);

  const rectById = useMemo(() => {
    const m = new Map<string, Rect>();
    for (const b of blocks) {
      const collapsedFrame = frames.length > 0 ? blockCollapsedAncestorFrame(b, frames) : null;
      if (collapsedFrame) {
        m.set(b.id, { x: collapsedFrame.x, y: collapsedFrame.y, width: FRAME_COLLAPSED_W, height: FRAME_COLLAPSED_H });
        continue;
      }
      const measured = sizes.get(b.id);
      m.set(b.id, {
        x: b.x,
        y: b.y,
        width: measured?.width ?? b.width ?? BLOCK_SIZES[b.type].w,
        height: measured?.height ?? b.height ?? BLOCK_SIZES[b.type].h,
      });
    }
    return m;
  }, [blocks, sizes, frames]);

  return { rectById, reportSize };
}
