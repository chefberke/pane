import type { Block } from '@/app/features/types';

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 1.25;
export const DRAG_THRESHOLD = 2;
export const MARQUEE_THRESHOLD = 4;
export const DOT_GRID_SIZE = 24;
export const FOLLOW_LERP = 0.18;
/** How long a transient on-canvas hint label stays visible, in ms. */
export const HINT_FLASH_MS = 2500;
/** Debounce before persisting canvas state after a change, in ms. */
export const SAVE_DEBOUNCE_MS = 150;
/** Screen-edge padding (px) reserved when zooming to fit all blocks. */
export const ZOOM_TO_FIT_PADDING = 64;
/** Stacking order for screen-space remote peer cursors. */
export const PEER_CURSOR_Z = 150;
/** Stacking order for the transparent shield shown while dragging out a connector (covers iframes so pointer events keep flowing). */
export const CONNECTOR_DRAG_SHIELD_Z = 50;
/** How long (ms) the user must go without an action before the "double-click to add" nudge starts blinking. */
export const IDLE_HINT_MS = 30000;
/** Interval (ms) between blinks once the idle nudge is active. */
export const IDLE_HINT_BLINK_PERIOD_MS = 6000;
/** How long (ms) each blink stays visible before fading back out. */
export const IDLE_HINT_BLINK_VISIBLE_MS = 3800;
/** Stacking order for the idle cursor hint (above selected blocks, below menus/modals). */
export const IDLE_HINT_Z = 120;
/** Px the idle hint sits below the cursor tip so it reads as "just under the pointer". */
export const IDLE_HINT_OFFSET_Y = 22;
/** Rendered px size of the pointer icon; also used to center it under the cursor. */
export const IDLE_HINT_ICON_SIZE = 16;

/** Approximate rendered dimensions per block type — used to center blocks on drop. */
export const BLOCK_SIZES: Record<Block['type'], { w: number; h: number }> = {
  link:    { w: 288, h: 140 },
  youtube: { w: 400, h: 225 },
  twitter: { w: 320, h: 480 },
  image:   { w: 288, h: 200 },
  text:    { w: 224, h: 88  },
  pdf:     { w: 400, h: 520 },
  spotify: { w: 320, h: 380 },
  map:     { w: 400, h: 300 },
  github:  { w: 320, h: 180 },
};

export interface Shortcut {
  keys: string[];
  label: string;
  category: 'Navigation' | 'Blocks' | 'Edit' | 'View';
}

export const SHORTCUTS: Shortcut[] = [
  { keys: ['⌘K'],       label: 'Search blocks',     category: 'Navigation' },
  { keys: ['0'],         label: 'Reset view',         category: 'Navigation' },
  { keys: ['+', '-'],    label: 'Zoom in / out',      category: 'Navigation' },
  { keys: ['H'],         label: 'Pan mode',           category: 'Navigation' },
  { keys: ['V'],         label: 'Select mode',        category: 'Navigation' },
  { keys: ['Space'],     label: 'Temp pan',           category: 'Navigation' },
  { keys: ['T'],         label: 'Add text note',      category: 'Blocks' },
  { keys: ['⌘D'],        label: 'Duplicate selected', category: 'Blocks' },
  { keys: ['⌘A'],        label: 'Select all',         category: 'Blocks' },
  { keys: ['⌘G'],        label: 'Group selected',     category: 'Blocks' },
  { keys: ['⌘⇧G'],       label: 'Ungroup frame',      category: 'Blocks' },
  { keys: ['Esc'],       label: 'Deselect / close',   category: 'Edit' },
  { keys: ['Del / ⌫'],   label: 'Delete selected',    category: 'Edit' },
  { keys: ['⌘Z'],        label: 'Undo',               category: 'Edit' },
  { keys: ['⌘⇧Z'],       label: 'Redo',               category: 'Edit' },
  { keys: ['↑↓←→'],      label: 'Nudge (1px)',        category: 'Edit' },
  { keys: ['⇧↑↓←→'],    label: 'Nudge (10px)',       category: 'Edit' },
  { keys: ['D'],         label: 'Toggle theme',       category: 'View' },
  { keys: ['?'],         label: 'This cheat-sheet',   category: 'View' },
];
