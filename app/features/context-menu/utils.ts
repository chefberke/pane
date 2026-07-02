import type { Block } from '@/app/features/types';
import type { ContextMenuRow } from './types';
import { MENU_EDGE_PADDING, MENU_ROW_HEIGHT } from './constants';

/** Rendered height of a menu row, used to estimate total menu height and to top-align submenu flyouts. */
export function rowHeight(row: ContextMenuRow): number {
  if (row.kind === 'separator') return 9;
  if (row.kind === 'color') return 28;
  return MENU_ROW_HEIGHT;
}

/** Returns the external URL a block opens to, or null when it has none (text/image/pdf). */
export function blockShareUrl(block: Block): string | null {
  switch (block.type) {
    case 'link':
    case 'twitter':
    case 'spotify':
    case 'github':
      return block.url;
    case 'youtube':
      return `https://www.youtube.com/watch?v=${block.videoId}`;
    case 'map':
      return block.embedUrl;
    default:
      return null;
  }
}

/** Anchors the menu at (x, y) but flips/clamps it so it stays inside the viewport bounds. */
export function clampMenuPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  bounds: { w: number; h: number },
): { left: number; top: number } {
  const pad = MENU_EDGE_PADDING;
  let left = x;
  let top = y;
  if (left + width + pad > bounds.w) left = x - width;
  if (top + height + pad > bounds.h) top = y - height;
  left = Math.max(pad, Math.min(left, bounds.w - width - pad));
  top = Math.max(pad, Math.min(top, bounds.h - height - pad));
  return { left, top };
}
