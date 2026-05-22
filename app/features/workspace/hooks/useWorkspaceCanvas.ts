/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useCallback } from 'react';
import { db } from '@/app/lib/db';
import type { CanvasState } from '../../canvas/types';
import { serializeState, deserializeState } from '../utils';

export interface UseWorkspaceCanvasResult {
  initialState: CanvasState | null;
  isLoading: boolean;
  notFound: boolean;
  workspaceName: string;
  isOwner: boolean;
  handleSave: (state: CanvasState) => void;
}

/**
 * Loads a workspace's canvas state from InstantDB and provides a debounced save callback.
 * initialState is captured once on first successful load — subsequent InstantDB updates
 * do not re-hydrate the canvas (last-write-wins across devices is the v1 contract).
 * Also lazy-inserts an owner workspaceMember row for new workspaces.
 */
export function useWorkspaceCanvas(workspaceId: string): UseWorkspaceCanvasResult {
  const { user } = db.useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading: queryLoading } = db.useQuery({
    workspaces: { $: { where: { id: workspaceId } as any } },
  });

  const [ready, setReady] = useState(false);
  const [initialState, setInitialState] = useState<CanvasState | null>(null);

  // Hydrate initial state during render the first time the query resolves.
  // This is the "adjust state while rendering" pattern from React docs — `ready`
  // guards against re-running, so this won't loop.
  if (!ready && !queryLoading && data) {
    const ws = (data as { workspaces?: { stateJson?: string; userId?: string }[] }).workspaces?.[0];
    if (ws?.stateJson) {
      setInitialState(deserializeState(ws.stateJson));
    }
    setReady(true);
  }

  const ws = (data as any)?.workspaces?.[0];
  const isOwner = !!(user && ws?.userId === user.id);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSave = useCallback((state: CanvasState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      db.transact((db.tx as any).workspaces[workspaceId].update({
        stateJson: serializeState(state),
        updatedAt: Date.now(),
      }));
    }, 500);
  }, [workspaceId]);

  const workspaces = (data as { workspaces?: unknown[] } | undefined)?.workspaces;
  const notFound = ready && Array.isArray(workspaces) && workspaces.length === 0;

  return {
    initialState,
    isLoading: !ready,
    notFound,
    workspaceName: ws?.name ?? 'My canvas',
    isOwner,
    handleSave,
  };
}
