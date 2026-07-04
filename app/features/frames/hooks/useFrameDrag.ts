import { useCallback, useEffect, useRef } from 'react';
import { DRAG_THRESHOLD } from '@/app/features/canvas/constants';

interface UseFrameDragArgs {
  frameId: string;
  scaleRef: { current: number };
  canEdit: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, dx: number, dy: number) => void;
  onEnd: (id: string, dx: number, dy: number) => void;
  onBeforeMutate: () => void;
  onDragRect: (frameId: string, delta: { dx: number; dy: number } | null) => void;
}

/** Handles drag gesture for a frame's title bar — moves frame + all descendants together, and pulses the drop-target highlight. */
export function useFrameDrag({ frameId, scaleRef, canEdit, onSelect, onMove, onEnd, onBeforeMutate, onDragRect }: UseFrameDragArgs) {
  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const start = useRef({ mx: 0, my: 0 });
  const delta = useRef({ dx: 0, dy: 0 });

  // Coalesce the drop-target highlight signal to one call per animation frame (the frame itself moves
  // via the imperative transform in onMove; this only paces the React drop-target state).
  const dragRectRaf = useRef<number | null>(null);
  const pendingRect = useRef<{ dx: number; dy: number } | null>(null);

  const onTitleDragPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    onSelect(frameId);
    if (!canEdit) return;   // viewers: select only, never start a drag

    dragging.current = true;
    hasDragged.current = false;
    delta.current = { dx: 0, dy: 0 };
    start.current = { mx: e.clientX, my: e.clientY };
  }, [frameId, onSelect, canEdit]);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const s = scaleRef.current;
      const dx = (e.clientX - start.current.mx) / s;
      const dy = (e.clientY - start.current.my) / s;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) hasDragged.current = true;
      delta.current = { dx, dy };
      onMove(frameId, dx, dy);
      if (hasDragged.current) {
        pendingRect.current = { dx, dy };
        if (dragRectRaf.current === null) {
          dragRectRaf.current = requestAnimationFrame(() => {
            dragRectRaf.current = null;
            if (pendingRect.current) onDragRect(frameId, pendingRect.current);
          });
        }
      }
    };
    const onPointerUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      // Drop any coalesced frame so the terminal onDragRect(null) below isn't overtaken by a stale delta.
      if (dragRectRaf.current !== null) { cancelAnimationFrame(dragRectRaf.current); dragRectRaf.current = null; }
      pendingRect.current = null;
      const { dx, dy } = delta.current;
      if (hasDragged.current && (dx !== 0 || dy !== 0)) {
        onBeforeMutate();
        onEnd(frameId, dx, dy);
      } else {
        onEnd(frameId, 0, 0);
      }
      onDragRect(frameId, null);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (dragRectRaf.current !== null) { cancelAnimationFrame(dragRectRaf.current); dragRectRaf.current = null; }
    };
  }, [frameId, scaleRef, onMove, onEnd, onBeforeMutate, onDragRect]);

  return { onTitleDragPointerDown };
}
