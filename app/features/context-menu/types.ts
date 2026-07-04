import type { LucideIcon } from 'lucide-react';
import type { FrameColor } from '@/app/features/types';

/** What the menu was opened on. */
export type ContextMenuTarget =
  | { kind: 'block'; id: string }
  | { kind: 'frame'; id: string }
  | { kind: 'connector'; id: string }
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

/** A row representing one existing frame — rendered inside a submenu's flyout panel. */
export interface ContextMenuGroupRow {
  kind: 'group';
  label: string;
  color: FrameColor;
  onClick: () => void;
}

/** A row that expands into a flyout panel of `group` rows on hover (e.g. "Add to group"). */
export interface ContextMenuSubmenuRow {
  kind: 'submenu';
  label: string;
  icon: LucideIcon;
  /** `current` marks the block's existing group — shown with a check and non-interactive. */
  items: { label: string; color: FrameColor; current?: boolean; onClick: () => void }[];
}

/** A thin divider between groups of rows. */
export interface ContextMenuSeparatorRow {
  kind: 'separator';
}

/** Any row the menu can render. */
export type ContextMenuRow =
  | ContextMenuActionRow
  | ContextMenuColorRow
  | ContextMenuGroupRow
  | ContextMenuSubmenuRow
  | ContextMenuSeparatorRow;

/** Computed position and items for a submenu row's open flyout panel. */
export interface ContextMenuSubmenuPanel {
  left: number;
  top: number;
  items: ContextMenuSubmenuRow['items'];
}
