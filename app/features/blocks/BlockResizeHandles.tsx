'use client';
import { memo } from 'react';
import { BLOCK_RESIZE_CORNER_SIZE, BLOCK_RESIZE_EDGE_SIZE } from './constants';
import type { ResizeDir } from './hooks/useBlockResize';

const CURSORS: Record<ResizeDir, string> = {
  n: 'ns-resize',
  s: 'ns-resize',
  e: 'ew-resize',
  w: 'ew-resize',
  nw: 'nwse-resize',
  se: 'nwse-resize',
  ne: 'nesw-resize',
  sw: 'nesw-resize',
};

interface ZoneProps {
  dir: ResizeDir;
  onPointerDown: (e: React.PointerEvent) => void;
}

function EdgeZone({ dir, onPointerDown }: ZoneProps) {
  const t = BLOCK_RESIZE_EDGE_SIZE;
  const half = t / 2;
  const style: React.CSSProperties = {
    position: 'absolute',
    cursor: CURSORS[dir],
    pointerEvents: 'auto',
    zIndex: 15,
  };
  if (dir === 'n') { style.left = 0; style.right = 0; style.top = -half; style.height = t; }
  if (dir === 's') { style.left = 0; style.right = 0; style.bottom = -half; style.height = t; }
  if (dir === 'w') { style.top = 0; style.bottom = 0; style.left = -half; style.width = t; }
  if (dir === 'e') { style.top = 0; style.bottom = 0; style.right = -half; style.width = t; }
  return <div style={style} onPointerDown={onPointerDown} />;
}

function CornerZone({ dir, onPointerDown }: ZoneProps) {
  const s = BLOCK_RESIZE_CORNER_SIZE;
  const half = s / 2;
  const style: React.CSSProperties = {
    position: 'absolute',
    width: s,
    height: s,
    cursor: CURSORS[dir],
    pointerEvents: 'auto',
    zIndex: 16,
  };
  if (dir === 'nw') { style.left = -half; style.top = -half; }
  if (dir === 'ne') { style.right = -half; style.top = -half; }
  if (dir === 'sw') { style.left = -half; style.bottom = -half; }
  if (dir === 'se') { style.right = -half; style.bottom = -half; }
  return <div style={style} onPointerDown={onPointerDown} />;
}

/** Invisible perimeter resize zones (4 edges + 4 corners) for a note block. */
function BlockResizeHandles({ onHandlePointerDown }: { onHandlePointerDown: (dir: ResizeDir) => (e: React.PointerEvent) => void }) {
  return (
    <>
      <EdgeZone dir="n" onPointerDown={onHandlePointerDown('n')} />
      <EdgeZone dir="s" onPointerDown={onHandlePointerDown('s')} />
      <EdgeZone dir="w" onPointerDown={onHandlePointerDown('w')} />
      <EdgeZone dir="e" onPointerDown={onHandlePointerDown('e')} />
      <CornerZone dir="nw" onPointerDown={onHandlePointerDown('nw')} />
      <CornerZone dir="ne" onPointerDown={onHandlePointerDown('ne')} />
      <CornerZone dir="sw" onPointerDown={onHandlePointerDown('sw')} />
      <CornerZone dir="se" onPointerDown={onHandlePointerDown('se')} />
    </>
  );
}

export default memo(BlockResizeHandles);
