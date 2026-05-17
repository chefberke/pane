import type { AlignMode } from '@/app/features/types';

/** Display state consumed by the Toolbar component. */
export interface ToolbarStatus {
  isPanMode: boolean;
  hasRefreshable: boolean;
  isRefreshing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  selectedCount: number;
}

/** Action callbacks consumed by the Toolbar component. */
export interface ToolbarActions {
  addText: () => void;
  togglePanMode: () => void;
  search: () => void;
  refresh: () => void;
  undo: () => void;
  redo: () => void;
  alignSelected: (mode: AlignMode) => void;
  zoomToFit: () => void;
}
