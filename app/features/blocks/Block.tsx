'use client';
import { memo, useState } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Block } from '@/app/features/types';
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
import CommentBubble from '../comments/CommentBubble';
import ActionTip from './ActionTip';

interface Props {
  block: Block;
  scale: number;
  selected: boolean;
  isInMultiSelection: boolean;
  handlers: BlockHandlers;
}

/** Draggable block container — renders the appropriate embed and delegates interaction via handlers. */
function BlockContainer({ block, scale, selected, isInMultiSelection, handlers }: Props) {
  const [isEditingText, setIsEditingText] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const comments = block.comments ?? [];
  const commentCount = comments.length;
  const lastComment = commentCount > 0 ? comments[comments.length - 1] : null;

  const { containerRef, overlayRef, onPointerDown } = useBlockDrag({
    block,
    scale,
    isInMultiSelection,
    onSelect: handlers.onSelect,
    onClickEnd: handlers.onClickEnd,
    onUpdate: handlers.onUpdate,
    onMultiDragMove: handlers.onMultiDragMove,
    onMultiDragEnd: handlers.onMultiDragEnd,
    onBeforeDragCommit: handlers.onBeforeDragCommit,
    onDragRect: handlers.onDragRect,
  });

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
        cursor: 'grab',
        willChange: 'transform',
      }}
      onPointerDown={isEditingText ? undefined : onPointerDown}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); handlers.onContextMenu(block.id, e.clientX, e.clientY); }}
      onDoubleClick={e => {
        e.stopPropagation();
        if (block.type === 'text') {
          setIsEditingText(true);
        } else {
          handlers.onOpen(block);
        }
      }}
    >
      {/* Overlay blocks iframe pointer events while dragging */}
      <div ref={overlayRef} className="absolute inset-0 z-20" style={{ display: 'none' }} />

      {/* Comment bubble */}
      {lastComment && (
        <CommentBubble comment={lastComment} visible={isHovered && !selected} />
      )}

      {/* Card */}
      <div
        className={[
          'rounded-2xl overflow-hidden transition-shadow duration-150',
          selected ? 'shadow-xl' : 'shadow-md hover:shadow-lg',
        ].join(' ')}
        style={selected ? {
          outline: '2px solid var(--color-ring-selection)',
          outlineOffset: '1px',
        } : undefined}
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
            onUpdate={content => handlers.onUpdate(block.id, { content } as Partial<Block>)}
            isEditing={isEditingText}
            onStopEdit={() => setIsEditingText(false)}
          />
        )}
      </div>

      {/* Action toolbar pill */}
      <div
        className={[
          'absolute -top-8 right-0 flex items-center backdrop-blur-sm rounded-full px-0.5 py-0.5 gap-0 z-10 transition-opacity duration-150',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
        style={{ background: 'var(--color-surface-action)' }}
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
    </div>
  );
}

export default memo(BlockContainer);
