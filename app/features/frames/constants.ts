import type { FrameColor } from '@/app/features/types';

export const FRAME_HEADER_HEIGHT = 22;
export const FRAME_HEADER_OFFSET = 8;
export const FRAME_PADDING = 24;
export const FRAME_MIN_W = 200;
export const FRAME_MIN_H = 120;
export const FRAME_COLLAPSED_W = 260;
export const FRAME_COLLAPSED_H = 200;
/** Corner radius (px) of the frame card. */
export const FRAME_RADIUS = 11;

export const FRAME_RESIZE_EDGE_SIZE = 8;
export const FRAME_RESIZE_CORNER_SIZE = 14;

export const FRAME_DROP_TRANSITION_MS = 200;
export const FRAME_DROP_COLLAPSED_SCALE = 1.04;

export const FRAME_DEFAULT_TITLE = 'Group';
export const FRAME_DEFAULT_COLOR: FrameColor = 'slate';

export const FRAME_COLOR_ORDER: FrameColor[] = ['slate', 'blue', 'green', 'amber', 'rose', 'violet'];

interface FrameColorTokens {
  rgb: string;
  bg: string;
  bgHover: string;
  border: string;
  borderActive: string;
  glow: string;
  swatch: string;
}

export const FRAME_COLORS: Record<FrameColor, FrameColorTokens> = {
  slate: {
    rgb: '148, 163, 184',
    bg: 'rgba(148, 163, 184, 0.08)',
    bgHover: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.55)',
    borderActive: 'rgba(148, 163, 184, 0.95)',
    glow: 'rgba(148, 163, 184, 0.22)',
    swatch: 'rgb(148, 163, 184)',
  },
  blue: {
    rgb: '96, 165, 250',
    bg: 'rgba(96, 165, 250, 0.08)',
    bgHover: 'rgba(96, 165, 250, 0.12)',
    border: 'rgba(96, 165, 250, 0.6)',
    borderActive: 'rgba(96, 165, 250, 0.95)',
    glow: 'rgba(96, 165, 250, 0.22)',
    swatch: 'rgb(96, 165, 250)',
  },
  green: {
    rgb: '74, 222, 128',
    bg: 'rgba(74, 222, 128, 0.08)',
    bgHover: 'rgba(74, 222, 128, 0.12)',
    border: 'rgba(74, 222, 128, 0.6)',
    borderActive: 'rgba(74, 222, 128, 0.95)',
    glow: 'rgba(74, 222, 128, 0.22)',
    swatch: 'rgb(74, 222, 128)',
  },
  amber: {
    rgb: '251, 191, 36',
    bg: 'rgba(251, 191, 36, 0.08)',
    bgHover: 'rgba(251, 191, 36, 0.14)',
    border: 'rgba(251, 191, 36, 0.65)',
    borderActive: 'rgba(251, 191, 36, 0.98)',
    glow: 'rgba(251, 191, 36, 0.24)',
    swatch: 'rgb(251, 191, 36)',
  },
  rose: {
    rgb: '251, 113, 133',
    bg: 'rgba(251, 113, 133, 0.08)',
    bgHover: 'rgba(251, 113, 133, 0.14)',
    border: 'rgba(251, 113, 133, 0.65)',
    borderActive: 'rgba(251, 113, 133, 0.98)',
    glow: 'rgba(251, 113, 133, 0.24)',
    swatch: 'rgb(251, 113, 133)',
  },
  violet: {
    rgb: '167, 139, 250',
    bg: 'rgba(167, 139, 250, 0.08)',
    bgHover: 'rgba(167, 139, 250, 0.14)',
    border: 'rgba(167, 139, 250, 0.65)',
    borderActive: 'rgba(167, 139, 250, 0.98)',
    glow: 'rgba(167, 139, 250, 0.24)',
    swatch: 'rgb(167, 139, 250)',
  },
};
