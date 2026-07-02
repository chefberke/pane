'use client';
import { memo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  EDIT_HANDLE_RADIUS, EDIT_HANDLE_RADIUS_HOVER, EDIT_HANDLE_STROKE_WIDTH, EDIT_HANDLE_HOVER_GLOW_BLUR,
  EDIT_HANDLE_HOVER_TRANSITION_MS,
} from './constants';
import { SELECTION_COLOR } from '../ui/constants';

interface Props {
  cx: number;
  cy: number;
  /** Live canvas zoom — radius/stroke/glow are divided by this so the dot reads as a constant on-screen size. */
  scale: number;
  fill: string;
  stroke: string;
  cursor: string;
  onPointerDown: (e: React.PointerEvent) => void;
}

/** A single edit-handle dot (bend belly or endpoint) — scale-invariant sizing, with hover enlarge + glow feedback. */
function EditHandle({ cx, cy, scale, fill, stroke, cursor, onPointerDown }: Props) {
  const [hovered, setHovered] = useState(false);
  const radius = (hovered ? EDIT_HANDLE_RADIUS_HOVER : EDIT_HANDLE_RADIUS) / scale;
  const glowBlur = (hovered ? EDIT_HANDLE_HOVER_GLOW_BLUR : 0) / scale;
  const style: CSSProperties = {
    pointerEvents: 'auto',
    cursor,
    transition: `r ${EDIT_HANDLE_HOVER_TRANSITION_MS}ms ease-out, filter ${EDIT_HANDLE_HOVER_TRANSITION_MS}ms ease-out`,
    filter: `drop-shadow(0 0 ${glowBlur}px ${SELECTION_COLOR})`,
  };
  return (
    <circle
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth={EDIT_HANDLE_STROKE_WIDTH / scale}
      style={style}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onPointerDown={onPointerDown}
    />
  );
}

export default memo(EditHandle);
