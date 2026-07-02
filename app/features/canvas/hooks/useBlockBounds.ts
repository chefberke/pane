'use client';
import { useCallback, useMemo, useState } from 'react';
import type { Block, Frame } from '@/app/features/types';
import type { Rect } from '../../frames/types';
import { blockRect, findCollapsedAncestorFrame } from '../../frames/utils';
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
    setSizes(prev => {
      if (size === null) {
        if (!prev.has(id)) return prev;
        const next = new Map(prev);
        next.delete(id);
        return next;
      }
      const cur = prev.get(id);
      if (cur && cur.width === size.width && cur.height === size.height) return prev;
      const next = new Map(prev);
      next.set(id, size);
      return next;
    });
  }, []);

  const rectById = useMemo(() => {
    const m = new Map<string, Rect>();
    for (const b of blocks) {
      const collapsedFrame = frames.length > 0 ? findCollapsedAncestorFrame(blockRect(b), frames) : null;
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
