import type { Connector, ConnectorSide } from '@/app/features/types';
import type { Anchor, Point, Rect } from './types';
import { MIN_CURVE, MAX_CURVE, CURVE_RATIO } from './constants';

/** Generates a UUID for a new connector. */
export function uid(): string {
  return crypto.randomUUID();
}

/** Centre point of a rect. */
function center(r: Rect): Point {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
}

/** Returns a copy of `r` translated by (dx, dy) — used to preview a block's live drag position. */
export function shiftRect(r: Rect, dx: number, dy: number): Rect {
  return { x: r.x + dx, y: r.y + dy, width: r.width, height: r.height };
}

/** Anchor at the midpoint of one of a rect's sides, with its outward normal direction. */
export function sideAnchor(r: Rect, side: ConnectorSide): Anchor {
  switch (side) {
    case 'right':  return { x: r.x + r.width,     y: r.y + r.height / 2, dir: { x: 1, y: 0 } };
    case 'left':   return { x: r.x,               y: r.y + r.height / 2, dir: { x: -1, y: 0 } };
    case 'bottom': return { x: r.x + r.width / 2, y: r.y + r.height,     dir: { x: 0, y: 1 } };
    case 'top':    return { x: r.x + r.width / 2, y: r.y,                dir: { x: 0, y: -1 } };
  }
}

/** Picks the facing sides of two rects (dominant axis) and returns their anchor points. */
export function resolveAnchors(src: Rect, tgt: Rect): { a: Anchor; b: Anchor } {
  const cs = center(src);
  const ct = center(tgt);
  const dx = ct.x - cs.x;
  const dy = ct.y - cs.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { a: sideAnchor(src, 'right'), b: sideAnchor(tgt, 'left') }
      : { a: sideAnchor(src, 'left'),  b: sideAnchor(tgt, 'right') };
  }
  return dy >= 0
    ? { a: sideAnchor(src, 'bottom'), b: sideAnchor(tgt, 'top') }
    : { a: sideAnchor(src, 'top'),    b: sideAnchor(tgt, 'bottom') };
}

/** Anchor on the side of `r` that best faces an arbitrary point (used for the in-progress ghost). */
export function anchorToPoint(r: Rect, p: Point): Anchor {
  const c = center(r);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  if (Math.abs(dx) >= Math.abs(dy)) return sideAnchor(r, dx >= 0 ? 'right' : 'left');
  return sideAnchor(r, dy >= 0 ? 'bottom' : 'top');
}

/** A free endpoint at `p` whose direction eases back toward `from` so the ghost curve stays smooth. */
export function pointAnchor(p: Point, from: Point): Anchor {
  const dx = p.x - from.x;
  const dy = p.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: p.x, y: p.y, dir: { x: -dx / len, y: -dy / len } };
}

/** Builds an SVG cubic-bezier `d` string between two anchors, curving along each anchor's direction. */
export function bezierPath(a: Anchor, b: Anchor): string {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  const k = Math.max(MIN_CURVE, Math.min(MAX_CURVE, dist * CURVE_RATIO));
  const c1x = a.x + a.dir.x * k;
  const c1y = a.y + a.dir.y * k;
  const c2x = b.x + b.dir.x * k;
  const c2y = b.y + b.dir.y * k;
  return `M ${a.x} ${a.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${b.x} ${b.y}`;
}

/** Returns the id of the topmost block whose rect contains `p`, excluding `excludeId`, or null. */
export function findTargetAt(p: Point, rects: Map<string, Rect>, excludeId: string): string | null {
  let found: string | null = null;
  for (const [id, r] of rects) {
    if (id === excludeId) continue;
    if (p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height) found = id;
  }
  return found;
}

/** Drops any connectors whose source or target block is no longer present. */
export function pruneConnectors(connectors: Connector[], liveIds: Set<string>): Connector[] {
  return connectors.filter(c => liveIds.has(c.sourceId) && liveIds.has(c.targetId));
}
