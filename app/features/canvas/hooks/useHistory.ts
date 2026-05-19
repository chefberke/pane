import { useRef, useCallback, useState, type Dispatch, type SetStateAction, type RefObject } from 'react';
import type { Block, Frame } from '@/app/features/types';

const LIMIT = 100;

interface Snapshot {
  blocks: Block[];
  frames: Frame[];
}

/** Manages undo/redo stacks for blocks + frames. Snapshots are taken before mutations. */
export function useHistory({
  setBlocks,
  blocksRef,
  setFrames,
  framesRef,
}: {
  setBlocks: Dispatch<SetStateAction<Block[]>>;
  blocksRef: RefObject<Block[]>;
  setFrames: Dispatch<SetStateAction<Frame[]>>;
  framesRef: RefObject<Frame[]>;
}) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /** Saves the current blocks + frames as a snapshot before a mutation. Clears redo stack. */
  const pushSnapshot = useCallback(() => {
    const snap: Snapshot = { blocks: [...blocksRef.current], frames: [...framesRef.current] };
    past.current = [...past.current.slice(-(LIMIT - 1)), snap];
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [blocksRef, framesRef]);

  /** Reverts blocks + frames to the previous snapshot. */
  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    const current: Snapshot = { blocks: [...blocksRef.current], frames: [...framesRef.current] };
    future.current = [current, ...future.current.slice(0, LIMIT - 1)];
    setBlocks(prev.blocks);
    setFrames(prev.frames);
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  }, [setBlocks, setFrames, blocksRef, framesRef]);

  /** Re-applies the most recently undone snapshot. */
  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    const current: Snapshot = { blocks: [...blocksRef.current], frames: [...framesRef.current] };
    past.current = [...past.current.slice(-(LIMIT - 1)), current];
    setBlocks(next.blocks);
    setFrames(next.frames);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  }, [setBlocks, setFrames, blocksRef, framesRef]);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
