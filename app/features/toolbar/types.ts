/** Display state consumed by the Toolbar component. */
export interface ToolbarStatus {
  scale: number;
  blockCount: number;
  isDark: boolean;
  isPanMode: boolean;
  hasRefreshable: boolean;
  isRefreshing: boolean;
}

/** Action callbacks consumed by the Toolbar component. */
export interface ToolbarActions {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  addText: () => void;
  clear: () => void;
  toggleTheme: () => void;
  togglePanMode: () => void;
  search: () => void;
  refresh: () => void;
}
