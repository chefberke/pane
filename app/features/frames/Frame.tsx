'use client';
import { memo, useState } from 'react';
import type { Block, Frame as FrameType } from '@/app/features/types';
import FrameTitle from './FrameTitle';
import CollapsedFrame from './CollapsedFrame';
import FrameActionPill from './FrameActionPill';
import CommentBubble from '../comments/CommentBubble';
import SelectionOutline from '../ui/SelectionOutline';
import { useFrameDrag } from './hooks/useFrameDrag';
import { useFrameResize, type ResizeDir } from './hooks/useFrameResize';
import {
  FRAME_COLORS,
  FRAME_DROP_TRANSITION_MS,
  FRAME_HEADER_HEIGHT,
  FRAME_HEADER_OFFSET,
  FRAME_RADIUS,
  FRAME_RESIZE_CORNER_SIZE,
  FRAME_RESIZE_EDGE_SIZE,
} from './constants';
import type { FrameDropPreview, FrameHandlers, FrameRenameRequest } from './types';

interface Props {
  frame: FrameType;
  scale: number;
  selected: boolean;
  memberCount: number;
  descendantBlocks: Block[];
  handlers: FrameHandlers;
  dropPreview?: FrameDropPreview;
  /** A one-shot rename request (driven by the context menu); enters inline-edit when its id matches. */
  renameRequest?: FrameRenameRequest | null;
}

/** Frame container — dashed-bordered rectangle with external header above and floating action pill. */
function Frame({ frame, scale, selected, memberCount, descendantBlocks, handlers, dropPreview, renameRequest }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const canEdit = handlers.canEdit;

  // Enter inline-edit when a new rename request targets this (expanded) frame.
  // Render-phase "compare previous prop" pattern (mirrors FrameTitle) — sets local state only.
  const [seenRename, setSeenRename] = useState(renameRequest);
  if (renameRequest !== seenRename) {
    setSeenRename(renameRequest);
    if (renameRequest && !frame.collapsed && renameRequest.id === frame.id) setIsEditing(true);
  }

  const { onTitleDragPointerDown } = useFrameDrag({
    frameId: frame.id,
    scale,
    canEdit,
    onMove: handlers.onDragMove,
    onEnd: handlers.onDragEnd,
    onSelect: handlers.onSelect,
    onBeforeMutate: handlers.onBeforeMutate,
  });

  const { onHandlePointerDown } = useFrameResize({
    frame,
    scale,
    onResize: handlers.onResize,
    onBeforeMutate: handlers.onBeforeMutate,
  });

  if (frame.collapsed) {
    return (
      <CollapsedFrame
        frame={frame}
        descendantBlocks={descendantBlocks}
        selected={selected}
        handlers={handlers}
        onDragPointerDown={onTitleDragPointerDown}
        dropPreview={dropPreview}
        renameRequest={renameRequest}
      />
    );
  }

  const tokens = FRAME_COLORS[frame.color];
  const comments = frame.comments ?? [];
  const lastComment = comments.length > 0 ? comments[comments.length - 1] : null;
  const pillVisible = selected || isHovered || isEditing;
  const previewRect = dropPreview?.rect;
  const dropActive = dropPreview?.active === true;
  const boxLeft = previewRect?.x ?? frame.x;
  const boxTop = previewRect?.y ?? frame.y;
  const boxWidth = previewRect?.width ?? frame.width;
  const boxHeight = previewRect?.height ?? frame.height;

  return (
    <div
      data-frame-id={frame.id}
      className="absolute"
      style={{
        left: boxLeft,
        top: boxTop,
        width: boxWidth,
        height: boxHeight,
        background: dropActive ? tokens.bgHover : tokens.bg,
        border: `1.5px dashed ${dropActive ? tokens.borderActive : tokens.border}`,
        borderRadius: FRAME_RADIUS,
        boxShadow: dropActive ? `0 0 0 4px ${tokens.glow}` : undefined,
        transition: `left ${FRAME_DROP_TRANSITION_MS}ms ease-out, top ${FRAME_DROP_TRANSITION_MS}ms ease-out, width ${FRAME_DROP_TRANSITION_MS}ms ease-out, height ${FRAME_DROP_TRANSITION_MS}ms ease-out, background 150ms ease-out, border-color 150ms ease-out, box-shadow 150ms ease-out`,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Local selection — animated marching-ants ring just outside the frame border. */}
      {selected && <SelectionOutline radius={FRAME_RADIUS} />}

      {/* External header (chevron + title + count) above frame top-left. */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: -(FRAME_HEADER_HEIGHT + FRAME_HEADER_OFFSET),
          height: FRAME_HEADER_HEIGHT,
          maxWidth: Math.max(80, boxWidth - 200),
          pointerEvents: 'auto',
        }}
      >
        {lastComment && (
          <CommentBubble comment={lastComment} visible={isHovered && !selected} />
        )}
        <FrameTitle
          frame={frame}
          memberCount={memberCount}
          isEditing={isEditing}
          canEdit={canEdit}
          onToggleCollapse={() => handlers.onToggleCollapse(frame.id)}
          onCommitRename={title => { handlers.onRename(frame.id, title); setIsEditing(false); }}
          onCancelRename={() => setIsEditing(false)}
          onDragPointerDown={onTitleDragPointerDown}
        />
      </div>

      {/* Floating action pill — outside frame, above top-right corner (editors only) */}
      {canEdit && (
        <FrameActionPill
          frame={frame}
          visible={pillVisible}
          onOpenComments={anchor => handlers.onOpenComments(frame, anchor)}
          onStartRename={() => setIsEditing(true)}
          onColorChange={c => handlers.onColorChange(frame.id, c)}
          onDelete={() => handlers.onDelete(frame.id)}
        />
      )}

      {/* Full-area drag zone — sits below blocks so they still receive pointer events, above nothing. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'auto',
          cursor: canEdit ? 'grab' : 'default',
          zIndex: 1,
        }}
        onPointerDown={onTitleDragPointerDown}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); handlers.onContextMenu(frame.id, e.clientX, e.clientY); }}
      />

      {/* Invisible perimeter resize zones — 4 edges + 4 corners (editors only). */}
      {canEdit && (
        <>
          <EdgeZone dir="n" onPointerDown={onHandlePointerDown('n')} />
          <EdgeZone dir="s" onPointerDown={onHandlePointerDown('s')} />
          <EdgeZone dir="w" onPointerDown={onHandlePointerDown('w')} />
          <EdgeZone dir="e" onPointerDown={onHandlePointerDown('e')} />
          <CornerZone dir="nw" onPointerDown={onHandlePointerDown('nw')} />
          <CornerZone dir="ne" onPointerDown={onHandlePointerDown('ne')} />
          <CornerZone dir="sw" onPointerDown={onHandlePointerDown('sw')} />
          <CornerZone dir="se" onPointerDown={onHandlePointerDown('se')} />
        </>
      )}
    </div>
  );
}

const CURSORS: Record<ResizeDir, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
};

interface ZoneProps {
  dir: ResizeDir;
  onPointerDown: (e: React.PointerEvent) => void;
}

function EdgeZone({ dir, onPointerDown }: ZoneProps) {
  const t = FRAME_RESIZE_EDGE_SIZE;
  const half = t / 2;
  const style: React.CSSProperties = {
    position: 'absolute',
    cursor: CURSORS[dir],
    pointerEvents: 'auto',
    zIndex: 2,
  };
  if (dir === 'n') { style.left = 0; style.right = 0; style.top = -half; style.height = t; }
  if (dir === 's') { style.left = 0; style.right = 0; style.bottom = -half; style.height = t; }
  if (dir === 'w') { style.top = 0; style.bottom = 0; style.left = -half; style.width = t; }
  if (dir === 'e') { style.top = 0; style.bottom = 0; style.right = -half; style.width = t; }
  return <div style={style} onPointerDown={onPointerDown} />;
}

function CornerZone({ dir, onPointerDown }: ZoneProps) {
  const s = FRAME_RESIZE_CORNER_SIZE;
  const half = s / 2;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: s,
    height: s,
    cursor: CURSORS[dir],
    pointerEvents: 'auto',
    zIndex: 3,
  };
  if (dir === 'nw') { style.left = -half; style.top = -half; }
  if (dir === 'ne') { style.right = -half; style.top = -half; }
  if (dir === 'sw') { style.left = -half; style.bottom = -half; }
  if (dir === 'se') { style.right = -half; style.bottom = -half; }
  return <div style={style} onPointerDown={onPointerDown} />;
}

export default memo(Frame);
