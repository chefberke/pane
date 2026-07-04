import { useState, useCallback, useEffect, useRef, type RefObject, type Dispatch, type SetStateAction } from 'react';
import { MIN_SCALE, MAX_SCALE, VIEWPORT_SAVE_DEBOUNCE_MS } from '../constants';
import { useLatestRef } from './useLatestRef';
import { loadViewport, saveViewport } from '../utils/storage';
/** Manages pan offset, zoom scale, wheel zoom, and coordinate conversion for the canvas viewport. When `persistKey` is set, restores/saves this device's pan+zoom to localStorage. */
export function useViewport(viewportRef: RefObject<HTMLDivElement | null>, disabled = false, persistKey?: string) {
  const [offset, setOffsetState] = useState({ x: 0, y: 0 });
  const [scale, setScaleState] = useState(1);

  // Refs are the single source of truth for the *live* viewport during a gesture. They are written
  // synchronously by every setter (below) — not via a passive effect — so a wheel/pinch delta accumulated
  // between rAF-coalesced commits can never be clobbered by a late-running effect flushing a stale snapshot.
  const offsetRef = useRef(offset);
  const scaleRef = useRef(scale);
  const disabledRef = useLatestRef(disabled);
  /** True once a per-device viewport was restored from localStorage — lets usePersistence skip the server viewport. */
  const viewportRestoredRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Public setters that keep the refs in lock-step with React state (supports the functional form so
  // callers like zoomBy/useFollowViewport can update relative to the current value without a stale read).
  const setOffset = useCallback<Dispatch<SetStateAction<{ x: number; y: number }>>>((v) => {
    const next = typeof v === 'function' ? v(offsetRef.current) : v;
    offsetRef.current = next;
    setOffsetState(next);
  }, []);
  const setScale = useCallback<Dispatch<SetStateAction<number>>>((v) => {
    const next = typeof v === 'function' ? v(scaleRef.current) : v;
    scaleRef.current = next;
    setScaleState(next);
  }, []);

  // rAF-coalesced commit: gesture handlers mutate offsetRef/scaleRef synchronously (for 1:1 pointer math)
  // and call this; it flushes the latest refs into React state at most once per animation frame, so the
  // world re-renders ≤1×/frame no matter how fast the trackpad/wheel fires.
  const commitRaf = useRef<number | null>(null);
  const scheduleViewportCommit = useCallback(() => {
    if (commitRaf.current !== null) return;
    commitRaf.current = requestAnimationFrame(() => {
      commitRaf.current = null;
      setOffsetState(offsetRef.current);
      setScaleState(scaleRef.current);
    });
  }, []);
  useEffect(() => () => { if (commitRaf.current !== null) cancelAnimationFrame(commitRaf.current); }, []);

  // Restore this device's viewport from localStorage on mount, else center. Runs before
  // usePersistence's hydrate (hook order), so viewportRestoredRef is set in time for it to
  // defer to the local viewport. One-time hydration from an external store (localStorage) /
  // DOM measurement is a legitimate effect the set-state-in-effect heuristic can't detect.
  useEffect(() => {
    const restored = persistKey ? loadViewport(persistKey) : null;
    if (restored) {
      viewportRestoredRef.current = true;
      setScale(restored.scale);
      setOffset(restored.offset);
    } else {
      const el = viewportRef.current;
      if (el) setOffset({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
    }
  }, [viewportRef, persistKey, setOffset, setScale]);

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
  }, [offset, scale, disabled, persistKey]);

  // Flush the latest viewport on F5 / tab close / unmount so a pan inside the debounce window isn't lost.
  useEffect(() => {
    const flush = () => {
      if (!persistKey || disabledRef.current) return;
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
      saveViewport(persistKey, { offset: offsetRef.current, scale: scaleRef.current });
    };
    window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('beforeunload', flush); flush(); };
  }, [persistKey, disabledRef]);

  // Wheel zoom anchored to cursor position (pan on plain scroll). Both branches accumulate into the refs
  // synchronously and defer the React commit to the next animation frame via scheduleViewportCommit.
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
        scaleRef.current = next;
        offsetRef.current = {
          x: cx - (cx - offsetRef.current.x) * ratio,
          y: cy - (cy - offsetRef.current.y) * ratio,
        };
        scheduleViewportCommit();
      } else {
        offsetRef.current = {
          x: offsetRef.current.x - e.deltaX,
          y: offsetRef.current.y - e.deltaY,
        };
        scheduleViewportCommit();
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [viewportRef, disabled, scheduleViewportCommit]);

  /** Converts screen coordinates to canvas world coordinates. */
  const screenToCanvas = useCallback((sx: number, sy: number) => ({
    x: (sx - offsetRef.current.x) / scaleRef.current,
    y: (sy - offsetRef.current.y) / scaleRef.current,
  }), []);

  /** Scales around the viewport center by `factor`. */
  const zoomBy = useCallback((factor: number) => {
    const prev = scaleRef.current;
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
    const el = viewportRef.current;
    if (el) {
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      const ratio = next / prev;
      setOffset(o => ({ x: cx - (cx - o.x) * ratio, y: cy - (cy - o.y) * ratio }));
    }
    setScale(next);
  }, [viewportRef, setOffset, setScale]);

  /** Resets scale to 1 and re-centers the viewport. */
  const resetView = useCallback(() => {
    setScale(1);
    const el = viewportRef.current;
    if (el) setOffset({ x: el.clientWidth / 2, y: el.clientHeight / 2 });
  }, [viewportRef, setOffset, setScale]);

  return { offset, scale, offsetRef, scaleRef, setOffset, setScale, scheduleViewportCommit, screenToCanvas, zoomBy, resetView, viewportRestoredRef };
}
