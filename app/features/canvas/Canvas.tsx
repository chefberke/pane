'use client';
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { Block, Frame, Connector } from '@/app/features/types';
import type { CanvasProps, LiveDrag } from './types';
import { BLOCK_SIZES, MIN_SCALE, MAX_SCALE, ZOOM_TO_FIT_PADDING, CONNECTOR_DRAG_SHIELD_Z } from './constants';
import { uid } from './utils';
import {
  arrangeItemsInGrid,
  blockInsideCollapsedFrame,
  blockParent,
  blockRect,
  buildBlockFrameMap,
  findEmptySpotInFrame,
  findEnclosingFrame,
  frameAncestorCollapsed,
  frameDescendantBlocks,
  frameDescendantFrames,
  frameMembers,
  frameOuterRect,
  frameParent,
  groupBoundsFromRects,
  sortFramesByDepth,
} from '../frames/utils';
import type { FrameHandlers, FrameRenameRequest, Rect } from '../frames/types';
import { FRAME_MIN_H, FRAME_MIN_W, FRAME_PADDING, TIDY_GAP } from '../frames/constants';
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
import { useBlockBounds } from './hooks/useBlockBounds';
import { useFollowViewport } from './hooks/useFollowViewport';
import { useFrames } from '../frames/hooks/useFrames';
import { useConnectors } from '../connectors/hooks/useConnectors';
import { useConnectorDrag } from '../connectors/hooks/useConnectorDrag';
import { useConnectorReshape } from '../connectors/hooks/useConnectorReshape';
import { useConnectorEndpoint } from '../connectors/hooks/useConnectorEndpoint';
import ConnectorToolbar from '../connectors/ConnectorToolbar';
import { resolveAnchors, connectorMidpoint } from '../connectors/utils';
import { usePersistence } from './hooks/usePersistence';
import { usePresenceSync } from './hooks/usePresenceSync';
import { useCanvasHint } from './hooks/useCanvasHint';
import { useCanvasIdleHint } from './hooks/useCanvasIdleHint';
import { useComments } from './hooks/useComments';
import { useFrameInteractions } from './hooks/useFrameInteractions';
import { useBlockDropTarget } from './hooks/useBlockDropTarget';
import { useFrameDropTarget } from './hooks/useFrameDropTarget';
import { useCanvasContextMenu } from './hooks/useCanvasContextMenu';
import DotGrid from './DotGrid';
import CanvasWorld from './CanvasWorld';
import CanvasOverlays from './CanvasOverlays';
import { PeerCursors } from './PeerLayer';

/** Infinite pan/zoom canvas — orchestrates viewport, blocks, frames, selection, and keyboard shortcuts. */
export default function Canvas({
  initialState, syncedAt, onSave,
  canEdit = true,
  peers = [],
  onCursorMove,
  onSelectionChange,
  topRightSlot,
  isFollowing = false,
  followTarget,
  onViewportChange,
  identity,
  viewportKey,
}: CanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  // Declared up-front (mirrors useLatestRef, synced by the effect below) so new blocks created in
  // useBlocks can read the current frames to auto-join whatever frame they land over. This also lets
  // useFrames receive setBlocks without a construction cycle (blocks ← frames ← setBlocks).
  const framesRef = useRef<Frame[]>([]);

  // ─── Domain hooks ────────────────────────────────────────────────────────
  const { themeChoice, toggleTheme, setTheme } = useTheme();
  const { offset, scale, offsetRef, scaleRef, setOffset, setScale, screenToCanvas, zoomBy, resetView, viewportRestoredRef } = useViewport(viewportRef, isFollowing, viewportKey);
  const { blocks, setBlocks, isRefreshing, addBlockFromUrl, refreshEmbeds, updateBlock, deleteBlock } = useBlocks({ screenToCanvas, framesRef });
  const {
    frames, setFrames, createFromSelection, updateFrame, deleteFrame,
    toggleCollapse, renameFrame, setFrameColor,
  } = useFrames(setBlocks);
  const { connectors, setConnectors, addConnector, deleteConnector, updateConnector, pruneByBlocks } = useConnectors();

  const blocksRef = useLatestRef(blocks);
  useEffect(() => { framesRef.current = frames; }, [frames]);
  const connectorsRef = useLatestRef(connectors);
  const { pushSnapshot, undo, redo, canUndo, canRedo } = useHistory({ setBlocks, blocksRef, setFrames, framesRef, setConnectors, connectorsRef });
  const { selectedIds, setSelectedIds, handleBlockSelect, handleBlockClickEnd, handleMultiDragMove, handleMultiDragEnd, duplicateSelected, selectAll, nudgeSelected, alignSelected } = useSelection({ blocks, setBlocks, pushSnapshot });

  // ─── Local UI state ──────────────────────────────────────────────────────
  const [selectedFrameId, setSelectedFrameId] = useState<string | null>(null);
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const selectedConnectorIdRef = useLatestRef(selectedConnectorId);
  const [liveDrag, setLiveDrag] = useState<LiveDrag | null>(null);
  const [renameFrameReq, setRenameFrameReq] = useState<FrameRenameRequest | null>(null);
  const [addPos, setAddPos] = useState<{ x: number; y: number; connectSourceId?: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [lightbox, setLightbox] = useState<{ url: string; alt?: string } | null>(null);
  const [pdfLightbox, setPdfLightbox] = useState<{ url: string; title?: string } | null>(null);
  const selectedIdsRef = useLatestRef(selectedIds);

  usePinchZoom({ viewportRef, setOffset, setScale, offsetRef, scaleRef, disabled: isFollowing });
  usePersistence({ initialState, syncedAt, onSave, canEdit, blocks, frames, connectors, offset, scale, setBlocks, setFrames, setConnectors, setScale, setOffset, viewportRestoredRef });
  usePresenceSync({ selectedIds, selectedFrameId, onSelectionChange, offset, scale, isFollowing, onViewportChange, viewportRef });
  useFollowViewport({ isFollowing, followTarget, viewportRef, offset, scale, setOffset, setScale });

  // Live block id → world rect map (true rendered sizes), used to render connector endpoints and hit-test drop targets.
  const { rectById: blockRectById, reportSize } = useBlockBounds(blocks, frames);
  const blockRectByIdRef = useLatestRef(blockRectById);
  const { pending, startConnector } = useConnectorDrag({
    viewportRef, screenToCanvas, rectByIdRef: blockRectByIdRef, addConnector, pushSnapshot,
    onDropInEmpty: canEdit ? (sx, sy, sourceId) => setAddPos({ x: sx, y: sy, connectSourceId: sourceId }) : undefined,
  });

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
    const nx = x - w / 2, ny = y - h / 2;
    const parentFrameId = findEnclosingFrame({ x: nx, y: ny, width: w, height: h }, framesRef.current)?.id ?? null;
    pushSnapshot();
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '', x: nx, y: ny, parentFrameId }]);
  }, [screenToCanvas, setBlocks, pushSnapshot, framesRef]);

  /** Adds an empty text note centered on the given screen point (used by the canvas context menu). */
  const addTextNoteAt = useCallback((sx: number, sy: number) => {
    const { x, y } = screenToCanvas(sx, sy);
    const { w, h } = BLOCK_SIZES.text;
    const nx = x - w / 2, ny = y - h / 2;
    const parentFrameId = findEnclosingFrame({ x: nx, y: ny, width: w, height: h }, framesRef.current)?.id ?? null;
    pushSnapshot();
    setBlocks(prev => [...prev, { id: uid(), type: 'text', content: '', x: nx, y: ny, parentFrameId }]);
  }, [screenToCanvas, setBlocks, pushSnapshot, framesRef]);

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

  /** Patches a connector's style or colour (with an undo checkpoint). */
  const handleUpdateConnector = useCallback((id: string, patch: Partial<Pick<Connector, 'color' | 'style'>>) => {
    pushSnapshot();
    updateConnector(id, patch);
  }, [updateConnector, pushSnapshot]);

  // Bend a connector by dragging its line/belly (menu-safe: a click selects, a drag never opens the toolbar).
  const { startReshape, reshapingId } = useConnectorReshape({
    viewportRef, screenToCanvas, rectByIdRef: blockRectByIdRef, connectorsRef,
    updateConnector, pushSnapshot, onSelect: handleSelectConnector, canEdit,
  });
  // Re-point a connector's endpoint onto a different block.
  const { endpointDrag, startEndpoint } = useConnectorEndpoint({
    viewportRef, screenToCanvas, rectByIdRef: blockRectByIdRef, connectorsRef,
    updateConnector, pushSnapshot,
  });

  /** Group currently selected blocks into a new frame. */
  const groupSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    pushSnapshot();
    const id = createFromSelection(blocksRef.current, selectedIds, framesRef.current);
    if (id) {
      setSelectedIds(new Set());
      setSelectedFrameId(id);
    }
  }, [selectedIds, createFromSelection, blocksRef, framesRef, pushSnapshot, setSelectedIds]);

  /** Remove the currently selected frame (members stay where they are). */
  const ungroupSelected = useCallback(() => {
    if (!selectedFrameId) return;
    pushSnapshot();
    deleteFrame(selectedFrameId);
    setSelectedFrameId(null);
  }, [selectedFrameId, deleteFrame, pushSnapshot]);

  /** Moves the current selection into an existing frame, auto-placing each block in free space and growing/shrinking affected frames to fit. */
  const addSelectedToFrame = useCallback((frameId: string) => {
    if (selectedIdsRef.current.size === 0) return;
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;
    pushSnapshot();

    // Compute each selected block's new spot off a working copy, so blocks placed earlier
    // in this batch are respected as obstacles for blocks placed later.
    const workingBlocks = blocksRef.current.map(b => ({ ...b }));
    const posMap = new Map<string, { x: number; y: number }>();
    selectedIdsRef.current.forEach(id => {
      const idx = workingBlocks.findIndex(b => b.id === id);
      if (idx === -1) return;
      const b = workingBlocks[idx];
      // Reserve the block's true rendered footprint (content-driven cards render taller than the static default).
      const measured = blockRectByIdRef.current.get(b.id);
      const w = measured?.width ?? b.width ?? BLOCK_SIZES[b.type].w;
      const h = measured?.height ?? b.height ?? BLOCK_SIZES[b.type].h;
      const { x, y } = findEmptySpotInFrame(frame, { w, h }, workingBlocks, framesRef.current, id);
      // Set stored membership on the working copy too, so blocks placed earlier in this batch count
      // as members of the destination (findEmptySpotInFrame reads stored membership) and later blocks
      // avoid overlapping them.
      workingBlocks[idx] = { ...b, x, y, parentFrameId: frameId };
      posMap.set(id, { x, y });
    });

    // Frames affected: the destination, plus any frame(s) the moved blocks are leaving.
    const blockFrameMapBefore = buildBlockFrameMap(blocksRef.current, framesRef.current);
    const affected = new Set<string>([frameId]);
    selectedIdsRef.current.forEach(id => {
      const old = blockFrameMapBefore.get(id);
      if (old) affected.add(old);
    });
    const newRects = new Map<string, Rect>();
    affected.forEach(fid => {
      const f = framesRef.current.find(x => x.id === fid);
      if (!f) return;
      // Membership can't be inferred purely by geometry here: a moved block may land right at
      // (or just past) the destination frame's stale edge, so force it in for `frameId` and force
      // it out of whichever frame(s) it's leaving, rather than trusting containment against old rects.
      const { blockIds, childFrameIds } = frameMembers(f, workingBlocks, framesRef.current);
      const memberIds = new Set(blockIds);
      if (fid === frameId) {
        selectedIdsRef.current.forEach(id => memberIds.add(id));
      } else {
        selectedIdsRef.current.forEach(id => memberIds.delete(id));
      }
      // Measured size paired with the block's working position (just-placed blocks moved to a new spot),
      // so the frame wraps their real rendered footprint instead of the static default.
      const rects = workingBlocks.filter(b => memberIds.has(b.id)).map(b => {
        const m = blockRectByIdRef.current.get(b.id);
        return {
          x: b.x, y: b.y,
          width: m?.width ?? b.width ?? BLOCK_SIZES[b.type].w,
          height: m?.height ?? b.height ?? BLOCK_SIZES[b.type].h,
        };
      });
      framesRef.current.forEach(cf => { if (childFrameIds.has(cf.id)) rects.push(frameOuterRect(cf)); });
      const bound = groupBoundsFromRects(rects);
      if (bound) {
        newRects.set(fid, {
          x: bound.x, y: bound.y,
          width: Math.max(FRAME_MIN_W, bound.width),
          height: Math.max(FRAME_MIN_H, bound.height),
        });
      }
    });

    // Force the moved blocks into `frameId` (the overwrite also un-nests them from any prior frame).
    setBlocks(prev => prev.map(b => { const p = posMap.get(b.id); return p ? { ...b, ...p, parentFrameId: frameId } as Block : b; }));
    setFrames(prev => prev.map(f => {
      let next = f;
      if (f.id === frameId && f.collapsed) next = { ...next, collapsed: false };
      const nr = newRects.get(f.id);
      if (nr) next = { ...next, ...nr };
      return next;
    }));
    setSelectedIds(new Set());
    setSelectedFrameId(frameId);
  }, [selectedIdsRef, framesRef, blocksRef, blockRectByIdRef, pushSnapshot, setBlocks, setFrames, setSelectedIds]);

  /** Auto-arranges a frame's direct member blocks and child frames into an evenly-spaced grid, preserving each item's natural size. */
  const arrangeFrame = useCallback((frameId: string) => {
    const frame = framesRef.current.find(f => f.id === frameId);
    if (!frame) return;

    const { blockIds, childFrameIds } = frameMembers(frame, blocksRef.current, framesRef.current);
    const items: { id: string; rect: Rect; isFrame: boolean }[] = [];
    // Use each block's true measured rect (content-driven heights for links/embeds diverge wildly
    // from the static BLOCK_SIZES defaults, which would collide rows). Measured rects only exist
    // while members are mounted — i.e. the frame is expanded; a collapsed frame's members are
    // unmounted and rectById would report the collapsed pill rect, so fall back to the static size
    // there (unchanged pre-fix behaviour; the frame un-collapses below anyway).
    const useMeasured = !frame.collapsed;
    blocksRef.current.forEach(b => {
      if (!blockIds.has(b.id)) return;
      const rect = useMeasured ? (blockRectByIdRef.current.get(b.id) ?? blockRect(b)) : blockRect(b);
      items.push({ id: b.id, rect, isFrame: false });
    });
    framesRef.current.forEach(f => { if (childFrameIds.has(f.id)) items.push({ id: f.id, rect: frameOuterRect(f), isFrame: true }); });
    if (items.length < 2) return;

    pushSnapshot();

    const origin = { x: frame.x + FRAME_PADDING, y: frame.y + FRAME_PADDING };
    const newPositions = arrangeItemsInGrid(items.map(({ id, rect }) => ({ id, rect })), origin, TIDY_GAP);

    // Direct member blocks: write new x/y straight from the grid result.
    const blockPosMap = new Map<string, { x: number; y: number }>();
    items.forEach(it => { if (!it.isFrame) { const p = newPositions.get(it.id); if (p) blockPosMap.set(it.id, p); } });

    // Child frames move as rigid units: translate the child frame + its full descendant subtree
    // by one delta each, reusing the same pattern as handleFrameDragEnd. Only ever walk descendants
    // of a moved child frame here — never of `frame` itself — so a direct member block is never
    // moved twice (once individually, once again via a parent's delta).
    const descBlockDeltas = new Map<string, { dx: number; dy: number }>();
    const frameDeltas = new Map<string, { dx: number; dy: number }>();
    const descFrameDeltas = new Map<string, { dx: number; dy: number }>();

    items.forEach(it => {
      if (!it.isFrame) return;
      const p = newPositions.get(it.id);
      const childFrame = framesRef.current.find(f => f.id === it.id);
      if (!p || !childFrame) return;
      const dx = p.x - childFrame.x, dy = p.y - childFrame.y;
      frameDeltas.set(it.id, { dx, dy });
      frameDescendantBlocks(childFrame, blocksRef.current, framesRef.current).forEach(id => descBlockDeltas.set(id, { dx, dy }));
      frameDescendantFrames(childFrame, framesRef.current).forEach(id => descFrameDeltas.set(id, { dx, dy }));
    });

    // Recompute the target frame's own bounds from the new item rects — child frames contribute
    // their new outer rect (same treatment as addSelectedToFrame's frameOuterRect(cf) push), not
    // their members' rects, so they're sized as one opaque box.
    const newItemRects: Rect[] = items.map(it => {
      const p = newPositions.get(it.id)!;
      return { x: p.x, y: p.y, width: it.rect.width, height: it.rect.height };
    });
    const bound = groupBoundsFromRects(newItemRects);

    setBlocks(prev => prev.map(b => {
      const direct = blockPosMap.get(b.id);
      if (direct) return { ...b, ...direct } as Block;
      const delta = descBlockDeltas.get(b.id);
      return delta ? { ...b, x: b.x + delta.dx, y: b.y + delta.dy } as Block : b;
    }));

    setFrames(prev => prev.map(f => {
      if (f.id === frameId) {
        let next = f.collapsed ? { ...f, collapsed: false } : f;
        if (bound) next = { ...next, x: bound.x, y: bound.y, width: Math.max(FRAME_MIN_W, bound.width), height: Math.max(FRAME_MIN_H, bound.height) };
        return next;
      }
      const cd = frameDeltas.get(f.id);
      if (cd) return { ...f, x: f.x + cd.dx, y: f.y + cd.dy };
      const dd = descFrameDeltas.get(f.id);
      return dd ? { ...f, x: f.x + dd.dx, y: f.y + dd.dy } : f;
    }));
  }, [framesRef, blocksRef, blockRectByIdRef, pushSnapshot, setBlocks, setFrames]);

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
      const deletedIds = new Set(toDeleteFrames.map(df => df.id));
      setFrames(prev => prev
        .filter(f => !deletedIds.has(f.id))
        .map(f => f.parentFrameId && deletedIds.has(f.parentFrameId) ? { ...f, parentFrameId: null } : f));
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
  const { frameDragHover, handleFrameDragRect, getFrameDropTargetId } = useFrameDropTarget({ framesRef });

  const {
    handleFrameDragMove, handleFrameDragEnd, handleFrameResize,
    handleFrameRename, handleFrameColor, handleFrameToggleCollapse, handleFrameDelete,
  } = useFrameInteractions({
    blocksRef, framesRef, blockRectByIdRef, setBlocks, setFrames, setLiveDrag,
    updateFrame, renameFrame, setFrameColor, toggleCollapse, deleteFrame,
    pushSnapshot, selectedFrameId, setSelectedFrameId, setCommentTarget,
    getFrameDropTargetId,
  });

  const { dragHover, handleBlockDragRect } = useBlockDropTarget({ blocksRef, framesRef, selectedIdsRef, setBlocks, setFrames, blockRectByIdRef });
  // Block and frame drags are mutually exclusive, so one shared highlight state feeds the frame layer.
  const activeDragHover = dragHover ?? frameDragHover;

  /** Wraps the drop-target signal so connectors follow blocks live (and smoothly) during a drag, before state commits on drop. */
  const handleBlockDragLive = useCallback((blockId: string, delta: { dx: number; dy: number } | null) => {
    handleBlockDragRect(blockId, delta);
    if (!delta) { setLiveDrag(null); return; }
    const sel = selectedIdsRef.current;
    const ids = sel.size > 1 && sel.has(blockId) ? sel : new Set([blockId]);
    // Connectors are the only thing that has to follow a block mid-drag. When no dragged block is
    // wired to a connector, skip the per-move setLiveDrag (and its full-canvas re-render) entirely —
    // the block itself moves via a direct DOM transform in useBlockDrag, so no React state changes.
    if (!connectorsRef.current.some(c => ids.has(c.sourceId) || ids.has(c.targetId))) return;
    setLiveDrag({ ids, dx: delta.dx, dy: delta.dy });
  }, [handleBlockDragRect, selectedIdsRef, connectorsRef]);

  /** Clears the live offset in the same synchronous flush that commits the group move, avoiding a one-frame jump. */
  const handleMultiDragEndLive = useCallback((dx: number, dy: number) => {
    setLiveDrag(null);
    handleMultiDragEnd(dx, dy);
  }, [handleMultiDragEnd]);

  const handleAddSubmit = useCallback(async (value: string, sx: number, sy: number, connectSourceId?: string) => {
    setAddPos(null);
    const trimmed = value.trim();
    if (!trimmed) return;
    pushSnapshot();
    let newId: string | null = null;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('<iframe')) {
      newId = await addBlockFromUrl(trimmed, sx, sy);
    } else {
      const { x, y } = screenToCanvas(sx, sy);
      const { w, h } = BLOCK_SIZES.text;
      const id = uid();
      const nx = x - w / 2, ny = y - h / 2;
      const parentFrameId = findEnclosingFrame({ x: nx, y: ny, width: w, height: h }, framesRef.current)?.id ?? null;
      setBlocks(prev => [...prev, { id, type: 'text', content: trimmed, x: nx, y: ny, parentFrameId }]);
      newId = id;
    }
    if (connectSourceId && newId) addConnector(connectSourceId, newId);
  }, [addBlockFromUrl, screenToCanvas, setBlocks, pushSnapshot, addConnector, framesRef]);

  const navigateToBlock = useCallback((block: Block) => {
    setIsSearchOpen(false);
    setIsItemsOpen(false);
    // If the block is inside a collapsed frame, expand its ancestor chain first.
    let ancestor = blockParent(block, framesRef.current);
    while (ancestor) {
      if (ancestor.collapsed) updateFrame(ancestor.id, { collapsed: false });
      ancestor = frameParent(ancestor, framesRef.current);
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
    addSelectedToFrame,
    arrangeFrame,
    deleteSelectedAny,
    handleFrameColor,
    handleOpenFrameComments: commentHandlers.handleOpenFrameComments,
    ungroupSelected,
    handleFrameDelete,
    setRenameFrameReq,
    deleteConnector: handleDeleteConnector,
  }), [addTextNoteAt, selectAll, resetView, handleOpenBlock, commentHandlers, duplicateSelected, groupSelected, addSelectedToFrame, arrangeFrame, deleteSelectedAny, handleFrameColor, ungroupSelected, handleFrameDelete, handleDeleteConnector]);

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
    canEdit,
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
    onDragRect: handleFrameDragRect,
    onResize: handleFrameResize,
    onOpenComments: commentHandlers.handleOpenFrameComments,
    onBeforeMutate: pushSnapshot,
    onContextMenu: (id: string, clientX: number, clientY: number) => {
      if (!canEdit) return;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCommentTarget(null);
      handleFrameSelect(id);
      openMenu(buildMenuRows({ kind: 'frame', id }, clientX - rect.left, clientY - rect.top), clientX, clientY, rect);
    },
    scaleRef,
    canEdit,
  }), [handleFrameSelect, handleFrameRename, handleFrameColor, handleFrameToggleCollapse, handleFrameDelete, handleFrameDragMove, handleFrameDragEnd, handleFrameDragRect, handleFrameResize, commentHandlers, pushSnapshot, openMenu, buildMenuRows, setCommentTarget, scaleRef, canEdit]);

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
      if (!canEdit) return;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCommentTarget(null);
      if (!selectedIdsRef.current.has(id)) handleBlockSelectWithFrameClear(id, false);
      openMenu(buildMenuRows({ kind: 'block', id }, clientX - rect.left, clientY - rect.top), clientX, clientY, rect);
    },
    onConnectorStart: canEdit ? startConnector : undefined,
    onMeasure: reportSize,
    scaleRef,
    canEdit,
  }), [handleBlockSelectWithFrameClear, handleBlockClickEnd, handleOpenBlock, updateBlock, handleDeleteBlock, commentHandlers, handleMultiDragMove, handleMultiDragEndLive, pushSnapshot, handleBlockDragLive, openMenu, selectedIdsRef, buildMenuRows, setCommentTarget, scaleRef, canEdit, startConnector, reportSize]);

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

  // The idle "double-click to add" hint may show only when editing is allowed and nothing else is going on.
  const idleHintEnabled = useMemo(() => (
    canEdit && !isFollowing &&
    (blocks.length + frames.length) > 0 &&   // EmptyState already advertises this on an empty canvas
    !addPos && !menu && !commentTarget && !selectedConnectorId &&
    !isSearchOpen && !isHelpOpen && !isItemsOpen && !lightbox && !pdfLightbox &&
    !liveDrag && !pending && !activeDragHover && !marquee && !isPanMode && !renameFrameReq
  ), [
    canEdit, isFollowing, blocks.length, frames.length, addPos, menu, commentTarget,
    selectedConnectorId, isSearchOpen, isHelpOpen, isItemsOpen, lightbox, pdfLightbox,
    liveDrag, pending, activeDragHover, marquee, isPanMode, renameFrameReq,
  ]);
  const { idleHint, reportPointer } = useCanvasIdleHint({ enabled: idleHintEnabled });

  // ─── Derived render data ─────────────────────────────────────────────────

  // Sort frames so outer renders first (lower z), inner on top. Skip frames whose ancestor is collapsed.
  const visibleFrames = useMemo(() => {
    const sorted = sortFramesByDepth(frames);
    return sorted.filter(f => !frameAncestorCollapsed(f, frames));
  }, [frames]);

  // Skip blocks whose stored ancestor frame is collapsed.
  const visibleBlocks = useMemo(() => {
    if (frames.length === 0) return blocks;
    return blocks.filter(b => !blockInsideCollapsedFrame(b, frames));
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

  // Selection-only view of peers, kept referentially stable across pure cursor moves (the `peers`
  // array churns at ~30 Hz per collaborator). A cursor tick changes no selection, so the world layers
  // below stay identity-stable and memo(CanvasWorld) skips — only PeerCursors (screen-space) re-renders.
  const peerSelectionSig = peers
    .map(p => `${p.id}:${p.color}:${p.selection.frameId ?? ''}:${p.selection.blockIds.join(',')}`)
    .join('|');
  const peerSelections = useMemo(
    () => peers.map(p => ({ id: p.id, color: p.color, selection: p.selection })),
    // Rebuild only when a selection/color/roster actually changes, not on every cursor move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [peerSelectionSig],
  );

  // block id → colors of peers currently selecting it; feeds on-card peer outlines (see Block.tsx).
  const peerColorsById = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const peer of peerSelections) {
      for (const bid of peer.selection.blockIds) {
        const list = m.get(bid);
        if (list) list.push(peer.color);
        else m.set(bid, [peer.color]);
      }
    }
    return m;
  }, [peerSelections]);

  const connectorLayer = useMemo(() => ({
    connectors,
    rectById: blockRectById,
    drag: liveDrag,
    pending,
    endpointDrag,
    selectedId: selectedConnectorId,
    reshapingId,
    canEdit,
    onReshapeStart: startReshape,
    onEndpointStart: startEndpoint,
    onContextMenu: handleConnectorContextMenu,
  }), [connectors, blockRectById, liveDrag, pending, endpointDrag, selectedConnectorId, reshapingId, canEdit, startReshape, startEndpoint, handleConnectorContextMenu]);

  // Screen-space anchor (viewport px) for the selected connector's floating toolbar, or null when none/missing.
  const connectorToolbar = useMemo(() => {
    if (!selectedConnectorId) return null;
    const c = connectors.find(conn => conn.id === selectedConnectorId);
    if (!c) return null;
    const s = blockRectById.get(c.sourceId);
    const t = blockRectById.get(c.targetId);
    if (!s || !t) return null;
    const { a, b } = resolveAnchors(s, t);
    const mid = connectorMidpoint(a, b, c.curvature ?? 0);
    return { connector: c, x: mid.x * scale + offset.x, y: mid.y * scale + offset.y };
  }, [selectedConnectorId, connectors, blockRectById, scale, offset]);

  // Referentially-stable layer bags so memo(CanvasWorld) can skip when only unrelated Canvas state
  // changed (hover, popovers, context menu, remote cursors). Each rebuilds only when its own inputs do.
  const frameLayer = useMemo(() => ({
    visibleFrames,
    framePresent,
    dragHover: activeDragHover,
    selectedFrameId,
    handlers: frameHandlers,
    renameRequest: renameFrameReq,
  }), [visibleFrames, framePresent, activeDragHover, selectedFrameId, frameHandlers, renameFrameReq]);

  const blockLayer = useMemo(() => ({
    visibleBlocks,
    selectedIds,
    dropTargetId: pending?.targetId ?? endpointDrag?.targetId ?? null,
    peerColorsById,
    // blockHandlers carries a stable scaleRef read only inside pointer handlers, never during render.
    // eslint-disable-next-line react-hooks/refs
    handlers: blockHandlers,
  }), [visibleBlocks, selectedIds, pending?.targetId, endpointDrag?.targetId, peerColorsById, blockHandlers]);

  const peerLayer = useMemo(() => ({ peers: peerSelections, frameById }), [peerSelections, frameById]);

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
        const rect = viewportRef.current?.getBoundingClientRect();
        if (rect) {
          const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
          reportPointer(sx, sy);
          if (onCursorMove) {
            const { x, y } = screenToCanvas(sx, sy);
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
        frameLayer={frameLayer}
        blockLayer={blockLayer}
        connectorLayer={connectorLayer}
        peerLayer={peerLayer}
      />

      {/* Transparent shield during a connector drag so pointer events keep flowing over iframes. */}
      {pending && (
        <div className="absolute inset-0" style={{ zIndex: CONNECTOR_DRAG_SHIELD_Z, cursor: 'crosshair' }} />
      )}

      <PeerCursors peers={peers} scale={scale} offset={offset} />

      {canEdit && !isFollowing && connectorToolbar && !reshapingId && !endpointDrag && (
        <ConnectorToolbar
          x={connectorToolbar.x}
          y={connectorToolbar.y}
          style={connectorToolbar.connector.style ?? 'solid'}
          color={connectorToolbar.connector.color}
          onStyle={s => handleUpdateConnector(connectorToolbar.connector.id, { style: s })}
          onColor={col => handleUpdateConnector(connectorToolbar.connector.id, { color: col })}
          onDelete={() => handleDeleteConnector(connectorToolbar.connector.id)}
        />
      )}

      <CanvasOverlays
        canEdit={canEdit}
        isFollowing={isFollowing}
        transient={{ marquee, addPos, menu, hint, commentTarget, idleHint }}
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
