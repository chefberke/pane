'use client';
import { useState, useRef, useCallback, useMemo } from 'react';
import type { Block, Frame } from '@/app/features/types';
import type { CanvasProps } from './types';
import type { Rect } from '../frames/types';
import { BLOCK_SIZES, MIN_SCALE, MAX_SCALE, ZOOM_TO_FIT_PADDING, CONNECTOR_DRAG_SHIELD_Z } from './constants';
import { uid } from './utils';
import {
  blockRect,
  findEnclosingFrame,
  frameAncestorCollapsed,
  frameDescendantBlocks,
  frameMembers,
  isInsideCollapsedFrame,
  sortFramesByDepth,
} from '../frames/utils';
import type { FrameHandlers, FrameRenameRequest } from '../frames/types';
import { useViewport } from './hooks/useViewport';
import { useTheme } from './hooks/useTheme';
import { useBlocks } from './hooks/useBlocks';
import { useSelection } from './hooks/useSelection';
import { useMarquee } from './hooks/useMarquee';
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard';
import { usePasteUrl } from './hooks/usePasteUrl';
import { useHistory } from './hooks/useHistory';
import { usePinchZoom } from './hooks/usePinchZoom';
import { useLatestRef } from './hooks/useLatestRef';
import { useFollowViewport } from './hooks/useFollowViewport';
import { useFrames } from '../frames/hooks/useFrames';
import { useConnectors } from '../connectors/hooks/useConnectors';
import { useConnectorDrag } from '../connectors/hooks/useConnectorDrag';
import { usePersistence } from './hooks/usePersistence';
import { usePresenceSync } from './hooks/usePresenceSync';
import { useCanvasHint } from './hooks/useCanvasHint';
import { useComments } from './hooks/useComments';
import { useFrameInteractions } from './hooks/useFrameInteractions';
import { useBlockDropTarget } from './hooks/useBlockDropTarget';
import { useCanvasContextMenu } from './hooks/useCanvasContextMenu';
import DotGrid from './DotGrid';
import CanvasWorld from './CanvasWorld';
import CanvasOverlays from './CanvasOverlays';
import { PeerCursors } from './PeerLayer';

/** Infinite pan/zoom canvas — orchestrates viewport, blocks, frames, selection, and keyboard shortcuts. */
export default function Canvas({
  initialState, onSave,
  canEdit = true,
  peers = [],
  onCursorMove,
  onSelectionChange,
  topRightSlot,
  isFollowing = false,
  followTarget,
  onViewportChange,
  identity,
}: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  // ─── Domain hooks ────────────────────────────────────────────────────────
  const { themeChoice, toggleTheme, setTheme } = useTheme();
  const { offset, scale, offsetRef, scaleRef, setOffset, setScale, screenToCanvas, zoomBy, resetView } = useViewport(viewportRef, isFollowing);
  const { blocks, setBlocks, isRefreshing, addBlockFromUrl, refreshEmbeds, updateBlock, deleteBlock } = useBlocks({ screenToCanvas });
  const {
    frames, setFrames, createFromSelection, updateFrame, deleteFrame,
    toggleCollapse, renameFrame, setFrameColor,
  } = useFrames();
  const { connectors, setConnectors, addConnector, deleteConnector, pruneByBlocks } = useConnectors();

  const blocksRef = useLatestRef(blocks);
  const framesRef = useLatestRef(frames);
  const connectorsRef = useLatestRef(connectors);
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistory({ setBlocks, blocksRef, setFrames, framesRef, setConnectors, connectorsRef });
  const { selectedIds, setSelectedIds, handleBlockSelect, handleBlockClickEnd, handleMultiDragMove, handleMultiDragEnd, duplicateSelected, selectAll, nudgeSelected, alignSelected } = useSelection({ blocks, setBlocks, pushSnapshot });

  // ─── Local UI state ──────────────────────────────────────────────────────
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const selectedConnectorIdRef = useLatestRef(selectedConnectorId);
  const [liveDrag, setLiveDrag] = useState<{ ids: Set<string>; dx: number; dy: number } | null>(null);
  const [renameFrameReq, setRenameFrameReq] = useState<FrameRenameRequest | null>(null);
  const [addPos, setAddPos] = useState<{ x: number; y: number } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; alt?: string } | null>(null);
  const [pdfLightbox, setPdfLightbox] = useState<{ url: string; title?: string } | null>(null);
  const selectedIdsRef = useLatestRef(selectedIds);

  usePinchZoom({ viewportRef, setOffset, setScale, offsetRef, scaleRef, disabled: isFollowing });
  usePersistence({ initialState, onSave, canEdit, blocks, frames, connectors, offset, scale, setBlocks, setFrames, setConnectors, setScale, setOffset });
  usePresenceSync({ selectedIds, selectedFrameId, onSelectionChange, offset, scale, isFollowing, onViewportChange, viewportRef });
  useFollowViewport({ isFollowing, followTarget, viewportRef, offset, scale, setOffset, setScale });

  // Live block id → world rect map, used to render connector endpoints and hit-test drop targets.
  const blockRectById = useMemo(() => {
    const m = new Map<string, Rect>();
    for (const b of blocks) m.set(b.id, blockRect(b));
    return m;
  }, [blocks]);
  const blockRectByIdRef = useLatestRef(blockRectById);
  const { pending, startConnector } = useConnectorDrag({ viewportRef, screenToCanvas, rectByIdRef: blockRectByIdRef, addConnector, pushSnapshot });

  const zoomToFit = useCallback(() => {
    const el = viewportRef.current;
    if (!el || blocks.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const b of blocks) {
      const w = b.width ?? BLOCK_SIZES[b.type].w;
      const h = b.height ?? BLOCK_SIZES[b.type].h;
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + w > maxX) maxX = b.x + w;
      if (b.y + h > maxY) maxY = b.y + h;
    }
    const bboxW = maxX - minX;
    const bboxH = maxY - minY;
    const newScale = Math.min(
      (el.clientWidth - ZOOM_TO_FIT_PADDING * 2) / bboxW,
      (el.clientHeight - ZOOM_TO_FIT_PADDING * 2) / bboxH,
      1,
    );
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale(clampedScale);
    setOffset({
      x: el.clientWidth / 2 - ((minX + maxX) / 2) * clampedScale,
      y: el.clientHeight / 2 - ((minY + maxY) / 2) * clampedScale,
    });
  }, [blocks, setScale, setOffset]);

  const addTextNote = useCallback(() => {
    const el = viewportRef.current;
    const sx = el ? el.clientWidth / 2 : 400;
    const sy = el ? el.clientHeight / 2 : 300;
    const { x, y } = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.text;
    pushSnapshot();
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '', x: x - w / 2, y: y - h / 2 }]);
  }, [screenToCanvas, setBlocks, pushSnapshot]);

  /** Adds an empty text note centered on the given screen point (used by the canvas context menu). */
  const addTextNoteAt = useCallback((sx: number, sy: number) => {
    const { x, y } = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.text;
    pushSnapshot();
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '', x: x - w / 2, y: y - h / 2 }]);
  }, [screenToCanvas, setBlocks, pushSnapshot]);

  // ─── Drop/paste hint + comments ──────────────────────────────────────────
  const { hint, flashHint } = useCanvasHint();
  usePasteUrl({ viewportRef, addBlockFromUrl, onPasteImageBlocked: (sx, sy) => flashHint(sx, sy, 'Paste an image/PDF link instead') });

  /** Files aren't hosted — a dropped file just flashes a hint to use a link. */
  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer?.files?.length) return;
    e.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    const sx = rect ? e.clientX - rect.left : 400;
    const sy = rect ? e.clientY - rect.top : 300;
    flashHint(sx, sy, 'Drop a link, not a file');
  }, [flashHint]);
  const { commentTarget, setCommentTarget, commentHandlers } = useComments({ pushSnapshot, updateBlock, updateFrame, blocksRef, framesRef, identity });

  // ─── Selection helpers ───────────────────────────────────────────────────
  const handleFrameSelect = useCallback((id: string) => {
    setSelectedIds(new Set());
    setSelectedConnectorId(null);
    setSelectedFrameId(id);
  }, [setSelectedIds]);

  const clearFrameSelection = useCallback(() => { setSelectedFrameId(null); }, []);

  const handleBlockSelectWithFrameClear = useCallback((id: string, shiftKey: boolean) => {
    setSelectedFrameId(null);
    setSelectedConnectorId(null);
    handleBlockSelect(id, shiftKey);
  }, [handleBlockSelect]);

  /** Selects a single connector, clearing any block/frame selection. */
  const handleSelectConnector = useCallback((id: string) => {
    setSelectedIds(new Set());
    setSelectedFrameId(null);
    setCommentTarget(null);
    setSelectedConnectorId(id);
  }, [setSelectedIds, setCommentTarget]);

  /** Deletes a connector by id (with an undo checkpoint). */
  const handleDeleteConnector = useCallback((id: string) => {
    pushSnapshot();
    deleteConnector(id);
    setSelectedConnectorId(prev => (prev === id ? null : prev));
  }, [deleteConnector, pushSnapshot]);

  /** Group currently selected blocks into a new frame. */
  const groupSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushSnapshot();
    const id = createFromSelection(blocksRef.current, selectedIds);
    if (id) {
      setSelectedIds(new Set());
      setSelectedFrameId(id);
    }
  }, [selectedIds, createFromSelection, blocksRef, pushSnapshot, setSelectedIds]);

  /** Remove the currently selected frame (members stay where they are). */
  const ungroupSelected = useCallback(() => {
    if (!selectedFrameId) return;
    pushSnapshot();
    deleteFrame(selectedFrameId);
    setSelectedFrameId(null);
  }, [selectedFrameId, deleteFrame, pushSnapshot]);

  /** Unified delete: removes the selected frame if one is selected, otherwise blocks (plus any frames whose all descendant blocks are being deleted). */
  const deleteSelectedAny = useCallback(() => {
    if (selectedConnectorIdRef.current) {
      pushSnapshot();
      deleteConnector(selectedConnectorIdRef.current);
      setSelectedConnectorId(null);
      return;
    }
    if (selectedFrameId) {
      pushSnapshot();
      deleteFrame(selectedFrameId);
      setSelectedFrameId(null);
      return;
    }
    if (selectedIdsRef.current.size === 0) return;
    // Also delete frames whose every descendant block is in the selection
    const toDeleteFrames = framesRef.current.filter(f => {
      const descendants = frameDescendantBlocks(f, blocksRef.current, framesRef.current);
      return descendants.size > 0 && [...descendants].every(id => selectedIdsRef.current.has(id));
    });
    pushSnapshot();
    setBlocks(prev => prev.filter(b => !selectedIdsRef.current.has(b.id)));
    pruneByBlocks(selectedIdsRef.current);
    setSelectedIds(new Set());
    if (toDeleteFrames.length > 0) {
      setFrames(prev => prev.filter(f => !toDeleteFrames.some(df => df.id === f.id)));
    }
  }, [selectedConnectorIdRef, deleteConnector, selectedFrameId, deleteFrame, framesRef, blocksRef, selectedIdsRef, pushSnapshot, setBlocks, pruneByBlocks, setSelectedIds, setFrames]);

  const handleOpenBlock = useCallback((block: Block) => {
    // Images open in an in-app lightbox rather than a new tab.
    if (block.type === 'image') {
      if (block.url) setLightbox({ url: block.url, alt: block.alt });
      return;
    }
    // PDFs preview inline in a modal rather than a new tab.
    if (block.type === 'pdf') {
      if (block.url) setPdfLightbox({ url: block.url, title: block.title });
      return;
    }
    let url: string | null = null;
    if (block.type === 'link' || block.type === 'twitter') url = block.url;
    if (block.type === 'youtube') url = `https://www.youtube.com/watch?v=${block.videoId}`;
    if (block.type === 'spotify') url = block.url;
    if (block.type === 'map') url = block.embedUrl;
    if (block.type === 'github') url = block.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    pushSnapshot();
    deleteBlock(id);
    pruneByBlocks(new Set([id]));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setCommentTarget(prev => (prev?.kind === 'block' && prev.id === id) ? null : prev);
  }, [deleteBlock, pruneByBlocks, setSelectedIds, pushSnapshot, setCommentTarget]);

  // ─── Frame interactions + block drop-target ──────────────────────────────
  const {
    handleFrameDragMove, handleFrameDragEnd, handleFrameResize,
    handleFrameRename, handleFrameColor, handleFrameToggleCollapse, handleFrameDelete,
  } = useFrameInteractions({
    blocksRef, framesRef, setBlocks, setFrames,
    updateFrame, renameFrame, setFrameColor, toggleCollapse, deleteFrame,
    pushSnapshot, selectedFrameId, setSelectedFrameId, setCommentTarget,
  });

  const { dragHover, handleBlockDragRect } = useBlockDropTarget({ blocksRef, framesRef, selectedIdsRef, setFrames });

  /** Wraps the drop-target signal so connectors follow blocks live (and smoothly) during a drag, before state commits on drop. */
  const handleBlockDragLive = useCallback((blockId: string, delta: { dx: number; dy: number } | null) => {
    handleBlockDragRect(blockId, delta);
    if (!delta) { setLiveDrag(null); return; }
    const sel = selectedIdsRef.current;
    const ids = sel.size > 1 && sel.has(blockId) ? sel : new Set([blockId]);
    setLiveDrag({ ids, dx: delta.dx, dy: delta.dy });
  }, [handleBlockDragRect, selectedIdsRef]);

  /** Clears the live offset in the same synchronous flush that commits the group move, avoiding a one-frame jump. */
  const handleMultiDragEndLive = useCallback((dx: number, dy: number) => {
    setLiveDrag(null);
    handleMultiDragEnd(dx, dy);
  }, [handleMultiDragEnd]);

  const handleAddSubmit = useCallback((value: string, sx: number, sy: number) => {
    setAddPos(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    pushSnapshot();
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('<iframe')) {
      addBlockFromUrl(trimmed, sx, sy);
    } else {
      const { x, y } = screenToCanvas(sx, sy);
      const { w, h } = BLOCK_SIZES.text;
      setBlocks(prev => [...prev, { id: uid(), type: 'text', content: trimmed, x: x - w / 2, y: y - h / 2 }]);
    }
  }, [addBlockFromUrl, screenToCanvas, setBlocks, pushSnapshot]);

  const navigateToBlock = useCallback((block: Block) => {
    setIsSearchOpen(false);
    setIsItemsOpen(false);
    // If the block is inside a collapsed frame, expand its ancestor chain first.
    let ancestor = findEnclosingFrame(blockRect(block), framesRef.current);
    while (ancestor) {
      if (ancestor.collapsed) updateFrame(ancestor.id, { collapsed: false });
      ancestor = findEnclosingFrame({ x: ancestor.x, y: ancestor.y, width: ancestor.width, height: ancestor.height }, framesRef.current, ancestor.id);
    }
    setSelectedIds(new Set([block.id]));
    setSelectedFrameId(null);
    const el = viewportRef.current;
    if (!el) return;
    const { w, h } = BLOCK_SIZES[block.type];
    setScale(1);
    setOffset({ x: el.clientWidth / 2 - (block.x + w / 2), y: el.clientHeight / 2 - (block.y + h / 2) });
  }, [setOffset, setScale, setSelectedIds, framesRef, updateFrame]);

  const navigateToFrame = useCallback((frame: Frame) => {
    setIsSearchOpen(false);
    setIsItemsOpen(false);
    setSelectedIds(new Set());
    setSelectedFrameId(frame.id);
    const el = viewportRef.current;
    if (!el) return;
    setScale(1);
    setOffset({ x: el.clientWidth / 2 - (frame.x + frame.width / 2), y: el.clientHeight / 2 - (frame.y + frame.height / 2) });
  }, [setOffset, setScale, setSelectedIds]);

  // ─── Context menu (wraps useContextMenu + row builder) ───────────────────
  const contextMenuActions = useMemo(() => ({
    setAddPos,
    addTextNoteAt,
    selectAll,
    resetView,
    handleOpenBlock,
    handleOpenComments: commentHandlers.handleOpenComments,
    duplicateSelected,
    groupSelected,
    deleteSelectedAny,
    handleFrameColor,
    handleOpenFrameComments: commentHandlers.handleOpenFrameComments,
    ungroupSelected,
    handleFrameDelete,
    setRenameFrameReq,
    deleteConnector: handleDeleteConnector,
  }), [addTextNoteAt, selectAll, resetView, handleOpenBlock, commentHandlers, duplicateSelected, groupSelected, deleteSelectedAny, handleFrameColor, ungroupSelected, handleFrameDelete, handleDeleteConnector]);

  const { menu, openMenu, closeMenu, buildMenuRows } = useCanvasContextMenu(contextMenuActions, { blocksRef, framesRef, connectorsRef });

  /** Opens the right-click menu for a connector (selects it first). No-op for viewers. */
  const handleConnectorContextMenu = useCallback((id: string, clientX: number, clientY: number) => {
    if (!canEdit) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;
    handleSelectConnector(id);
    openMenu(buildMenuRows({ kind: 'connector', id }, clientX - rect.left, clientY - rect.top), clientX, clientY, rect);
  }, [canEdit, openMenu, buildMenuRows, handleSelectConnector]);

  // ─── Marquee + keyboard ──────────────────────────────────────────────────
  const { marquee, isPanMode, setIsPanMode, isPanning, onPointerDown, onPointerMove, onPointerUp, onDoubleClick } = useMarquee({
    viewportRef,
    offsetRef,
    setOffset,
    setSelectedIds,
    onDoubleClickCanvas: (sx, sy) => setAddPos({ x: sx, y: sy }),
    onCanvasClick: () => { setAddPos(null); setSelectedFrameId(null); setSelectedConnectorId(null); setCommentTarget(null); closeMenu(); },
  });

  useCanvasKeyboard({
    setSelectedIds, setAddPos, setIsSearchOpen, setIsHelpOpen, setIsPanMode,
    deleteSelected: deleteSelectedAny, duplicateSelected, selectAll, nudgeSelected,
    addTextNote, toggleTheme, resetView, zoomBy, undo, redo,
    groupSelected, ungroupSelected, clearFrameSelection,
    disabled: isFollowing,
  });

  // ─── Handler bags for memoized children ──────────────────────────────────
  const frameHandlers = useMemo<FrameHandlers>(() => ({
    onSelect: handleFrameSelect,
    onRename: handleFrameRename,
    onColorChange: handleFrameColor,
    onToggleCollapse: handleFrameToggleCollapse,
    onDelete: handleFrameDelete,
    onDragMove: handleFrameDragMove,
    onDragEnd: handleFrameDragEnd,
    onResize: handleFrameResize,
    onOpenComments: commentHandlers.handleOpenFrameComments,
    onBeforeMutate: pushSnapshot,
    onContextMenu: (id: string, clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCommentTarget(null);
      handleFrameSelect(id);
      openMenu(buildMenuRows({ kind: 'frame', id }, clientX - rect.left, clientY - rect.top), clientX, clientY, rect);
    },
  }), [handleFrameSelect, handleFrameRename, handleFrameColor, handleFrameToggleCollapse, handleFrameDelete, handleFrameDragMove, handleFrameDragEnd, handleFrameResize, commentHandlers, pushSnapshot, openMenu, buildMenuRows, setCommentTarget]);

  const blockHandlers = useMemo(() => ({
    onSelect: (id: string, shiftKey: boolean) => { setCommentTarget(null); handleBlockSelectWithFrameClear(id, shiftKey); },
    onClickEnd: handleBlockClickEnd,
    onOpen: handleOpenBlock,
    onUpdate: updateBlock,
    onDelete: handleDeleteBlock,
    onOpenComments: commentHandlers.handleOpenComments,
    onMultiDragMove: handleMultiDragMove,
    onMultiDragEnd: handleMultiDragEndLive,
    onBeforeDragCommit: pushSnapshot,
    onDragRect: handleBlockDragLive,
    onContextMenu: (id: string, clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCommentTarget(null);
      if (!selectedIdsRef.current.has(id)) handleBlockSelectWithFrameClear(id, false);
      openMenu(buildMenuRows({ kind: 'block', id }, clientX - rect.left, clientY - rect.top), clientX, clientY, rect);
    },
    onConnectorStart: canEdit ? startConnector : undefined,
  }), [handleBlockSelectWithFrameClear, handleBlockClickEnd, handleOpenBlock, updateBlock, handleDeleteBlock, commentHandlers, handleMultiDragMove, handleMultiDragEndLive, pushSnapshot, handleBlockDragLive, openMenu, selectedIdsRef, buildMenuRows, setCommentTarget, canEdit, startConnector]);

  const toolbarActions = useMemo(() => ({
    addText: addTextNote,
    togglePanMode: () => setIsPanMode(p => !p),
    search: () => setIsSearchOpen(true),
    refresh: refreshEmbeds,
    undo,
    redo,
    alignSelected,
    zoomToFit,
    groupSelected,
  }), [addTextNote, setIsPanMode, refreshEmbeds, undo, redo, alignSelected, zoomToFit, groupSelected]);

  const toolbarStatus = { isPanMode, hasRefreshable: blocks.some(b => b.type === 'link' || b.type === 'github'), isRefreshing, canUndo, canRedo, selectedCount: selectedIds.size };
  const inPanMode = isPanMode || isPanning.current;

  // ─── Derived render data ─────────────────────────────────────────────────

  // Sort frames so outer renders first (lower z), inner on top. Skip frames whose ancestor is collapsed.
  const visibleFrames = useMemo(() => {
    const sorted = sortFramesByDepth(frames);
    return sorted.filter(f => !frameAncestorCollapsed(f, frames));
  }, [frames]);

  // Skip blocks whose nearest ancestor frame is collapsed.
  const visibleBlocks = useMemo(() => {
    if (frames.length === 0) return blocks;
    return blocks.filter(b => !isInsideCollapsedFrame(blockRect(b), frames));
  }, [blocks, frames]);

  // Precompute member counts + descendant blocks per frame (for title bar count / collapsed thumbnails).
  const framePresent = useMemo(() => {
    const map = new Map<string, { count: number; descBlocks: Block[] }>();
    for (const f of frames) {
      const { blockIds, childFrameIds } = frameMembers(f, blocks, frames);
      const count = blockIds.size + childFrameIds.size;
      const descIds = frameDescendantBlocks(f, blocks, frames);
      const descBlocks = blocks.filter(b => descIds.has(b.id));
      map.set(f.id, { count, descBlocks });
    }
    return map;
  }, [blocks, frames]);

  // O(1) id lookups for the live-collaboration render path (peer selection outlines)
  // and comment targets — avoids repeated O(n) `.find()` scans per peer/selection.
  const blockById = useMemo(() => new Map(blocks.map(b => [b.id, b])), [blocks]);
  const frameById = useMemo(() => new Map(frames.map(f => [f.id, f])), [frames]);

  const connectorLayer = useMemo(() => ({
    connectors,
    rectById: blockRectById,
    drag: liveDrag,
    pending,
    selectedId: selectedConnectorId,
    onSelect: handleSelectConnector,
    onContextMenu: handleConnectorContextMenu,
  }), [connectors, blockRectById, liveDrag, pending, selectedConnectorId, handleSelectConnector, handleConnectorContextMenu]);

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'var(--color-canvas)',
        cursor: isPanning.current ? 'grabbing' : inPanMode ? 'grab' : 'default',
        touchAction: 'none',
      }}
      onPointerDown={isFollowing ? undefined : onPointerDown}
      onPointerMove={e => {
        if (!isFollowing) onPointerMove(e);
        if (onCursorMove) {
          const rect = viewportRef.current?.getBoundingClientRect();
          if (rect) {
            const { x, y } = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top);
            onCursorMove(x, y);
          }
        }
      }}
      onPointerLeave={() => { /* caller can use onCursorMove(null) to hide — handled in usePresence */ }}
      onPointerUp={isFollowing ? undefined : onPointerUp}
      onPointerCancel={isFollowing ? undefined : onPointerUp}
      onDoubleClick={canEdit && !isFollowing ? onDoubleClick : undefined}
      onContextMenu={canEdit && !isFollowing ? (e => {
        e.preventDefault();
        const rect = viewportRef.current?.getBoundingClientRect();
        if (rect) openMenu(buildMenuRows({ kind: 'canvas' }, e.clientX - rect.left, e.clientY - rect.top), e.clientX, e.clientY, rect);
      }) : undefined}
      onDragOver={canEdit && !isFollowing ? (e => e.preventDefault()) : undefined}
      onDrop={canEdit && !isFollowing ? handleCanvasDrop : undefined}
    >
      <DotGrid offset={offset} scale={scale} />

      <CanvasWorld
        offset={offset}
        scale={scale}
        frameLayer={{
          visibleFrames,
          framePresent,
          dragHover,
          selectedFrameId,
          handlers: frameHandlers,
          renameRequest: renameFrameReq,
        }}
        blockLayer={{
          visibleBlocks,
          selectedIds,
          dropTargetId: pending?.targetId ?? null,
          handlers: blockHandlers,
        }}
        connectorLayer={connectorLayer}
        peerLayer={{ peers, blockById, frameById }}
      />

      {/* Transparent shield during a connector drag so pointer events keep flowing over iframes. */}
      {pending && (
        <div className="absolute inset-0" style={{ zIndex: CONNECTOR_DRAG_SHIELD_Z, cursor: 'crosshair' }} />
      )}

      <PeerCursors peers={peers} scale={scale} offset={offset} />

      <CanvasOverlays
        canEdit={canEdit}
        isFollowing={isFollowing}
        transient={{ marquee, addPos, menu, hint, commentTarget }}
        modals={{ isSearchOpen, isHelpOpen, isItemsOpen, lightbox, pdfLightbox }}
        data={{ blocks, frames, blockById, frameById, scale, canUndo, canRedo, themeChoice, topRightSlot, toolbarStatus, toolbarActions }}
        commentHandlers={commentHandlers}
        actions={{
          handleAddSubmit,
          setAddPos,
          closeMenu,
          setCommentTarget,
          navigateToBlock,
          navigateToFrame,
          setIsSearchOpen,
          setIsHelpOpen,
          setIsItemsOpen,
          setLightbox,
          setPdfLightbox,
          handleDeleteBlock,
          updateBlock,
          zoomBy,
          resetView,
          undo,
          redo,
          setTheme,
        }}
      />
    </div>
  );
}
