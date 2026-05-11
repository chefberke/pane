import { useState, useRef, useCallback, useEffect, type RefObject, type Dispatch, type SetStateAction } from 'react';
import type { Marquee } from '../types';
import { DRAG_THRESHOLD, MARQUEE_THRESHOLD } from '../constants';

/** Manages canvas pan gesture, marquee selection, space-key temporary pan, and double-click. */
export function useMarquee({
  viewportRef,
  offsetRef,
  setOffset,
  setSelectedIds,
  onDoubleClickCanvas,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  offsetRef: RefObject<{ x: number; y: number }>;
  setOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  onDoubleClickCanvas: (sx: number, sy: number) => void;
}) {
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);

  const isPanning = useRef(false);
  const panOrigin = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const isMarqueeing = useRef(false);
  const marqueeStart = useRef({ x: 0, y: 0 });
  const marqueeRef = useRef<Marquee | null>(null);
  const didDrag = useRef(false);
  const spaceHeld = useRef(false);

  // Space key activates temporary pan mode
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat) return;
      const active = document.activeElement;
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      spaceHeld.current = true;
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      spaceHeld.current = false;
      isPanning.current = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && (spaceHeld.current || isPanMode))) {
      isPanning.current = true;
      panOrigin.current = { mx: e.clientX, my: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
      return;
    }
    if (e.button !== 0) return;

    const rect = viewportRef.current!.getBoundingClientRect();
    isMarqueeing.current = true;
    didDrag.current = false;
    marqueeStart.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (!e.shiftKey) setSelectedIds(new Set());
  }, [isPanMode, offsetRef, viewportRef, setSelectedIds]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      const dx = e.clientX - panOrigin.current.mx;
      const dy = e.clientY - panOrigin.current.my;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) didDrag.current = true;
      setOffset({ x: panOrigin.current.ox + dx, y: panOrigin.current.oy + dy });
      return;
    }
    if (isMarqueeing.current) {
      const rect = viewportRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (Math.abs(mx - marqueeStart.current.x) > MARQUEE_THRESHOLD || Math.abs(my - marqueeStart.current.y) > MARQUEE_THRESHOLD) {
        didDrag.current = true;
        const m: Marquee = {
          x1: Math.min(marqueeStart.current.x, mx),
          y1: Math.min(marqueeStart.current.y, my),
          x2: Math.max(marqueeStart.current.x, mx),
          y2: Math.max(marqueeStart.current.y, my),
        };
        marqueeRef.current = m;
        setMarquee(m);
      }
    }
  }, [setOffset, viewportRef]);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
    if (!isMarqueeing.current) return;

    isMarqueeing.current = false;
    const m = marqueeRef.current;
    if (!m) return;

    const viewport = viewportRef.current;
    if (viewport) {
      const vRect = viewport.getBoundingClientRect();
      const newSelected = new Set<string>();
      document.querySelectorAll('[data-block-id]').forEach(el => {
        const bRect = (el as HTMLElement).getBoundingClientRect();
        const bx1 = bRect.left - vRect.left;
        const by1 = bRect.top - vRect.top;
        const bx2 = bRect.right - vRect.left;
        const by2 = bRect.bottom - vRect.top;
        if (bx1 < m.x2 && bx2 > m.x1 && by1 < m.y2 && by2 > m.y1) {
          newSelected.add((el as HTMLElement).dataset.blockId!);
        }
      });
      if (newSelected.size > 0) setSelectedIds(newSelected);
    }
    marqueeRef.current = null;
    setMarquee(null);
  }, [viewportRef, setSelectedIds]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (didDrag.current) return;
    const rect = viewportRef.current!.getBoundingClientRect();
    onDoubleClickCanvas(e.clientX - rect.left, e.clientY - rect.top);
  }, [viewportRef, onDoubleClickCanvas]);

  return { marquee, isPanMode, setIsPanMode, isPanning, onMouseDown, onMouseMove, onMouseUp, onDoubleClick };
}
