'use client';
import { memo, useCallback, useRef, useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Block, ConnectorSide } from '@/app/features/types';
import type { BlockHandlers } from './types';
import LinkPreview from './renderers/LinkPreview';
import YoutubeEmbed from './renderers/YoutubeEmbed';
import TwitterEmbed from './renderers/TwitterEmbed';
import ImageEmbed from './renderers/ImageEmbed';
import TextNote from './renderers/TextNote';
import SpotifyEmbed from './renderers/SpotifyEmbed';
import MapEmbed from './renderers/MapEmbed';
import PdfEmbed from './renderers/PdfEmbed';
import GithubEmbed from './renderers/GithubEmbed';
import { useBlockDrag } from './hooks/useBlockDrag';
import { useBlockResize } from './hooks/useBlockResize';
import { useBlockMeasure } from './hooks/useBlockMeasure';
import CommentBubble from '../comments/CommentBubble';
import ActionTip from './ActionTip';
import BlockEdgeHandles from './BlockEdgeHandles';
import BlockResizeHandles from './BlockResizeHandles';
import SelectionOutline from '../ui/SelectionOutline';
import { NOTE_DEFAULT_H, NOTE_DEFAULT_W } from './constants';

interface Props {
  block: Block;
  scale: number;
  selected: boolean;
  isInMultiSelection: boolean;
  isDropTarget: boolean;
  /** Colors of remote peers currently selecting this block — drawn as outline ring(s) on the card. */
  peerColors?: string[];
  handlers: BlockHandlers;
}

const DRAG_OVERLAY_STYLE: CSSProperties = { display: 'none' };
/** Card corner radius (px) — matches `rounded-2xl` (--radius-2xl = 11px in the theme). */
const CARD_RADIUS = 11;
const ACTION_PILL_STYLE: CSSProperties = { background: 'var(--color-surface-action)' };

/** Draggable block container — renders the appropriate embed and delegates interaction via handlers. */
function BlockContainer({ block, scale, selected, isInMultiSelection, isDropTarget, peerColors, handlers }: Props) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const comments = block.comments ?? [];
  const commentCount = comments.length;
  const lastComment = commentCount > 0 ? comments[comments.length - 1] : null;

  const { onUpdate, onConnectorStart, canEdit } = handlers;
  const onUpdateText = useCallback(
    (content: string) => onUpdate(block.id, { content } as Partial<Block>),
    [block.id, onUpdate],
  );
  const onStopEditText = useCallback(() => setIsEditingText(false), []);
  const handleConnectorStart = useCallback(
    (side: ConnectorSide, e: React.PointerEvent) => onConnectorStart?.(block.id, side, e),
    [onConnectorStart, block.id],
  );

  const { containerRef, overlayRef, onPointerDown } = useBlockDrag({
    block,
    scale,
    isInMultiSelection,
    canEdit,
    onSelect: handlers.onSelect,
    onClickEnd: handlers.onClickEnd,
    onUpdate: handlers.onUpdate,
    onMultiDragMove: handlers.onMultiDragMove,
    onMultiDragEnd: handlers.onMultiDragEnd,
    onBeforeDragCommit: handlers.onBeforeDragCommit,
    onDragRect: handlers.onDragRect,
  });

  // Note (text) resize — width is free; height floors at the note's content ("content is the floor").
  const cardRef = useRef<HTMLDivElement>(null);
  const noteContentRef = useRef<HTMLDivElement>(null);
  const { onHandlePointerDown } = useBlockResize({
    block,
    scale,
    onUpdate,
    onBeforeMutate: handlers.onBeforeDragCommit,
    boxRef: cardRef,
    contentRef: noteContentRef,
  });
  useBlockMeasure({ id: block.id, cardRef, onMeasure: handlers.onMeasure });
  const isNote = block.type === 'text';
  const showResizeHandles = isNote && canEdit && (selected || isHovered) && !isEditingText;

  return (
    <div
      ref={containerRef}
      data-block-id={block.id}
      className="absolute group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        left: block.x,
        top: block.y,
        zIndex: selected ? 100 : 1,
        cursor: canEdit ? 'grab' : 'default',
        willChange: 'transform',
      }}
      onPointerDown={isEditingText ? undefined : onPointerDown}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); handlers.onContextMenu(block.id, e.clientX, e.clientY); }}
      onDoubleClick={e => {
        e.stopPropagation();
        if (block.type === 'text') {
          if (canEdit) setIsEditingText(true);
        } else {
          handlers.onOpen(block);   // opening links/embeds is a view action — allowed for viewers
        }
      }}
    >
      {/* Overlay blocks iframe pointer events while dragging */}
      <div ref={overlayRef} className="absolute inset-0 z-20" style={DRAG_OVERLAY_STYLE} />

      {/* Comment bubble */}
      {lastComment && (
        <CommentBubble comment={lastComment} visible={isHovered && !selected} />
      )}

      {/* Card */}
      <div
        ref={cardRef}
        className="rounded-2xl overflow-hidden transition-shadow duration-150"
        style={{
          boxShadow: selected || isHovered || isDropTarget ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
          // Notes are resizable: width is user-driven, height floors at content (see useBlockResize).
          ...(isNote
            ? {
                width: block.width ?? NOTE_DEFAULT_W,
                minHeight: block.height ?? NOTE_DEFAULT_H,
                background: 'var(--color-surface-note)',
              }
            : null),
        }}
      >
        {block.type === 'link' && <LinkPreview block={block} />}
        {block.type === 'youtube' && <YoutubeEmbed block={block} />}
        {block.type === 'twitter' && <TwitterEmbed block={block} />}
        {block.type === 'image' && <ImageEmbed block={block} />}
        {block.type === 'spotify' && <SpotifyEmbed block={block} />}
        {block.type === 'map' && <MapEmbed block={block} />}
        {block.type === 'pdf' && <PdfEmbed block={block} />}
        {block.type === 'github' && <GithubEmbed block={block} />}
        {block.type === 'text' && (
          <TextNote
            block={block}
            onUpdate={onUpdateText}
            isEditing={isEditingText}
            onStopEdit={onStopEditText}
            rootRef={noteContentRef}
          />
        )}
      </div>

      {/* Local selection / connector drop target — animated marching-ants ring hugging the card. */}
      {(selected || isDropTarget) && <SelectionOutline radius={CARD_RADIUS} />}

      {/* Remote peer selection outline(s) — painted on the real card so they always hug its
          rendered size (e.g. a tall image), unlike a separately-measured box. */}
      {peerColors && peerColors.length > 0 && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: peerColors.map((c, i) => `0 0 0 ${2 * (i + 1)}px ${c}`).join(', ') }}
        />
      )}

      {/* Action toolbar pill (editors only — viewers get no delete/comment affordances) */}
      {canEdit && (
      <div
        className={[
          'absolute -top-8 right-0 flex items-center backdrop-blur-sm rounded-full px-0.5 py-0.5 gap-0 z-10 transition-opacity duration-150',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
        style={ACTION_PILL_STYLE}
      >
        <ActionTip label="Comments">
          <button
            className="flex items-center gap-1 px-2 py-1 rounded-full transition-colors hover:bg-blue-500/80"
            style={{ color: 'var(--color-text-on-action)', cursor: 'default' }}
            onClick={e => { e.stopPropagation(); handlers.onOpenComments(block, { x: e.clientX, y: e.clientY }); }}
            onPointerDown={e => e.stopPropagation()}
          >
            <MessageCircle size={11} />
            {commentCount > 0 && (
              <span className="text-[10px] font-medium leading-none">{commentCount}</span>
            )}
          </button>
        </ActionTip>
        <div className="w-px h-3 mx-0.5" style={{ background: 'var(--color-border-subtle)' }} />
        <ActionTip label="Delete">
          <button
            className="flex items-center px-2 py-1 rounded-full transition-colors hover:bg-red-500/80"
            style={{ color: 'var(--color-text-on-action)', cursor: 'default' }}
            onClick={e => { e.stopPropagation(); handlers.onDelete(block.id); }}
            onPointerDown={e => e.stopPropagation()}
          >
            <Trash2 size={11} />
          </button>
        </ActionTip>
      </div>
      )}

      {/* Edge connection handles (hover) */}
      {onConnectorStart && !isEditingText && isHovered && (
        <BlockEdgeHandles onStart={handleConnectorStart} />
      )}

      {/* Note resize handles — 4 edges + 4 corners, hugging the card box (editors only). */}
      {showResizeHandles && <BlockResizeHandles onHandlePointerDown={onHandlePointerDown} />}
    </div>
  );
}

export default memo(BlockContainer);
