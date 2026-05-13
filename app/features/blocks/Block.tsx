'use client';
import { memo } from 'react';
import type { Block } from '@/types';
import type { BlockHandlers } from './types';
import LinkPreview from './renderers/LinkPreview';
import YoutubeEmbed from './renderers/YoutubeEmbed';
import TwitterEmbed from './renderers/TwitterEmbed';
import ImageEmbed from './renderers/ImageEmbed';
import TextNote from './renderers/TextNote';
import { useBlockDrag } from './hooks/useBlockDrag';

interface Props {
  block: Block;
  scale: number;
  selected: boolean;
  isInMultiSelection: boolean;
  handlers: BlockHandlers;
}

/** Draggable block container — renders the appropriate embed and delegates interaction via handlers. */
function BlockContainer({ block, scale, selected, isInMultiSelection, handlers }: Props) {
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
  });

  return (
    <div
      ref={containerRef}
      data-block-id={block.id}
      className="absolute group"
      style={{
        left: block.x,
        top: block.y,
        zIndex: selected ? 100 : 1,
        cursor: 'grab',
        willChange: 'transform',
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={e => { e.stopPropagation(); handlers.onOpen(block); }}
    >
      {/* Overlay blocks iframe pointer events while dragging */}
      <div ref={overlayRef} className="absolute inset-0 z-20" style={{ display: 'none' }} />

      {/* Card */}
      <div
        className={[
          'rounded-2xl overflow-hidden transition-shadow duration-150',
          selected
            ? 'shadow-xl ring-2 ring-blue-400/60 dark:ring-white/20 ring-offset-1 dark:ring-offset-[#161616]'
            : 'shadow-md hover:shadow-lg dark:shadow-black/50',
        ].join(' ')}
      >
        {block.type === 'link' && <LinkPreview block={block} />}
        {block.type === 'youtube' && <YoutubeEmbed block={block} />}
        {block.type === 'twitter' && <TwitterEmbed block={block} />}
        {block.type === 'image' && <ImageEmbed block={block} />}
        {block.type === 'text' && (
          <TextNote block={block} onUpdate={content => handlers.onUpdate(block.id, { content } as Partial<Block>)} />
        )}
      </div>

      {/* Delete */}
      <button
        className={[
          'absolute -top-2.5 -right-2.5 w-6 h-6 bg-gray-700 dark:bg-[#3a3a3a] text-white rounded-full text-sm leading-none flex items-center justify-center hover:bg-red-500 transition-colors z-10',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
        style={{ cursor: 'default' }}
        onClick={e => { e.stopPropagation(); handlers.onDelete(block.id); }}
        onPointerDown={e => e.stopPropagation()}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default memo(BlockContainer);
