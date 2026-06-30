import { memo } from 'react';
import type { CSSProperties } from 'react';
import {
  SELECTION_DASH, SELECTION_DASH_PERIOD, SELECTION_STROKE_WIDTH,
  SELECTION_MARCH_MS, SELECTION_OFFSET, SELECTION_COLOR,
} from './constants';

interface Props {
  /** Corner radius (px) of the shape being outlined. */
  radius: number;
  /** Distance (px) the ring sits outside the shape; defaults to SELECTION_OFFSET. */
  offset?: number;
}

const MARCH_STYLE = {
  '--sel-march-distance': `-${SELECTION_DASH_PERIOD}`,
  '--sel-march-duration': `${SELECTION_MARCH_MS}ms`,
} as CSSProperties;

/** Animated marching-ants selection ring (brand gradient) that hugs a rounded rect. */
function SelectionOutline({ radius, offset = SELECTION_OFFSET }: Props) {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: -offset,
        left: -offset,
        width: `calc(100% + ${offset * 2}px)`,
        height: `calc(100% + ${offset * 2}px)`,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        rx={radius + offset}
        fill="none"
        stroke={SELECTION_COLOR}
        strokeWidth={SELECTION_STROKE_WIDTH}
        strokeDasharray={SELECTION_DASH}
        strokeLinecap="round"
        className="selection-march"
        style={MARCH_STYLE}
      />
    </svg>
  );
}

export default memo(SelectionOutline);
