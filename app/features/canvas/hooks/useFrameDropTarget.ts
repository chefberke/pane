'use client';
import { useCallback, useRef, useState } from 'react';
import type { Frame } from '@/app/features/types';
import { frameDropTarget } from '../../frames/utils';
import type { Rect } from '../../frames/types';

interface Params {
  framesRef: React.RefObject<Frame[]>;
}

interface DragHover {
  hoverFrameId: string | null;
  previewByFrame: Map<string, Rect>;
}

/**
 * Single source of truth for the frame-into-frame drop target. While a frame is dragged it resolves the
 * target once per coalesced move and feeds it to BOTH the glow (`frameDragHover` state) and the commit
 * (via `getFrameDropTargetId`), so what glows at release is exactly what gets nested. Unlike the block
 * path it never grows a preview rect (the target keeps its size until drop), so `previewByFrame` stays
 * empty and only the highlight is driven.
 */
export function useFrameDropTarget({ framesRef }: Params) {
  const [frameDragHover, setFrameDragHover] = useState<DragHover | null>(null);
  // Last resolved target, read by the commit path so it never recomputes and can't disagree with the glow.
  const ctxRef = useRef<{ frameId: string; hoverFrameId: string | null } | null>(null);

  /** Resolves the drop-target highlight during a frame drag; clears it (and the ctx) on a null delta (drop). */
  const handleFrameDragRect = useCallback((frameId: string, delta: { dx: number; dy: number } | null) => {
    if (delta === null) { ctxRef.current = null; setFrameDragHover(null); return; }
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) { ctxRef.current = null; setFrameDragHover(null); return; }
    const target = frameDropTarget(frame, delta.dx, delta.dy, framesRef.current);
    const hoverFrameId = target?.id ?? null;
    ctxRef.current = { frameId, hoverFrameId };
    // Empty preview map → the target glows at its own current size (Frame.tsx falls back to frame rect).
    // Only re-render when the target actually changes, not on every coalesced move.
    setFrameDragHover(prev => (prev && prev.hoverFrameId === hoverFrameId) ? prev : { hoverFrameId, previewByFrame: new Map() });
  }, [framesRef]);

  /**
   * The parent the frame should get on drop: a frame id (nest), `null` (top-level), or `undefined` when
   * no detection ran for this frame — e.g. a micro-flick that crossed the drag threshold and released
   * within one animation frame, so no coalesced move fired. The caller keeps the current parent then.
   */
  const getFrameDropTargetId = useCallback((frameId: string): string | null | undefined => {
    const ctx = ctxRef.current;
    if (!ctx || ctx.frameId !== frameId) return undefined;
    return ctx.hoverFrameId;
  }, []);

  return { frameDragHover, handleFrameDragRect, getFrameDropTargetId };
}
