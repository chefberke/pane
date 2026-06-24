'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { Connector } from '@/app/features/types';
import type { PendingConnector, Rect } from './types';
import ConnectorPath from './ConnectorPath';
import { resolveAnchors, bezierPath, anchorToPoint, pointAnchor, shiftRect } from './utils';
import { STROKE_COLOR, STROKE_WIDTH, ARROW_SIZE } from './constants';

interface Props {
  connectors: Connector[];
  rectById: Map<string, Rect>;
  /** Live block-drag offset so connectors follow blocks mid-drag (before positions commit to state). */
  drag: { ids: Set<string>; dx: number; dy: number } | null;
  pending: PendingConnector | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onContextMenu: (id: string, clientX: number, clientY: number) => void;
}

// 1×1 box with overflow visible: the layer draws/handles clicks anywhere in world space without
// covering the empty canvas (so marquee/pan still work). Coordinates are raw world units.
const SVG_STYLE: CSSProperties = { position: 'absolute', top: 0, left: 0, width: 1, height: 1, overflow: 'visible' };
const GHOST_STYLE: CSSProperties = { pointerEvents: 'none' };
const ARROW_PATH = `M0,0 L${ARROW_SIZE},${ARROW_SIZE / 2} L0,${ARROW_SIZE} Z`;

/** World-space SVG layer rendering every connector plus the in-progress drag ghost. */
function Connectors({ connectors, rectById, drag, pending, selectedId, onSelect, onContextMenu }: Props) {
  const rectOf = (id: string): Rect | undefined => {
    const r = rectById.get(id);
    if (!r) return undefined;
    return drag && drag.ids.has(id) ? shiftRect(r, drag.dx, drag.dy) : r;
  };

  let ghost: string | null = null;
  if (pending) {
    const src = rectOf(pending.sourceId);
    if (src) {
      const a = anchorToPoint(src, pending.cursor);
      const b = pointAnchor(pending.cursor, a);
      ghost = bezierPath(a, b);
    }
  }

  return (
    <svg style={SVG_STYLE}>
      <defs>
        <marker id="conn-arrow" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE} refX={ARROW_SIZE * 0.85} refY={ARROW_SIZE / 2} orient="auto" markerUnits="userSpaceOnUse">
          <path d={ARROW_PATH} fill={STROKE_COLOR} />
        </marker>
        <marker id="conn-arrow-sel" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE} refX={ARROW_SIZE * 0.85} refY={ARROW_SIZE / 2} orient="auto" markerUnits="userSpaceOnUse">
          <path d={ARROW_PATH} fill="var(--color-ring-selection)" />
        </marker>
      </defs>

      {connectors.map(c => {
        const s = rectOf(c.sourceId);
        const t = rectOf(c.targetId);
        if (!s || !t) return null;
        const { a, b } = resolveAnchors(s, t);
        return (
          <ConnectorPath
            key={c.id}
            id={c.id}
            d={bezierPath(a, b)}
            selected={selectedId === c.id}
            color={c.color}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
          />
        );
      })}

      {ghost && (
        <path d={ghost} fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeDasharray="6 5" strokeLinecap="round" markerEnd="url(#conn-arrow)" opacity={0.85} style={GHOST_STYLE} />
      )}
    </svg>
  );
}

export default memo(Connectors);
