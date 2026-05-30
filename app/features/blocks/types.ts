import type { Block } from '@/app/features/types';

/** Callback handlers passed to BlockContainer for interaction delegation. */
export interface BlockHandlers {
  onSelect: (id: string, shiftKey: boolean) => void;
  onClickEnd: (id: string, wasDragged: boolean) => void;
  onOpen: (block: Block) => void;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onOpenComments: (block: Block, anchor: { x: number; y: number }) => void;
  onMultiDragMove: (dx: number, dy: number) => void;
  onMultiDragEnd: (dx: number, dy: number) => void;
  onBeforeDragCommit: () => void;
  onDragRect: (blockId: string, delta: { dx: number; dy: number } | null) => void;
  onContextMenu: (id: string, clientX: number, clientY: number) => void;
}
