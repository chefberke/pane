import type { ConnectorStyle } from '@/app/features/types';

/** Stroke width (world units) for an idle connector line. */
export const STROKE_WIDTH = 2.5;
/** Stroke width (world units) for a selected connector line. */
export const STROKE_WIDTH_SELECTED = 3.5;
/** Width (world units) of the invisible hit path that makes the thin line clickable. */
export const HIT_STROKE_WIDTH = 16;
/** Stroke width (world units) of the translucent selection halo drawn behind a selected connector. */
export const HALO_STROKE_WIDTH = 9;
/** Opacity of the selection halo. */
export const HALO_OPACITY = 0.3;
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
/** Maximum |curvature| (world units) a connector can be bent to. */
export const MAX_BEND = 400;
/** Screen-px pointer travel before a press on a connector becomes a bend-drag; below it, the press is a plain click that opens the toolbar. */
export const RESHAPE_DRAG_THRESHOLD = 4;
/** Radius (world units) of the bend + endpoint handle dots shown on a selected connector. */
export const EDIT_HANDLE_RADIUS = 5;
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
