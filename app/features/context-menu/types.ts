import type { LucideIcon } from 'lucide-react';
import type { FrameColor } from '@/app/features/types';

/** What the menu was opened on. */
export type ContextMenuTarget =
  | { kind: 'block'; id: string }
  | { kind: 'frame'; id: string }
  | { kind: 'canvas' };

/** Open menu state — x/y are viewport-relative (like `addPos`); bounds is the viewport size for clamping. */
export interface ContextMenuState {
  x: number;
  y: number;
  bounds: { w: number; h: number };
  rows: ContextMenuRow[];
}

/** A clickable command row. */
export interface ContextMenuActionRow {
  kind: 'action';
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  /** Keyboard shortcut as individual keys, shown right-aligned as keycaps (e.g. ['⌘', 'D']). */
  shortcut?: string[];
  danger?: boolean;
  disabled?: boolean;
}

/** A row of frame color swatches. */
export interface ContextMenuColorRow {
  kind: 'color';
  current: FrameColor;
  onSelect: (color: FrameColor) => void;
}

/** A thin divider between groups of rows. */
export interface ContextMenuSeparatorRow {
  kind: 'separator';
}

/** Any row the menu can render. */
export type ContextMenuRow = ContextMenuActionRow | ContextMenuColorRow | ContextMenuSeparatorRow;
