'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { ConnectorStyle } from '@/app/features/types';
import {
  STROKE_COLOR, STROKE_COLOR_SELECTED, STROKE_WIDTH, STROKE_WIDTH_SELECTED,
  HIT_STROKE_WIDTH, HALO_STROKE_WIDTH, HALO_OPACITY, LINE_DASH,
} from './constants';

interface Props {
  id: string;
  d: string;
  selected: boolean;
  color?: string;
  style: ConnectorStyle;
  markerId: string;
  onSelect: (id: string) => void;
  onContextMenu: (id: string, clientX: number, clientY: number) => void;
}

const HIT_STYLE: CSSProperties = { pointerEvents: 'stroke', cursor: 'pointer' };
const LINE_STYLE: CSSProperties = { pointerEvents: 'none' };

/** A single connector: a wide invisible hit path for clicks, a selection halo, and the visible bezier line with an arrowhead. */
function ConnectorPath({ id, d, selected, color, style, markerId, onSelect, onContextMenu }: Props) {
  const stroke = color ?? STROKE_COLOR;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={HIT_STROKE_WIDTH}
        style={HIT_STYLE}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onSelect(id); }}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(id, e.clientX, e.clientY); }}
      />
      {selected && (
        <path
          d={d}
          fill="none"
          stroke={STROKE_COLOR_SELECTED}
          strokeWidth={HALO_STROKE_WIDTH}
          strokeLinecap="round"
          opacity={HALO_OPACITY}
          style={LINE_STYLE}
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
