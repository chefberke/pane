'use client';
import { memo, useRef, useEffect, useCallback } from 'react';
import type { Block } from '@/types';
import LinkPreview from './renderers/LinkPreview';
import YoutubeEmbed from './renderers/YoutubeEmbed';
import TwitterEmbed from './renderers/TwitterEmbed';
import ImageEmbed from './renderers/ImageEmbed';
import TextNote from './renderers/TextNote';
import { DRAG_THRESHOLD } from './constants';

/** Props for the draggable block container. */
interface Props {
  block: Block;
  /** Current canvas scale — used to convert screen px to canvas units during drag. */
  scale: number;
  selected: boolean;
  isInMultiSelection: boolean;
  onSelect: (id: string, shiftKey: boolean) => void;
  onClickEnd: (id: string, wasDragged: boolean) => void;
  onUpdate: (id: string, updates: Partial<Block>) => void;
  onDelete: (id: string) => void;
  onMultiDragMove: (dx: number, dy: number) => void;
  onMultiDragEnd: (dx: number, dy: number) => void;
}

function BlockContainer({
  block, scale, selected, isInMultiSelection,
  onSelect, onClickEnd, onUpdate, onDelete,
  onMultiDragMove, onMultiDragEnd,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dragging = useRef(false);
  const hasDragged = useRef(false);
  const isMultiDrag = useRef(false);
  const dragStart = useRef({ mx: 0, my: 0, bx: 0, by: 0 });
  const dragDelta = useRef({ dx: 0, dy: 0 });

  const scaleRef = useRef(scale);
  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // Keep multi-selection status fresh without re-creating the effect
  const isInMultiRef = useRef(isInMultiSelection);
  useEffect(() => { isInMultiRef.current = isInMultiSelection; }, [isInMultiSelection]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    onSelect(block.id, e.shiftKey);

    // Shift-click just toggles selection — don't start a drag
    if (e.shiftKey) return;

    dragging.current = true;
    hasDragged.current = false;
    isMultiDrag.current = isInMultiRef.current;
    dragDelta.current = { dx: 0, dy: 0 };
    dragStart.current = { mx: e.clientX, my: e.clientY, bx: block.x, by: block.y };

    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
    if (overlayRef.current) overlayRef.current.style.display = 'block';
  }, [block.id, block.x, block.y, onSelect]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const s = scaleRef.current;
      const dx = (e.clientX - dragStart.current.mx) / s;
      const dy = (e.clientY - dragStart.current.my) / s;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) hasDragged.current = true;
      dragDelta.current = { dx, dy };

      if (isMultiDrag.current) {
        onMultiDragMove(dx, dy);
      } else {
        const el = containerRef.current;
        if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
      }
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;

      if (overlayRef.current) overlayRef.current.style.display = 'none';
      const el = containerRef.current;
      if (el) el.style.cursor = 'grab';

      const wasDragged = hasDragged.current;
      onClickEnd(block.id, wasDragged);

      if (!wasDragged) {
        // Just a click — clear any accidental micro-transform
        if (el) el.style.transform = '';
        return;
      }

      if (isMultiDrag.current) {
        onMultiDragEnd(dragDelta.current.dx, dragDelta.current.dy);
      } else {
        if (el) el.style.transform = '';
        onUpdate(block.id, {
          x: dragStart.current.bx + dragDelta.current.dx,
          y: dragStart.current.by + dragDelta.current.dy,
        } as Partial<Block>);
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [block.id, onUpdate, onClickEnd, onMultiDragMove, onMultiDragEnd]);

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
      onMouseDown={handleMouseDown}
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
          <TextNote block={block} onUpdate={content => onUpdate(block.id, { content } as Partial<Block>)} />
        )}
      </div>

      {/* Delete */}
      <button
        className={[
          'absolute -top-2.5 -right-2.5 w-6 h-6 bg-gray-700 dark:bg-[#3a3a3a] text-white rounded-full text-sm leading-none flex items-center justify-center hover:bg-red-500 transition-colors z-10',
          selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
        style={{ cursor: 'default' }}
        onClick={e => { e.stopPropagation(); onDelete(block.id); }}
        onMouseDown={e => e.stopPropagation()}
        title="Delete"
      >
        ×
      </button>
    </div>
  );
}

export default memo(BlockContainer);
