import { useEffect, useRef, type RefObject, type Dispatch, type SetStateAction } from 'react';
import { MIN_SCALE, MAX_SCALE } from '../constants';

/** Tracks two-finger pinch on touch devices, updating scale and offset around the pinch midpoint. */
export function usePinchZoom({
  viewportRef,
  setOffset,
  setScale,
  offsetRef,
  scaleRef,
}: {
  viewportRef: RefObject<HTMLDivElement | null>;
  setOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setScale: Dispatch<SetStateAction<number>>;
  offsetRef: RefObject<{ x: number; y: number }>;
  scaleRef: RefObject<number>;
}) {
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastDist = useRef<number | null>(null);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.current.has(e.pointerId)) return;
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.current.size !== 2) { lastDist.current = null; return; }

      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };

      if (lastDist.current !== null) {
        const factor = dist / lastDist.current;
        const rect = el.getBoundingClientRect();
        const cx = mid.x - rect.left;
        const cy = mid.y - rect.top;
        const prev = scaleRef.current;
        const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
        const ratio = next / prev;
        const nextOffset = {
          x: cx - (cx - offsetRef.current.x) * ratio,
          y: cy - (cy - offsetRef.current.y) * ratio,
        };
        scaleRef.current = next;
        offsetRef.current = nextOffset;
        setScale(next);
        setOffset(nextOffset);
      }
      lastDist.current = dist;
    };

    const onUp = (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) lastDist.current = null;
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [viewportRef, setOffset, setScale, offsetRef, scaleRef]);
}
