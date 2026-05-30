'use client';
import { memo } from 'react';
import { Layers, MoreHorizontal } from 'lucide-react';
import type { WorkspaceItem } from './types';

interface Props {
  ws: WorkspaceItem;
  isActive: boolean;
  isHovered: boolean;
  dotOpen: boolean;
  onHoverChange: (id: string | null) => void;
  onNavigate: (id: string) => void;
  onOpenActionMenu: (ws: WorkspaceItem) => void;
  registerDotRef: (id: string, el: HTMLButtonElement | null) => void;
}

/** A single canvas row with navigate target and a hover-revealed 3-dot menu. */
function WorkspaceRow({
  ws, isActive, isHovered, dotOpen, onHoverChange, onNavigate, onOpenActionMenu, registerDotRef,
}: Props) {
  return (
    <div
      className="relative flex items-center"
      style={{
        height: 'var(--row-height)',
        background: isActive ? 'var(--color-bg-active)' : isHovered ? 'var(--color-bg-hover)' : 'transparent',
      }}
      onMouseEnter={() => onHoverChange(ws.id)}
      onMouseLeave={() => onHoverChange(null)}
    >
      {/* Navigate button */}
      <button
        type="button"
        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 pl-3"
        style={{ height: '100%', paddingRight: isHovered || dotOpen ? 28 : 12, background: 'transparent', border: 'none' }}
        onClick={() => onNavigate(ws.id)}
      >
        <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex' }}>
          <Layers size={14} />
        </span>
        <span className="flex-1 text-left text-[13px] font-mono truncate" style={{ color: 'var(--color-text-primary)' }}>
          {ws.name}
        </span>
      </button>

      {/* 3-dot button */}
      {(isHovered || dotOpen) && (
        <button
          ref={el => registerDotRef(ws.id, el)}
          type="button"
          className="absolute right-2 flex items-center justify-center cursor-pointer"
          style={{
            width: 20, height: 20,
            borderRadius: 'var(--radius-md)',
            background: dotOpen ? 'var(--color-bg-active)' : 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-active)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = dotOpen ? 'var(--color-bg-active)' : 'transparent'; }}
          onClick={e => { e.stopPropagation(); onOpenActionMenu(ws); }}
        >
          <MoreHorizontal size={13} />
        </button>
      )}
    </div>
  );
}

export default memo(WorkspaceRow);
