'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HINT_FLASH_MS } from '../constants';

/** Manages a short-lived on-canvas hint label (e.g. "drop a link, not a file") that fades out on its own. */
export function useCanvasHint() {
  const [hint, setHint] = useState<{ x: number; y: number; message: string } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Shows a short-lived hint label at the given screen point. */
  const flashHint = useCallback((sx: number, sy: number, message: string) => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHint({ x: sx, y: sy, message });
    hintTimer.current = setTimeout(() => setHint(null), HINT_FLASH_MS);
  }, []);

  useEffect(() => () => { if (hintTimer.current) clearTimeout(hintTimer.current); }, []);

  return { hint, flashHint };
}
