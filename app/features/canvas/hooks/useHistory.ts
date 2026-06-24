import { useRef, useCallback, useState, type Dispatch, type SetStateAction, type RefObject } from 'react';
import type { Block, Frame, Connector } from '@/app/features/types';

const LIMIT = 100;

interface Snapshot {
  blocks: Block[];
  frames: Frame[];
  connectors: Connector[];
}

/** Manages undo/redo stacks for blocks + frames + connectors. Snapshots are taken before mutations. */
export function useHistory({
  setBlocks,
  blocksRef,
  setFrames,
  framesRef,
  setConnectors,
  connectorsRef,
}: {
  setBlocks: Dispatch<SetStateAction<Block[]>>;
  blocksRef: RefObject<Block[]>;
  setFrames: Dispatch<SetStateAction<Frame[]>>;
  framesRef: RefObject<Frame[]>;
  setConnectors: Dispatch<SetStateAction<Connector[]>>;
  connectorsRef: RefObject<Connector[]>;
}) {
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  /** Saves the current blocks + frames + connectors as a snapshot before a mutation. Clears redo stack. */
  const pushSnapshot = useCallback(() => {
    const snap: Snapshot = { blocks: [...blocksRef.current], frames: [...framesRef.current], connectors: [...connectorsRef.current] };
    past.current = [...past.current.slice(-(LIMIT - 1)), snap];
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [blocksRef, framesRef, connectorsRef]);

  /** Reverts blocks + frames + connectors to the previous snapshot. */
  const undo = useCallback(() => {
    if (!past.current.length) return;
    const prev = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    const current: Snapshot = { blocks: [...blocksRef.current], frames: [...framesRef.current], connectors: [...connectorsRef.current] };
    future.current = [current, ...future.current.slice(0, LIMIT - 1)];
    setBlocks(prev.blocks);
    setFrames(prev.frames);
    setConnectors(prev.connectors);
    setCanUndo(past.current.length > 0);
    setCanRedo(true);
  }, [setBlocks, setFrames, setConnectors, blocksRef, framesRef, connectorsRef]);

  /** Re-applies the most recently undone snapshot. */
  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    const current: Snapshot = { blocks: [...blocksRef.current], frames: [...framesRef.current], connectors: [...connectorsRef.current] };
    past.current = [...past.current.slice(-(LIMIT - 1)), current];
    setBlocks(next.blocks);
    setFrames(next.frames);
    setConnectors(next.connectors);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  }, [setBlocks, setFrames, setConnectors, blocksRef, framesRef, connectorsRef]);

  return { pushSnapshot, undo, redo, canUndo, canRedo };
}
