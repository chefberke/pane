/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/lib/db';
import LoadingScreen from '@/app/features/loading/LoadingScreen';

interface Props {
  params: Promise<{ token: string }>;
}

/** Invite accept page — must be logged in; redirects to workspace on success. */
export default function InviteAcceptPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();

  const accepted = useRef(false);

  const { data: inviteData, isLoading: inviteLoading } = db.useQuery(
    user ? { workspaceInvites: { $: { where: { token } as any } } } : null,
  );

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/sign-in?next=/s/invite/${token}`);
    }
  }, [authLoading, user, router, token]);

  // Run the accept mutation once we have invite data
  useEffect(() => {
    if (!user || inviteLoading || !inviteData || accepted.current) return;
    const invite = (inviteData as any)?.workspaceInvites?.[0];
    if (!invite || invite.acceptedAt || invite.email !== user.email?.toLowerCase()) return;

    accepted.current = true;
    const memberId = crypto.randomUUID();
    Promise.all([
      db.transact((db.tx as any).workspaceMembers[memberId].update({
        workspaceId: invite.workspaceId,
        userId:      user.id,
        role:        invite.role === 'editor' ? 'editor' : 'viewer',
        invitedBy:   invite.invitedBy,
        createdAt:   Date.now(),
      })),
      db.transact((db.tx as any).workspaceInvites[invite.id].update({ acceptedAt: Date.now() })),
    ]).then(() => router.replace(`/w/${invite.workspaceId}`)).catch(() => { /* ignore */ });
  }, [user, inviteLoading, inviteData, router]);

  // Redirect to workspace if already accepted
  useEffect(() => {
    if (!user || inviteLoading || !inviteData) return;
    const invite = (inviteData as any)?.workspaceInvites?.[0];
    if (invite?.acceptedAt) router.replace(`/w/${invite.workspaceId}`);
  }, [user, inviteLoading, inviteData, router]);

  // Derive error state from data during render
  const invite = !inviteLoading && inviteData ? (inviteData as any)?.workspaceInvites?.[0] : undefined;
  const isLoading = authLoading || inviteLoading || !invite;

  let errorMsg = '';
  if (!isLoading) {
    if (!invite) {
      errorMsg = 'Invite not found or has been revoked.';
    } else if (invite.email && user && invite.email !== user.email?.toLowerCase()) {
      errorMsg = `This invite was sent to ${invite.email}. You're signed in as ${user.email}.`;
    }
  }

  if (isLoading || !errorMsg) return <LoadingScreen />;

  return (
    <div
      className="w-screen h-screen flex flex-col items-center justify-center gap-3"
      style={{ background: 'var(--color-canvas)' }}
    >
      <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
        Cannot accept invite
      </p>
      <p className="text-[13px] text-center max-w-xs" style={{ color: 'var(--color-text-muted)' }}>
        {errorMsg}
      </p>
    </div>
  );
}
