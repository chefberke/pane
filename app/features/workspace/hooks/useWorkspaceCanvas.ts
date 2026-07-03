/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useCallback } from 'react';
import { db } from '@/app/lib/db';
import type { CanvasState } from '../../canvas/types';
import { serializeState, deserializeState } from '../utils';

export interface UseWorkspaceCanvasResult {
  syncedState: CanvasState | null;
  syncedAt: number;
  isLoading: boolean;
  notFound: boolean;
  workspaceName: string;
  isOwner: boolean;
  handleSave: (state: CanvasState) => void;
}

/**
 * Loads a workspace's canvas state from InstantDB and provides a save callback.
 * `syncedState`/`syncedAt` stay live: when another device saves, they advance so the
 * open canvas can re-hydrate (see usePersistence) instead of silently overwriting the
 * newer state with a stale one. Owners save directly (allowed by the
 * `workspaces.update: isOwner` rule); non-owner editor-members save through
 * /api/workspace/save, which authorizes via the admin token.
 */
export function useWorkspaceCanvas(workspaceId: string): UseWorkspaceCanvasResult {
  const { user } = db.useAuth();

  const { data, isLoading: queryLoading } = db.useQuery({
    workspaces: { $: { where: { id: workspaceId } as any } },
  });

  const ws = (data as any)?.workspaces?.[0];
  const isOwner = !!(user && ws?.userId === user.id);

  // Live canvas state — recomputed only when the stored JSON actually changes, so its
  // identity is stable across unrelated re-renders but advances on every remote save.
  const syncedState = useMemo(
    () => (ws?.stateJson ? deserializeState(ws.stateJson) : null),
    [ws?.stateJson],
  );
  const syncedAt: number = typeof ws?.updatedAt === 'number' ? ws.updatedAt : 0;

  // Immediate write — usePersistence already debounces and flushes on unmount, so a
  // second debounce here would only add latency and risk dropping the last edit.
  const handleSave = useCallback((state: CanvasState) => {
    const stateJson = serializeState(state);
    if (isOwner) {
      // Owner writes directly — allowed by the `workspaces.update: isOwner` rule.
      db.transact((db.tx as any).workspaces[workspaceId].update({
        stateJson,
        updatedAt: Date.now(),
      }));
    } else {
      // Non-owner editor-members save through the server route, which verifies their
      // membership role with the admin token (client writes are blocked).
      const token = (user as any)?.refresh_token;
      if (!token) return;
      void fetch('/api/workspace/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: workspaceId, stateJson }),
      });
    }
  }, [workspaceId, isOwner, user]);

  const workspaces = (data as { workspaces?: unknown[] } | undefined)?.workspaces;
  const ready = !queryLoading && !!data;
  const notFound = ready && Array.isArray(workspaces) && (workspaces.length === 0 || !!ws?.deletedAt);

  return {
    syncedState,
    syncedAt,
    isLoading: !ready,
    notFound,
    workspaceName: ws?.name ?? 'My canvas',
    isOwner,
    handleSave,
  };
}
