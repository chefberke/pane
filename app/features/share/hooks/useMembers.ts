/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useCallback } from 'react';
import { db } from '@/app/lib/db';
import type { WorkspaceMember, MemberRole } from '../types';

/** Returns the member list for a workspace and provides role-change and remove actions. */
export function useMembers(workspaceId: string, callerIsOwner: boolean) {
  const { data, isLoading } = db.useQuery({
    workspaceMembers: { $: { where: { workspaceId } as any } },
  });

  const members = ((data as any)?.workspaceMembers ?? []) as WorkspaceMember[];

  // Defense-in-depth: gate mutations on the caller being the workspace owner.
  // The server-side InstantDB rules are the authoritative enforcement layer;
  // this prevents accidental misuse from non-owner call sites.
  const updateRole = useCallback(async (memberId: string, role: MemberRole) => {
    if (!callerIsOwner) return;
    await db.transact((db.tx as any).workspaceMembers[memberId].update({ role }));
  }, [callerIsOwner]);

  const removeMember = useCallback(async (memberId: string) => {
    if (!callerIsOwner) return;
    await db.transact((db.tx as any).workspaceMembers[memberId].delete());
  }, [callerIsOwner]);

  return { members, isLoading, updateRole, removeMember };
}
