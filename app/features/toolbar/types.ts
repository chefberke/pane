/** Display state consumed by the Toolbar component. */
export interface ToolbarStatus {
  blockCount: number;
  isDark: boolean;
  isPanMode: boolean;
  hasRefreshable: boolean;
  isRefreshing: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

/** Action callbacks consumed by the Toolbar component. */
export interface ToolbarActions {
  addText: () => void;
  clear: () => void;
  toggleTheme: () => void;
  togglePanMode: () => void;
  search: () => void;
  refresh: () => void;
  undo: () => void;
  redo: () => void;
}
