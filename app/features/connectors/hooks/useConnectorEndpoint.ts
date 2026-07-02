'use client';
import { useState, useCallback, type RefObject } from 'react';
import type { Connector } from '@/app/features/types';
import type { EndpointDrag, Point, Rect } from '../types';
import { findTargetAt } from '../utils';

interface Params {
  viewportRef: RefObject<HTMLDivElement | null>;
  screenToCanvas: (sx: number, sy: number) => Point;
  /** Live map of block id → world rect, read to hit-test the block under the dragged endpoint. */
  rectByIdRef: RefObject<Map<string, Rect>>;
  connectorsRef: RefObject<Connector[]>;
  updateConnector: (id: string, patch: Partial<Omit<Connector, 'id'>>) => void;
  pushSnapshot: () => void;
}

/**
 * Drives the "drag an endpoint of an existing connector onto a different block" gesture. Exposes
 * `endpointDrag` so the connector layer can preview the moving end and highlight the hovered target;
 * on release over a valid block it re-points that end, otherwise it reverts.
 */
export function useConnectorEndpoint({
  viewportRef, screenToCanvas, rectByIdRef, connectorsRef, updateConnector, pushSnapshot,
}: Params) {
  const [endpointDrag, setEndpointDrag] = useState<EndpointDrag | null>(null);

  const toWorld = useCallback((clientX: number, clientY: number): Point | null => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return screenToCanvas(clientX - rect.left, clientY - rect.top);
  }, [viewportRef, screenToCanvas]);

  const startEndpoint = useCallback((id: string, end: 'source' | 'target', e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const connector = connectorsRef.current.find(c => c.id === id);
    if (!connector) return;
    // The end that stays put — excluded from hit-testing so the arrow can't collapse onto itself.
    const fixedBlockId = end === 'source' ? connector.targetId : connector.sourceId;
    const el = e.currentTarget as Element;
    try { el.setPointerCapture(e.pointerId); } catch { /* capture is best-effort */ }

    const start = toWorld(e.clientX, e.clientY) ?? { x: 0, y: 0 };
    setEndpointDrag({ connectorId: id, end, cursor: start, targetId: null });

    function onMove(ev: PointerEvent) {
      const w = toWorld(ev.clientX, ev.clientY);
      if (!w) return;
      const targetId = findTargetAt(w, rectByIdRef.current, fixedBlockId);
      setEndpointDrag({ connectorId: id, end, cursor: w, targetId });
    }
    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
      try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }
    function finish(ev: PointerEvent | null) {
      cleanup();
      setEndpointDrag(null);
      if (!ev) return;
      const w = toWorld(ev.clientX, ev.clientY);
      if (!w) return;
      const targetId = findTargetAt(w, rectByIdRef.current, fixedBlockId);
      if (targetId && targetId !== fixedBlockId) {
        pushSnapshot();
        updateConnector(id, end === 'source' ? { sourceId: targetId } : { targetId });
      }
    }
    function onUp(ev: PointerEvent) { finish(ev); }
    function onKey(ev: KeyboardEvent) { if (ev.key === 'Escape') finish(null); }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
  }, [toWorld, rectByIdRef, connectorsRef, updateConnector, pushSnapshot]);

  return { endpointDrag, startEndpoint };
}
