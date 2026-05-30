'use client';
import { memo } from 'react';
import { DOT_GRID_SIZE } from './constants';

interface Props {
  offset: { x: number; y: number };
  scale: number;
}

/** Infinite dot-grid background that tracks the viewport pan/zoom. */
function DotGrid({ offset, scale }: Props) {
  const gridSize = DOT_GRID_SIZE * scale;
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `radial-gradient(circle, var(--color-grid-dot) 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offset.x % gridSize}px ${offset.y % gridSize}px`,
      }}
    />
  );
}

export default memo(DotGrid);
