import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { ZOOM_STEP } from '../constants';

/** Registers global keyboard shortcuts for canvas viewport, block, and tool actions. */
export function useCanvasKeyboard({
  setSelectedIds,
  setAddPos,
  setIsSearchOpen,
  setIsHelpOpen,
  setIsPanMode,
  deleteSelected,
  duplicateSelected,
  selectAll,
  nudgeSelected,
  addTextNote,
  toggleTheme,
  resetView,
  zoomBy,
  undo,
  redo,
  groupSelected,
  ungroupSelected,
  clearFrameSelection,
  disabled = false,
  canEdit = true,
}: {
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  setAddPos: Dispatch<SetStateAction<{ x: number; y: number; connectSourceId?: string } | null>>;
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>;
  setIsHelpOpen: Dispatch<SetStateAction<boolean>>;
  setIsPanMode: Dispatch<SetStateAction<boolean>>;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  selectAll: () => void;
  nudgeSelected: (dx: number, dy: number) => void;
  addTextNote: () => void;
  toggleTheme: () => void;
  resetView: () => void;
  zoomBy: (factor: number) => void;
  undo: () => void;
  redo: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  clearFrameSelection: () => void;
  disabled?: boolean;
  /** When false (viewer), mutating shortcuts (move/delete/duplicate/group/add) are no-ops. */
  canEdit?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      const active = document.activeElement;
      const inInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';
      const meta = e.metaKey || e.ctrlKey;

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        clearFrameSelection();
        setAddPos(null);
        setIsSearchOpen(false);
        setIsHelpOpen(false);
        return;
      }

      if ((e.key === 'k' || e.key === 'K') && meta) { e.preventDefault(); setIsSearchOpen(prev => !prev); return; }

      if ((e.key === 'z' || e.key === 'Z') && meta) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }

      if (meta && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        if (canEdit) { if (e.shiftKey) ungroupSelected(); else groupSelected(); }
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !inInput) { if (canEdit) deleteSelected(); return; }

      if (meta && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); if (canEdit) duplicateSelected(); return; }
      if (meta && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); selectAll(); return; }

      if (!inInput && !meta) {
        if (e.key === 'ArrowUp')    { e.preventDefault(); if (canEdit) nudgeSelected(0, e.shiftKey ? -10 : -1); return; }
        if (e.key === 'ArrowDown')  { e.preventDefault(); if (canEdit) nudgeSelected(0, e.shiftKey ? 10 : 1); return; }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); if (canEdit) nudgeSelected(e.shiftKey ? -10 : -1, 0); return; }
        if (e.key === 'ArrowRight') { e.preventDefault(); if (canEdit) nudgeSelected(e.shiftKey ? 10 : 1, 0); return; }
      }

      if (inInput) return;

      if (e.key === 'v' || e.key === 'V') setIsPanMode(false);
      if (e.key === 'h' || e.key === 'H') setIsPanMode(true);
      if ((e.key === 't' || e.key === 'T') && canEdit) addTextNote();
      if (e.key === 'd' || e.key === 'D') toggleTheme();
      if (e.key === '0') resetView();
      if ((e.key === '=' || e.key === '+') && !meta) zoomBy(ZOOM_STEP);
      if (e.key === '-' && !meta) zoomBy(1 / ZOOM_STEP);
      if (e.key === '?') { e.preventDefault(); setIsHelpOpen(prev => !prev); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    setSelectedIds, setAddPos, setIsSearchOpen, setIsHelpOpen, setIsPanMode,
    deleteSelected, duplicateSelected, selectAll, nudgeSelected,
    addTextNote, toggleTheme, resetView, zoomBy, undo, redo,
    groupSelected, ungroupSelected, clearFrameSelection, disabled, canEdit,
  ]);
}
