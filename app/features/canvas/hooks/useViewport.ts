import { useState, useCallback, useEffect, useRef, type RefObject } from 'react';
import { MIN_SCALE, MAX_SCALE, VIEWPORT_SAVE_DEBOUNCE_MS } from '../constants';
import { useLatestRef } from './useLatestRef';
import { loadViewport, saveViewport } from '../utils/storage';
/** Manages pan offset, zoom scale, wheel zoom, and coordinate conversion for the canvas viewport. When `persistKey` is set, restores/saves this device's pan+zoom to localStorage. */
export function useViewport(viewportRef: RefObject<HTMLDivElement | null>, disabled = false, persistKey?: string) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);

  const offsetRef = useLatestRef(offset);
  const scaleRef = useLatestRef(scale);
  const disabledRef = useLatestRef(disabled);
  /** True once a per-device viewport was restored from localStorage — lets usePersistence skip the server viewport. */
  const viewportRestoredRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore this device's viewport from localStorage on mount, else center. Runs before
  // usePersistence's hydrate (hook order), so viewportRestoredRef is set in time for it to
  // defer to the local viewport. One-time hydration from an external store (localStorage) /
  // DOM measurement is a legitimate effect the set-state-in-effect heuristic can't detect.
  useEffect(() => {
    const restored = persistKey ? loadViewport(persistKey) : null;
    let next: { offset: { x: number; y: number }; scale: number } | null = null;
    if (restored) {
      viewportRestoredRef.current = true;
      next = restored;
    } else {
      const el = viewportRef.current;
      if (el) next = { offset: { x: el.clientWidth / 2, y: el.clientHeight / 2 }, scale: scaleRef.current };
    }
    if (!next) return;
    // Update refs synchronously so the debounced save / flush below can never persist the pre-restore {0,0}.
    offsetRef.current = next.offset;
    scaleRef.current = next.scale;
    setOffset(next.offset);
    setScale(next.scale);
  }, [viewportRef, persistKey, offsetRef, scaleRef]);

  // Debounced save of pan/zoom. Skipped while following a peer so the lerped transient view is never persisted.
  useEffect(() => {
    if (!persistKey || disabled) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      // Read refs at fire time (not this effect's closure) so the initial mount pass can never persist {0,0}.
      saveViewport(persistKey, { offset: offsetRef.current, scale: scaleRef.current });
    }, VIEWPORT_SAVE_DEBOUNCE_MS);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [offset, scale, disabled, persistKey, offsetRef, scaleRef]);

  // Flush the latest viewport on F5 / tab close / unmount so a pan inside the debounce window isn't lost.
  useEffect(() => {
    const flush = () => {
      if (!persistKey || disabledRef.current) return;
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      saveViewport(persistKey, { offset: offsetRef.current, scale: scaleRef.current });
    };
    window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('beforeunload', flush); flush(); };
  }, [persistKey, offsetRef, scaleRef, disabledRef]);

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

  return { offset, scale, offsetRef, scaleRef, setOffset, setScale, screenToCanvas, zoomBy, resetView, viewportRestoredRef };
}
