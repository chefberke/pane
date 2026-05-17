import { useState, useRef, useCallback, useEffect } from 'react';
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

  const readyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [initialState, setInitialState] = useState<CanvasState | null>(null);

  useEffect(() => {
    if (readyRef.current || queryLoading || !data) return;
    readyRef.current = true;
    const ws = (data as { workspaces?: { stateJson?: string }[] }).workspaces?.[0];
    if (ws?.stateJson) {
      setInitialState(deserializeState(ws.stateJson));
    }
    setReady(true);
  }, [queryLoading, data]);

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
