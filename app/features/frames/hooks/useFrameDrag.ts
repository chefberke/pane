import { useCallback, useEffect, useRef } from 'react';
import { DRAG_THRESHOLD } from '@/app/features/canvas/constants';

interface UseFrameDragArgs {
  frameId: string;
  scale: number;
  onSelect: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onEnd: (id: string, dx: number, dy: number) => void;
  onBeforeMutate: () => void;
}

/** Handles drag gesture for a frame's title bar — moves frame + all descendants together. */
export function useFrameDrag({ frameId, scale, onSelect, onMove, onEnd, onBeforeMutate }: UseFrameDragArgs) {
  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const start = useRef({ mx: 0, my: 0 });
  const delta = useRef({ dx: 0, dy: 0 });

  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  const onTitleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    onSelect(frameId);

    dragging.current = true;
    hasDragged.current = false;
    delta.current = { dx: 0, dy: 0 };
    start.current = { mx: e.clientX, my: e.clientY };
  }, [frameId, onSelect]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const s = scaleRef.current;
      const dx = (e.clientX - start.current.mx) / s;
      const dy = (e.clientY - start.current.my) / s;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) hasDragged.current = true;
      delta.current = { dx, dy };
      onMove(frameId, dx, dy);
    };
    const onPointerUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      const { dx, dy } = delta.current;
      if (hasDragged.current && (dx !== 0 || dy !== 0)) {
        onBeforeMutate();
        onEnd(frameId, dx, dy);
      } else {
        onEnd(frameId, 0, 0);
      }
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [frameId, onMove, onEnd, onBeforeMutate]);

  return { onTitleDragPointerDown };
}
