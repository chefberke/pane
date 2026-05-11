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
