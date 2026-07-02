import type { ConnectorStyle } from '@/app/features/types';

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
/** Multiplier on the belly offset applied to both cubic control points so the curve's belly lands exactly on the drag point (cubic weights c1+c2 by 0.75 at t=0.5, so 1/0.75 = 4/3). */
export const BEND_CONTROL_FACTOR = 4 / 3;
/** Maximum |curvature| (world units) a connector can be bent to — kept tight so a drag can't stretch the curve into an unpleasantly long belly. */
export const MAX_BEND = 150;
/** How much a connector's endpoint tangent (the ease into/out of a block side) shrinks once bending saturates (see BEND_SHARPEN_RAMP), so a bent curve pulls into a crisp corner at the belly instead of stretching into a wide oval. 0 = tangent never shrinks, 1 = tangent fully collapses (leaves the block perpendicular to the chord). */
export const BEND_SHARPEN_FACTOR = 0.92;
/** Bend magnitude (world units) at which the tangent-shrink above reaches full strength — well under MAX_BEND so even a moderate bend-drag already reads as cornered, not just the most extreme one. */
export const BEND_SHARPEN_RAMP = 90;
/** Screen-px pointer travel before a press on a connector becomes a bend-drag; below it, the press is a plain click that opens the toolbar. */
export const RESHAPE_DRAG_THRESHOLD = 4;
/** Radius (screen px, divided by live canvas scale at render time so the dot reads as a constant on-screen size) of an idle bend/endpoint handle dot. */
export const EDIT_HANDLE_RADIUS = 5;
/** Radius (screen px, scale-compensated) of a bend/endpoint handle dot while hovered. */
export const EDIT_HANDLE_RADIUS_HOVER = 7;
/** Stroke width (screen px, scale-compensated) of a bend/endpoint handle dot's ring. */
export const EDIT_HANDLE_STROKE_WIDTH = 2;
/** Blur radius (screen px, scale-compensated) of the soft glow behind a handle dot while hovered. */
export const EDIT_HANDLE_HOVER_GLOW_BLUR = 4;
/** Duration (ms) of the hover radius/glow transition on bend/endpoint handle dots. */
export const EDIT_HANDLE_HOVER_TRANSITION_MS = 120;
/** Minimum drag distance (world units) before releasing on empty canvas opens the add-content popover; below this a stray click on a handle is ignored. */
export const EMPTY_DROP_DRAG_MIN = 6;
/** Default connector stroke colour — a mid slate that reads on both light and dark canvases. */
export const STROKE_COLOR = '#94a3b8';
/** Selected connector stroke colour — reuses the canvas selection ring var. */
export const STROKE_COLOR_SELECTED = 'var(--color-ring-selection)';
/** strokeDasharray (world units) per line style; 'solid' omits the dash. 'wide' keeps the dash but widens the gaps. */
export const LINE_DASH: Record<ConnectorStyle, string | undefined> = {
  solid: undefined,
  dashed: '7 7',
  wide: '7 18',
};
/** Selectable line styles shown in the connector toolbar, in display order. */
export const STYLE_OPTIONS: { value: ConnectorStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'wide', label: 'Wide dashes' },
];
/** Connector colour swatches — `value` is the CSS colour stored on the connector, `swatch` the picker dot. Kept local (mirrors the frame palette) to avoid a cross-feature import. */
export const CONNECTOR_SWATCHES: { value: string; swatch: string }[] = [
  { value: '#94a3b8', swatch: 'rgb(148,163,184)' },
  { value: '#60a5fa', swatch: 'rgb(96,165,250)' },
  { value: '#4ade80', swatch: 'rgb(74,222,128)' },
  { value: '#fbbf24', swatch: 'rgb(251,191,36)' },
  { value: '#fb7185', swatch: 'rgb(251,113,133)' },
  { value: '#a78bfa', swatch: 'rgb(167,139,250)' },
];
