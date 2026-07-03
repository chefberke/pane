import { RefObject, useCallback, useEffect, useRef } from 'react';
import type { Block } from '@/app/features/types';
import { BLOCK_MIN_H, BLOCK_MIN_W, NOTE_DEFAULT_H, NOTE_DEFAULT_W } from '../constants';

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

interface UseBlockResizeArgs {
  block: Block;
  scaleRef: { current: number };
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onBeforeMutate: () => void;
  /** The block's outer container — its `left`/`top` are moved imperatively during n/w edge resizes. */
  containerRef: RefObject<HTMLElement | null>;
  /** The rendered card box — measured at gesture start and sized imperatively during the drag. */
  boxRef: RefObject<HTMLElement | null>;
  /** The content element — its `offsetHeight` is the height floor (box can't shrink below the text). */
  contentRef: RefObject<HTMLElement | null>;
}

/** Edge/corner resize gestures for a note block; width is free, height floors at content ("content is the floor"). */
export function useBlockResize({ block, scaleRef, onUpdate, onBeforeMutate, containerRef, boxRef, contentRef }: UseBlockResizeArgs) {
  const activeDir = useRef<ResizeDir | null>(null);
  const start = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });
  const committed = useRef(false);
  const pendingUpdates = useRef<Partial<Block> | null>(null);

  const blockRef = useRef(block);
  useEffect(() => { blockRef.current = block; }, [block]);

  const onHandlePointerDown = useCallback((dir: ResizeDir) => (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    e.preventDefault();
    const b = blockRef.current;
    const el = boxRef.current;
    activeDir.current = dir;
    committed.current = false;
    start.current = {
      mx: e.clientX,
      my: e.clientY,
      x: b.x,
      y: b.y,
      w: el?.offsetWidth ?? b.width ?? NOTE_DEFAULT_W,
      h: el?.offsetHeight ?? b.height ?? NOTE_DEFAULT_H,
    };
  }, [boxRef]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const dir = activeDir.current;
      if (!dir) return;
      if (!committed.current) { onBeforeMutate(); committed.current = true; }
      const s = scaleRef.current;
      const dx = (e.clientX - start.current.mx) / s;
      const dy = (e.clientY - start.current.my) / s;
      const { x, y, w, h } = start.current;

      const movesLeft = dir === 'w' || dir === 'nw' || dir === 'sw';
      const movesTop  = dir === 'n' || dir === 'nw' || dir === 'ne';
      const changesX  = movesLeft;
      const changesY  = movesTop;
      const changesW  = dir.includes('e') || dir.includes('w');
      const changesH  = dir.includes('n') || dir.includes('s');

      // Height floor = content height (never crush the text), but at least BLOCK_MIN_H.
      const contentH = contentRef.current?.offsetHeight ?? 0;
      const minH = Math.max(BLOCK_MIN_H, contentH);

      let nx = x, ny = y, nw = w, nh = h;
      if (changesW) nw = changesX ? w - dx : w + dx;
      if (changesH) nh = changesY ? h - dy : h + dy;
      if (changesX) nx = x + dx;
      if (changesY) ny = y + dy;

      if (nw < BLOCK_MIN_W) {
        if (movesLeft) nx = x + (w - BLOCK_MIN_W);
        nw = BLOCK_MIN_W;
      }
      if (nh < minH) {
        if (movesTop) ny = y + (h - minH);
        nh = minH;
      }

      // Only write the dimensions this handle actually changes — a pure width drag must not
      // freeze the height (it should stay content-driven).
      const updates: Partial<Block> = {};
      if (changesW) updates.width = nw;
      if (changesH) updates.height = nh;
      if (changesX) updates.x = nx;
      if (changesY) updates.y = ny;

      // Apply the resize imperatively during the gesture — no per-move setBlocks, so no O(N) array
      // rebuild + whole-canvas persistence stringify on every pointermove. Commit lands once on up.
      const box = boxRef.current;
      if (box) {
        if (updates.width !== undefined) box.style.width = `${updates.width}px`;
        if (updates.height !== undefined) box.style.minHeight = `${updates.height}px`;
      }
      const cont = containerRef.current;
      if (cont) {
        if (updates.x !== undefined) cont.style.left = `${updates.x}px`;
        if (updates.y !== undefined) cont.style.top = `${updates.y}px`;
      }
      pendingUpdates.current = updates;
    };
    const onUp = () => {
      if (!activeDir.current) return;
      activeDir.current = null;
      const updates = pendingUpdates.current;
      pendingUpdates.current = null;
      if (committed.current && updates) onUpdate(blockRef.current.id, updates);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [onUpdate, onBeforeMutate, scaleRef, containerRef, boxRef, contentRef]);

  return { onHandlePointerDown };
}
