'use client';
import { useState, useRef, useCallback, type RefObject } from 'react';
import type { ConnectorSide } from '@/app/features/types';
import type { PendingConnector, Point, Rect } from '../types';
import { findTargetAt } from '../utils';

interface Params {
  viewportRef: RefObject<HTMLDivElement | null>;
  screenToCanvas: (sx: number, sy: number) => Point;
  /** Live map of block id → world rect, read at pointerup to hit-test the drop target. */
  rectByIdRef: RefObject<Map<string, Rect>>;
  addConnector: (sourceId: string, targetId: string) => void;
  pushSnapshot: () => void;
}

/**
 * Drives the "drag from a block edge to another block" gesture. `startConnector` is wired to the
 * edge handles; it tracks the cursor in world space, exposes `pending` for the ghost line, and
 * commits a connector when the pointer is released over a different block.
 */
export function useConnectorDrag({ viewportRef, screenToCanvas, rectByIdRef, addConnector, pushSnapshot }: Params) {
  const [pending, setPending] = useState<PendingConnector | null>(null);
  const sourceRef = useRef<{ sourceId: string; side: ConnectorSide } | null>(null);

  const toWorld = useCallback((clientX: number, clientY: number): Point | null => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return screenToCanvas(clientX - rect.left, clientY - rect.top);
  }, [viewportRef, screenToCanvas]);

  const startConnector = useCallback((blockId: string, side: ConnectorSide, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    sourceRef.current = { sourceId: blockId, side };
    const start = toWorld(e.clientX, e.clientY) ?? { x: 0, y: 0 };
    setPending({ sourceId: blockId, side, cursor: start, targetId: null });

    function onMove(ev: PointerEvent) {
      const src = sourceRef.current;
      const w = toWorld(ev.clientX, ev.clientY);
      if (!src || !w) return;
      const targetId = findTargetAt(w, rectByIdRef.current, src.sourceId);
      setPending({ sourceId: src.sourceId, side: src.side, cursor: w, targetId });
    }
    function cleanup() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('keydown', onKey);
    }
    function finish(ev: PointerEvent | null) {
      cleanup();
      const src = sourceRef.current;
      sourceRef.current = null;
      setPending(null);
      if (!src || !ev) return;
      const w = toWorld(ev.clientX, ev.clientY);
      if (!w) return;
      const targetId = findTargetAt(w, rectByIdRef.current, src.sourceId);
      if (targetId) {
        pushSnapshot();
        addConnector(src.sourceId, targetId);
      }
    }
    function onUp(ev: PointerEvent) { finish(ev); }
    function onKey(ev: KeyboardEvent) { if (ev.key === 'Escape') finish(null); }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('keydown', onKey);
  }, [toWorld, rectByIdRef, addConnector, pushSnapshot]);

  return { pending, startConnector };
}
