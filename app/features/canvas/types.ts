import type { Block, Frame, RemotePresencePeer } from '@/app/features/types';

export type Marquee = { x1: number; y1: number; x2: number; y2: number };

export interface CanvasState {
  blocks: Block[];
  frames: Frame[];
  offset: { x: number; y: number };
  scale: number;
}

export interface CanvasProps {
  /** Canvas state to hydrate on first mount. Read once — not reactive after mount. */
  initialState?: CanvasState | null;
  /** Called after every debounced state change (150ms). Page decides where to persist. */
  onSave?: (state: CanvasState) => void;
  /** If false, all mutating UI (toolbar, drag, keyboard shortcuts) is disabled. Default true. */
  canEdit?: boolean;
  /** Remote peers to render as cursors and selection outlines. */
  peers?: RemotePresencePeer[];
  /** Called on every pointermove with canvas-space coordinates. Use to publish cursor presence. */
  onCursorMove?: (canvasX: number, canvasY: number) => void;
  /** Called when block/frame selection changes. Use to publish selection presence. */
  onSelectionChange?: (blockIds: string[], frameId: string | null) => void;
  /** Extra nodes rendered in the top-right floating cluster (alongside the Items button). */
  topRightSlot?: React.ReactNode;
  /** When true, all editing chrome is hidden and input is disabled (follow-user mode). */
  isFollowing?: boolean;
  /** Followed peer's viewport to lerp toward. Only used when isFollowing is true. */
  followTarget?: { offset: { x: number; y: number }; scale: number; size: { w: number; h: number } } | null;
  /** Called with local viewport state so the page can publish it to presence. */
  onViewportChange?: (offset: { x: number; y: number }, scale: number, size: { w: number; h: number }) => void;
}
