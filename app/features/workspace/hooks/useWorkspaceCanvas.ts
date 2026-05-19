import { useState, useRef, useCallback } from 'react';
import { db } from '@/app/lib/db';
import type { CanvasState } from '../../canvas/types';
import { serializeState, deserializeState } from '../utils';

export interface UseWorkspaceCanvasResult {
  initialState: CanvasState | null;
  isLoading: boolean;
  notFound: boolean;
  handleSave: (state: CanvasState) => void;
}

/**
 * Loads a workspace's canvas state from InstantDB and provides a debounced save callback.
 * initialState is captured once on first successful load — subsequent InstantDB updates
 * do not re-hydrate the canvas (last-write-wins across devices is the v1 contract).
 */
export function useWorkspaceCanvas(workspaceId: string): UseWorkspaceCanvasResult {
  const { data, isLoading: queryLoading } = db.useQuery({
    workspaces: { $: { where: { id: workspaceId } } },
  });

  const [ready, setReady] = useState(false);
  const [initialState, setInitialState] = useState<CanvasState | null>(null);

  // Hydrate initial state during render the first time the query resolves.
  // This is the "adjust state while rendering" pattern from React docs — `ready`
  // guards against re-running, so this won't loop.
  if (!ready && !queryLoading && data) {
    const ws = (data as { workspaces?: { stateJson?: string }[] }).workspaces?.[0];
    if (ws?.stateJson) {
      setInitialState(deserializeState(ws.stateJson));
    }
    setReady(true);
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSave = useCallback((state: CanvasState) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      db.transact(db.tx.workspaces[workspaceId].update({
        stateJson: serializeState(state),
        updatedAt: Date.now(),
      }));
    }, 500);
  }, [workspaceId]);

  const workspaces = (data as { workspaces?: unknown[] } | undefined)?.workspaces;
  const notFound = ready && Array.isArray(workspaces) && workspaces.length === 0;

  return { initialState, isLoading: !ready, notFound, handleSave };
}
