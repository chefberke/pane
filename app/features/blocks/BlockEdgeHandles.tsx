'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import type { ConnectorSide } from '@/app/features/types';

interface Props {
  onStart: (side: ConnectorSide, e: React.PointerEvent) => void;
}

/** Diameter (px) of an edge connection handle. */
const HANDLE_SIZE = 11;

const SIDES: { side: ConnectorSide; pos: CSSProperties }[] = [
  { side: 'top',    pos: { left: '50%', top: 0,      transform: 'translate(-50%, -50%)' } },
  { side: 'bottom', pos: { left: '50%', top: '100%', transform: 'translate(-50%, -50%)' } },
  { side: 'left',   pos: { left: 0,     top: '50%',  transform: 'translate(-50%, -50%)' } },
  { side: 'right',  pos: { left: '100%', top: '50%', transform: 'translate(-50%, -50%)' } },
];

const BASE_HANDLE_STYLE: CSSProperties = {
  position: 'absolute',
  width: HANDLE_SIZE,
  height: HANDLE_SIZE,
  borderRadius: '9999px',
  background: 'var(--color-ring-selection)',
  border: '2px solid var(--color-surface)',
  cursor: 'crosshair',
  pointerEvents: 'auto',
  zIndex: 30,
};

/** Four edge dots (only the dots are interactive — the wrapper never blocks the block) that start a connector drag. */
function BlockEdgeHandles({ onStart }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {SIDES.map(({ side, pos }) => (
        <div
          key={side}
          style={{ ...BASE_HANDLE_STYLE, ...pos }}
          onPointerDown={e => onStart(side, e)}
        />
      ))}
    </div>
  );
}

export default memo(BlockEdgeHandles);
