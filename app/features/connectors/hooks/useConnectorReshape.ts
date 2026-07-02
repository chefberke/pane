'use client';
import { useState, useCallback, type RefObject } from 'react';
import type { Connector } from '@/app/features/types';
import type { Point, Rect } from '../types';
import { resolveAnchors, bendFromPoint } from '../utils';
import { MAX_BEND, RESHAPE_DRAG_THRESHOLD } from '../constants';

interface Params {
  viewportRef: RefObject<HTMLDivElement | null>;
  screenToCanvas: (sx: number, sy: number) => Point;
  /** Live map of block id → world rect, read each move to re-derive the anchors as blocks move. */
  rectByIdRef: RefObject<Map<string, Rect>>;
  connectorsRef: RefObject<Connector[]>;
  updateConnector: (id: string, patch: Partial<Omit<Connector, 'id'>>) => void;
  pushSnapshot: () => void;
  /** Selects a connector on a plain click (no drag) — this is what opens the toolbar. */
  onSelect: (id: string) => void;
  canEdit: boolean;
}

/**
 * Drives the "grab a connector and bend it" gesture (bound to the line body and the belly handle).
 * A press that stays under RESHAPE_DRAG_THRESHOLD is treated as a click → `onSelect` (opens the menu);
 * once it crosses the threshold it becomes a live bend and never selects, so the toolbar can't misfire.
 */
export function useConnectorReshape({
  viewportRef, screenToCanvas, rectByIdRef, connectorsRef, updateConnector, pushSnapshot, onSelect, canEdit,
}: Params) {
  const [reshapingId, setReshapingId] = useState<string | null>(null);

  const toWorld = useCallback((clientX: number, clientY: number): Point | null => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return screenToCanvas(clientX - rect.left, clientY - rect.top);
  }, [viewportRef, screenToCanvas]);

  const startReshape = useCallback((id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    const el = e.currentTarget as Element;
    try { el.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ }
    const startX = e.clientX;
    const startY = e.clientY;
    const original = connectorsRef.current.find(c => c.id === id)?.curvature;
    let moved = false;

    function applyBend(ev: PointerEvent) {
      const c = connectorsRef.current.find(conn => conn.id === id);
      const w = toWorld(ev.clientX, ev.clientY);
      if (!c || !w) return;
      const src = rectByIdRef.current.get(c.sourceId);
      const tgt = rectByIdRef.current.get(c.targetId);
      if (!src || !tgt) return;
      const { a, b } = resolveAnchors(src, tgt);
      const bend = Math.max(-MAX_BEND, Math.min(MAX_BEND, bendFromPoint(a, b, w)));
      updateConnector(id, { curvature: bend });
    }

    function onMove(ev: PointerEvent) {
      if (!moved) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < RESHAPE_DRAG_THRESHOLD) return;
        if (!canEdit) return;   // viewers can click-select but not bend
        moved = true;
        setReshapingId(id);
        pushSnapshot();
      }
      applyBend(ev);
    }
    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }
    function onUp() {
      cleanup();
      if (!moved) onSelect(id);   // a click → select + open toolbar; a drag never selects
      else setReshapingId(null);
    }
    function onKey(ev: KeyboardEvent) {
      if (ev.key !== 'Escape') return;
      cleanup();
      if (moved) updateConnector(id, { curvature: original });   // restore pre-drag shape
      setReshapingId(null);
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
  }, [toWorld, rectByIdRef, connectorsRef, updateConnector, pushSnapshot, onSelect, canEdit]);

  return { reshapingId, startReshape };
}
