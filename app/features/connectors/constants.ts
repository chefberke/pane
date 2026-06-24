/** Stroke width (world units) for an idle connector line. */
export const STROKE_WIDTH = 2.5;
/** Stroke width (world units) for a selected connector line. */
export const STROKE_WIDTH_SELECTED = 3.5;
/** Width (world units) of the invisible hit path that makes the thin line clickable. */
export const HIT_STROKE_WIDTH = 16;
/** Arrowhead marker size in world units. */
export const ARROW_SIZE = 10;
/** Minimum bezier control-point offset (world units). */
export const MIN_CURVE = 24;
/** Maximum bezier control-point offset (world units). */
export const MAX_CURVE = 160;
/** Fraction of endpoint distance used for the bezier control-point offset. */
export const CURVE_RATIO = 0.4;
/** Default connector stroke colour — a mid slate that reads on both light and dark canvases. */
export const STROKE_COLOR = '#94a3b8';
/** Selected connector stroke colour — reuses the canvas selection ring var. */
export const STROKE_COLOR_SELECTED = 'var(--color-ring-selection)';
