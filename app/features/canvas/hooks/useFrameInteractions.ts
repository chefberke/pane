'use client';
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { flushSync } from 'react-dom';
import type { Block, Frame, FrameColor } from '@/app/features/types';
import {
  blockRect,
  frameDescendantBlocks,
  frameDescendantFrames,
  frameMembers,
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
}

/** Frame interaction handlers: drag (imperative transform + flushSync commit), resize, and metadata edits. */
export function useFrameInteractions({
  blocksRef, framesRef, blockRectByIdRef, setBlocks, setFrames, setLiveDrag,
  updateFrame, renameFrame, setFrameColor, toggleCollapse, deleteFrame,
  pushSnapshot, selectedFrameId, setSelectedFrameId, setCommentTarget,
}: Params) {
  const handleFrameDragMove = useCallback((id: string, dx: number, dy: number) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;
    const descBlocks = frameDescendantBlocks(frame, blocksRef.current, framesRef.current);
    const descFrames = frameDescendantFrames(frame, framesRef.current, blocksRef.current);
    const fEl = document.querySelector(`[data-frame-id="${id}"]`) as HTMLElement | null;
    if (fEl) fEl.style.transform = `translate(${dx}px, ${dy}px)`;
    descFrames.forEach(fid => {
      const el = document.querySelector(`[data-frame-id="${fid}"]`) as HTMLElement | null;
      if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    descBlocks.forEach(bid => {
      const el = document.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null;
      if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    // So connectors attached to a block being dragged along with its frame follow live too, not just direct block drags.
    setLiveDrag(descBlocks.size > 0 ? { ids: descBlocks, dx, dy } : null);
  }, [blocksRef, framesRef, setLiveDrag]);

  const handleFrameDragEnd = useCallback((id: string, dx: number, dy: number) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;
    const descBlocks = frameDescendantBlocks(frame, blocksRef.current, framesRef.current);
    const descFrames = frameDescendantFrames(frame, framesRef.current, blocksRef.current);

    const collectEls = (): HTMLElement[] => {
      const els: HTMLElement[] = [];
      const fEl = document.querySelector(`[data-frame-id="${id}"]`) as HTMLElement | null;
      if (fEl) els.push(fEl);
      descFrames.forEach(fid => { const el = document.querySelector(`[data-frame-id="${fid}"]`) as HTMLElement | null; if (el) els.push(el); });
      descBlocks.forEach(bid => { const el = document.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null; if (el) els.push(el); });
      return els;
    };

    if (dx === 0 && dy === 0) {
      collectEls().forEach(el => { el.style.transform = ''; });
      setLiveDrag(null);
      return;
    }

    const els = collectEls();
    // Suppress CSS left/top transitions so they don't fight the transform during commit.
    els.forEach(el => { el.style.transition = 'none'; });
    // Synchronously commit new positions (and clear the live-drag preview) in the same flush,
    // so the DOM is updated before we clear transforms and connectors never see a stale frame.
    flushSync(() => {
      setBlocks(prev => prev.map(b => descBlocks.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } as Block : b));
      setFrames(prev => prev.map(f =>
        f.id === id ? { ...f, x: f.x + dx, y: f.y + dy } :
        descFrames.has(f.id) ? { ...f, x: f.x + dx, y: f.y + dy } : f
      ));
      setLiveDrag(null);
    });
    // Clear transforms — left/top is already at final position, so no snap.
    els.forEach(el => { el.style.transform = ''; });
    // Re-enable transitions after the browser has painted the committed frame.
    requestAnimationFrame(() => { els.forEach(el => { el.style.transition = ''; }); });
  }, [blocksRef, framesRef, setBlocks, setFrames, setLiveDrag]);

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
