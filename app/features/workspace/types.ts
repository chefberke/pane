import type { CanvasState } from '../canvas/types';

export interface Workspace {
  id: string;
  name: string;
  stateJson?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/** A single workspace inside an export file: its display name plus the full canvas state. */
export interface ExportedWorkspace {
  name: string;
  state: CanvasState;
}

/** Versioned container written to / read from a `.pane.json` export file. */
export interface WorkspaceExportEnvelope {
  format: string;
  version: number;
  exportedAt: number;
  workspaces: ExportedWorkspace[];
}

/** Result of parsing an import file: the valid workspaces to create plus any per-item skip reasons. */
export interface ImportPreview {
  workspaces: ExportedWorkspace[];
  errors: string[];
}
