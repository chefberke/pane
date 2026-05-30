'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { flushSync } from 'react-dom';
import dynamic from 'next/dynamic';
import type { Block, Frame, FrameColor } from '@/app/features/types';
import type { CanvasProps } from './types';
import BlockContainer from '../blocks/Block';
import FrameView from '../frames/Frame';
import AddInput from '../add-input/AddInput';
import Toolbar from '../toolbar/Toolbar';
import CommentsPopover from '../comments/CommentsPopover';
import { makeComment } from '../comments/utils';
import ContextMenu from '../context-menu/ContextMenu';
import { useContextMenu } from '../context-menu/hooks/useContextMenu';
import { blockShareUrl } from '../context-menu/utils';
import type { ContextMenuRow, ContextMenuTarget } from '../context-menu/types';
import { Plus, Type, BoxSelect, Maximize2, ExternalLink, Link2, MessageCircle, Copy, FolderPlus, FolderMinus, Trash2, Pencil } from 'lucide-react';
import ShortcutsButton from './ShortcutsButton';
import ZoomControls from './ZoomControls';
import ItemsButton from '../items-panel/ItemsButton';
import MenuButton from '../menu-panel/MenuButton';

// Heavy, conditionally-mounted overlays — code-split out of the initial canvas
// chunk and loaded on demand. All are client-only interactive UI, so SSR is off.
const ImageLightbox = dynamic(() => import('../blocks/ImageLightbox'), { ssr: false });
const PdfLightbox = dynamic(() => import('../blocks/PdfLightbox'), { ssr: false });
const SearchModal = dynamic(() => import('../search/SearchModal'), { ssr: false });
const ShortcutsHelp = dynamic(() => import('./ShortcutsHelp'), { ssr: false });
const ItemsSheet = dynamic(() => import('../items-panel/ItemsSheet'), { ssr: false });
import { ZOOM_STEP, BLOCK_SIZES, DOT_GRID_SIZE, MIN_SCALE, MAX_SCALE, MAX_IMAGE_BYTES, MAX_IMAGE_EDGE, IMAGE_OUTPUT_QUALITY, MAX_PDF_BYTES, UPLOAD_ERROR_MS } from './constants';
import { useFollowViewport } from './hooks/useFollowViewport';
import { uid, sanitizeFileName, downscaleImage } from './utils';
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
import { FRAME_MIN_H, FRAME_MIN_W, FRAME_PADDING } from '../frames/constants';
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
import type { FrameHandlers, FrameRenameRequest } from '../frames/types';
import { AnimatePresence } from 'framer-motion';
import EmptyState from './EmptyState';
import UploadErrorFlash from './UploadErrorFlash';
import { db } from '@/app/lib/db';

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

  const { themeChoice, toggleTheme, setTheme } = useTheme();
  const { offset, scale, offsetRef, scaleRef, setOffset, setScale, screenToCanvas, zoomBy, resetView } = useViewport(viewportRef, isFollowing);
  const { blocks, setBlocks, isRefreshing, addBlockFromUrl, refreshEmbeds, updateBlock, deleteBlock } = useBlocks({ screenToCanvas });
  const {
    frames, setFrames, createFromSelection, updateFrame, deleteFrame,
    toggleCollapse, renameFrame, setFrameColor,
  } = useFrames();

  const blocksRef = useLatestRef(blocks);
  const framesRef = useLatestRef(frames);
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistory({ setBlocks, blocksRef, setFrames, framesRef });

  const { selectedIds, setSelectedIds, handleBlockSelect, handleBlockClickEnd, handleMultiDragMove, handleMultiDragEnd, duplicateSelected, selectAll, nudgeSelected, alignSelected } = useSelection({ blocks, setBlocks, pushSnapshot });

  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [renameFrameReq, setRenameFrameReq] = useState<FrameRenameRequest | null>(null);
  const [addPos, setAddPos] = useState<{ x: number; y: number } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [commentTarget, setCommentTarget] = useState<{ kind: 'block' | 'frame'; id: string; x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState<{ url: string; alt?: string } | null>(null);
  const [pdfLightbox, setPdfLightbox] = useState<{ url: string; title?: string } | null>(null);
  const [uploadError, setUploadError] = useState<{ x: number; y: number; message: string } | null>(null);
  const uploadErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  usePinchZoom({ viewportRef, setOffset, setScale, offsetRef, scaleRef, disabled: isFollowing });

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
    if (!onSave || !canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { onSave({ blocks, frames, offset, scale }); }, 150);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [blocks, frames, offset, scale, onSave, canEdit]);

  // Publish selection changes to presence
  useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(Array.from(selectedIds), selectedFrameId);
  }, [selectedIds, selectedFrameId, onSelectionChange]);

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

  /** Adds an empty text note centered on the given screen point (used by the canvas context menu). */
  const addTextNoteAt = useCallback((sx: number, sy: number) => {
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
    onCanvasClick: () => { setAddPos(null); setSelectedFrameId(null); setCommentTarget(null); closeMenu(); },
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

  /** Unified delete: removes the selected frame if one is selected, otherwise blocks (plus any frames whose all descendant blocks are being deleted). */
  const deleteSelectedAny = useCallback(() => {
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
    setSelectedIds(new Set());
    if (toDeleteFrames.length > 0) {
      setFrames(prev => prev.filter(f => !toDeleteFrames.some(df => df.id === f.id)));
    }
  }, [selectedFrameId, deleteFrame, framesRef, blocksRef, selectedIdsRef, pushSnapshot, setBlocks, setSelectedIds, setFrames]);

  useCanvasKeyboard({
    setSelectedIds, setAddPos, setIsSearchOpen, setIsHelpOpen, setIsPanMode,
    deleteSelected: deleteSelectedAny, duplicateSelected, selectAll, nudgeSelected,
    addTextNote, toggleTheme, resetView, zoomBy, undo, redo,
    groupSelected, ungroupSelected, clearFrameSelection,
    disabled: isFollowing,
  });
  /** Shows a short-lived red error label at the given screen point. */
  const flashUploadError = useCallback((sx: number, sy: number, message: string) => {
    if (uploadErrorTimer.current) clearTimeout(uploadErrorTimer.current);
    setUploadError({ x: sx, y: sy, message });
    uploadErrorTimer.current = setTimeout(() => setUploadError(null), UPLOAD_ERROR_MS);
  }, []);
  useEffect(() => () => { if (uploadErrorTimer.current) clearTimeout(uploadErrorTimer.current); }, []);

  const handleUploadPdf = useCallback(async (file: File, sx: number, sy: number) => {
    setAddPos(null);
    if (file.size > MAX_PDF_BYTES) { flashUploadError(sx, sy, 'PDF too large (max 25MB)'); return; }
    const path = `pdfs/${uid()}-${sanitizeFileName(file.name)}`;
    const pos = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.pdf;
    const blockId = uid();
    // Show a loading placeholder immediately so large uploads don't feel stuck.
    pushSnapshot();
    setBlocks(prev => [...prev, {
      id: blockId, type: 'pdf', url: '', source: 'upload', filePath: path,
      title: file.name, x: pos.x - w / 2, y: pos.y - h / 2, uploading: true,
    }]);
    try {
      await db.storage.uploadFile(path, file);
      const downloadData = await db.storage.getDownloadUrl(path);
      const url: string = typeof downloadData === 'string' ? downloadData : downloadData?.data?.url ?? path;
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, url, uploading: false } : b));
    } catch (err) {
      console.error('PDF upload failed', err);
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    }
  }, [screenToCanvas, setBlocks, pushSnapshot, flashUploadError]);

  const handleUploadImage = useCallback(async (file: File, sx: number, sy: number) => {
    setAddPos(null);
    if (!file.type.startsWith('image/')) { console.warn('Not an image file', file.type); return; }
    if (file.size > MAX_IMAGE_BYTES) { flashUploadError(sx, sy, 'Image too large (max 30MB)'); return; }
    const pos = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.image;
    const blockId = uid();
    // Show a loading placeholder immediately so the downscale + upload don't feel stuck.
    pushSnapshot();
    setBlocks(prev => [...prev, {
      id: blockId, type: 'image', url: '', alt: file.name,
      x: pos.x - w / 2, y: pos.y - h / 2, uploading: true,
    }]);
    try {
      // Downscale + re-encode client-side to keep stored images small.
      const upload = await downscaleImage(file, MAX_IMAGE_EDGE, IMAGE_OUTPUT_QUALITY);
      const path = `images/${uid()}-${sanitizeFileName(upload.name)}`;
      await db.storage.uploadFile(path, upload);
      const downloadData = await db.storage.getDownloadUrl(path);
      const url: string = typeof downloadData === 'string' ? downloadData : downloadData?.data?.url ?? path;
      setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, url, uploading: false } : b));
    } catch (err) {
      console.error('Image upload failed', err);
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    }
  }, [screenToCanvas, setBlocks, pushSnapshot, flashUploadError]);

  usePasteUrl({ viewportRef, addBlockFromUrl, onPasteImage: handleUploadImage });

  /** Drop handler — adds dropped image / PDF files at the drop point. */
  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    e.preventDefault();
    const rect = viewportRef.current?.getBoundingClientRect();
    const sx = rect ? e.clientX - rect.left : 400;
    const sy = rect ? e.clientY - rect.top : 300;
    for (const file of files) {
      if (file.type.startsWith('image/')) handleUploadImage(file, sx, sy);
      else if (file.type === 'application/pdf') handleUploadPdf(file, sx, sy);
    }
  }, [handleUploadImage, handleUploadPdf]);

  // Publish own viewport to presence so others can follow us
  useEffect(() => {
    if (isFollowing || !onViewportChange) return;
    const el = viewportRef.current;
    if (!el) return;
    onViewportChange(offset, scale, { w: el.clientWidth, h: el.clientHeight });
  }, [offset, scale, isFollowing, onViewportChange]);

  // Follow lerp — smoothly tracks peer viewport when isFollowing
  useFollowViewport({ isFollowing, followTarget, viewportRef, offset, scale, setOffset, setScale });

  const handleOpenBlock = useCallback((block: Block) => {
    // Images open in an in-app lightbox rather than a new tab.
    if (block.type === 'image') {
      if (!block.uploading && block.url) setLightbox({ url: block.url, alt: block.alt });
      return;
    }
    // PDFs preview inline in a modal rather than a new tab.
    if (block.type === 'pdf') {
      if (!block.uploading && block.url) setPdfLightbox({ url: block.url, title: block.title });
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
    updateBlock(blockId, { comments: [...(block.comments ?? []), makeComment(text, identity)] });
  }, [pushSnapshot, updateBlock, blocksRef, identity]);

  const handleDeleteComment = useCallback((blockId: string, commentId: string) => {
    pushSnapshot();
    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, { comments: (block.comments ?? []).filter(c => c.id !== commentId) });
  }, [pushSnapshot, updateBlock, blocksRef]);

  const handleReplyComment = useCallback((blockId: string, parentId: string, text: string) => {
    pushSnapshot();
    const block = blocksRef.current.find(b => b.id === blockId);
    if (!block) return;
    updateBlock(blockId, { comments: (block.comments ?? []).map(c => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), makeComment(text, identity)] } : c) });
  }, [pushSnapshot, updateBlock, blocksRef, identity]);

  const handleOpenFrameComments = useCallback((frame: Frame, anchor: { x: number; y: number }) => {
    setCommentTarget(prev => (prev?.kind === 'frame' && prev.id === frame.id) ? null : { kind: 'frame', id: frame.id, x: anchor.x, y: anchor.y });
  }, []);

  const handleAddFrameComment = useCallback((frameId: string, text: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: [...(frame.comments ?? []), makeComment(text, identity)] });
  }, [pushSnapshot, updateFrame, framesRef, identity]);

  const handleDeleteFrameComment = useCallback((frameId: string, commentId: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: (frame.comments ?? []).filter(c => c.id !== commentId) });
  }, [pushSnapshot, updateFrame, framesRef]);

  const handleReplyFrameComment = useCallback((frameId: string, parentId: string, text: string) => {
    pushSnapshot();
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    updateFrame(frameId, { comments: (frame.comments ?? []).map(c => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), makeComment(text, identity)] } : c) });
  }, [pushSnapshot, updateFrame, framesRef, identity]);

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

    const collectEls = (): HTMLElement[] => {
      const els: HTMLElement[] = [];
      const fEl = document.querySelector(`[data-frame-id="${id}"]`) as HTMLElement | null;
      if (fEl) els.push(fEl);
      descFrames.forEach(fid => { const el = document.querySelector(`[data-frame-id="${fid}"]`) as HTMLElement | null; if (el) els.push(el); });
      descBlocks.forEach(bid => { const el = document.querySelector(`[data-block-id="${bid}"]`) as HTMLElement | null; if (el) els.push(el); });
      return els;
    };

    if (dx === 0 && dy === 0) {
      collectEls().forEach(el => { el.style.transform = ''; });
      return;
    }

    const els = collectEls();
    // Suppress CSS left/top transitions so they don't fight the transform during commit.
    els.forEach(el => { el.style.transition = 'none'; });
    // Synchronously commit new positions so the DOM is updated before we clear transforms.
    flushSync(() => {
      setBlocks(prev => prev.map(b => descBlocks.has(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } as Block : b));
      setFrames(prev => prev.map(f =>
        f.id === id ? { ...f, x: f.x + dx, y: f.y + dy } :
        descFrames.has(f.id) ? { ...f, x: f.x + dx, y: f.y + dy } : f
      ));
    });
    // Clear transforms — left/top is already at final position, so no snap.
    els.forEach(el => { el.style.transform = ''; });
    // Re-enable transitions after the browser has painted the committed frame.
    requestAnimationFrame(() => { els.forEach(el => { el.style.transition = ''; }); });
  }, [blocksRef, framesRef, setBlocks, setFrames]);

  const handleFrameResize = useCallback((id: string, next: { x: number; y: number; width: number; height: number }) => {
    const frame = framesRef.current.find(f => f.id === id);
    if (!frame) return;

    const { blockIds, childFrameIds } = frameMembers(frame, blocksRef.current, framesRef.current);
    const hasContent = blockIds.size > 0 || childFrameIds.size > 0;

    if (!hasContent) {
      updateFrame(id, next);
      return;
    }

    // Compute tight bounding box of all direct member content.
    let contentLeft = Infinity, contentTop = Infinity;
    let contentRight = -Infinity, contentBottom = -Infinity;
    for (const b of blocksRef.current) {
      if (!blockIds.has(b.id)) continue;
      const r = blockRect(b);
      contentLeft   = Math.min(contentLeft,   r.x);
      contentTop    = Math.min(contentTop,     r.y);
      contentRight  = Math.max(contentRight,  r.x + r.width);
      contentBottom = Math.max(contentBottom, r.y + r.height);
    }
    for (const f of framesRef.current) {
      if (!childFrameIds.has(f.id)) continue;
      contentLeft   = Math.min(contentLeft,   f.x);
      contentTop    = Math.min(contentTop,     f.y);
      contentRight  = Math.max(contentRight,  f.x + f.width);
      contentBottom = Math.max(contentBottom, f.y + f.height);
    }

    // Clamp resize so the frame can never shrink past content + padding on each side.
    let { x: nx, y: ny, width: nw, height: nh } = next;
    const origRight  = nx + nw;
    const origBottom = ny + nh;

    // Left edge can't encroach past content left edge.
    if (nx > contentLeft - FRAME_PADDING) { nx = contentLeft - FRAME_PADDING; nw = origRight - nx; }
    // Top edge can't encroach past content top edge.
    if (ny > contentTop  - FRAME_PADDING) { ny = contentTop  - FRAME_PADDING; nh = origBottom - ny; }
    // Right edge must stay at least past content right edge.
    if (nx + nw < contentRight  + FRAME_PADDING) nw = contentRight  + FRAME_PADDING - nx;
    // Bottom edge must stay at least past content bottom edge.
    if (ny + nh < contentBottom + FRAME_PADDING) nh = contentBottom + FRAME_PADDING - ny;

    updateFrame(id, { x: nx, y: ny, width: nw, height: nh });
  }, [blocksRef, framesRef, updateFrame]);

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

  /**
   * Builds context-menu rows for a target. Called from event handlers (not render), so reading the
   * latest blocks/frames/selection via refs here is safe and keeps the rows current.
   */
  const buildMenuRows = useCallback((target: ContextMenuTarget, sx: number, sy: number): ContextMenuRow[] => {
    if (target.kind === 'canvas') {
      return [
        { kind: 'action', label: 'Add content here', icon: Plus, onClick: () => setAddPos({ x: sx, y: sy }) },
        { kind: 'action', label: 'Add text note here', icon: Type, shortcut: ['T'], onClick: () => addTextNoteAt(sx, sy) },
        { kind: 'separator' },
        { kind: 'action', label: 'Select all', icon: BoxSelect, shortcut: ['⌘', 'A'], onClick: selectAll, disabled: blocksRef.current.length === 0 },
        { kind: 'action', label: 'Reset view', icon: Maximize2, shortcut: ['0'], onClick: resetView },
      ];
    }
    if (target.kind === 'block') {
      const block = blocksRef.current.find(b => b.id === target.id);
      if (!block) return [];
      const url = blockShareUrl(block);
      const rows: ContextMenuRow[] = [
        { kind: 'action', label: 'Open', icon: ExternalLink, onClick: () => handleOpenBlock(block) },
      ];
      if (url) rows.push({ kind: 'action', label: 'Copy link', icon: Link2, onClick: () => { void navigator.clipboard?.writeText(url); } });
      rows.push(
        { kind: 'action', label: 'Comments', icon: MessageCircle, onClick: () => handleOpenComments(block, { x: sx, y: sy }) },
        { kind: 'separator' },
        { kind: 'action', label: 'Duplicate', icon: Copy, shortcut: ['⌘', 'D'], onClick: duplicateSelected },
        { kind: 'action', label: 'Group selected', icon: FolderPlus, shortcut: ['⌘', 'G'], onClick: groupSelected },
        { kind: 'separator' },
        { kind: 'action', label: 'Delete', icon: Trash2, shortcut: ['⌫'], onClick: deleteSelectedAny, danger: true },
      );
      return rows;
    }
    const frame = framesRef.current.find(f => f.id === target.id);
    if (!frame) return [];
    return [
      { kind: 'action', label: 'Rename', icon: Pencil, onClick: () => setRenameFrameReq({ id: frame.id, n: Date.now() }) },
      { kind: 'color', current: frame.color, onSelect: c => handleFrameColor(frame.id, c) },
      { kind: 'action', label: 'Comments', icon: MessageCircle, onClick: () => handleOpenFrameComments(frame, { x: sx, y: sy }) },
      { kind: 'separator' },
      { kind: 'action', label: 'Ungroup', icon: FolderMinus, shortcut: ['⌘', '⇧', 'G'], onClick: ungroupSelected },
      { kind: 'action', label: 'Delete', icon: Trash2, shortcut: ['⌫'], onClick: () => handleFrameDelete(frame.id), danger: true },
    ];
  }, [blocksRef, framesRef, addTextNoteAt, selectAll, resetView, handleOpenBlock, handleOpenComments, duplicateSelected, groupSelected, deleteSelectedAny, handleFrameColor, handleOpenFrameComments, ungroupSelected, handleFrameDelete]);

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
    onContextMenu: (id: string, clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCommentTarget(null);
      handleFrameSelect(id);
      openMenu(buildMenuRows({ kind: 'frame', id }, clientX - rect.left, clientY - rect.top), clientX, clientY, rect);
    },
  }), [handleFrameSelect, handleFrameRename, handleFrameColor, handleFrameToggleCollapse, handleFrameDelete, handleFrameDragMove, handleFrameDragEnd, handleFrameResize, handleOpenFrameComments, pushSnapshot, openMenu, buildMenuRows]);

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
    onContextMenu: (id: string, clientX: number, clientY: number) => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCommentTarget(null);
      if (!selectedIdsRef.current.has(id)) handleBlockSelectWithFrameClear(id, false);
      openMenu(buildMenuRows({ kind: 'block', id }, clientX - rect.left, clientY - rect.top), clientX, clientY, rect);
    },
  }), [handleBlockSelectWithFrameClear, handleBlockClickEnd, handleOpenBlock, updateBlock, handleDeleteBlock, handleOpenComments, handleMultiDragMove, handleMultiDragEnd, pushSnapshot, handleBlockDragRect, openMenu, selectedIdsRef, buildMenuRows]);

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

  // O(1) id lookups for the live-collaboration render path (peer selection outlines)
  // and comment targets — avoids repeated O(n) `.find()` scans per peer/selection.
  const blockById = useMemo(() => new Map(blocks.map(b => [b.id, b])), [blocks]);
  const frameById = useMemo(() => new Map(frames.map(f => [f.id, f])), [frames]);

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
      onDrop={canEdit && !isFollowing ? handleDrop : undefined}
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
              renameRequest={renameFrameReq}
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

        {/* Remote peer selection outlines (canvas-space, scale-correct) */}
        {peers.map(peer =>
          peer.selection.blockIds.map(bid => {
            const block = blockById.get(bid);
            if (!block) return null;
            const w = block.width  ?? BLOCK_SIZES[block.type]?.w ?? 240;
            const h = block.height ?? BLOCK_SIZES[block.type]?.h ?? 160;
            return (
              <div
                key={`${peer.id}-${bid}`}
                className="absolute pointer-events-none rounded-xl"
                style={{
                  left:    block.x - 3,
                  top:     block.y - 3,
                  width:   w + 6,
                  height:  h + 6,
                  outline: `2px solid ${peer.color}`,
                  outlineOffset: 0,
                }}
              />
            );
          })
        )}
        {peers.map(peer => {
          if (!peer.selection.frameId) return null;
          const frame = frameById.get(peer.selection.frameId);
          if (!frame) return null;
          return (
            <div
              key={`${peer.id}-frame-${frame.id}`}
              className="absolute pointer-events-none rounded-xl"
              style={{
                left:    frame.x - 3,
                top:     frame.y - 3,
                width:   frame.width + 6,
                height:  frame.height + 6,
                outline: `2px solid ${peer.color}`,
                outlineOffset: 0,
              }}
            />
          );
        })}
      </div>

      {/* Remote peer cursors (screen-space, fixed pixel size) */}
      {peers.map(peer => {
        if (!peer.cursor) return null;
        const sx = peer.cursor.x * scale + offset.x;
        const sy = peer.cursor.y * scale + offset.y;
        return (
          <div
            key={`cursor-${peer.id}`}
            className="absolute pointer-events-none"
            style={{ left: sx, top: sy, zIndex: 150 }}
          >
            {/* Figma-style cursor arrow */}
            <svg width="14" height="17" viewBox="0 0 18 22" fill="none" style={{ display: 'block' }}>
              <path
                d="M1 1L1 17L5.5 13L8.5 20L10.5 19L7.5 12L13 12L1 1Z"
                fill={peer.color}
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            {/* Name label */}
            <div
              className="absolute left-3 top-2.5 px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap"
              style={{ background: peer.color, color: '#ffffff' }}
            >
              {peer.name}
              {peer.typing && <span style={{ opacity: 0.8 }}> · typing…</span>}
            </div>
          </div>
        );
      })}

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

      {canEdit && !isFollowing && addPos && (
        <AddInput
          x={addPos.x}
          y={addPos.y}
          onSubmit={val => handleAddSubmit(val, addPos.x, addPos.y)}
          onUploadPdf={file => handleUploadPdf(file, addPos.x, addPos.y)}
          onUploadImage={file => handleUploadImage(file, addPos.x, addPos.y)}
          onClose={() => setAddPos(null)}
        />
      )}

      {canEdit && !isFollowing && menu && (
        <>
          {/* Click-catcher: any pointer down / right-click outside the menu dismisses it. */}
          <div
            className="absolute inset-0 z-40"
            onPointerDown={closeMenu}
            onContextMenu={e => { e.preventDefault(); closeMenu(); }}
          />
          <ContextMenu x={menu.x} y={menu.y} bounds={menu.bounds} rows={menu.rows} onClose={closeMenu} />
        </>
      )}

      <AnimatePresence>
        {uploadError && (
          <UploadErrorFlash
            key={`${uploadError.x}-${uploadError.y}-${uploadError.message}`}
            x={uploadError.x}
            y={uploadError.y}
            message={uploadError.message}
          />
        )}
      </AnimatePresence>

      {!isFollowing && commentTarget && (
        <CommentsPopover
          targetId={commentTarget.id}
          comments={
            commentTarget.kind === 'block'
              ? blockById.get(commentTarget.id)?.comments ?? []
              : frameById.get(commentTarget.id)?.comments ?? []
          }
          x={commentTarget.x}
          y={commentTarget.y}
          onAdd={commentTarget.kind === 'block' ? handleAddComment : handleAddFrameComment}
          onDelete={commentTarget.kind === 'block' ? handleDeleteComment : handleDeleteFrameComment}
          onReply={commentTarget.kind === 'block' ? handleReplyComment : handleReplyFrameComment}
          onClose={() => setCommentTarget(null)}
        />
      )}

      {!isFollowing && isSearchOpen && (
        <SearchModal
          blocks={blocks}
          onClose={() => setIsSearchOpen(false)}
          onNavigate={navigateToBlock}
        />
      )}

      {!isFollowing && isHelpOpen && (
        <ShortcutsHelp onClose={() => setIsHelpOpen(false)} />
      )}

      {lightbox && (
        <ImageLightbox url={lightbox.url} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}

      {pdfLightbox && (
        <PdfLightbox url={pdfLightbox.url} title={pdfLightbox.title} onClose={() => setPdfLightbox(null)} />
      )}

      {!isFollowing && isItemsOpen && (
        <ItemsSheet
          blocks={blocks}
          frames={frames}
          onClose={() => setIsItemsOpen(false)}
          onNavigate={navigateToBlock}
          onNavigateFrame={navigateToFrame}
          onDelete={handleDeleteBlock}
          onTogglePin={id => updateBlock(id, { pinned: !blockById.get(id)?.pinned })}
        />
      )}

      {canEdit && !isFollowing && <Toolbar status={toolbarStatus} actions={toolbarActions} />}

      {!isFollowing && (
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
      )}

      {!isFollowing && <ShortcutsButton onClick={() => setIsHelpOpen(p => !p)} />}

      {/* Top-right cluster: extra slot (Share / AvatarStack) + Items */}
      {!isFollowing && (
        <div className="absolute top-6 right-6 pointer-events-auto flex items-center gap-2">
          {topRightSlot}
          <ItemsButton count={blocks.length} onClick={() => setIsItemsOpen(p => !p)} />
        </div>
      )}

      {!isFollowing && <MenuButton themeChoice={themeChoice} onSetTheme={setTheme} />}

      <AnimatePresence>
        {blocks.length === 0 && frames.length === 0 && !addPos && <EmptyState key="empty" />}
      </AnimatePresence>
    </div>
  );
}
