import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { ZOOM_STEP } from '../constants';

/** Registers global keyboard shortcuts for canvas viewport, block, and tool actions. */
export function useCanvasKeyboard({
  setSelectedIds,
  setAddPos,
  setIsSearchOpen,
  setIsPanMode,
  deleteSelected,
  addTextNote,
  toggleTheme,
  resetView,
  zoomBy,
}: {
  setSelectedIds: Dispatch<SetStateAction<Set<string>>>;
  setAddPos: Dispatch<SetStateAction<{ x: number; y: number } | null>>;
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>;
  setIsPanMode: Dispatch<SetStateAction<boolean>>;
  deleteSelected: () => void;
  addTextNote: () => void;
  toggleTheme: () => void;
  resetView: () => void;
  zoomBy: (factor: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const inInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA';

      if (e.key === 'Escape') { setSelectedIds(new Set()); setAddPos(null); setIsSearchOpen(false); }

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && !inInput) {
        deleteSelected();
      }

      if (inInput) return;

      if (e.key === 'v' || e.key === 'V') setIsPanMode(false);
      if (e.key === 'h' || e.key === 'H') setIsPanMode(true);
      if (e.key === 't' || e.key === 'T') addTextNote();
      if (e.key === 'd' || e.key === 'D') toggleTheme();
      if (e.key === '0') resetView();
      if ((e.key === '=' || e.key === '+') && !e.metaKey && !e.ctrlKey) zoomBy(ZOOM_STEP);
      if (e.key === '-' && !e.metaKey && !e.ctrlKey) zoomBy(1 / ZOOM_STEP);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelectedIds, setAddPos, setIsSearchOpen, setIsPanMode, deleteSelected, addTextNote, toggleTheme, resetView, zoomBy]);
}
