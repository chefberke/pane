'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ACTION_MENU_OFFSET_X, ACTION_MENU_OFFSET_Y } from '../constants';
import type { WorkspaceItem } from '../types';

/**
 * Manages the per-row hover state and the 3-dot action dropdown: its open id,
 * anchor position, button refs, and the Escape / outside-click dismissal.
 *
 * `panelRef` is owned by the panel so outside-click can test containment;
 * `modalOpen` suppresses dismissal while a modal owns its own dismissal.
 */
export function useActionMenu(
  panelRef: React.RefObject<HTMLDivElement | null>,
  onClose: () => void,
  modalOpen: boolean,
) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState({ top: 0, left: 0 });
  const dotBtnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const openActionMenu = useCallback((ws: WorkspaceItem) => {
    const btn = dotBtnRefs.current[ws.id];
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setActionMenuPos({ top: rect.bottom + ACTION_MENU_OFFSET_Y, left: rect.left - ACTION_MENU_OFFSET_X });
    setActionMenuId(ws.id);
  }, []);

  const registerDotRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    dotBtnRefs.current[id] = el;
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (actionMenuId) { setActionMenuId(null); return; }
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, actionMenuId]);

  useEffect(() => {
    // Don't close while a modal is open — the modal handles its own dismissal
    if (modalOpen) return;
    const onDown = (e: MouseEvent) => {
      const inPanel = panelRef.current?.contains(e.target as Node);
      const inPortal = (e.target as Element)?.closest?.('[data-menu-portal]');
      if (!inPanel && !inPortal) {
        setActionMenuId(null);
        onClose();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose, modalOpen, panelRef]);

  return {
    hoveredId,
    setHoveredId,
    actionMenuId,
    setActionMenuId,
    actionMenuPos,
    openActionMenu,
    registerDotRef,
  };
}
