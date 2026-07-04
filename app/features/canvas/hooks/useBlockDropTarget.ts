'use client';
import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { Block, Frame } from '@/app/features/types';
import {
  blockRect,
  buildBlockFrameMap,
  computeFramePreviewRect,
  pickDropTargetFrame,
} from '../../frames/utils';
import { FRAME_MIN_H, FRAME_MIN_W } from '../../frames/constants';
import type { Rect } from '../../frames/types';

interface Params {
  blocksRef: React.RefObject<Block[]>;
  framesRef: React.RefObject<Frame[]>;
  selectedIdsRef: React.RefObject<Set<string>>;
  setBlocks: Dispatch<SetStateAction<Block[]>>;
  setFrames: Dispatch<SetStateAction<Frame[]>>;
  /** Live id → true rendered rect map, so frame re-fits use measured (not static) member sizes. */
  blockRectByIdRef: React.RefObject<Map<string, Rect>>;
}

interface DragHover {
  hoverFrameId: string | null;
  previewByFrame: Map<string, Rect>;
}

/** Tracks the live block-drag drop-target, drives frame preview rects, and commits frame bounds on drop. */
export function useBlockDropTarget({ blocksRef, framesRef, selectedIdsRef, setBlocks, setFrames, blockRectByIdRef }: Params) {
  const dragCtxRef = useRef<{
    draggedIds: Set<string>;
    originals: Map<string, Rect>;
    lastDelta: { dx: number; dy: number } | null;
    hoverFrameId: string | null;
  } | null>(null);
  const [dragHover, setDragHover] = useState<DragHover | null>(null);

  /** Updates live drop-target preview during a block drag; on null delta commits frame bounds. */
  const handleBlockDragRect = useCallback((blockId: string, delta: { dx: number; dy: number } | null) => {
    if (delta === null) {
      const ctx = dragCtxRef.current;
      dragCtxRef.current = null;
      setDragHover(null);
      if (!ctx || !ctx.lastDelta) return;
      const { dx, dy } = ctx.lastDelta;
      if (dx === 0 && dy === 0) return;

      // Commit stored membership from the SAME resolution that drove the glow (ctx.hoverFrameId):
      // a frame id (nest) or null (top-level / un-nest even while still overlapping). Runs after the
      // position commit (useBlockDrag.onUp → onUpdate / onMultiDragEnd), which is also a functional
      // setBlocks update keyed by id, so this .map sees final positions and only patches parentFrameId.
      // The early returns above (no move / net-zero) leave the block's prior parent intact — the
      // block path's equivalent of the frame path's `undefined` "keep current parent" case.
      setBlocks(prev => prev.map(b =>
        ctx.draggedIds.has(b.id) ? ({ ...b, parentFrameId: ctx.hoverFrameId } as Block) : b));

      const projectedRects = new Map<string, Rect>();
      ctx.draggedIds.forEach(id => {
        const orig = ctx.originals.get(id);
        if (orig) projectedRects.set(id, { x: orig.x + dx, y: orig.y + dy, width: orig.width, height: orig.height });
      });

      const currentFrames = framesRef.current;
      const currentBlocks = blocksRef.current;
      const blockFrameMap = buildBlockFrameMap(currentBlocks, currentFrames);
      const affected = new Set<string>();
      ctx.draggedIds.forEach(id => {
        const oldFid = blockFrameMap.get(id);
        if (oldFid) affected.add(oldFid);
      });
      const hoverFrameId = ctx.hoverFrameId;
      if (hoverFrameId) affected.add(hoverFrameId);

      const newRects = new Map<string, Rect>();
      affected.forEach(fid => {
        const f = currentFrames.find(x => x.id === fid);
        if (!f) return;
        // Dropping into a collapsed frame keeps it collapsed and at its stored size — no auto-expand,
        // no grow (mirrors the hover-preview skip below). The block just joins as a hidden member.
        if (fid === hoverFrameId && f.collapsed) return;
        const isIncoming = fid === hoverFrameId;
        const r = computeFramePreviewRect(f, currentBlocks, currentFrames, ctx.draggedIds, projectedRects, isIncoming, blockRectByIdRef.current);
        newRects.set(fid, {
          x: r.x,
          y: r.y,
          width: Math.max(FRAME_MIN_W, r.width),
          height: Math.max(FRAME_MIN_H, r.height),
        });
      });

      setFrames(prev => prev.map(f => {
        const nr = newRects.get(f.id);
        return nr ? { ...f, x: nr.x, y: nr.y, width: nr.width, height: nr.height } : f;
      }));
      return;
    }

    // Initialize ctx on first non-null delta of this drag.
    if (!dragCtxRef.current) {
      const sel = selectedIdsRef.current;
      const draggedIds = sel.has(blockId) && sel.size > 1 ? new Set(sel) : new Set([blockId]);
      const originals = new Map<string, Rect>();
      blocksRef.current.forEach(b => {
        // Measured rect (true rendered footprint) so a block dragged into a frame reserves its real size.
        if (draggedIds.has(b.id)) originals.set(b.id, blockRectByIdRef.current.get(b.id) ?? blockRect(b));
      });
      dragCtxRef.current = { draggedIds, originals, lastDelta: null, hoverFrameId: null };
    }
    const ctx = dragCtxRef.current;
    ctx.lastDelta = delta;

    const projectedRects = new Map<string, Rect>();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ctx.draggedIds.forEach(id => {
      const orig = ctx.originals.get(id);
      if (!orig) return;
      const r = { x: orig.x + delta.dx, y: orig.y + delta.dy, width: orig.width, height: orig.height };
      projectedRects.set(id, r);
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    });
    if (!Number.isFinite(minX)) return;
    const union: Rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

    const currentFrames = framesRef.current;
    const currentBlocks = blocksRef.current;
    const hoverFrame = pickDropTargetFrame(union, currentFrames);
    const hoverFrameId = hoverFrame?.id ?? null;
    ctx.hoverFrameId = hoverFrameId;

    const blockFrameMap = buildBlockFrameMap(currentBlocks, currentFrames);
    const affected = new Set<string>();
    ctx.draggedIds.forEach(id => {
      const oldFid = blockFrameMap.get(id);
      if (oldFid) affected.add(oldFid);
    });
    if (hoverFrameId) affected.add(hoverFrameId);

    const previewByFrame = new Map<string, Rect>();
    affected.forEach(fid => {
      const f = currentFrames.find(x => x.id === fid);
      if (!f) return;
      // Collapsed hover target: keep its visual size; highlight only.
      if (fid === hoverFrameId && f.collapsed) return;
      const isIncoming = fid === hoverFrameId;
      const r = computeFramePreviewRect(f, currentBlocks, currentFrames, ctx.draggedIds, projectedRects, isIncoming, blockRectByIdRef.current);
      previewByFrame.set(fid, {
        x: r.x,
        y: r.y,
        width: Math.max(FRAME_MIN_W, r.width),
        height: Math.max(FRAME_MIN_H, r.height),
      });
    });

    setDragHover(prev => {
      if (prev && prev.hoverFrameId === hoverFrameId && prev.previewByFrame.size === previewByFrame.size) {
        let same = true;
        previewByFrame.forEach((r, k) => {
          const pr = prev.previewByFrame.get(k);
          if (!pr || pr.x !== r.x || pr.y !== r.y || pr.width !== r.width || pr.height !== r.height) same = false;
        });
        if (same) return prev;
      }
      return { hoverFrameId, previewByFrame };
    });
  }, [blocksRef, framesRef, selectedIdsRef, setBlocks, setFrames, blockRectByIdRef]);

  return { dragHover, handleBlockDragRect };
}
