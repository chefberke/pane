import { useEffect, useRef } from 'react';
import type { Block } from '@/app/features/types';
import { saveCanvasState } from '../utils/storage';

/** Debounced persistence of canvas state to localStorage (150ms). */
export function useCanvasPersistence({
  blocks,
  offset,
  scale,
}: {
  blocks: Block[];
  offset: { x: number; y: number };
  scale: number;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveCanvasState({ blocks, offset, scale });
    }, 150);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [blocks, offset, scale]);
}
