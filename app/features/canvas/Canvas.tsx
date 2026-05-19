'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Block, Frame, FrameColor } from '@/app/features/types';
import type { CanvasProps } from './types';
import BlockContainer from '../blocks/Block';
import FrameView from '../frames/Frame';
import AddInput from '../add-input/AddInput';
import Toolbar from '../toolbar/Toolbar';
import SearchModal from '../search/SearchModal';
import CommentsPopover from '../comments/CommentsPopover';
import { makeComment } from '../comments/utils';
import ShortcutsHelp from './ShortcutsHelp';
import ShortcutsButton from './ShortcutsButton';
import ZoomControls from './ZoomControls';
import ItemsButton from '../items-panel/ItemsButton';
import ItemsSheet from '../items-panel/ItemsSheet';
import MenuButton from '../menu-panel/MenuButton';
import { ZOOM_STEP, BLOCK_SIZES, DOT_GRID_SIZE, MIN_SCALE, MAX_SCALE } from './constants';
import { uid } from './utils';
import {
  blockRect,
  buildBlockFrameMap,
  computeFramePreviewRect,
  findEnclosingFrame,
  frameAncestorCollapsed,
  frameDescendantBlocks,
  frameDescendantFrames,
  frameMembers,
  isInsideCollapsedFrame,
  pickDropTargetFrame,
  sortFramesByDepth,
} from '../frames/utils';
import { FRAME_MIN_H, FRAME_MIN_W } from '../frames/constants';
import type { Rect } from '../frames/types';
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
import { useFrames } from '../frames/hooks/useFrames';
import type { FrameHandlers } from '../frames/types';
import { AnimatePresence } from 'framer-motion';
import EmptyState from './EmptyState';
import { db } from '@/app/lib/db';

/** Infinite pan/zoom canvas — orchestrates viewport, blocks, frames, selection, and keyboard shortcuts. */
export default function Canvas({ initialState, onSave }: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  const { themeChoice, toggleTheme, setTheme } = useTheme();
  const { offset, scale, offsetRef, scaleRef, setOffset, setScale, screenToCanvas, zoomBy, resetView } = useViewport(viewportRef);
  const { blocks, setBlocks, isRefreshing, addBlockFromUrl, refreshEmbeds, updateBlock, deleteBlock } = useBlocks({ screenToCanvas });
  const {
    frames, setFrames, createFromSelection, updateFrame, deleteFrame,
    toggleCollapse, renameFrame, setFrameColor,
  } = useFrames();

  const blocksRef = useLatestRef(blocks);
  const framesRef = useLatestRef(frames);
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistory({ setBlocks, blocksRef, setFrames, framesRef });

  const { selectedIds, setSelectedIds, handleBlockSelect, handleBlockClickEnd, handleMultiDragMove, handleMultiDragEnd, deleteSelected, duplicateSelected, selectAll, nudgeSelected, alignSelected } = useSelection({ blocks, setBlocks, pushSnapshot });

  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [addPos, setAddPos] = useState<{ x: number; y: number } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ kind: 'block' | 'frame'; id: string; x: number; y: number } | null>(null);

  // Live drag context tracking projected rects for the block(s) currently being dragged.
  const dragCtxRef = useRef<{
    draggedIds: Set<string>;
    originals: Map<string, Rect>;
    lastDelta: { dx: number; dy: number } | null;
    hoverFrameId: string | null;
  } | null>(null);
  const [dragHover, setDragHover] = useState<{
    hoverFrameId: string | null;
    previewByFrame: Map<string, Rect>;
  } | null>(null);
  const selectedIdsRef = useLatestRef(selectedIds);

  usePinchZoom({ viewportRef, setOffset, setScale, offsetRef, scaleRef });

  // Hydrate from initialState on first mount only
  useEffect(() => {
    if (!initialState) return;
    if (initialState.blocks.length) setBlocks(initialState.blocks);
    if (initialState.frames?.length) setFrames(initialState.frames);
    if (initialState.scale !== 1) setScale(initialState.scale);
    if (initialState.offset.x !== 0 || initialState.offset.y !== 0) setOffset(initialState.offset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save — calls onSave whenever canvas state changes
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!onSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { onSave({ blocks, frames, offset, scale }); }, 150);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [blocks, frames, offset, scale, onSave]);

  const zoomToFit = useCallback(() => {
    const el = viewportRef.current;
    if (!el || blocks.length === 0) return;
    const PADDING = 64;
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
      (el.clientWidth - PADDING * 2) / bboxW,
      (el.clientHeight - PADDING * 2) / bboxH,
      1,
    );
    const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
    setScale(clampedScale);
    setOffset({
      x: el.clientWidth / 2 - ((minX + maxX) / 2) * clampedScale,
      y: el.clientHeight / 2 - ((minY + maxY) / 2) * clampedScale,
    });
  }, [blocks, viewportRef, setScale, setOffset]);

  const addTextNote = useCallback(() => {
    const el = viewportRef.current;
    const sx = el ? el.clientWidth / 2 : 400;
    const sy = el ? el.clientHeight / 2 : 300;
    const { x, y } = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.text;
    pushSnapshot();
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '', x: x - w / 2, y: y - h / 2 }]);
  }, [screenToCanvas, setBlocks, pushSnapshot]);

  const { marquee, isPanMode, setIsPanMode, isPanning, onPointerDown, onPointerMove, onPointerUp, onDoubleClick } = useMarquee({
    viewportRef,
    offsetRef,
    setOffset,
    setSelectedIds,
    onDoubleClickCanvas: (sx, sy) => setAddPos({ x: sx, y: sy }),
    onCanvasClick: () => { setAddPos(null); setSelectedFrameId(null); setCommentTarget(null); },
  });

  // Frame selection clears block selection and vice-versa
  const handleFrameSelect = useCallback((id: string) => {
    setSelectedIds(new Set());
    setSelectedFrameId(id);
  }, [setSelectedIds]);

  const clearFrameSelection = useCallback(() => { setSelectedFrameId(null); }, []);

  const handleBlockSelectWithFrameClear = useCallback((id: string, shiftKey: boolean) => {
    setSelectedFrameId(null);
    handleBlockSelect(id, shiftKey);
  }, [handleBlockSelect]);

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

  /** Unified delete: removes the selected frame if one is selected, otherwise blocks. */
  const deleteSelectedAny = useCallback(() => {
    if (selectedFrameId) {
      pushSnapshot();
      deleteFrame(selectedFrameId);
      setSelectedFrameId(null);
      return;
    }
    deleteSelected();
  }, [selectedFrameId, deleteFrame, deleteSelected, pushSnapshot]);

  useCanvasKeyboard({
    setSelectedIds, setAddPos, setIsSearchOpen, setIsHelpOpen, setIsPanMode,
    deleteSelected: deleteSelectedAny, duplicateSelected, selectAll, nudgeSelected,
    addTextNote, toggleTheme, resetView, zoomBy, undo, redo,
    groupSelected, ungroupSelected, clearFrameSelection,
  });
  usePasteUrl({ viewportRef, addBlockFromUrl });

  const handleOpenBlock = useCallback((block: Block) => {
    let url: string | null = null;
    if (block.type === 'link' || block.type === 'twitter' || block.type === 'image') url = block.url;
    if (block.type === 'youtube') url = `https://www.youtube.com/watch?v=${block.videoId}`;
    if (block.type === 'spotify') url = block.url;
    if (block.type === 'map') url = block.embedUrl;
    if (block.type === 'pdf') url = block.url;
    if (block.type === 'github') url = block.url;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const handleDeleteBlock = useCallback((id: string) => {
    pushSnapshot();
    deleteBlock(id);
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setCommentTarget(prev => (prev?.kind === 'block' && prev.id === id) ? null : prev);
  }, [deleteBlock, setSelectedIds, pushSnapshot]);

  const handleOpenComments = useCallback((block: Block, anchor: { x: number; y: number }) => {
    setCommentTarget(prev => (prev?.kind === 'block' && prev.id === block.id) ? null : { kind: 'block', id: block.id, x: anchor.x, y: anchor.y });
  }, []);

  const handleAddComment = useCallback((blockId: string, text: string) => {
    pushSnapshot();
    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, { comments: [...(block.comments ?? []), makeComment(text)] });
  }, [pushSnapshot, updateBlock, blocksRef]);

  const handleDeleteComment = useCallback((blockId: string, commentId: string) => {
    pushSnapshot();
    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, { comments: (block.comments ?? []).filter(c => c.id !== commentId) });
  }, [pushSnapshot, updateBlock, blocksRef]);

  const handleOpenFrameComments = useCallback((frame: Frame, anchor: { x: number; y: number }) => {
    setCommentTarget(prev => (prev?.kind === 'frame' && prev.id === frame.id) ? null : { kind: 'frame', id: frame.id, x: anchor.x, y: anchor.y });
  }, []);

  const handleAddFrameComment = useCallback((frameId: string, text: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: [...(frame.comments ?? []), makeComment(text)] });
  }, [pushSnapshot, updateFrame, framesRef]);

  const handleDeleteFrameComment = useCallback((frameId: string, commentId: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: (frame.comments ?? []).filter(c => c.id !== commentId) });
  }, [pushSnapshot, updateFrame, framesRef]);

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

  const handleUploadPdf = useCallback(async (file: File, sx: number, sy: number) => {
    setAddPos(null);
    const path = `pdfs/${uid()}-${file.name}`;
    try {
      await db.storage.uploadFile(path, file);
      const downloadData = await db.storage.getDownloadUrl(path);
      const url: string = typeof downloadData === 'string' ? downloadData : downloadData?.data?.url ?? path;
      const pos = screenToCanvas(sx, sy);
      const { w, h } = BLOCK_SIZES.pdf;
      pushSnapshot();
      setBlocks(prev => [...prev, {
        id: uid(), type: 'pdf', url, source: 'upload', filePath: path,
        title: file.name, x: pos.x - w / 2, y: pos.y - h / 2,
      }]);
    } catch (err) {
      console.error('PDF upload failed', err);
    }
  }, [screenToCanvas, setBlocks, pushSnapshot]);

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

  // ─── Frame handlers ────────────────────────────────────────────────────

  const handleFrameDragMove = useCallback((id: string, dx: number, dy: number) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;
    const descBlocks = frameDescendantBlocks(frame, blocksRef.current, framesRef.current);
    const descFrames = frameDescendantFrames(frame, framesRef.current, blocksRef.current);
    const fEl = document.querySelector(`[data-frame-id="${id}"]`) as HTMLElement | null;
    if (fEl) fEl.style.transform = `translate(${dx}px, ${dy}px)`;
    descFrames.forEach(fid => {
      const el = document.querySelector(`[data-frame-id="${fid}"]`) as HTMLElement | null;
      if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    descBlocks.forEach(bid => {
      const el = document.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null;
      if (el) el.style.transform = `translate(${dx}px, ${dy}px)`;
    });
  }, [blocksRef, framesRef]);

  const handleFrameDragEnd = useCallback((id: string, dx: number, dy: number) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;
    const descBlocks = frameDescendantBlocks(frame, blocksRef.current, framesRef.current);
    const descFrames = frameDescendantFrames(frame, framesRef.current, blocksRef.current);
    const clear = (sel: string) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (el) el.style.transform = '';
    };
    clear(`[data-frame-id="${id}"]`);
    descFrames.forEach(fid => clear(`[data-frame-id="${fid}"]`));
    descBlocks.forEach(bid => clear(`[data-block-id="${bid}"]`));
    if (dx === 0 && dy === 0) return;
    setBlocks(prev => prev.map(b => descBlocks.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } as Block : b));
    setFrames(prev => prev.map(f =>
      f.id === id ? { ...f, x: f.x + dx, y: f.y + dy } :
      descFrames.has(f.id) ? { ...f, x: f.x + dx, y: f.y + dy } : f
    ));
  }, [blocksRef, framesRef, setBlocks, setFrames]);

  const handleFrameResize = useCallback((id: string, next: { x: number; y: number; width: number; height: number }) => {
    updateFrame(id, next);
  }, [updateFrame]);

  const handleFrameRename = useCallback((id: string, title: string) => {
    pushSnapshot();
    renameFrame(id, title);
  }, [renameFrame, pushSnapshot]);

  const handleFrameColor = useCallback((id: string, color: FrameColor) => {
    pushSnapshot();
    setFrameColor(id, color);
  }, [setFrameColor, pushSnapshot]);

  const handleFrameToggleCollapse = useCallback((id: string) => {
    pushSnapshot();
    toggleCollapse(id);
  }, [toggleCollapse, pushSnapshot]);

  const handleFrameDelete = useCallback((id: string) => {
    pushSnapshot();
    deleteFrame(id);
    if (selectedFrameId === id) setSelectedFrameId(null);
    setCommentTarget(prev => (prev?.kind === 'frame' && prev.id === id) ? null : prev);
  }, [deleteFrame, pushSnapshot, selectedFrameId]);

  const frameHandlers = useMemo<FrameHandlers>(() => ({
    onSelect: handleFrameSelect,
    onRename: handleFrameRename,
    onColorChange: handleFrameColor,
    onToggleCollapse: handleFrameToggleCollapse,
    onDelete: handleFrameDelete,
    onDragMove: handleFrameDragMove,
    onDragEnd: handleFrameDragEnd,
    onResize: handleFrameResize,
    onOpenComments: handleOpenFrameComments,
    onBeforeMutate: pushSnapshot,
  }), [handleFrameSelect, handleFrameRename, handleFrameColor, handleFrameToggleCollapse, handleFrameDelete, handleFrameDragMove, handleFrameDragEnd, handleFrameResize, handleOpenFrameComments, pushSnapshot]);

  // ─── Block drag → frame drop-target preview + commit ──────────────────

  /** Updates live drop-target preview during a block drag; on null delta commits frame bounds. */
  const handleBlockDragRect = useCallback((blockId: string, delta: { dx: number; dy: number } | null) => {
    if (delta === null) {
      const ctx = dragCtxRef.current;
      dragCtxRef.current = null;
      setDragHover(null);
      if (!ctx || !ctx.lastDelta) return;
      const { dx, dy } = ctx.lastDelta;
      if (dx === 0 && dy === 0) return;

      const projectedRects = new Map<string, Rect>();
      ctx.draggedIds.forEach(id => {
        const orig = ctx.originals.get(id);
        if (orig) projectedRects.set(id, { x: orig.x + dx, y: orig.y + dy, width: orig.width, height: orig.height });
      });

      const currentFrames = framesRef.current;
      const currentBlocks = blocksRef.current;
      const blockFrameMap = buildBlockFrameMap(currentBlocks, currentFrames);
      const affected = new Set<string>();
      ctx.draggedIds.forEach(id => {
        const oldFid = blockFrameMap.get(id);
        if (oldFid) affected.add(oldFid);
      });
      const hoverFrameId = ctx.hoverFrameId;
      if (hoverFrameId) affected.add(hoverFrameId);

      const newRects = new Map<string, Rect>();
      affected.forEach(fid => {
        const f = currentFrames.find(x => x.id === fid);
        if (!f) return;
        const isIncoming = fid === hoverFrameId;
        const r = computeFramePreviewRect(f, currentBlocks, currentFrames, ctx.draggedIds, projectedRects, isIncoming);
        newRects.set(fid, {
          x: r.x,
          y: r.y,
          width: Math.max(FRAME_MIN_W, r.width),
          height: Math.max(FRAME_MIN_H, r.height),
        });
      });

      setFrames(prev => prev.map(f => {
        let next = f;
        if (hoverFrameId && f.id === hoverFrameId && f.collapsed) {
          next = { ...next, collapsed: false };
        }
        const nr = newRects.get(f.id);
        if (nr) next = { ...next, x: nr.x, y: nr.y, width: nr.width, height: nr.height };
        return next;
      }));
      return;
    }

    // Initialize ctx on first non-null delta of this drag.
    if (!dragCtxRef.current) {
      const sel = selectedIdsRef.current;
      const draggedIds = sel.has(blockId) && sel.size > 1 ? new Set(sel) : new Set([blockId]);
      const originals = new Map<string, Rect>();
      blocksRef.current.forEach(b => {
        if (draggedIds.has(b.id)) originals.set(b.id, blockRect(b));
      });
      dragCtxRef.current = { draggedIds, originals, lastDelta: null, hoverFrameId: null };
    }
    const ctx = dragCtxRef.current;
    ctx.lastDelta = delta;

    const projectedRects = new Map<string, Rect>();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    ctx.draggedIds.forEach(id => {
      const orig = ctx.originals.get(id);
      if (!orig) return;
      const r = { x: orig.x + delta.dx, y: orig.y + delta.dy, width: orig.width, height: orig.height };
      projectedRects.set(id, r);
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.width > maxX) maxX = r.x + r.width;
      if (r.y + r.height > maxY) maxY = r.y + r.height;
    });
    if (!Number.isFinite(minX)) return;
    const union: Rect = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

    const currentFrames = framesRef.current;
    const currentBlocks = blocksRef.current;
    const hoverFrame = pickDropTargetFrame(union, currentFrames);
    const hoverFrameId = hoverFrame?.id ?? null;
    ctx.hoverFrameId = hoverFrameId;

    const blockFrameMap = buildBlockFrameMap(currentBlocks, currentFrames);
    const affected = new Set<string>();
    ctx.draggedIds.forEach(id => {
      const oldFid = blockFrameMap.get(id);
      if (oldFid) affected.add(oldFid);
    });
    if (hoverFrameId) affected.add(hoverFrameId);

    const previewByFrame = new Map<string, Rect>();
    affected.forEach(fid => {
      const f = currentFrames.find(x => x.id === fid);
      if (!f) return;
      // Collapsed hover target: keep its visual size; highlight only.
      if (fid === hoverFrameId && f.collapsed) return;
      const isIncoming = fid === hoverFrameId;
      const r = computeFramePreviewRect(f, currentBlocks, currentFrames, ctx.draggedIds, projectedRects, isIncoming);
      previewByFrame.set(fid, {
        x: r.x,
        y: r.y,
        width: Math.max(FRAME_MIN_W, r.width),
        height: Math.max(FRAME_MIN_H, r.height),
      });
    });

    setDragHover(prev => {
      if (prev && prev.hoverFrameId === hoverFrameId && prev.previewByFrame.size === previewByFrame.size) {
        let same = true;
        previewByFrame.forEach((r, k) => {
          const pr = prev.previewByFrame.get(k);
          if (!pr || pr.x !== r.x || pr.y !== r.y || pr.width !== r.width || pr.height !== r.height) same = false;
        });
        if (same) return prev;
      }
      return { hoverFrameId, previewByFrame };
    });
  }, [blocksRef, framesRef, selectedIdsRef, setFrames]);

  const blockHandlers = useMemo(() => ({
    onSelect: (id: string, shiftKey: boolean) => { setCommentTarget(null); handleBlockSelectWithFrameClear(id, shiftKey); },
    onClickEnd: handleBlockClickEnd,
    onOpen: handleOpenBlock,
    onUpdate: updateBlock,
    onDelete: handleDeleteBlock,
    onOpenComments: handleOpenComments,
    onMultiDragMove: handleMultiDragMove,
    onMultiDragEnd: handleMultiDragEnd,
    onBeforeDragCommit: pushSnapshot,
    onDragRect: handleBlockDragRect,
  }), [handleBlockSelectWithFrameClear, handleBlockClickEnd, handleOpenBlock, updateBlock, handleDeleteBlock, handleOpenComments, handleMultiDragMove, handleMultiDragEnd, pushSnapshot, handleBlockDragRect]);

  const toolbarActions = useMemo(() => ({
    addText: addTextNote,
    togglePanMode: () => setIsPanMode(p => !p),
    search: () => setIsSearchOpen(true),
    refresh: refreshEmbeds,
    undo,
    redo,
    alignSelected,
    zoomToFit,
  }), [addTextNote, setIsPanMode, refreshEmbeds, undo, redo, alignSelected, zoomToFit]);

  const toolbarStatus = { isPanMode, hasRefreshable: blocks.some(b => b.type === 'link' || b.type === 'github'), isRefreshing, canUndo, canRedo, selectedCount: selectedIds.size };
  const inPanMode = isPanMode || isPanning.current;
  const gridSize = DOT_GRID_SIZE * scale;

  // ─── Render filters ────────────────────────────────────────────────────

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

  return (
    <div
      ref={viewportRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{
        background: 'var(--color-canvas)',
        cursor: isPanning.current ? 'grabbing' : inPanMode ? 'grab' : 'default',
        touchAction: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, var(--color-grid-dot) 1px, transparent 1px)`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundPosition: `${offset.x % gridSize}px ${offset.y % gridSize}px`,
        }}
      />

      {/* Canvas world */}
      <div
        className="absolute"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0', willChange: 'transform' }}
      >
        {/* Frames (behind blocks, sorted outer→inner) */}
        {visibleFrames.map(frame => {
          const present = framePresent.get(frame.id);
          const isHover = dragHover?.hoverFrameId === frame.id;
          const previewRect = dragHover?.previewByFrame.get(frame.id);
          const dropPreview = isHover
            ? { active: true, rect: previewRect }
            : previewRect
              ? { active: false, rect: previewRect }
              : undefined;
          return (
            <FrameView
              key={frame.id}
              frame={frame}
              scale={scale}
              selected={selectedFrameId === frame.id}
              memberCount={present?.count ?? 0}
              descendantBlocks={present?.descBlocks ?? []}
              handlers={frameHandlers}
              dropPreview={dropPreview}
            />
          );
        })}

        {/* Blocks (skip those inside a collapsed frame) */}
        {visibleBlocks.map(block => (
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
            border: '1.5px solid var(--color-marquee-border)',
            background: 'var(--color-marquee-bg)',
            borderRadius: 3,
          }}
        />
      )}

      {addPos && (
        <AddInput
          x={addPos.x}
          y={addPos.y}
          onSubmit={val => handleAddSubmit(val, addPos.x, addPos.y)}
          onUploadPdf={file => handleUploadPdf(file, addPos.x, addPos.y)}
          onClose={() => setAddPos(null)}
        />
      )}

      {commentTarget && (
        <CommentsPopover
          targetId={commentTarget.id}
          comments={
            commentTarget.kind === 'block'
              ? blocks.find(b => b.id === commentTarget.id)?.comments ?? []
              : frames.find(f => f.id === commentTarget.id)?.comments ?? []
          }
          x={commentTarget.x}
          y={commentTarget.y}
          onAdd={commentTarget.kind === 'block' ? handleAddComment : handleAddFrameComment}
          onDelete={commentTarget.kind === 'block' ? handleDeleteComment : handleDeleteFrameComment}
          onClose={() => setCommentTarget(null)}
        />
      )}

      {isSearchOpen && (
        <SearchModal
          blocks={blocks}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={navigateToBlock}
        />
      )}

      {isHelpOpen && (
        <ShortcutsHelp onClose={() => setIsHelpOpen(false)} />
      )}

      {isItemsOpen && (
        <ItemsSheet
          blocks={blocks}
          frames={frames}
          onClose={() => setIsItemsOpen(false)}
          onNavigate={navigateToBlock}
          onNavigateFrame={navigateToFrame}
          onDelete={handleDeleteBlock}
          onTogglePin={id => updateBlock(id, { pinned: !blocks.find(b => b.id === id)?.pinned })}
        />
      )}

      <Toolbar status={toolbarStatus} actions={toolbarActions} />

      <ZoomControls
        scale={scale}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
        onReset={resetView}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />

      <ShortcutsButton onClick={() => setIsHelpOpen(p => !p)} />

      <ItemsButton count={blocks.length} onClick={() => setIsItemsOpen(p => !p)} />

      <MenuButton themeChoice={themeChoice} onSetTheme={setTheme} />

      <AnimatePresence>
        {blocks.length === 0 && frames.length === 0 && !addPos && <EmptyState key="empty" />}
      </AnimatePresence>
    </div>
  );
}
