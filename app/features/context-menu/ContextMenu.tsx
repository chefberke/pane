'use client';
import { useEffect } from 'react';
import type { ContextMenuRow } from './types';
import { MENU_WIDTH, MENU_ROW_HEIGHT } from './constants';
import { clampMenuPosition } from './utils';
import ColorSwatchRow from './ColorSwatchRow';

/** Props for the floating right-click menu. */
interface Props {
  /** Viewport-relative anchor X (cursor position). */
  x: number;
  /** Viewport-relative anchor Y (cursor position). */
  y: number;
  /** Viewport size used to keep the menu on-screen. */
  bounds: { w: number; h: number };
  rows: ContextMenuRow[];
  onClose: () => void;
}

/** Floating right-click menu rendered inside the canvas viewport; mirrors the AddInput/CommentsSheet shell. */
export default function ContextMenu({ x, y, bounds, rows, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    const onWheel = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('wheel', onWheel); };
  }, [onClose]);

  // Estimate height for edge-flipping (separator/color rows are shorter — close enough for clamping).
  const estHeight = rows.reduce((h, r) => h + (r.kind === 'separator' ? 9 : r.kind === 'color' ? 28 : MENU_ROW_HEIGHT), 8);
  const { left, top } = clampMenuPosition(x, y, MENU_WIDTH, estHeight, bounds);

  return (
    <div
      className="absolute z-50 backdrop-blur-md rounded-xl overflow-hidden py-1"
      style={{
        left,
        top,
        width: MENU_WIDTH,
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-modal)',
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
    >
      {rows.map((row, i) => {
        if (row.kind === 'separator') {
          return <div key={i} className="my-1 mx-2.5 h-px" style={{ background: 'var(--color-border-subtle)' }} />;
        }
        if (row.kind === 'color') {
          return <ColorSwatchRow key={i} current={row.current} onSelect={c => { row.onSelect(c); onClose(); }} />;
        }
        const Icon = row.icon;
        return (
          <button
            key={i}
            type="button"
            disabled={row.disabled}
            onClick={() => { if (!row.disabled) { row.onClick(); onClose(); } }}
            className="w-full flex items-center gap-2.5 px-2.5 text-left text-[13px] transition-colors"
            style={{
              height: MENU_ROW_HEIGHT,
              color: row.danger ? '#ef4444' : 'var(--color-text-primary)',
              cursor: row.disabled ? 'default' : 'pointer',
              opacity: row.disabled ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!row.disabled) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}
          >
            <Icon size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
            <span className="flex-1 truncate">{row.label}</span>
            {row.shortcut && (
              <span
                className="flex-shrink-0 text-[11px] tracking-[0.5px] tabular-nums"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {row.shortcut.join('')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
