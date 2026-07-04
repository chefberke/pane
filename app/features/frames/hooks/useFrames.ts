import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { Block, Frame, FrameColor } from '@/app/features/types';
import { FRAME_DEFAULT_COLOR, FRAME_DEFAULT_TITLE, FRAME_MIN_H, FRAME_MIN_W } from '../constants';
import { findEnclosingFrame, frameUid, groupBoundsFromBlocks } from '../utils';

/** Manages frame collection + CRUD operations (create from selection, rename, color, collapse, delete). */
export function useFrames(setBlocks: Dispatch<SetStateAction<Block[]>>) {
  const [frames, setFrames] = useState<Frame[]>([]);

  /** Creates a new frame wrapping the selected blocks; nests it under whatever frame it geometrically sits inside (or top-level), and adopts the selected blocks as its stored members. Returns the new frame id (or null). */
  const createFromSelection = useCallback((blocks: Block[], selectedIds: Set<string>, frames: Frame[]): string | null => {
    if (selectedIds.size === 0) return null;
    const rect = groupBoundsFromBlocks(blocks, selectedIds);
    if (!rect) return null;
    const id = frameUid();
    const frame: Frame = {
      id,
      title: FRAME_DEFAULT_TITLE,
      color: FRAME_DEFAULT_COLOR,
      x: rect.x,
      y: rect.y,
      width: Math.max(FRAME_MIN_W, rect.width),
      height: Math.max(FRAME_MIN_H, rect.height),
      collapsed: false,
      parentFrameId: findEnclosingFrame(rect, frames)?.id ?? null,
    };
    setFrames(prev => [...prev, frame]);
    // Reparent exactly the selected blocks to the new frame (they leave any frame they were in),
    // so membership is stored intent — the new frame moves them, not geometry.
    setBlocks(prev => prev.map(b => selectedIds.has(b.id) ? ({ ...b, parentFrameId: id } as Block) : b));
    return id;
  }, [setBlocks]);

  /** Updates partial fields on a frame. */
  const updateFrame = useCallback((id: string, updates: Partial<Frame>) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  /** Removes a frame entity; members stay where they are, and any child frames/blocks become top-level (parentFrameId → null). */
  const deleteFrame = useCallback((id: string) => {
    setFrames(prev => prev
      .filter(f => f.id !== id)
      .map(f => f.parentFrameId === id ? { ...f, parentFrameId: null } : f));
    setBlocks(prev => prev.map(b => b.parentFrameId === id ? ({ ...b, parentFrameId: null } as Block) : b));
  }, [setBlocks]);

  /** Toggles the collapsed state of a frame. */
  const toggleCollapse = useCallback((id: string) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, collapsed: !f.collapsed } : f));
  }, []);

  /** Renames a frame's title. */
  const renameFrame = useCallback((id: string, title: string) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, title } : f));
  }, []);

  /** Changes a frame's color preset. */
  const setFrameColor = useCallback((id: string, color: FrameColor) => {
    setFrames(prev => prev.map(f => f.id === id ? { ...f, color } : f));
  }, []);

  return {
    frames,
    setFrames: setFrames as Dispatch<SetStateAction<Frame[]>>,
    createFromSelection,
    updateFrame,
    deleteFrame,
    toggleCollapse,
    renameFrame,
    setFrameColor,
  };
}
