import type { FrameColor } from '@/app/features/types';

export const MENU_WIDTH = 188;
export const MENU_ROW_HEIGHT = 30;
export const MENU_EDGE_PADDING = 8;

/** Swatch colors mirrored from the frames feature (kept local to avoid a cross-feature import). */
export const MENU_FRAME_SWATCHES: { color: FrameColor; swatch: string }[] = [
  { color: 'slate', swatch: 'rgb(148, 163, 184)' },
  { color: 'blue', swatch: 'rgb(96, 165, 250)' },
  { color: 'green', swatch: 'rgb(74, 222, 128)' },
  { color: 'amber', swatch: 'rgb(251, 191, 36)' },
  { color: 'rose', swatch: 'rgb(251, 113, 133)' },
  { color: 'violet', swatch: 'rgb(167, 139, 250)' },
];
