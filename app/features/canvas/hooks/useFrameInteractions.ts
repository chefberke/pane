'use client';
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { flushSync } from 'react-dom';
import type { Block, Frame, FrameColor } from '@/app/features/types';
import {
  blockRect,
  frameDescendantBlocks,
  frameDescendantFrames,
  frameMembers,
  rectContains,
} from '../../frames/utils';
import { FRAME_PADDING } from '../../frames/constants';
import type { CommentTarget, LiveDrag } from '../types';
import type { Rect } from '../../frames/types';

interface Params {
  blocksRef: React.RefObject<Block[]>;
  framesRef: React.RefObject<Frame[]>;
  /** Live id → true rendered rect map, so the resize clamp guards against a member's real (not static) edge. */
  blockRectByIdRef: React.RefObject<Map<string, Rect>>;
  setBlocks: Dispatch<SetStateAction<Block[]>>;
  setFrames: Dispatch<SetStateAction<Frame[]>>;
  /** Drives the connector layer's live-follow preview while a frame (and its member blocks) is being dragged. */
  setLiveDrag: Dispatch<SetStateAction<LiveDrag | null>>;
  updateFrame: (id: string, updates: Partial<Frame>) => void;
  renameFrame: (id: string, title: string) => void;
  setFrameColor: (id: string, color: FrameColor) => void;
  toggleCollapse: (id: string) => void;
  deleteFrame: (id: string) => void;
  pushSnapshot: () => void;
  selectedFrameId: string | null;
  setSelectedFrameId: Dispatch<SetStateAction<string | null>>;
  setCommentTarget: Dispatch<SetStateAction<CommentTarget>>;
  /** Reads the drop target resolved by useFrameDropTarget during the drag (shared with the glow). */
  getFrameDropTargetId: (id: string) => string | null | undefined;
}

/** Frame interaction handlers: drag (imperative transform + flushSync commit), resize, and metadata edits. */
export function useFrameInteractions({
  blocksRef, framesRef, blockRectByIdRef, setBlocks, setFrames, setLiveDrag,
  updateFrame, renameFrame, setFrameColor, toggleCollapse, deleteFrame,
  pushSnapshot, selectedFrameId, setSelectedFrameId, setCommentTarget,
  getFrameDropTargetId,
}: Params) {
  const handleFrameDragMove = useCallback((id: string, dx: number, dy: number) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;
    const descBlocks = frameDescendantBlocks(frame, blocksRef.current, framesRef.current);
    const descFrames = frameDescendantFrames(frame, framesRef.current);
    // Suppress transitions on the moving elements so the imperative transform tracks the pointer
    // 1:1 — the collapsed frame's `transform` transition would otherwise ease each move (slide/lag).
    const fEl = document.querySelector(`[data-frame-id="${id}"]`) as HTMLElement | null;
    if (fEl) { fEl.style.transition = 'none'; fEl.style.transform = `translate(${dx}px, ${dy}px)`; }
    descFrames.forEach(fid => {
      const el = document.querySelector(`[data-frame-id="${fid}"]`) as HTMLElement | null;
      if (el) { el.style.transition = 'none'; el.style.transform = `translate(${dx}px, ${dy}px)`; }
    });
    descBlocks.forEach(bid => {
      const el = document.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null;
      if (el) { el.style.transition = 'none'; el.style.transform = `translate(${dx}px, ${dy}px)`; }
    });
    // So connectors attached to a block being dragged along with its frame follow live too, not just direct block drags.
    setLiveDrag(descBlocks.size > 0 ? { ids: descBlocks, dx, dy } : null);
  }, [blocksRef, framesRef, setLiveDrag]);

  const handleFrameDragEnd = useCallback((id: string, dx: number, dy: number) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;
    const descBlocks = frameDescendantBlocks(frame, blocksRef.current, framesRef.current);
    const descFrames = frameDescendantFrames(frame, framesRef.current);

    const collectEls = (): HTMLElement[] => {
      const els: HTMLElement[] = [];
      const fEl = document.querySelector(`[data-frame-id="${id}"]`) as HTMLElement | null;
      if (fEl) els.push(fEl);
      descFrames.forEach(fid => { const el = document.querySelector(`[data-frame-id="${fid}"]`) as HTMLElement | null; if (el) els.push(el); });
      descBlocks.forEach(bid => { const el = document.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null; if (el) els.push(el); });
      return els;
    };

    if (dx === 0 && dy === 0) {
      // Restore the transition suppressed during the (net-zero) move so the drop-target bounce works again.
      collectEls().forEach(el => { el.style.transform = ''; el.style.transition = ''; });
      setLiveDrag(null);
      return;
    }

    // Intentional nesting, read from the SAME resolution that drove the glow (useFrameDropTarget), so
    // what highlighted at release is exactly what nests — the commit never recomputes it. The frame joins
    // the smallest frame its center lands inside (self + descendants excluded to prevent cycles). No
    // target → top-level (null), which un-nests even if it still geometrically overlaps its old parent
    // (membership is stored now). `undefined` means no detection ran (micro-flick) → keep the current parent.
    const resolved = getFrameDropTargetId(id);
    const newParentId = resolved === undefined ? (frame.parentFrameId ?? null) : resolved;
    const target = newParentId ? framesRef.current.find(f => f.id === newParentId) ?? null : null;

    // Grow the target to wrap the dropped frame (mirrors how blocks grow their frame), so a nested
    // frame stays visually inside its parent even when dropped near an edge. Only grows where the
    // padded child pokes out — if it already fits, the target is left unchanged (idempotent).
    let grownTarget: { id: string; rect: Rect } | null = null;
    if (target) {
      const childRect: Rect = { x: frame.x + dx, y: frame.y + dy, width: frame.width, height: frame.height };
      const targetRect: Rect = { x: target.x, y: target.y, width: target.width, height: target.height };
      if (!rectContains(targetRect, childRect)) {
        const px = childRect.x - FRAME_PADDING, py = childRect.y - FRAME_PADDING;
        const pr = childRect.x + childRect.width + FRAME_PADDING, pb = childRect.y + childRect.height + FRAME_PADDING;
        const minX = Math.min(targetRect.x, px), minY = Math.min(targetRect.y, py);
        const maxX = Math.max(targetRect.x + targetRect.width, pr), maxY = Math.max(targetRect.y + targetRect.height, pb);
        grownTarget = { id: target.id, rect: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } };
      }
    }

    const els = collectEls();
    // Suppress CSS left/top transitions so they don't fight the transform during commit.
    els.forEach(el => { el.style.transition = 'none'; });
    // Synchronously commit new positions (and clear the live-drag preview) in the same flush,
    // so the DOM is updated before we clear transforms and connectors never see a stale frame.
    flushSync(() => {
      setBlocks(prev => prev.map(b => descBlocks.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } as Block : b));
      setFrames(prev => prev.map(f => {
        if (f.id === id) return { ...f, x: f.x + dx, y: f.y + dy, parentFrameId: newParentId };
        if (descFrames.has(f.id)) return { ...f, x: f.x + dx, y: f.y + dy };
        if (grownTarget && f.id === grownTarget.id) return { ...f, ...grownTarget.rect };
        return f;
      }));
      setLiveDrag(null);
    });
    // Clear transforms — left/top is already at final position, so no snap.
    els.forEach(el => { el.style.transform = ''; });
    // Re-enable transitions after the browser has painted the committed frame.
    requestAnimationFrame(() => { els.forEach(el => { el.style.transition = ''; }); });
  }, [blocksRef, framesRef, setBlocks, setFrames, setLiveDrag, getFrameDropTargetId]);

  const handleFrameResize = useCallback((id: string, next: { x: number; y: number; width: number; height: number }) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;

    const { blockIds, childFrameIds } = frameMembers(frame, blocksRef.current, framesRef.current);
    const hasContent = blockIds.size > 0 || childFrameIds.size > 0;

    if (!hasContent) {
      updateFrame(id, next);
      return;
    }

    // Compute tight bounding box of all direct member content.
    let contentLeft = Infinity, contentTop = Infinity;
    let contentRight = -Infinity, contentBottom = -Infinity;
    for (const b of blocksRef.current) {
      if (!blockIds.has(b.id)) continue;
      // Prefer the true rendered rect so the clamp can't shrink past a taller-rendered card's edge.
      const r = blockRectByIdRef.current.get(b.id) ?? blockRect(b);
      contentLeft   = Math.min(contentLeft,   r.x);
      contentTop    = Math.min(contentTop,     r.y);
      contentRight  = Math.max(contentRight,  r.x + r.width);
      contentBottom = Math.max(contentBottom, r.y + r.height);
    }
    for (const f of framesRef.current) {
      if (!childFrameIds.has(f.id)) continue;
      contentLeft   = Math.min(contentLeft,   f.x);
      contentTop    = Math.min(contentTop,     f.y);
      contentRight  = Math.max(contentRight,  f.x + f.width);
      contentBottom = Math.max(contentBottom, f.y + f.height);
    }

    // Clamp resize so the frame can never shrink past content + padding on each side.
    let { x: nx, y: ny, width: nw, height: nh } = next;
    const origRight  = nx + nw;
    const origBottom = ny + nh;

    // Left edge can't encroach past content left edge.
    if (nx > contentLeft - FRAME_PADDING) { nx = contentLeft - FRAME_PADDING; nw = origRight - nx; }
    // Top edge can't encroach past content top edge.
    if (ny > contentTop  - FRAME_PADDING) { ny = contentTop  - FRAME_PADDING; nh = origBottom - ny; }
    // Right edge must stay at least past content right edge.
    if (nx + nw < contentRight  + FRAME_PADDING) nw = contentRight  + FRAME_PADDING - nx;
    // Bottom edge must stay at least past content bottom edge.
    if (ny + nh < contentBottom + FRAME_PADDING) nh = contentBottom + FRAME_PADDING - ny;

    updateFrame(id, { x: nx, y: ny, width: nw, height: nh });
  }, [blocksRef, framesRef, blockRectByIdRef, updateFrame]);

  const handleFrameRename = useCallback((id: string, title: string) => {
    pushSnapshot();
    renameFrame(id, title);
  }, [renameFrame, pushSnapshot]);

  const handleFrameColor = useCallback((id: string, color: FrameColor) => {
    pushSnapshot();
    setFrameColor(id, color);
  }, [setFrameColor, pushSnapshot]);

  const handleFrameToggleCollapse = useCallback((id: string) => {
    pushSnapshot();
    toggleCollapse(id);
  }, [toggleCollapse, pushSnapshot]);

  const handleFrameDelete = useCallback((id: string) => {
    pushSnapshot();
    deleteFrame(id);
    if (selectedFrameId === id) setSelectedFrameId(null);
    setCommentTarget(prev => (prev?.kind === 'frame' && prev.id === id) ? null : prev);
  }, [deleteFrame, pushSnapshot, selectedFrameId, setSelectedFrameId, setCommentTarget]);

  return {
    handleFrameDragMove,
    handleFrameDragEnd,
    handleFrameResize,
    handleFrameRename,
    handleFrameColor,
    handleFrameToggleCollapse,
    handleFrameDelete,
  };
}
