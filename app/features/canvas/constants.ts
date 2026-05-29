import type { Block } from '@/app/features/types';

export const MIN_SCALE = 0.1;
export const MAX_SCALE = 4;
export const ZOOM_STEP = 1.25;
export const DRAG_THRESHOLD = 2;
export const MARQUEE_THRESHOLD = 4;
export const DOT_GRID_SIZE = 24;
export const FOLLOW_LERP = 0.18;
/** Safety cap on the raw image file we'll even attempt to process, in bytes (30 MB). Most images are downscaled well below this before upload. */
export const MAX_IMAGE_BYTES = 30_000_000;
/** Longest edge (px) an uploaded image is downscaled to before upload. */
export const MAX_IMAGE_EDGE = 2000;
/** WebP quality (0–1) used when re-encoding a downscaled image. */
export const IMAGE_OUTPUT_QUALITY = 0.8;
/** Maximum size for an uploaded PDF, in bytes (25 MB) — PDFs can't be compressed client-side. */
export const MAX_PDF_BYTES = 25_000_000;
/** How long the on-canvas upload error label stays visible, in ms. */
export const UPLOAD_ERROR_MS = 2500;

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
