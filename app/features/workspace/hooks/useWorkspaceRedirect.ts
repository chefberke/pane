import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/lib/db';
import { useAuth } from '../../auth/hooks/useAuth';
import { loadCanvasState } from '../../canvas/utils/storage';
import { uid } from '../utils';
import { SYNCED_UID_KEY } from '../constants';

/**
 * Handles post-login workspace routing:
 * - Imports any unsynced localStorage data as a new workspace on first login from a device.
 * - Creates a default empty workspace if the user has none.
 * - Redirects to the user's oldest workspace.
 */
export function useWorkspaceRedirect(): { status: 'loading' | 'error' } {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const userId = user?.id ?? '__unauthenticated__';
  const { data, isLoading: wsLoading } = db.useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspaces: { $: { where: { userId } as any } },
  });

  const didRun = useRef(false);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/sign-in');
      return;
    }
    if (wsLoading || !data) return;
    if (didRun.current) return;
    didRun.current = true;

    (async () => {
      try {
        const alreadySynced = localStorage.getItem(SYNCED_UID_KEY) === user.id;
        const existingWorkspaces = ((data as { workspaces?: { id: string; createdAt: number }[] }).workspaces) ?? [];
        let targetId: string | null = null;

        if (!alreadySynced) {
          const local = loadCanvasState();
          if (local && local.blocks.length > 0) {
            const wid = uid();
            await db.transact(
              db.tx.workspaces[wid].update({
                userId: user.id,
                name: 'My canvas',
                stateJson: JSON.stringify(local),
                createdAt: Date.now(),
                updatedAt: Date.now(),
              })
            );
            targetId = wid;
          }
          localStorage.setItem(SYNCED_UID_KEY, user.id);
        }

        if (!targetId) {
          if (existingWorkspaces.length > 0) {
            const sorted = [...existingWorkspaces].sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
            targetId = sorted[0].id;
          } else {
            const wid = uid();
            await db.transact(
              db.tx.workspaces[wid].update({
                userId: user.id,
                name: 'My canvas',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              })
            );
            targetId = wid;
          }
        }

        router.replace(`/w/${targetId}`);
      } catch (err) {
        console.error('[useWorkspaceRedirect] failed:', err);
        setStatus('error');
      }
    })();
  }, [authLoading, wsLoading, user, data, router]);

  return { status };
}
