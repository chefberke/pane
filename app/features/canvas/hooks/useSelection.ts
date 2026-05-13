import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Block } from '@/app/features/types';
import { useLatestRef } from './useLatestRef';
import { uid } from '../utils';

/** Manages block selection state, multi-select toggling, group drag commits, deletion, and duplication. */
export function useSelection({
  blocks,
  setBlocks,
  pushSnapshot,
}: {
  blocks: Block[];
  setBlocks: Dispatch<SetStateAction<Block[]>>;
  pushSnapshot: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedIdsRef = useLatestRef(selectedIds);
  const blocksRef = useLatestRef(blocks);

  /** Selects a block; shift-click toggles; clicking inside a multi-selection keeps the group. */
  const handleBlockSelect = useCallback((id: string, shiftKey: boolean) => {
    setSelectedIds(prev => {
      if (shiftKey) {
        const next = new Set(prev);
        if (next.has(id)) { next.delete(id); } else { next.add(id); }
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

  /** Commits the group drag delta to block positions in state (snapshot taken by drag hook before this). */
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
    pushSnapshot();
    setBlocks(prev => prev.filter(b => !selectedIdsRef.current.has(b.id)));
    setSelectedIds(new Set());
  }, [setBlocks, selectedIdsRef, pushSnapshot]);

  /** Duplicates all selected blocks with new IDs, offset by +20/+20. */
  const duplicateSelected = useCallback(() => {
    if (selectedIdsRef.current.size === 0) return;
    pushSnapshot();
    const newIds = new Set<string>();
    setBlocks(prev => {
      const copies: Block[] = [];
      prev.forEach(b => {
        if (!selectedIdsRef.current.has(b.id)) return;
        const newId = uid();
        newIds.add(newId);
        copies.push({ ...b, id: newId, x: b.x + 20, y: b.y + 20 });
      });
      return [...prev, ...copies];
    });
    // defer so setBlocks settles first
    setTimeout(() => setSelectedIds(newIds), 0);
  }, [setBlocks, selectedIdsRef, pushSnapshot]);

  /** Selects all blocks on the canvas. */
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(blocksRef.current.map(b => b.id)));
  }, [blocksRef]);

  /** Nudges selected blocks by (dx, dy) in canvas units. */
  const nudgeSelected = useCallback((dx: number, dy: number) => {
    if (selectedIdsRef.current.size === 0) return;
    pushSnapshot();
    setBlocks(prev => prev.map(b =>
      selectedIdsRef.current.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } as Block : b
    ));
  }, [setBlocks, selectedIdsRef, pushSnapshot]);

  return {
    selectedIds, setSelectedIds,
    handleBlockSelect, handleBlockClickEnd,
    handleMultiDragMove, handleMultiDragEnd,
    deleteSelected, duplicateSelected, selectAll, nudgeSelected,
  };
}
