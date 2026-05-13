import { useRef, useCallback, useState, type Dispatch, type SetStateAction, type RefObject } from 'react';
import type { Block } from '@/types';

const LIMIT = 100;

/** Manages undo/redo stacks for the blocks array. Snapshots are taken before mutations. */
export function useHistory({
  setBlocks,
  blocksRef,
}: {
  setBlocks: Dispatch<SetStateAction<Block[]>>;
  blocksRef: RefObject<Block[]>;
}) {
  const past = useRef<Block[][]>([]);
  const future = useRef<Block[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /** Saves the current blocks as a snapshot before a mutation. Clears redo stack. */
  const pushSnapshot = useCallback(() => {
    past.current = [...past.current.slice(-(LIMIT - 1)), [...blocksRef.current]];
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [blocksRef]);

  /** Reverts blocks to the previous snapshot. */
  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [[...blocksRef.current], ...future.current.slice(0, LIMIT - 1)];
    setBlocks(prev);
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  }, [setBlocks, blocksRef]);

  /** Re-applies the most recently undone snapshot. */
  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current.slice(-(LIMIT - 1)), [...blocksRef.current]];
    setBlocks(next);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  }, [setBlocks, blocksRef]);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
