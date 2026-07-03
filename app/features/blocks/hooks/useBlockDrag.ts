import { useRef, useCallback, useEffect } from 'react';
import type { Block } from '@/app/features/types';
import { DRAG_THRESHOLD } from '../../canvas/constants';

interface UseBlockDragArgs {
  block: Block;
  scaleRef: { current: number };
  isInMultiSelection: boolean;
  canEdit: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onClickEnd: (id: string, wasDragged: boolean) => void;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onMultiDragMove: (dx: number, dy: number) => void;
  onMultiDragEnd: (dx: number, dy: number) => void;
  onBeforeDragCommit: () => void;
  onDragRect: (blockId: string, delta: { dx: number; dy: number } | null) => void;
}

/** Handles the drag gesture for a single block, supporting both solo and group drag via Pointer Events. */
export function useBlockDrag({
  block, scaleRef, isInMultiSelection, canEdit,
  onSelect, onClickEnd, onUpdate, onMultiDragMove, onMultiDragEnd, onBeforeDragCommit, onDragRect,
}: UseBlockDragArgs) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const isMultiDrag = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const dragDelta = useRef({ dx: 0, dy: 0 });
  const capturedPointerId = useRef<number | null>(null);

  // Coalesce the drop-target / live-connector signal to one call per animation frame.
  const dragRectRaf = useRef<number | null>(null);
  const pendingRect = useRef<{ dx: number; dy: number } | null>(null);

  const isInMultiRef = useRef(isInMultiSelection);
  useEffect(() => { isInMultiRef.current = isInMultiSelection; }, [isInMultiSelection]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();

    onSelect(block.id, e.shiftKey);
    if (e.shiftKey || !canEdit) return;   // viewers: select only, never start a drag

    dragging.current = true;
    hasDragged.current = false;
    isMultiDrag.current = isInMultiRef.current;
    dragDelta.current = { dx: 0, dy: 0 };
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: block.x, by: block.y };
    capturedPointerId.current = e.pointerId;

    if (containerRef.current) {
      containerRef.current.style.cursor = 'grabbing';
      // Promote to its own compositor layer only for the duration of the drag — a permanent
      // willChange on every block would create N GPU layers and thrash memory on a big canvas.
      containerRef.current.style.willChange = 'transform';
    }
    if (overlayRef.current) overlayRef.current.style.display = 'block';
  }, [block.id, block.x, block.y, onSelect, canEdit]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const s = scaleRef.current;
      const dx = (e.clientX - dragStart.current.mx) / s;
      const dy = (e.clientY - dragStart.current.my) / s;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        if (!hasDragged.current && capturedPointerId.current !== null && containerRef.current) {
          containerRef.current.setPointerCapture(capturedPointerId.current);
        }
        hasDragged.current = true;
      }
      dragDelta.current = { dx, dy };

      if (isMultiDrag.current) {
        onMultiDragMove(dx, dy);
      } else {
        const el = containerRef.current;
        if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
      }
      // The block's own movement was applied synchronously above (el.style.transform); this only paces
      // the React-state side effects (drop-target preview + live connector routing) to once per frame.
      if (hasDragged.current) {
        pendingRect.current = { dx, dy };
        if (dragRectRaf.current === null) {
          dragRectRaf.current = requestAnimationFrame(() => {
            dragRectRaf.current = null;
            if (pendingRect.current) onDragRect(block.id, pendingRect.current);
          });
        }
      }
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      capturedPointerId.current = null;
      // Drop any coalesced frame so the terminal onDragRect(null) below isn't overtaken by a stale delta.
      if (dragRectRaf.current !== null) { cancelAnimationFrame(dragRectRaf.current); dragRectRaf.current = null; }
      pendingRect.current = null;

      if (overlayRef.current) overlayRef.current.style.display = 'none';
      const el = containerRef.current;
      if (el) { el.style.cursor = 'grab'; el.style.willChange = ''; }

      const wasDragged = hasDragged.current;
      onClickEnd(block.id, wasDragged);

      if (!wasDragged) {
        if (el) el.style.transform = '';
        onDragRect(block.id, null);
        return;
      }

      onBeforeDragCommit();

      if (isMultiDrag.current) {
        onMultiDragEnd(dragDelta.current.dx, dragDelta.current.dy);
      } else {
        if (el) el.style.transform = '';
        onUpdate(block.id, {
          x: dragStart.current.bx + dragDelta.current.dx,
          y: dragStart.current.by + dragDelta.current.dy,
        } as Partial<Block>);
      }
      onDragRect(block.id, null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (dragRectRaf.current !== null) { cancelAnimationFrame(dragRectRaf.current); dragRectRaf.current = null; }
    };
  }, [block.id, scaleRef, onUpdate, onClickEnd, onMultiDragMove, onMultiDragEnd, onBeforeDragCommit, onDragRect]);

  return { containerRef, overlayRef, onPointerDown };
}
