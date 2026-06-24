import type { AvatarSize } from './types';

/** Pastel rainbow palette for deterministic per-user avatar/cursor colors. colorForId picks by hash index. */
export const AVATAR_COLORS = [
  '#fca5a5', // red
  '#fdba74', // orange
  '#fde047', // yellow
  '#86efac', // green
  '#67e8f9', // cyan
  '#93c5fd', // blue
  '#c4b5fd', // violet
  '#f9a8d4', // pink
  '#5eead4', // teal
  '#fcd34d', // amber
];

/** Dark text color for use on top of the pastel palette colors (keeps initials readable). */
export const AVATAR_TEXT_ON_COLOR = '#1f2937';

/** Box / font / online-dot dimensions (px) per avatar size preset. */
export const AVATAR_SIZES: Record<AvatarSize, { box: number; font: number; dot: number }> = {
  xs: { box: 18, font: 9,  dot: 7  },
  md: { box: 28, font: 10, dot: 9  },
  lg: { box: 32, font: 11, dot: 10 },
};

/** Online presence indicator dot color (green). */
export const AVATAR_ONLINE_COLOR = '#22c55e';
