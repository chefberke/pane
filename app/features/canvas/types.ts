import type { Block } from '@/app/features/types';

export type Marquee = { x1: number; y1: number; x2: number; y2: number };

export interface CanvasState {
  blocks: Block[];
  offset: { x: number; y: number };
  scale: number;
}

export interface CanvasProps {
  /** Canvas state to hydrate on first mount. Read once — not reactive after mount. */
  initialState?: CanvasState | null;
  /** Called after every debounced state change (150ms). Page decides where to persist. */
  onSave?: (state: CanvasState) => void;
}
