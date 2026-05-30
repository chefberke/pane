import { useState, useCallback } from 'react';
import type { ContextMenuRow, ContextMenuState } from '../types';

/** Owns the right-click menu state; converts client coords to viewport-relative on open. */
export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  /** Opens the menu with prebuilt rows. Call from an event handler so ref reads stay outside render. */
  const openMenu = useCallback((rows: ContextMenuRow[], clientX: number, clientY: number, rect: DOMRect) => {
    setMenu({ x: clientX - rect.left, y: clientY - rect.top, bounds: { w: rect.width, h: rect.height }, rows });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  return { menu, openMenu, closeMenu };
}
