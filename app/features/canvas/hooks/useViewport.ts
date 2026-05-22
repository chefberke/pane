import { useState, useCallback, useEffect, type RefObject } from 'react';
import { MIN_SCALE, MAX_SCALE } from '../constants';
import { useLatestRef } from './useLatestRef';
/** Manages pan offset, zoom scale, wheel zoom, and coordinate conversion for the canvas viewport. */
export function useViewport(viewportRef: RefObject<HTMLDivElement | null>, disabled = false) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const offsetRef = useLatestRef(offset);
  const scaleRef = useLatestRef(scale);

  // Center on mount
  useEffect(() => {
    const el = viewportRef.current;
    if (el) setOffset({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
  }, [viewportRef]);

  // Wheel zoom anchored to cursor position
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (disabled) return;
      // ctrlKey is set by the browser for pinch-zoom gestures on trackpads
      if (e.ctrlKey) {
        const rect = el.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
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
      } else {
        const nextOffset = {
          x: offsetRef.current.x - e.deltaX,
          y: offsetRef.current.y - e.deltaY,
        };
        offsetRef.current = nextOffset;
        setOffset(nextOffset);
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportRef, scaleRef, offsetRef, disabled]);

  /** Converts screen coordinates to canvas world coordinates. */
  const screenToCanvas = useCallback((sx: number, sy: number) => ({
    x: (sx - offsetRef.current.x) / scaleRef.current,
    y: (sy - offsetRef.current.y) / scaleRef.current,
  }), [offsetRef, scaleRef]);

  /** Scales around the viewport center by `factor`. */
  const zoomBy = useCallback((factor: number) => {
    setScale(s => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s * factor));
      const el = viewportRef.current;
      if (el) {
        const cx = el.clientWidth / 2;
        const cy = el.clientHeight / 2;
        setOffset(o => ({ x: cx - (cx - o.x) * (next / s), y: cy - (cy - o.y) * (next / s) }));
      }
      return next;
    });
  }, [viewportRef]);

  /** Resets scale to 1 and re-centers the viewport. */
  const resetView = useCallback(() => {
    setScale(1);
    const el = viewportRef.current;
    if (el) setOffset({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
  }, [viewportRef]);

  return { offset, scale, offsetRef, scaleRef, setOffset, setScale, screenToCanvas, zoomBy, resetView };
}
