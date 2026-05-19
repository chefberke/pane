import { useCallback, useEffect, useRef } from 'react';
import type { Frame } from '@/app/features/types';
import { FRAME_MIN_H, FRAME_MIN_W } from '../constants';

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

interface UseFrameResizeArgs {
  frame: Frame;
  scale: number;
  onResize: (id: string, next: { x: number; y: number; width: number; height: number }) => void;
  onBeforeMutate: () => void;
}

/** Handles resize gestures from any edge or corner of a frame, clamped to min size. */
export function useFrameResize({ frame, scale, onResize, onBeforeMutate }: UseFrameResizeArgs) {
  const activeDir = useRef<ResizeDir | null>(null);
  const start = useRef({ mx: 0, my: 0, x: 0, y: 0, w: 0, h: 0 });
  const committed = useRef(false);

  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const frameRef = useRef(frame);
  useEffect(() => { frameRef.current = frame; }, [frame]);

  const onHandlePointerDown = useCallback((dir: ResizeDir) => (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    e.preventDefault();
    const f = frameRef.current;
    activeDir.current = dir;
    committed.current = false;
    start.current = { mx: e.clientX, my: e.clientY, x: f.x, y: f.y, w: f.width, h: f.height };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const dir = activeDir.current;
      if (!dir) return;
      if (!committed.current) { onBeforeMutate(); committed.current = true; }
      const s = scaleRef.current;
      const dx = (e.clientX - start.current.mx) / s;
      const dy = (e.clientY - start.current.my) / s;
      const { x, y, w, h } = start.current;

      const movesLeft  = dir === 'w'  || dir === 'nw' || dir === 'sw';
      const movesTop   = dir === 'n'  || dir === 'nw' || dir === 'ne';
      const changesX   = movesLeft;
      const changesY   = movesTop;
      const changesW   = dir.includes('e') || dir.includes('w');
      const changesH   = dir.includes('n') || dir.includes('s');

      let nx = x, ny = y, nw = w, nh = h;
      if (changesW) nw = changesX ? w - dx : w + dx;
      if (changesH) nh = changesY ? h - dy : h + dy;
      if (changesX) nx = x + dx;
      if (changesY) ny = y + dy;

      if (nw < FRAME_MIN_W) {
        if (movesLeft) nx = x + (w - FRAME_MIN_W);
        nw = FRAME_MIN_W;
      }
      if (nh < FRAME_MIN_H) {
        if (movesTop) ny = y + (h - FRAME_MIN_H);
        nh = FRAME_MIN_H;
      }

      onResize(frameRef.current.id, { x: nx, y: ny, width: nw, height: nh });
    };
    const onUp = () => { activeDir.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [onResize, onBeforeMutate]);

  return { onHandlePointerDown };
}
