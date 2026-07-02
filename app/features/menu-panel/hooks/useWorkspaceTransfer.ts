'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { db } from '@/app/lib/db';
import {
  serializeState,
  deserializeState,
  emptyCanvasState,
  sanitizeState,
  buildExportEnvelope,
  parseImport,
} from '../../workspace/utils';
import type { ExportedWorkspace, ImportPreview } from '../../workspace/types';

/** Where an export is delivered: a downloaded file or the clipboard. */
export type ExportChannel = 'download' | 'copy';

/** A workspace row as needed for export — its name and (optional) serialized state. */
export interface ExportSource {
  name: string;
  stateJson?: string;
}

export interface UseWorkspaceTransferResult {
  exportWorkspaces: (rows: ExportSource[], channel: ExportChannel, filename: string) => Promise<boolean>;
  readImportFile: (file: File) => Promise<ImportPreview>;
  importWorkspaces: (workspaces: ExportedWorkspace[]) => Promise<string[]>;
}

/** Triggers a browser download of `text` as a `.json` file named `filename`. */
function downloadJson(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Turns a workspace row into an ExportedWorkspace, hydrating + sanitizing its state. */
function toExported(row: ExportSource): ExportedWorkspace {
  const state = row.stateJson ? deserializeState(row.stateJson) ?? emptyCanvasState() : emptyCanvasState();
  return { name: row.name, state: sanitizeState(state) };
}

/**
 * Orchestrates workspace export (download / clipboard) and import (parse a file, then
 * create new workspaces via the admin import route). Kept out of pure utils because it
 * touches the DOM, clipboard, and network.
 */
export function useWorkspaceTransfer(): UseWorkspaceTransferResult {
  const { user } = db.useAuth();

  const exportWorkspaces = useCallback(
    async (rows: ExportSource[], channel: ExportChannel, filename: string): Promise<boolean> => {
      const envelope = buildExportEnvelope(rows.map(toExported), Date.now());
      const text = JSON.stringify(envelope, null, 2);
      if (channel === 'copy') {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          return false;
        }
      }
      downloadJson(filename, text);
      return true;
    },
    [],
  );

  const readImportFile = useCallback(async (file: File): Promise<ImportPreview> => {
    const text = await file.text();
    return parseImport(text);
  }, []);

  const importWorkspaces = useCallback(
    async (workspaces: ExportedWorkspace[]): Promise<string[]> => {
      const token = (user as any)?.refresh_token;
      if (!token) throw new Error('You must be signed in to import.');
      const res = await fetch('/api/workspace/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workspaces: workspaces.map((w) => ({ name: w.name, stateJson: serializeState(w.state) })),
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error || 'Import failed.');
      }
      const data = (await res.json()) as { ids?: unknown };
      return Array.isArray(data.ids) ? (data.ids as string[]) : [];
    },
    [user],
  );

  return { exportWorkspaces, readImportFile, importWorkspaces };
}
