'use client';
import { useEffect, useRef } from 'react';
import type { Block, Frame } from '@/app/features/types';
import type { CanvasState } from '../types';
import { SAVE_DEBOUNCE_MS } from '../constants';

interface Params {
  initialState?: CanvasState | null;
  onSave?: (state: CanvasState) => void;
  canEdit: boolean;
  blocks: Block[];
  frames: Frame[];
  offset: { x: number; y: number };
  scale: number;
  setBlocks: (blocks: Block[]) => void;
  setFrames: (frames: Frame[]) => void;
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
}

/** Hydrates canvas state from `initialState` on first mount and debounces saves on change. */
export function usePersistence({
  initialState, onSave, canEdit,
  blocks, frames, offset, scale,
  setBlocks, setFrames, setScale, setOffset,
}: Params) {
  // Hydrate from initialState on first mount only.
  useEffect(() => {
    if (!initialState) return;
    if (initialState.blocks.length) setBlocks(initialState.blocks);
    if (initialState.frames?.length) setFrames(initialState.frames);
    if (initialState.scale !== 1) setScale(initialState.scale);
    if (initialState.offset.x !== 0 || initialState.offset.y !== 0) setOffset(initialState.offset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save — calls onSave whenever canvas state changes.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!onSave || !canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { onSave({ blocks, frames, offset, scale }); }, SAVE_DEBOUNCE_MS);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [blocks, frames, offset, scale, onSave, canEdit]);
}
