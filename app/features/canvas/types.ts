import type { Block, Frame, Connector, RemotePresencePeer } from '@/app/features/types';

export type Marquee = { x1: number; y1: number; x2: number; y2: number };

/** The block or frame whose comments popover is currently open, with its anchor point. */
export type CommentTarget = { kind: 'block' | 'frame'; id: string; x: number; y: number } | null;

/** Block + frame comment CRUD callbacks produced by useComments. */
export interface CommentHandlers {
  handleOpenComments: (block: Block, anchor: { x: number; y: number }) => void;
  handleAddComment: (blockId: string, text: string) => void;
  handleDeleteComment: (blockId: string, commentId: string) => void;
  handleReplyComment: (blockId: string, parentId: string, text: string) => void;
  handleOpenFrameComments: (frame: Frame, anchor: { x: number; y: number }) => void;
  handleAddFrameComment: (frameId: string, text: string) => void;
  handleDeleteFrameComment: (frameId: string, commentId: string) => void;
  handleReplyFrameComment: (frameId: string, parentId: string, text: string) => void;
}

export interface CanvasState {
  blocks: Block[];
  frames: Frame[];
  connectors?: Connector[];
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
  /** Current user identity — attached to comments/replies as author. */
  identity?: { id: string; name: string; color: string };
}
