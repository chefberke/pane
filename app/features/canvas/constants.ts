import type { Block } from '@/types';

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 1.25;
export const DRAG_THRESHOLD = 2;
export const MARQUEE_THRESHOLD = 4;
export const DOT_GRID_SIZE = 24;

/** Approximate rendered dimensions per block type — used to center blocks on drop. */
export const BLOCK_SIZES: Record<Block['type'], { w: number; h: number }> = {
  link:    { w: 288, h: 140 },
  youtube: { w: 400, h: 225 },
  twitter: { w: 320, h: 480 },
  image:   { w: 288, h: 200 },
  text:    { w: 224, h: 88  },
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
  { keys: ['Del / ⌫'],   label: 'Delete selected',    category: 'Edit' },
  { keys: ['⌘Z'],        label: 'Undo',               category: 'Edit' },
  { keys: ['⌘⇧Z'],       label: 'Redo',               category: 'Edit' },
  { keys: ['↑↓←→'],      label: 'Nudge (1px)',        category: 'Edit' },
  { keys: ['⇧↑↓←→'],    label: 'Nudge (10px)',       category: 'Edit' },
  { keys: ['D'],         label: 'Toggle theme',       category: 'View' },
  { keys: ['?'],         label: 'This cheat-sheet',   category: 'View' },
];
