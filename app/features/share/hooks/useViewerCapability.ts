/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { db } from '@/app/lib/db';
import type { MemberRole } from '../types';

interface ViewerCapability {
  canEdit: boolean;
  isOwner: boolean;
  role: MemberRole;
  isLoading: boolean;
}

/**
 * Derives edit capability and role for the currently authenticated user
 * in a workspace by checking the workspaceMembers table.
 */
export function useViewerCapability(workspaceId: string, ownerUserId: string): ViewerCapability {
  const { user } = db.useAuth();
  const { data, isLoading } = db.useQuery({
    workspaceMembers: { $: { where: { workspaceId, userId: user?.id ?? '' } as any } },
  });

  if (user?.id === ownerUserId) {
    return { canEdit: true, isOwner: true, role: 'owner', isLoading: false };
  }

  const members = ((data as any)?.workspaceMembers ?? []);
  const member = members[0];

  if (isLoading) return { canEdit: false, isOwner: false, role: 'viewer', isLoading: true };

  if (member) {
    const role = member.role as MemberRole;
    return { canEdit: role !== 'viewer', isOwner: false, role, isLoading: false };
  }

  return { canEdit: false, isOwner: false, role: 'viewer', isLoading: false };
}
