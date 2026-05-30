'use client';
import { useEffect } from 'react';

interface Params {
  selectedIds: Set<string>;
  selectedFrameId: string | null;
  onSelectionChange?: (blockIds: string[], frameId: string | null) => void;
  offset: { x: number; y: number };
  scale: number;
  isFollowing: boolean;
  onViewportChange?: (offset: { x: number; y: number }, scale: number, size: { w: number; h: number }) => void;
  viewportRef: React.RefObject<HTMLDivElement | null>;
}

/** Publishes local selection and viewport changes to presence callbacks. */
export function usePresenceSync({
  selectedIds, selectedFrameId, onSelectionChange,
  offset, scale, isFollowing, onViewportChange, viewportRef,
}: Params) {
  // Publish selection changes to presence.
  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(Array.from(selectedIds), selectedFrameId);
  }, [selectedIds, selectedFrameId, onSelectionChange]);

  // Publish own viewport to presence so others can follow us.
  useEffect(() => {
    if (isFollowing || !onViewportChange) return;
    const el = viewportRef.current;
    if (!el) return;
    onViewportChange(offset, scale, { w: el.clientWidth, h: el.clientHeight });
  }, [offset, scale, isFollowing, onViewportChange, viewportRef]);
}
