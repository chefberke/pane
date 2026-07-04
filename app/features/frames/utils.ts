import type { Block, Frame } from '@/app/features/types';
import { BLOCK_SIZES } from '@/app/features/canvas/constants';
import type { FrameMembership, Rect } from './types';
import { FRAME_PADDING } from './constants';

// Tuning knobs for findEmptySpotInFrame's grid scan — single-consumer, kept local rather than in constants.ts.
const EMPTY_SPOT_STEP = FRAME_PADDING;
const EMPTY_SPOT_GAP = FRAME_PADDING;
const EMPTY_SPOT_MAX_ROWS = 400;

/** Generates a UUID v4 for a new frame. */
export function frameUid(): string {
  return crypto.randomUUID();
}

/** Returns the axis-aligned bounding rect of a block in canvas coordinates. */
export function blockRect(block: Block): Rect {
  const w = block.width ?? BLOCK_SIZES[block.type].w;
  const h = block.height ?? BLOCK_SIZES[block.type].h;
  return { x: block.x, y: block.y, width: w, height: h };
}

/** Returns the outer rect of a frame (including title bar). */
export function frameOuterRect(frame: Frame): Rect {
  return { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
}

/** Returns the inner content rect of a frame. With the exterior header style, this equals the outer rect. */
export function frameInnerRect(frame: Frame): Rect {
  return { x: frame.x, y: frame.y, width: frame.width, height: frame.height };
}

/** True when rect `inner` is fully inside rect `outer`. */
export function rectContains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/** Returns the area of a rect (used to pick the smallest enclosing frame). */
export function rectArea(r: Rect): number {
  return Math.max(0, r.width) * Math.max(0, r.height);
}

/** True when a block's rect is fully inside the frame's inner content rect. */
export function blockInFrame(block: Block, frame: Frame): boolean {
  return rectContains(frameInnerRect(frame), blockRect(block));
}

/** The stored parent frame of `frame` (via `parentFrameId`), or null when top-level or the id is dangling/unset. */
export function frameParent(frame: Frame, frames: Frame[]): Frame | null {
  if (!frame.parentFrameId) return null;
  return frames.find(f => f.id === frame.parentFrameId) ?? null;
}

/** The frames whose stored `parentFrameId` points at `frame` (its direct child frames). */
export function frameChildFrames(frame: Frame, frames: Frame[]): Frame[] {
  return frames.filter(f => f.parentFrameId === frame.id);
}

/** Returns the smallest enclosing frame for a given rect, or null. */
export function findEnclosingFrame(rect: Rect, frames: Frame[], excludeId?: string): Frame | null {
  let best: Frame | null = null;
  let bestArea = Infinity;
  for (const f of frames) {
    if (excludeId && f.id === excludeId) continue;
    if (!rectContains(frameInnerRect(f), rect)) continue;
    const a = rectArea(frameOuterRect(f));
    if (a < bestArea) { best = f; bestArea = a; }
  }
  return best;
}

/**
 * Direct members of `frame`: blocks are derived geometrically (smallest enclosing frame wins),
 * child frames come from STORED `parentFrameId` — so a frame only counts as nested when it was
 * intentionally dropped in, never merely by geometric overlap.
 */
export function frameMembers(frame: Frame, blocks: Block[], frames: Frame[]): FrameMembership {
  const blockIds = new Set<string>();
  for (const b of blocks) {
    const owner = findEnclosingFrame(blockRect(b), frames);
    if (owner && owner.id === frame.id) blockIds.add(b.id);
  }
  const childFrameIds = new Set<string>(frameChildFrames(frame, frames).map(f => f.id));
  return { blockIds, childFrameIds };
}

/** True when two rects overlap, treating anything closer than `gap` apart as touching. */
function rectsOverlapWithGap(a: Rect, b: Rect, gap: number): boolean {
  return !(
    a.x + a.width + gap <= b.x ||
    b.x + b.width + gap <= a.x ||
    a.y + a.height + gap <= b.y ||
    b.y + b.height + gap <= a.y
  );
}

/**
 * Finds a free spot of the given size inside `frame` that doesn't overlap its current member
 * blocks/child frames, by grid-scanning from the frame's top-left. `excludeId` omits a block
 * (typically the one being placed) from the occupancy check so its own stale position doesn't
 * count as an obstacle. Falls back to stacking below the lowest member if the scan is exhausted.
 */
export function findEmptySpotInFrame(
  frame: Frame,
  size: { w: number; h: number },
  blocks: Block[],
  frames: Frame[],
  excludeId?: string,
): { x: number; y: number } {
  const { blockIds, childFrameIds } = frameMembers(frame, blocks, frames);
  const occupied: Rect[] = [];
  for (const b of blocks) {
    if (blockIds.has(b.id) && b.id !== excludeId) occupied.push(blockRect(b));
  }
  for (const f of frames) {
    if (childFrameIds.has(f.id)) occupied.push(frameOuterRect(f));
  }

  const inner = frameInnerRect(frame);
  const left = inner.x + FRAME_PADDING;
  const right = Math.max(left + size.w, inner.x + inner.width - FRAME_PADDING);
  const top = inner.y + FRAME_PADDING;

  for (let row = 0; row < EMPTY_SPOT_MAX_ROWS; row++) {
    const y = top + row * EMPTY_SPOT_STEP;
    for (let x = left; x <= right - size.w || x === left; x += EMPTY_SPOT_STEP) {
      const candidate: Rect = { x, y, width: size.w, height: size.h };
      if (!occupied.some(o => rectsOverlapWithGap(candidate, o, EMPTY_SPOT_GAP))) {
        return { x, y };
      }
      if (x >= right - size.w) break;
    }
  }

  const maxBottom = occupied.reduce((m, o) => Math.max(m, o.y + o.height), top);
  return { x: left, y: maxBottom + FRAME_PADDING };
}

/** Recursively collects all descendant block ids under `frame`. */
export function frameDescendantBlocks(frame: Frame, blocks: Block[], frames: Frame[]): Set<string> {
  const out = new Set<string>();
  const stack: Frame[] = [frame];
  while (stack.length) {
    const cur = stack.pop()!;
    const { blockIds, childFrameIds } = frameMembers(cur, blocks, frames);
    blockIds.forEach(id => out.add(id));
    childFrameIds.forEach(id => {
      const child = frames.find(f => f.id === id);
      if (child) stack.push(child);
    });
  }
  return out;
}

/** Recursively collects all descendant frame ids under `frame`, following stored `parentFrameId` links. The `out` set doubles as a visited guard so cycles can't loop. */
export function frameDescendantFrames(frame: Frame, frames: Frame[]): Set<string> {
  const out = new Set<string>();
  const stack: Frame[] = [frame];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const child of frameChildFrames(cur, frames)) {
      if (out.has(child.id)) continue;
      out.add(child.id);
      stack.push(child);
    }
  }
  return out;
}

/** True when any ancestor frame of a block (transitive) is collapsed. Block→owner step is geometric; the ancestor walk follows stored `parentFrameId`. */
export function isInsideCollapsedFrame(rect: Rect, frames: Frame[]): boolean {
  let owner = findEnclosingFrame(rect, frames);
  const seen = new Set<string>();
  while (owner && !seen.has(owner.id)) {
    if (owner.collapsed) return true;
    seen.add(owner.id);
    owner = frameParent(owner, frames);
  }
  return false;
}

/** The outermost collapsed ancestor frame enclosing `rect` — i.e. the one whose collapsed pill is actually visible on the canvas — or null if no ancestor is collapsed. Ancestor walk follows stored `parentFrameId`. */
export function findCollapsedAncestorFrame(rect: Rect, frames: Frame[]): Frame | null {
  let owner = findEnclosingFrame(rect, frames);
  let collapsed: Frame | null = null;
  const seen = new Set<string>();
  while (owner && !seen.has(owner.id)) {
    if (owner.collapsed) collapsed = owner;
    seen.add(owner.id);
    owner = frameParent(owner, frames);
  }
  return collapsed;
}

/** True when a frame's stored ancestor chain contains a collapsed frame. */
export function frameAncestorCollapsed(frame: Frame, frames: Frame[]): boolean {
  let owner = frameParent(frame, frames);
  const seen = new Set<string>();
  while (owner && !seen.has(owner.id)) {
    if (owner.collapsed) return true;
    seen.add(owner.id);
    owner = frameParent(owner, frames);
  }
  return false;
}

/** Computes a frame rect that wraps the union of given block + frame rects, with padding. */
export function groupBoundsFromRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const r of rects) {
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r.x + r.width > maxX) maxX = r.x + r.width;
    if (r.y + r.height > maxY) maxY = r.y + r.height;
  }
  return {
    x: minX - FRAME_PADDING,
    y: minY - FRAME_PADDING,
    width: maxX - minX + FRAME_PADDING * 2,
    height: maxY - minY + FRAME_PADDING * 2,
  };
}

/** Computes a frame rect from a set of selected block ids. */
export function groupBoundsFromBlocks(blocks: Block[], selectedIds: Set<string>): Rect | null {
  const rects = blocks.filter(b => selectedIds.has(b.id)).map(blockRect);
  return groupBoundsFromRects(rects);
}

/**
 * Masonry-packs items into evenly-spaced columns (shortest-column first), preserving each
 * item's own size. Cards stack tightly with no vertical gaps — a tall card never forces empty
 * space under its shorter row-mates. Returns each item's new top-left position, anchored at `origin`.
 */
export function arrangeItemsInGrid(
  items: { id: string; rect: Rect }[],
  origin: { x: number; y: number },
  gap: number = FRAME_PADDING,
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const n = items.length;
  if (n === 0) return positions;
  if (n === 1) { positions.set(items[0].id, origin); return positions; }

  // Preserve reading order (top-to-bottom, then left-to-right) so the first row still fills
  // left-to-right and tidying reads as a reflow of the existing layout, not a reshuffle.
  const sorted = [...items].sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);

  const avgW = Math.max(1, sorted.reduce((s, it) => s + it.rect.width, 0) / n);
  const avgH = Math.max(1, sorted.reduce((s, it) => s + it.rect.height, 0) / n);
  // cols·avgW ≈ (n/cols)·avgH  ⇒  cols ≈ √(n·avgH/avgW) — makes total width ≈ total height.
  const cols = Math.min(n, Math.max(1, Math.round(Math.sqrt(n * (avgH / avgW)))));

  // Uniform column width keeps column edges aligned; narrower items left-align in their column.
  const colWidth = Math.max(...sorted.map(it => it.rect.width));
  // Running bottom edge of each column; drop each item into whichever column is currently
  // shortest (ties → leftmost), so columns stay balanced and, for equal heights, this degrades
  // to a clean row-major grid.
  const colY = new Array<number>(cols).fill(origin.y);
  for (const it of sorted) {
    let col = 0;
    for (let c = 1; c < cols; c++) {
      if (colY[c] < colY[col]) col = c;
    }
    positions.set(it.id, { x: origin.x + col * (colWidth + gap), y: colY[col] });
    colY[col] += it.rect.height + gap;
  }
  return positions;
}

/** Depth of a frame in the stored frame tree (0 = root). Lower depth renders first. */
export function frameDepth(frame: Frame, frames: Frame[]): number {
  let depth = 0;
  let owner = frameParent(frame, frames);
  while (owner && depth < 32) {
    depth++;
    owner = frameParent(owner, frames);
  }
  return depth;
}

/** Sorts frames so outer (lower depth) frames render first, inner frames render on top. */
export function sortFramesByDepth(frames: Frame[]): Frame[] {
  const depths = new Map<string, number>();
  frames.forEach(f => depths.set(f.id, frameDepth(f, frames)));
  return [...frames].sort((a, b) => (depths.get(a.id)! - depths.get(b.id)!));
}

/** Maps every block id to its smallest enclosing frame id, if any. */
export function buildBlockFrameMap(blocks: Block[], frames: Frame[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const b of blocks) {
    const owner = findEnclosingFrame(blockRect(b), frames);
    if (owner) map.set(b.id, owner.id);
  }
  return map;
}

/** Returns the area of intersection of two rects. */
function rectIntersectArea(a: Rect, b: Rect): number {
  const w = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const h = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return w * h;
}

/**
 * Picks the best drop-target frame for a dragged BLOCK rect: the smallest frame whose inner rect
 * contains the dragged rect's center, else the smallest frame it overlaps by more than 25%.
 * (Frame-into-frame nesting is decided by `frameDropTarget`, which is center-only.)
 */
export function pickDropTargetFrame(rect: Rect, frames: Frame[]): Frame | null {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const dragArea = Math.max(1, rect.width * rect.height);
  let centerHit: Frame | null = null;
  let centerArea = Infinity;
  let overlapHit: Frame | null = null;
  let overlapArea = Infinity;
  for (const f of frames) {
    const inner = frameInnerRect(f);
    const a = rectArea(frameOuterRect(f));
    if (cx >= inner.x && cy >= inner.y && cx <= inner.x + inner.width && cy <= inner.y + inner.height) {
      if (a < centerArea) { centerHit = f; centerArea = a; }
    } else {
      const ov = rectIntersectArea(inner, rect);
      if (ov / dragArea > 0.25 && a < overlapArea) { overlapHit = f; overlapArea = a; }
    }
  }
  return centerHit ?? overlapHit;
}

/**
 * The frame a dragged frame would nest into if dropped at its projected (dx,dy) position, or null.
 * Rule: the SMALLEST frame whose rect contains the dragged frame's projected CENTER point, excluding
 * the frame itself and its stored descendants (so a frame can never be dropped into its own subtree —
 * cycle prevention). Center-based (not cover-ratio) so dragging a large frame onto a small one nests
 * just as reliably as the reverse; a center over empty space → null (top-level).
 */
export function frameDropTarget(frame: Frame, dx: number, dy: number, frames: Frame[]): Frame | null {
  // A zero-size rect at the projected center makes rectContains reduce exactly to point-in-rect.
  const center: Rect = { x: frame.x + dx + frame.width / 2, y: frame.y + dy + frame.height / 2, width: 0, height: 0 };
  const exclude = new Set<string>([frame.id, ...frameDescendantFrames(frame, frames)]);
  let best: Frame | null = null;
  let bestArea = Infinity;
  for (const f of frames) {
    if (exclude.has(f.id)) continue;
    if (!rectContains(frameInnerRect(f), center)) continue;
    const a = rectArea(frameOuterRect(f));
    if (a < bestArea) { best = f; bestArea = a; }
  }
  return best;
}

/**
 * One-time migration: for every frame with an unset (`undefined`) `parentFrameId`, derive it from
 * the current geometry (smallest enclosing frame) so pre-migration canvases keep their existing
 * nesting. Frames that already have an explicit value (`string` or `null`) are left untouched, which
 * makes this idempotent and preserves intentional un-nests across reloads/remote re-hydration.
 */
export function backfillFrameParents(frames: Frame[]): Frame[] {
  if (frames.every(f => f.parentFrameId !== undefined)) return frames;
  return frames.map(f =>
    f.parentFrameId === undefined
      ? { ...f, parentFrameId: findEnclosingFrame(frameOuterRect(f), frames, f.id)?.id ?? null }
      : f,
  );
}

/**
 * Computes a frame's preview rect during a block drag.
 *
 * - For each current member block of `frame`: use its projected rect (if it's being dragged) or its original rect.
 *   When `measured` is supplied, a retained member's true rendered rect is preferred over its static
 *   `blockRect` (falling back to it) so the frame never shrinks to cut through a taller-rendered card.
 * - If `includeIncoming` is true, also include any dragged blocks whose projected rect is being added.
 * - Returns the tight bound (with `FRAME_PADDING`) — never smaller than the frame's existing position
 *   collapsing point. If empty, returns the frame's current rect.
 */
export function computeFramePreviewRect(
  frame: Frame,
  blocks: Block[],
  frames: Frame[],
  draggedIds: Set<string>,
  projectedRects: Map<string, Rect>,
  includeIncoming: boolean,
  measured?: Map<string, Rect>,
): Rect {
  const memberIds = frameMembers(frame, blocks, frames).blockIds;
  const rects: Rect[] = [];
  for (const b of blocks) {
    if (memberIds.has(b.id)) {
      if (draggedIds.has(b.id)) {
        // Member is being dragged — only keep it if it's still landing inside this frame (handled by caller).
        // If caller says includeIncoming covers it, skip; otherwise this block is leaving → don't include.
        continue;
      }
      // Retained members are stationary, so the measured rect's x/y already matches the block's.
      rects.push(measured?.get(b.id) ?? blockRect(b));
    }
  }
  if (includeIncoming) {
    draggedIds.forEach(id => {
      const r = projectedRects.get(id);
      if (r) rects.push(r);
    });
  }
  // Also include any nested child frame outer rects so we don't shrink past them.
  const { childFrameIds } = frameMembers(frame, blocks, frames);
  for (const f of frames) {
    if (childFrameIds.has(f.id)) rects.push(frameOuterRect(f));
  }
  const bound = groupBoundsFromRects(rects);
  if (!bound) return frameOuterRect(frame);
  return bound;
}
