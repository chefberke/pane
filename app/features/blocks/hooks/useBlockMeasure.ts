'use client';
import { useEffect, type RefObject } from 'react';

interface Params {
  id: string;
  /** The block's rendered card element; its border box is the true world-space size (transforms don't affect offsetWidth/Height). */
  cardRef: RefObject<HTMLElement | null>;
  /** Reports the card's rendered size whenever it changes, and null on unmount. */
  onMeasure?: (id: string, size: { width: number; height: number } | null) => void;
}

/** Observes a block card's rendered size and reports it upward so connector routing/hit-testing use true bounds. */
export function useBlockMeasure({ id, cardRef, onMeasure }: Params): void {
  useEffect(() => {
    const el = cardRef.current;
    if (!el || !onMeasure) return;
    const report = () => onMeasure(id, { width: el.offsetWidth, height: el.offsetHeight });
    report();
    const ro = new ResizeObserver(report);
    ro.observe(el);
    return () => {
      ro.disconnect();
      onMeasure(id, null);
    };
  }, [id, cardRef, onMeasure]);
}
