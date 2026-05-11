import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Block } from '@/types';
import { useLatestRef } from './useLatestRef';

/** Manages block selection state, multi-select toggling, group drag commits, and deletion. */
export function useSelection({ setBlocks }: {
  setBlocks: Dispatch<SetStateAction<Block[]>>;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedIdsRef = useLatestRef(selectedIds);

  /** Selects a block; shift-click toggles; clicking inside a multi-selection keeps the group. */
  const handleBlockSelect = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds(prev => {
      if (shiftKey) {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }
      if (prev.size > 1 && prev.has(id)) return prev;
      return new Set([id]);
    });
  }, []);

  /** Collapses a multi-selection to the clicked block on a plain click without drag. */
  const handleBlockClickEnd = useCallback((id: string, wasDragged: boolean) => {
    if (!wasDragged && selectedIdsRef.current.size > 1 && selectedIdsRef.current.has(id)) {
      setSelectedIds(new Set([id]));
    }
  }, [selectedIdsRef]);

  /** Translates all selected blocks visually during a group drag. */
  const handleMultiDragMove = useCallback((dx: number, dy: number) => {
    selectedIdsRef.current.forEach(id => {
      const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
      if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  }, [selectedIdsRef]);

  /** Commits the group drag delta to block positions in state. */
  const handleMultiDragEnd = useCallback((dx: number, dy: number) => {
    selectedIdsRef.current.forEach(id => {
      const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
      if (el) el.style.transform = '';
    });
    setBlocks(prev => prev.map(b =>
      selectedIdsRef.current.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } as Block : b
    ));
  }, [setBlocks, selectedIdsRef]);

  /** Deletes all currently selected blocks. */
  const deleteSelected = useCallback(() => {
    if (selectedIdsRef.current.size === 0) return;
    setBlocks(prev => prev.filter(b => !selectedIdsRef.current.has(b.id)));
    setSelectedIds(new Set());
  }, [setBlocks, selectedIdsRef]);

  return { selectedIds, setSelectedIds, handleBlockSelect, handleBlockClickEnd, handleMultiDragMove, handleMultiDragEnd, deleteSelected };
}
