/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useCallback } from 'react';
import { db } from '@/app/lib/db';
import { mintToken } from '../utils';
import type { ShareLink, ShareRole } from '../types';

/** Returns share links for a workspace and provides create/revoke actions. */
export function useShareLinks(workspaceId: string, userId: string) {
  const { data, isLoading } = db.useQuery({
    workspaceShares: { $: { where: { workspaceId } as any } },
  });

  const shares = ((data as any)?.workspaceShares ?? []) as ShareLink[];
  const active = shares.filter(s => !s.revokedAt);

  const createShare = useCallback(async (role: ShareRole): Promise<ShareLink> => {
    const token = mintToken();
    const id = crypto.randomUUID();
    const share: ShareLink = { id, workspaceId, token, role, createdAt: Date.now(), createdBy: userId };
    // Set the workspace link so permission rules can traverse share → workspace.
    await db.transact((db.tx as any).workspaceShares[id].update(share).link({ workspace: workspaceId }));
    return share;
  }, [workspaceId, userId]);

  const revokeShare = useCallback(async (shareId: string) => {
    await db.transact((db.tx as any).workspaceShares[shareId].update({ revokedAt: Date.now() }));
  }, []);

  const regenerateShare = useCallback(async (shareId: string, role: ShareRole) => {
    await revokeShare(shareId);
    return createShare(role);
  }, [revokeShare, createShare]);

  return { shares: active, isLoading, createShare, revokeShare, regenerateShare };
}
