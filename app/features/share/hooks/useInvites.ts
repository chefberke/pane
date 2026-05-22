/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useCallback } from 'react';
import { db } from '@/app/lib/db';
import { mintToken } from '../utils';
import type { WorkspaceInvite, ShareRole } from '../types';

/** Returns pending invites for a workspace and provides create/revoke actions. */
export function useInvites(workspaceId: string, invitedBy: string) {
  const { data, isLoading } = db.useQuery({
    workspaceInvites: { $: { where: { workspaceId } as any } },
  });

  const invites = ((data as any)?.workspaceInvites ?? []) as WorkspaceInvite[];
  const pending = invites.filter(i => !i.acceptedAt);

  const createInvite = useCallback(async (email: string, role: ShareRole): Promise<WorkspaceInvite> => {
    const id = crypto.randomUUID();
    const token = mintToken();
    const invite: WorkspaceInvite = {
      id, workspaceId, email: email.trim().toLowerCase(),
      role, token, invitedBy, createdAt: Date.now(),
    };
    await db.transact((db.tx as any).workspaceInvites[id].update(invite));
    return invite;
  }, [workspaceId, invitedBy]);

  const revokeInvite = useCallback(async (inviteId: string) => {
    await db.transact((db.tx as any).workspaceInvites[inviteId].delete());
  }, []);

  return { invites: pending, isLoading, createInvite, revokeInvite };
}
