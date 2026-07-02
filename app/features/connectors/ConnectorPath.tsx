'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { ConnectorStyle } from '@/app/features/types';
import {
  STROKE_COLOR, STROKE_WIDTH, STROKE_WIDTH_SELECTED, HIT_STROKE_WIDTH, LINE_DASH,
} from './constants';
import {
  SELECTION_ARROW_STROKE_WIDTH, SELECTION_DASH, SELECTION_DASH_PERIOD, SELECTION_MARCH_MS,
  SELECTION_COLOR,
} from '../ui/constants';

interface Props {
  id: string;
  d: string;
  selected: boolean;
  color?: string;
  style: ConnectorStyle;
  markerId: string;
  /** Begins a press on the line: a click selects (opens the toolbar), a drag bends the curve. */
  onReshapeStart: (id: string, e: React.PointerEvent) => void;
  onContextMenu: (id: string, clientX: number, clientY: number) => void;
}

const HIT_STYLE: CSSProperties = { pointerEvents: 'stroke', cursor: 'pointer' };
const LINE_STYLE: CSSProperties = { pointerEvents: 'none' };
const SELECTION_MARCH_STYLE = {
  pointerEvents: 'none',
  '--sel-march-distance': `-${SELECTION_DASH_PERIOD}`,
  '--sel-march-duration': `${SELECTION_MARCH_MS}ms`,
} as CSSProperties;

/** A single connector: a wide invisible hit path for clicks, a selection halo, and the visible bezier line with an arrowhead. */
function ConnectorPath({ id, d, selected, color, style, markerId, onReshapeStart, onContextMenu }: Props) {
  const stroke = color ?? STROKE_COLOR;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={HIT_STROKE_WIDTH}
        style={HIT_STYLE}
        onPointerDown={e => onReshapeStart(id, e)}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(id, e.clientX, e.clientY); }}
      />
      {selected && (
        <path
          d={d}
          fill="none"
          stroke={SELECTION_COLOR}
          strokeWidth={SELECTION_ARROW_STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={SELECTION_DASH}
          className="selection-march"
          style={SELECTION_MARCH_STYLE}
        />
      )}
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={selected ? STROKE_WIDTH_SELECTED : STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={LINE_DASH[style]}
        markerEnd={`url(#${markerId})`}
        style={LINE_STYLE}
      />
    </g>
  );
}

export default memo(ConnectorPath);
