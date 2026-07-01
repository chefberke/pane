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

/** Smallest zoom factor allowed in the image lightbox. */
export const LIGHTBOX_MIN_ZOOM = 0.25;
/** Largest zoom factor allowed in the image lightbox. */
export const LIGHTBOX_MAX_ZOOM = 5;
/** Multiplier applied per zoom-in / zoom-out step (buttons and wheel). */
export const LIGHTBOX_ZOOM_STEP = 1.2;
/** Initial / reset zoom factor when the lightbox opens. */
export const LIGHTBOX_DEFAULT_ZOOM = 0.8;
