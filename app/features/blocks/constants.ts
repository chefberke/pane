/** Minimum pixel movement before a mousedown is classified as a drag. */
export const DRAG_THRESHOLD = 2;

/** Smallest width (px) a resizable note block can be dragged to. */
export const BLOCK_MIN_W = 140;
/** Smallest user-set height (px) for a note; content can still push the box taller. */
export const BLOCK_MIN_H = 60;
/** Thickness (px) of a note's edge resize hit-zone. */
export const BLOCK_RESIZE_EDGE_SIZE = 8;
/** Size (px) of a note's corner resize hit-zone. */
export const BLOCK_RESIZE_CORNER_SIZE = 14;
/** Fallback width (px) for a note with no stored width — matches `w-56`. */
export const NOTE_DEFAULT_W = 224;
/** Fallback min-height (px) for a note with no stored height — matches `min-h-[88px]`. */
export const NOTE_DEFAULT_H = 88;

/** Scale applied to a block card while it's a valid drop target (e.g. a connector endpoint re-point). */
export const BLOCK_DROP_TARGET_SCALE = 1.03;
/** Glow ring color around a block card acting as a drop target — a translucent tint of the selection ring color. */
export const BLOCK_DROP_TARGET_RING_COLOR = 'color-mix(in srgb, var(--color-ring-selection) 22%, transparent)';
/** Width (px) of the drop-target glow ring around a block card. */
export const BLOCK_DROP_TARGET_RING_WIDTH = 4;
/** Transition applied to a block card's shadow/transform when entering or leaving drop-target state. */
export const BLOCK_CARD_TRANSITION = 'box-shadow 180ms ease-out, transform 180ms ease-out';

/** Smallest zoom factor allowed in the image lightbox. */
export const LIGHTBOX_MIN_ZOOM = 0.25;
/** Largest zoom factor allowed in the image lightbox. */
export const LIGHTBOX_MAX_ZOOM = 5;
/** Multiplier applied per zoom-in / zoom-out step (buttons and wheel). */
export const LIGHTBOX_ZOOM_STEP = 1.2;
/** Initial / reset zoom factor when the lightbox opens. */
export const LIGHTBOX_DEFAULT_ZOOM = 0.8;
