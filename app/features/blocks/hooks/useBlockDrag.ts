import { useRef, useCallback, useEffect } from 'react';
import type { Block } from '@/types';
import { DRAG_THRESHOLD } from '../../canvas/constants';

interface UseBlockDragArgs {
  block: Block;
  scale: number;
  isInMultiSelection: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onClickEnd: (id: string, wasDragged: boolean) => void;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onMultiDragMove: (dx: number, dy: number) => void;
  onMultiDragEnd: (dx: number, dy: number) => void;
  onBeforeDragCommit: () => void;
}

/** Handles the drag gesture for a single block, supporting both solo and group drag via Pointer Events. */
export function useBlockDrag({
  block, scale, isInMultiSelection,
  onSelect, onClickEnd, onUpdate, onMultiDragMove, onMultiDragEnd, onBeforeDragCommit,
}: UseBlockDragArgs) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const isMultiDrag = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const dragDelta = useRef({ dx: 0, dy: 0 });

  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  const isInMultiRef = useRef(isInMultiSelection);
  useEffect(() => { isInMultiRef.current = isInMultiSelection; }, [isInMultiSelection]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();

    onSelect(block.id, e.shiftKey);
    if (e.shiftKey) return;

    dragging.current = true;
    hasDragged.current = false;
    isMultiDrag.current = isInMultiRef.current;
    dragDelta.current = { dx: 0, dy: 0 };
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: block.x, by: block.y };

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    if (overlayRef.current) overlayRef.current.style.display = 'block';
  }, [block.id, block.x, block.y, onSelect]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const s = scaleRef.current;
      const dx = (e.clientX - dragStart.current.mx) / s;
      const dy = (e.clientY - dragStart.current.my) / s;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) hasDragged.current = true;
      dragDelta.current = { dx, dy };

      if (isMultiDrag.current) {
        onMultiDragMove(dx, dy);
      } else {
        const el = containerRef.current;
        if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;

      if (overlayRef.current) overlayRef.current.style.display = 'none';
      const el = containerRef.current;
      if (el) el.style.cursor = 'grab';

      const wasDragged = hasDragged.current;
      onClickEnd(block.id, wasDragged);

      if (!wasDragged) {
        if (el) el.style.transform = '';
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
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [block.id, onUpdate, onClickEnd, onMultiDragMove, onMultiDragEnd, onBeforeDragCommit]);

  return { containerRef, overlayRef, onPointerDown };
}
