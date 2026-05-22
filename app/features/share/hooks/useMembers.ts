/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useCallback } from 'react';
import { db } from '@/app/lib/db';
import type { WorkspaceMember, MemberRole } from '../types';

/** Returns the member list for a workspace and provides role-change and remove actions. */
export function useMembers(workspaceId: string) {
  const { data, isLoading } = db.useQuery({
    workspaceMembers: { $: { where: { workspaceId } as any } },
  });

  const members = ((data as any)?.workspaceMembers ?? []) as WorkspaceMember[];

  const updateRole = useCallback(async (memberId: string, role: MemberRole) => {
    await db.transact((db.tx as any).workspaceMembers[memberId].update({ role }));
  }, []);

  const removeMember = useCallback(async (memberId: string) => {
    await db.transact((db.tx as any).workspaceMembers[memberId].delete());
  }, []);

  return { members, isLoading, updateRole, removeMember };
}
