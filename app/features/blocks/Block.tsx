'use client';
import { memo } from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Block } from '@/app/features/types';
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

      {/* Action toolbar pill */}
      <div
        className={[
          'absolute -top-8 right-0 flex items-center bg-gray-800/90 dark:bg-[#222]/90 backdrop-blur-sm rounded-full px-0.5 py-0.5 gap-0 z-10 transition-opacity duration-150',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-full text-white/70 hover:text-white hover:bg-blue-500/80 transition-colors"
          style={{ cursor: 'default' }}
          onClick={e => { e.stopPropagation(); handlers.onOpenComments(block, { x: e.clientX, y: e.clientY }); }}
          onPointerDown={e => e.stopPropagation()}
          title="Comments"
        >
          <MessageCircle size={11} />
          {(block.comments?.length ?? 0) > 0 && (
            <span className="text-[10px] font-medium leading-none">{block.comments!.length}</span>
          )}
        </button>
        <div className="w-px h-3 bg-white/10 mx-0.5" />
        <button
          className="flex items-center px-2 py-1 rounded-full text-white/70 hover:text-white hover:bg-red-500/80 transition-colors"
          style={{ cursor: 'default' }}
          onClick={e => { e.stopPropagation(); handlers.onDelete(block.id); }}
          onPointerDown={e => e.stopPropagation()}
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

export default memo(BlockContainer);
