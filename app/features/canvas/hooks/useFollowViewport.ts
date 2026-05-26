import { useEffect, useRef, type Dispatch, type SetStateAction, type RefObject } from 'react';
import { FOLLOW_LERP } from '../constants';

/** Smoothly lerps local viewport toward a followed peer's visible rect each RAF tick. */
export function useFollowViewport({
  isFollowing,
  followTarget,
  viewportRef,
  offset,
  scale,
  setOffset,
  setScale,
}: {
  isFollowing: boolean;
  followTarget: { offset: { x: number; y: number }; scale: number; size: { w: number; h: number } } | null | undefined;
  viewportRef: RefObject<HTMLDivElement | null>;
  offset: { x: number; y: number };
  scale: number;
  setOffset: Dispatch<SetStateAction<{ x: number; y: number }>>;
  setScale: Dispatch<SetStateAction<number>>;
}) {
  const rafRef = useRef<number | null>(null);
  const currentOffset = useRef(offset);
  const currentScale = useRef(scale);

  // Keep refs in sync with state
  useEffect(() => { currentOffset.current = offset; }, [offset]);
  useEffect(() => { currentScale.current = scale; }, [scale]);

  useEffect(() => {
    if (!isFollowing || !followTarget) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const el = viewportRef.current;
      if (!el) { rafRef.current = requestAnimationFrame(tick); return; }

      const localW = el.clientWidth;
      const localH = el.clientHeight;
      const { offset: tOff, scale: tScale, size: tSize } = followTarget;

      // Peer's visible world rect
      const wx = -tOff.x / tScale;
      const wy = -tOff.y / tScale;
      const ww = tSize.w / tScale;
      const wh = tSize.h / tScale;

      // Scale that fits peer's world rect into local viewport
      const targetScale = Math.min(localW / ww, localH / wh);

      // Offset to center peer's world rect in local viewport
      const targetOffsetX = localW / 2 - (wx + ww / 2) * targetScale;
      const targetOffsetY = localH / 2 - (wy + wh / 2) * targetScale;

      const co = currentOffset.current;
      const cs = currentScale.current;

      const dx = targetOffsetX - co.x;
      const dy = targetOffsetY - co.y;
      const ds = targetScale - cs;

      // Stop lerping when close enough
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(ds) < 0.001) {
        setOffset({ x: targetOffsetX, y: targetOffsetY });
        setScale(targetScale);
        currentOffset.current = { x: targetOffsetX, y: targetOffsetY };
        currentScale.current = targetScale;
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const nextOffset = { x: co.x + dx * FOLLOW_LERP, y: co.y + dy * FOLLOW_LERP };
      const nextScale = cs + ds * FOLLOW_LERP;

      currentOffset.current = nextOffset;
      currentScale.current = nextScale;
      setOffset(nextOffset);
      setScale(nextScale);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isFollowing, followTarget, viewportRef, setOffset, setScale]);
}
