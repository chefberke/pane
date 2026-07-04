'use client';
import { useEffect, useRef } from 'react';
import { PRESENCE_VIEWPORT_THROTTLE_MS } from '../constants';

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

  // Publish own viewport to presence so others can follow us — throttled (leading + trailing) so a fast pan
  // publishes at ~10 Hz instead of once per animation frame, sparing a forced layout read every frame.
  const lastPublish = useRef(0);
  const trailingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef({ offset, scale });
  useEffect(() => {
    latest.current = { offset, scale };
    if (isFollowing || !onViewportChange) return;
    const el = viewportRef.current;
    if (!el) return;
    const publish = () => {
      trailingTimer.current = null;
      lastPublish.current = Date.now();
      onViewportChange(latest.current.offset, latest.current.scale, { w: el.clientWidth, h: el.clientHeight });
    };
    const elapsed = Date.now() - lastPublish.current;
    if (elapsed >= PRESENCE_VIEWPORT_THROTTLE_MS) {
      if (trailingTimer.current) { clearTimeout(trailingTimer.current); trailingTimer.current = null; }
      publish();
    } else if (trailingTimer.current === null) {
      trailingTimer.current = setTimeout(publish, PRESENCE_VIEWPORT_THROTTLE_MS - elapsed);
    }
  }, [offset, scale, isFollowing, onViewportChange, viewportRef]);

  // Clear any pending trailing publish on unmount.
  useEffect(() => () => { if (trailingTimer.current) clearTimeout(trailingTimer.current); }, []);
}
