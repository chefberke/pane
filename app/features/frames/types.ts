import type { Frame, FrameColor } from '@/app/features/types';

/** Callback handlers passed to a Frame for interaction delegation. */
export interface FrameHandlers {
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onColorChange: (id: string, color: FrameColor) => void;
  onToggleCollapse: (id: string) => void;
  onDelete: (id: string) => void;
  onDragMove: (id: string, dx: number, dy: number) => void;
  onDragEnd: (id: string, dx: number, dy: number) => void;
  onResize: (id: string, next: { x: number; y: number; width: number; height: number }) => void;
  onOpenComments: (frame: Frame, anchor: { x: number; y: number }) => void;
  onBeforeMutate: () => void;
}

/** Bounding rectangle in canvas coordinates. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Live drop-target preview state passed to a Frame during a block drag. */
export interface FrameDropPreview {
  active: boolean;
  rect?: Rect;
}

/** Result of computing a frame's spatial children. */
export interface FrameMembership {
  blockIds: Set<string>;
  childFrameIds: Set<string>;
}

/** Re-export Frame for callers in this feature. */
export type { Frame, FrameColor };
