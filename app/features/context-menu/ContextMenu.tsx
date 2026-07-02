'use client';
import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ContextMenuRow, ContextMenuSubmenuPanel } from './types';
import { MENU_WIDTH, MENU_ROW_HEIGHT, MENU_EDGE_PADDING } from './constants';
import { clampMenuPosition, rowHeight } from './utils';
import ColorSwatchRow from './ColorSwatchRow';
import GroupRow from './GroupRow';

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
  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    const onWheel = () => onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('wheel', onWheel); };
  }, [onClose]);

  // Estimate height for edge-flipping (separator/color rows are shorter — close enough for clamping).
  const estHeight = rows.reduce((h, r) => h + rowHeight(r), 8);
  const { left, top } = clampMenuPosition(x, y, MENU_WIDTH, estHeight, bounds);

  // Running top offset of each row (relative to the menu box), used to top-align a submenu's flyout panel.
  const rowTops: number[] = [];
  rows.reduce((h, r, i) => { rowTops[i] = h; return h + rowHeight(r); }, 4);

  const submenuRow = openSubmenu !== null ? rows[openSubmenu] : null;
  let panel: ContextMenuSubmenuPanel | null = null;
  if (submenuRow && submenuRow.kind === 'submenu') {
    const panelHeight = submenuRow.items.length * MENU_ROW_HEIGHT + 8;
    const panelLeft = left + MENU_WIDTH * 2 + MENU_EDGE_PADDING > bounds.w ? -MENU_WIDTH : MENU_WIDTH;
    let panelTop = rowTops[openSubmenu!];
    panelTop = Math.min(panelTop, bounds.h - MENU_EDGE_PADDING - top - panelHeight);
    panelTop = Math.max(panelTop, MENU_EDGE_PADDING - top);
    panel = { left: panelLeft, top: panelTop, items: submenuRow.items };
  }

  return (
    <div
      className="absolute z-50"
      style={{ left, top, width: MENU_WIDTH }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onContextMenu={e => { e.preventDefault(); e.stopPropagation(); }}
      onMouseLeave={() => setOpenSubmenu(null)}
    >
      <div
        className="backdrop-blur-md rounded-xl overflow-hidden py-1"
        style={{
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {rows.map((row, i) => {
          if (row.kind === 'separator') {
            return <div key={i} className="my-1 mx-2.5 h-px" style={{ background: 'var(--color-border-subtle)' }} />;
          }
          if (row.kind === 'color') {
            return <ColorSwatchRow key={i} current={row.current} onSelect={c => { row.onSelect(c); onClose(); }} />;
          }
          if (row.kind === 'group') {
            return <GroupRow key={i} label={row.label} color={row.color} onClick={() => { row.onClick(); onClose(); }} />;
          }
          if (row.kind === 'submenu') {
            const Icon = row.icon;
            return (
              <button
                key={i}
                type="button"
                className="w-full flex items-center gap-2.5 px-2.5 text-left text-[13px] transition-colors"
                style={{ height: MENU_ROW_HEIGHT, color: 'var(--color-text-primary)', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; setOpenSubmenu(i); }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; }}
              >
                <Icon size={14} style={{ flexShrink: 0, opacity: 0.8 }} />
                <span className="flex-1 truncate">{row.label}</span>
                <ChevronRight size={14} style={{ flexShrink: 0, opacity: 0.5 }} />
              </button>
            );
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
              onMouseEnter={e => { setOpenSubmenu(null); if (!row.disabled) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
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

      {panel && (
        <div
          className="absolute backdrop-blur-md rounded-xl overflow-hidden py-1"
          style={{
            left: panel.left,
            top: panel.top,
            width: MENU_WIDTH,
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-modal)',
          }}
        >
          {panel.items.map((item, i) => (
            <GroupRow key={i} label={item.label} color={item.color} onClick={() => { item.onClick(); onClose(); }} />
          ))}
        </div>
      )}
    </div>
  );
}
