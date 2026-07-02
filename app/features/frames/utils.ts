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

/** True when child frame's outer rect is fully inside parent frame's inner rect. */
export function frameInFrame(child: Frame, parent: Frame): boolean {
  if (child.id === parent.id) return false;
  return rectContains(frameInnerRect(parent), frameOuterRect(child));
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

/** All direct member blocks + child frames of `frame` (one level deep, smallest-enclosing wins). */
export function frameMembers(frame: Frame, blocks: Block[], frames: Frame[]): FrameMembership {
  const blockIds = new Set<string>();
  for (const b of blocks) {
    const owner = findEnclosingFrame(blockRect(b), frames);
    if (owner && owner.id === frame.id) blockIds.add(b.id);
  }
  const childFrameIds = new Set<string>();
  for (const f of frames) {
    if (f.id === frame.id) continue;
    const owner = findEnclosingFrame(frameOuterRect(f), frames, f.id);
    if (owner && owner.id === frame.id) childFrameIds.add(f.id);
  }
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

/** Recursively collects all descendant frame ids under `frame`. */
export function frameDescendantFrames(frame: Frame, frames: Frame[], blocks: Block[]): Set<string> {
  const out = new Set<string>();
  const stack: Frame[] = [frame];
  while (stack.length) {
    const cur = stack.pop()!;
    const { childFrameIds } = frameMembers(cur, blocks, frames);
    childFrameIds.forEach(id => {
      if (out.has(id)) return;
      out.add(id);
      const child = frames.find(f => f.id === id);
      if (child) stack.push(child);
    });
  }
  return out;
}

/** True when any ancestor frame of a block (transitive) is collapsed. */
export function isInsideCollapsedFrame(rect: Rect, frames: Frame[]): boolean {
  let owner = findEnclosingFrame(rect, frames);
  while (owner) {
    if (owner.collapsed) return true;
    owner = findEnclosingFrame(frameOuterRect(owner), frames, owner.id);
  }
  return false;
}

/** The outermost collapsed ancestor frame enclosing `rect` — i.e. the one whose collapsed pill is actually visible on the canvas — or null if no ancestor is collapsed. */
export function findCollapsedAncestorFrame(rect: Rect, frames: Frame[]): Frame | null {
  let owner = findEnclosingFrame(rect, frames);
  let collapsed: Frame | null = null;
  while (owner) {
    if (owner.collapsed) collapsed = owner;
    owner = findEnclosingFrame(frameOuterRect(owner), frames, owner.id);
  }
  return collapsed;
}

/** True when a frame's nearest ancestor frame chain contains a collapsed frame. */
export function frameAncestorCollapsed(frame: Frame, frames: Frame[]): boolean {
  let owner = findEnclosingFrame(frameOuterRect(frame), frames, frame.id);
  while (owner) {
    if (owner.collapsed) return true;
    owner = findEnclosingFrame(frameOuterRect(owner), frames, owner.id);
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

/** Depth of a frame in the frame tree (0 = root). Lower depth renders first. */
export function frameDepth(frame: Frame, frames: Frame[]): number {
  let depth = 0;
  let owner = findEnclosingFrame(frameOuterRect(frame), frames, frame.id);
  while (owner && depth < 32) {
    depth++;
    owner = findEnclosingFrame(frameOuterRect(owner), frames, owner.id);
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
 * Picks the best drop-target frame for a dragged rect.
 *
 * Prefers the smallest frame whose inner rect contains the dragged rect's center.
 * Falls back to the smallest frame that overlaps the dragged rect by more than 25%.
 */
export function pickDropTargetFrame(rect: Rect, frames: Frame[]): Frame | null {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  let centerHit: Frame | null = null;
  let centerArea = Infinity;
  let overlapHit: Frame | null = null;
  let overlapArea = Infinity;
  const dragArea = Math.max(1, rect.width * rect.height);
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
 * Computes a frame's preview rect during a block drag.
 *
 * - For each current member block of `frame`: use its projected rect (if it's being dragged) or its original rect.
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
      rects.push(blockRect(b));
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
