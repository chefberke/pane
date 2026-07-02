'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { Connector } from '@/app/features/types';
import type { EndpointDrag, PendingConnector, Rect } from './types';
import ConnectorPath from './ConnectorPath';
import EditHandle from './EditHandle';
import { resolveAnchors, bezierPath, anchorToPoint, pointAnchor, shiftRect, markerIdForColor, connectorMidpoint } from './utils';
import { STROKE_COLOR, STROKE_WIDTH, ARROW_SIZE, CONNECTOR_SWATCHES } from './constants';
import { SELECTION_COLOR } from '../ui/constants';

interface Props {
  connectors: Connector[];
  rectById: Map<string, Rect>;
  /** Live block-drag offset so connectors follow blocks mid-drag (before positions commit to state). */
  drag: { ids: Set<string>; dx: number; dy: number } | null;
  pending: PendingConnector | null;
  /** Set while an endpoint of an existing connector is being re-pointed; drives its live preview. */
  endpointDrag: EndpointDrag | null;
  selectedId: string | null;
  /** Id of the connector currently being bend-dragged (crossed the drag threshold), or null. */
  reshapingId: string | null;
  canEdit: boolean;
  /** Live canvas zoom, so edit-handle dots can stay a constant on-screen size. */
  scale: number;
  /** Press on the line/belly: click selects (opens toolbar), drag bends the curve. */
  onReshapeStart: (id: string, e: React.PointerEvent) => void;
  /** Press on an endpoint handle: drag re-points that end to another block. */
  onEndpointStart: (id: string, end: 'source' | 'target', e: React.PointerEvent) => void;
  onContextMenu: (id: string, clientX: number, clientY: number) => void;
}

// 1×1 box with overflow visible: the layer draws/handles clicks anywhere in world space without
// covering the empty canvas (so marquee/pan still work). Coordinates are raw world units.
const SVG_STYLE: CSSProperties = { position: 'absolute', top: 0, left: 0, width: 1, height: 1, overflow: 'visible' };
const GHOST_STYLE: CSSProperties = { pointerEvents: 'none' };
const ARROW_PATH = `M0,0 L${ARROW_SIZE},${ARROW_SIZE / 2} L0,${ARROW_SIZE} Z`;

/** World-space SVG layer rendering every connector, its edit handles, and the in-progress drag ghost. */
function Connectors({ connectors, rectById, drag, pending, endpointDrag, selectedId, reshapingId, canEdit, scale, onReshapeStart, onEndpointStart, onContextMenu }: Props) {
  const rectOf = (id: string): Rect | undefined => {
    const r = rectById.get(id);
    if (!r) return undefined;
    return drag && drag.ids.has(id) ? shiftRect(r, drag.dx, drag.dy) : r;
  };

  let ghost: string | null = null;
  let locked = false; // ghost snapped to a hovered target block (vs. free-floating to the cursor)
  if (pending) {
    const src = rectOf(pending.sourceId);
    if (src) {
      const tgt = pending.targetId ? rectOf(pending.targetId) : undefined;
      if (tgt) {
        const { a, b } = resolveAnchors(src, tgt);
        ghost = bezierPath(a, b);
        locked = true;
      } else {
        const a = anchorToPoint(src, pending.cursor);
        ghost = bezierPath(a, pointAnchor(pending.cursor, a));
      }
    }
  }

  return (
    <svg style={SVG_STYLE}>
      <defs>
        {/* Default (slate) arrowhead — used by the drag ghost and colourless connectors. */}
        <marker id="conn-arrow" markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE} refX={ARROW_SIZE * 0.85} refY={ARROW_SIZE / 2} orient="auto" markerUnits="userSpaceOnUse">
          <path d={ARROW_PATH} fill={STROKE_COLOR} />
        </marker>
        {/* One arrowhead per swatch so the head colour matches the line colour. */}
        {CONNECTOR_SWATCHES.map((s, i) => (
          <marker key={s.value} id={`conn-arrow-${i}`} markerWidth={ARROW_SIZE} markerHeight={ARROW_SIZE} refX={ARROW_SIZE * 0.85} refY={ARROW_SIZE / 2} orient="auto" markerUnits="userSpaceOnUse">
            <path d={ARROW_PATH} fill={s.value} />
          </marker>
        ))}
      </defs>

      {connectors.map(c => {
        const s = rectOf(c.sourceId);
        const t = rectOf(c.targetId);
        if (!s || !t) return null;
        const bend = c.curvature ?? 0;
        const { a, b } = resolveAnchors(s, t);
        const isEndpointDragging = endpointDrag?.connectorId === c.id;

        // While an endpoint is being re-pointed, preview the moving end following the cursor
        // (snapping to a hovered block), reusing the same anchors the create-ghost uses.
        let d = bezierPath(a, b, bend);
        if (isEndpointDragging && endpointDrag) {
          const fixedRect = rectOf(endpointDrag.end === 'source' ? c.targetId : c.sourceId);
          if (!fixedRect) return null;
          const snapRect = endpointDrag.targetId ? rectOf(endpointDrag.targetId) : undefined;
          if (snapRect) {
            const { a: pa, b: pb } = endpointDrag.end === 'source'
              ? resolveAnchors(snapRect, fixedRect)   // new source → fixed target
              : resolveAnchors(fixedRect, snapRect);  // fixed source → new target
            d = bezierPath(pa, pb, bend);
          } else {
            const fixedAnchor = anchorToPoint(fixedRect, endpointDrag.cursor);
            const freeAnchor = pointAnchor(endpointDrag.cursor, fixedAnchor);
            const [pa, pb] = endpointDrag.end === 'source' ? [freeAnchor, fixedAnchor] : [fixedAnchor, freeAnchor];
            d = bezierPath(pa, pb);   // free-floating: no bend
          }
        }

        const showHandles = canEdit && selectedId === c.id && !isEndpointDragging;
        const belly = showHandles ? connectorMidpoint(a, b, bend) : null;
        const isReshaping = reshapingId === c.id;
        return (
          <g key={c.id}>
            <ConnectorPath
              id={c.id}
              d={d}
              selected={selectedId === c.id}
              isReshaping={isReshaping}
              color={c.color}
              style={c.style ?? 'solid'}
              markerId={markerIdForColor(c.color)}
              onReshapeStart={onReshapeStart}
              onContextMenu={onContextMenu}
            />
            {showHandles && belly && (
              <>
                <EditHandle cx={a.x} cy={a.y} scale={scale} fill="#fff" stroke={SELECTION_COLOR} cursor="crosshair" onPointerDown={e => onEndpointStart(c.id, 'source', e)} />
                <EditHandle cx={b.x} cy={b.y} scale={scale} fill="#fff" stroke={SELECTION_COLOR} cursor="crosshair" onPointerDown={e => onEndpointStart(c.id, 'target', e)} />
                <EditHandle cx={belly.x} cy={belly.y} scale={scale} fill={SELECTION_COLOR} stroke="#fff" cursor={isReshaping ? 'grabbing' : 'grab'} onPointerDown={e => onReshapeStart(c.id, e)} />
              </>
            )}
          </g>
        );
      })}

      {ghost && (
        <path d={ghost} fill="none" stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeDasharray={locked ? undefined : '6 5'} strokeLinecap="round" markerEnd="url(#conn-arrow)" opacity={locked ? 1 : 0.85} style={GHOST_STYLE} />
      )}
    </svg>
  );
}

export default memo(Connectors);
