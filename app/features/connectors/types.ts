import type { ConnectorSide } from '@/app/features/types';

/** A point in canvas world coordinates. */
export interface Point {
  x: number;
  y: number;
}

/** A bounding rectangle in canvas world coordinates (structurally compatible with the frames Rect). */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A resolved connector endpoint: a point on a block's border plus the outward direction the curve leaves in. */
export interface Anchor {
  x: number;
  y: number;
  dir: Point;
}

/** Transient state while the user is dragging out a new connector from a block edge. */
export interface PendingConnector {
  sourceId: string;
  side: ConnectorSide;
  cursor: Point;
}
