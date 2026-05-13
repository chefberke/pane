'use client';
import { useState, useRef, useCallback, useMemo } from 'react';
import type { Block } from '@/types';
import BlockContainer from '../blocks/Block';
import AddInput from '../add-input/AddInput';
import Toolbar from '../toolbar/Toolbar';
import SearchModal from '../search/SearchModal';
import { ZOOM_STEP, DOT_GRID_SIZE, BLOCK_SIZES } from './constants';
import { uid } from './utils';
import { useViewport } from './hooks/useViewport';
import { useTheme } from './hooks/useTheme';
import { useBlocks } from './hooks/useBlocks';
import { useSelection } from './hooks/useSelection';
import { useMarquee } from './hooks/useMarquee';
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard';
import { usePasteUrl } from './hooks/usePasteUrl';

/** Infinite pan/zoom canvas — orchestrates viewport, blocks, selection, and keyboard shortcuts. */
export default function Canvas() {
  const viewportRef = useRef<HTMLDivElement>(null);

  const { isDark, toggleTheme } = useTheme();
  const { offset, scale, offsetRef, setOffset, setScale, screenToCanvas, zoomBy, resetView } = useViewport(viewportRef);
  const { blocks, setBlocks, isRefreshing, addBlockFromUrl, refreshEmbeds, updateBlock, deleteBlock, clearBlocks } = useBlocks({ screenToCanvas });
  const { selectedIds, setSelectedIds, handleBlockSelect, handleBlockClickEnd, handleMultiDragMove, handleMultiDragEnd, deleteSelected } = useSelection({ setBlocks });

  const [addPos, setAddPos] = useState<{ x: number; y: number } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const addTextNote = useCallback(() => {
    const el = viewportRef.current;
    const sx = el ? el.clientWidth / 2 : 400;
    const sy = el ? el.clientHeight / 2 : 300;
    const { x, y } = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.text;
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '', x: x - w / 2, y: y - h / 2 }]);
  }, [screenToCanvas, setBlocks]);

  const { marquee, isPanMode, setIsPanMode, isPanning, onMouseDown, onMouseMove, onMouseUp, onDoubleClick } = useMarquee({
    viewportRef,
    offsetRef,
    setOffset,
    setSelectedIds,
    onDoubleClickCanvas: (sx, sy) => setAddPos({ x: sx, y: sy }),
  });

  useCanvasKeyboard({ setSelectedIds, setAddPos, setIsSearchOpen, setIsPanMode, deleteSelected, addTextNote, toggleTheme, resetView, zoomBy });
  usePasteUrl({ viewportRef, addBlockFromUrl });

  const handleOpenBlock = useCallback((block: Block) => {
    let url: string | null = null;
    if (block.type === 'link' || block.type === 'twitter' || block.type === 'image') url = block.url;
    if (block.type === 'youtube') url = `https://www.youtube.com/watch?v=${block.videoId}`;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    deleteBlock(id);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  }, [deleteBlock, setSelectedIds]);

  const handleAddSubmit = useCallback((value: string, sx: number, sy: number) => {
    setAddPos(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    if (/^https?:\/\//i.test(trimmed)) {
      addBlockFromUrl(trimmed, sx, sy);
    } else {
      const { x, y } = screenToCanvas(sx, sy);
      const { w, h } = BLOCK_SIZES.text;
      setBlocks(prev => [...prev, { id: uid(), type: 'text', content: trimmed, x: x - w / 2, y: y - h / 2 }]);
    }
  }, [addBlockFromUrl, screenToCanvas, setBlocks]);

  const navigateToBlock = useCallback((block: Block) => {
    setIsSearchOpen(false);
    setSelectedIds(new Set([block.id]));
    const el = viewportRef.current;
    if (!el) return;
    const { w, h } = BLOCK_SIZES[block.type];
    setScale(1);
    setOffset({ x: el.clientWidth / 2 - (block.x + w / 2), y: el.clientHeight / 2 - (block.y + h / 2) });
  }, [setOffset, setScale, setSelectedIds]);

  const blockHandlers = useMemo(() => ({
    onSelect: handleBlockSelect,
    onClickEnd: handleBlockClickEnd,
    onOpen: handleOpenBlock,
    onUpdate: updateBlock,
    onDelete: handleDeleteBlock,
    onMultiDragMove: handleMultiDragMove,
    onMultiDragEnd: handleMultiDragEnd,
  }), [handleBlockSelect, handleBlockClickEnd, handleOpenBlock, updateBlock, handleDeleteBlock, handleMultiDragMove, handleMultiDragEnd]);

  const toolbarActions = useMemo(() => ({
    zoomIn: () => zoomBy(ZOOM_STEP),
    zoomOut: () => zoomBy(1 / ZOOM_STEP),
    reset: resetView,
    addText: addTextNote,
    clear: () => { if (window.confirm('Remove all blocks from the canvas?')) { clearBlocks(); setSelectedIds(new Set()); } },
    toggleTheme,
    togglePanMode: () => setIsPanMode(p => !p),
    search: () => setIsSearchOpen(true),
    refresh: refreshEmbeds,
  }), [zoomBy, resetView, addTextNote, clearBlocks, setSelectedIds, toggleTheme, setIsPanMode, refreshEmbeds]);

  const toolbarStatus = { scale, blockCount: blocks.length, isDark, isPanMode, hasRefreshable: blocks.some(b => b.type === 'link'), isRefreshing };
  const inPanMode = isPanMode || isPanning.current;
  const gridSize = DOT_GRID_SIZE * scale;

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: isDark ? '#161616' : '#f1f0ee',
        cursor: isPanning.current ? 'grabbing' : inPanMode ? 'grab' : 'default',
      }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDoubleClick={onDoubleClick}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDark ? '#2e2e2e' : '#c8c5bf'} 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${offset.x % gridSize}px ${offset.y % gridSize}px`,
        }}
      />

      {/* Canvas world */}
      <div
        className="absolute"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', willChange: 'transform' }}
      >
        {blocks.map(block => (
          <BlockContainer
            key={block.id}
            block={block}
            scale={scale}
            selected={selectedIds.has(block.id)}
            isInMultiSelection={selectedIds.size > 1 && selectedIds.has(block.id)}
            handlers={blockHandlers}
          />
        ))}
      </div>

      {/* Marquee selection box */}
      {marquee && (
        <div
          className="absolute pointer-events-none z-50"
          style={{
            left: marquee.x1,
            top: marquee.y1,
            width: marquee.x2 - marquee.x1,
            height: marquee.y2 - marquee.y1,
            border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            borderRadius: 3,
          }}
        />
      )}

      {addPos && (
        <AddInput
          x={addPos.x}
          y={addPos.y}
          onSubmit={val => handleAddSubmit(val, addPos.x, addPos.y)}
          onClose={() => setAddPos(null)}
        />
      )}

      {isSearchOpen && (
        <SearchModal
          blocks={blocks}
          isDark={isDark}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={navigateToBlock}
        />
      )}

      <Toolbar status={toolbarStatus} actions={toolbarActions} />

      {blocks.length === 0 && !addPos && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <p className="text-gray-400 dark:text-[#4a4a4a] text-base font-medium">Double-click anywhere to add content</p>
          <p className="text-gray-300 dark:text-[#363636] text-sm mt-1">Or paste a URL to place it on the canvas</p>
        </div>
      )}
    </div>
  );
}
