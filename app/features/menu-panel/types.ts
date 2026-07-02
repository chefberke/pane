import type { THEME_CHOICES } from './constants';

export type ThemeChoice = typeof THEME_CHOICES[number];

/** A workspace/canvas row as stored in InstantDB. */
export interface WorkspaceItem {
  id: string;
  name: string;
  createdAt: number;
  deletedAt?: number;
  /** Serialized canvas state; present on loaded rows, used for export. */
  stateJson?: string;
}
