'use client';
import { useEffect, useMemo, useState, type RefObject } from 'react';
import type { Block } from '@/app/features/types';
import type { Rect } from '../../frames/types';
import { CULL_OVERSCAN } from '../constants';

/**
 * Viewport culling: returns only the blocks whose world-rect falls within the visible viewport expanded by
 * `CULL_OVERSCAN`, so far-off-screen cards aren't mounted/reconciled on large boards. The cull rectangle is
 * quantized to an overscan-sized grid, so small pans return the SAME array reference (identity-stable) and
 * the mounted set only changes when the viewport crosses a grid cell — no per-frame mount/unmount churn.
 * Before the viewport is measured (or when a block has no rect yet) it errs toward mounting, so nothing is
 * ever wrongly hidden. Marquee stays correct because the mounted set is always a superset of on-screen blocks.
 */
export function useVisibleBlocks(
  blocks: Block[],
  rectById: Map<string, Rect>,
  offset: { x: number; y: number },
  scale: number,
  viewportRef: RefObject<HTMLDivElement | null>,
): Block[] {
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Track the viewport's pixel size (needed to project screen bounds into world space) and follow resizes.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewportRef]);

  const hasSize = size.w > 0 && size.h > 0;

  // World-space cull bounds, snapped OUTWARD to the overscan grid (screen→world: world = (screen - offset) / scale).
  const q = CULL_OVERSCAN;
  const minBX = hasSize ? Math.floor((-offset.x / scale - q) / q) : 0;
  const minBY = hasSize ? Math.floor((-offset.y / scale - q) / q) : 0;
  const maxBX = hasSize ? Math.ceil(((size.w - offset.x) / scale + q) / q) : 0;
  const maxBY = hasSize ? Math.ceil(((size.h - offset.y) / scale + q) / q) : 0;
  const cullMinX = minBX * q, cullMinY = minBY * q, cullMaxX = maxBX * q, cullMaxY = maxBY * q;

  return useMemo(() => {
    if (!hasSize) return blocks;
    const out: Block[] = [];
    for (const b of blocks) {
      const r = rectById.get(b.id);
      if (!r) { out.push(b); continue; }   // no measured/known rect yet → keep mounted (safe)
      if (r.x + r.width < cullMinX || r.x > cullMaxX || r.y + r.height < cullMinY || r.y > cullMaxY) continue;
      out.push(b);
    }
    return out;
    // Keyed on the quantized bounds (not raw offset/scale), so panning within a grid cell returns the same array.
  }, [blocks, rectById, cullMinX, cullMinY, cullMaxX, cullMaxY, hasSize]);
}
