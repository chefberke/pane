'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import { STROKE_COLOR, STROKE_COLOR_SELECTED, STROKE_WIDTH, STROKE_WIDTH_SELECTED, HIT_STROKE_WIDTH } from './constants';

interface Props {
  id: string;
  d: string;
  selected: boolean;
  color?: string;
  onSelect: (id: string) => void;
  onContextMenu: (id: string, clientX: number, clientY: number) => void;
}

const HIT_STYLE: CSSProperties = { pointerEvents: 'stroke', cursor: 'pointer' };
const LINE_STYLE: CSSProperties = { pointerEvents: 'none' };

/** A single connector: a wide invisible hit path for clicks plus the visible bezier line with an arrowhead. */
function ConnectorPath({ id, d, selected, color, onSelect, onContextMenu }: Props) {
  const stroke = selected ? STROKE_COLOR_SELECTED : (color ?? STROKE_COLOR);
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
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={selected ? STROKE_WIDTH_SELECTED : STROKE_WIDTH}
        strokeLinecap="round"
        markerEnd={selected ? 'url(#conn-arrow-sel)' : 'url(#conn-arrow)'}
        style={LINE_STYLE}
      />
    </g>
  );
}

export default memo(ConnectorPath);
