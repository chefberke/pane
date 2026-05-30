'use client';
import { useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/app/lib/db';
import type { WorkspaceItem } from '../types';

/**
 * Loads the caller's workspaces (active + trashed) and exposes canvas CRUD actions.
 * Soft-delete moves canvases to Trash; permanent delete is irreversible.
 */
export function useWorkspaceCrud(userId: string | null, onCloseMenu: () => void) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: wsData } = db.useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspaces: { $: { where: { userId: userId ?? '__unauthenticated__' } as any } },
  });

  const allWorkspaces: WorkspaceItem[] = ((wsData as { workspaces?: WorkspaceItem[] } | undefined)
    ?.workspaces ?? [])
    .toSorted((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
  const workspaces = allWorkspaces.filter(w => !w.deletedAt);
  const deletedWorkspaces = allWorkspaces
    .filter(w => w.deletedAt)
    .toSorted((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));

  const createCanvas = useCallback(async () => {
    if (!userId) return;
    const wid = crypto.randomUUID();
    await db.transact(
      db.tx.workspaces[wid].update({
        userId,
        name: 'New canvas',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    onCloseMenu();
    router.push(`/w/${wid}`);
  }, [userId, onCloseMenu, router]);

  const rename = useCallback(async (id: string, name: string) => {
    await db.transact(db.tx.workspaces[id].update({ name, updatedAt: Date.now() }));
  }, []);

  const softDelete = useCallback(async (id: string) => {
    await db.transact(db.tx.workspaces[id].update({ deletedAt: Date.now() }));
    if (pathname === `/w/${id}`) router.replace('/w');
  }, [pathname, router]);

  const restore = useCallback(async (id: string) => {
    await db.transact(db.tx.workspaces[id].update({ deletedAt: null as unknown as number }));
  }, []);

  const deleteForever = useCallback(async (id: string) => {
    await db.transact(db.tx.workspaces[id].delete());
  }, []);

  return { workspaces, deletedWorkspaces, createCanvas, rename, softDelete, restore, deleteForever };
}
