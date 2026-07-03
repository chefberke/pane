'use client';
import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import type { Block, Frame } from '@/app/features/types';
import FrameTitle from './FrameTitle';
import FrameActionPill from './FrameActionPill';
import ThumbnailGrid from './ThumbnailGrid';
import CommentBubble from '../comments/CommentBubble';
import SelectionOutline from '../ui/SelectionOutline';
import {
  FRAME_COLLAPSED_H,
  FRAME_COLLAPSED_W,
  FRAME_COLORS,
  FRAME_DROP_COLLAPSED_SCALE,
  FRAME_HEADER_HEIGHT,
  FRAME_HEADER_OFFSET,
  FRAME_RADIUS,
} from './constants';
import type { FrameDropPreview, FrameHandlers, FrameRenameRequest } from './types';

interface Props {
  frame: Frame;
  descendantBlocks: Block[];
  selected: boolean;
  handlers: FrameHandlers;
  onDragPointerDown: (e: React.PointerEvent) => void;
  dropPreview?: FrameDropPreview;
  renameRequest?: FrameRenameRequest | null;
}

/** Collapsed frame: a dashed-bordered card with thumbnail grid, plus external header + action pill above. */
export default function CollapsedFrame({ frame, descendantBlocks, selected, handlers, onDragPointerDown, dropPreview, renameRequest }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const canEdit = handlers.canEdit;

  // Enter inline-edit when a new rename request targets this frame (render-phase compare; local state only).
  const [seenRename, setSeenRename] = useState(renameRequest);
  if (renameRequest !== seenRename) {
    setSeenRename(renameRequest);
    if (renameRequest && renameRequest.id === frame.id) setIsEditing(true);
  }
  const tokens = FRAME_COLORS[frame.color];
  const comments = frame.comments ?? [];
  const lastComment = comments.length > 0 ? comments[comments.length - 1] : null;
  const pillVisible = selected || isHovered || isEditing;
  const dropActive = dropPreview?.active === true;

  return (
    <div
      data-frame-id={frame.id}
      className="absolute"
      style={{
        left: frame.x,
        top: frame.y,
        width: FRAME_COLLAPSED_W,
        height: FRAME_COLLAPSED_H,
        background: dropActive ? tokens.bgHover : tokens.bg,
        border: `1.5px dashed ${dropActive ? tokens.borderActive : tokens.border}`,
        borderRadius: FRAME_RADIUS,
        boxShadow: dropActive
          ? `var(--shadow-float-hover), 0 0 0 5px ${tokens.glow}`
          : (selected ? 'var(--shadow-float-hover)' : 'var(--shadow-card)'),
        transform: dropActive ? `scale(${FRAME_DROP_COLLAPSED_SCALE})` : undefined,
        transformOrigin: 'center center',
        transition: 'transform 180ms ease-out, box-shadow 180ms ease-out, background 150ms ease-out, border-color 150ms ease-out',
        zIndex: 50,
        cursor: canEdit ? 'grab' : 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onPointerDown={onDragPointerDown}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); handlers.onContextMenu(frame.id, e.clientX, e.clientY); }}
    >
      {/* Local selection — animated marching-ants ring just outside the card. */}
      {selected && <SelectionOutline radius={FRAME_RADIUS} />}

      {/* External header above card top-left. */}
      <div
        className="absolute"
        style={{
          left: 0,
          top: -(FRAME_HEADER_HEIGHT + FRAME_HEADER_OFFSET),
          height: FRAME_HEADER_HEIGHT,
          maxWidth: FRAME_COLLAPSED_W - 160,
          pointerEvents: 'auto',
        }}
      >
        {lastComment && (
          <CommentBubble comment={lastComment} visible={isHovered && !selected} />
        )}
        <FrameTitle
          frame={frame}
          memberCount={descendantBlocks.length}
          isEditing={isEditing}
          canEdit={canEdit}
          onToggleCollapse={() => handlers.onToggleCollapse(frame.id)}
          onCommitRename={title => { handlers.onRename(frame.id, title); setIsEditing(false); }}
          onCancelRename={() => setIsEditing(false)}
          onDragPointerDown={onDragPointerDown}
        />
      </div>

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

      {/* Preview only — pointer-events off so drags fall through to the draggable card body. */}
      <div className="w-full h-full p-2" style={{ pointerEvents: 'none' }}>
        <ThumbnailGrid blocks={descendantBlocks} />
      </div>

      {dropActive && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            background: tokens.bgHover,
            backdropFilter: 'blur(2px)',
            borderRadius: 11,
          }}
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold"
            style={{
              background: 'var(--color-surface-action)',
              color: 'var(--color-text-on-action)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <FolderPlus size={12} />
            <span>Drop to add</span>
          </div>
        </div>
      )}
    </div>
  );
}
