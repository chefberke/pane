/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/lib/db';
import LoadingScreen from '@/app/features/loading/LoadingScreen';

interface Props {
  params: Promise<{ token: string }>;
}

/** Invite accept page — must be logged in. Acceptance + email binding is validated
 *  server-side by /api/invite/[token]/accept; redirects to the workspace on success. */
export default function InviteAcceptPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = db.useAuth();

  const ran = useRef(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect unauthenticated users to sign-in
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/sign-in?next=/s/invite/${token}`);
    }
  }, [authLoading, user, router, token]);

  // Accept the invite once we have an authenticated user
  useEffect(() => {
    if (authLoading || !user || ran.current) return;
    ran.current = true;

    (async () => {
      const authToken = (user as any)?.refresh_token;
      try {
        const res = await fetch(`/api/invite/${token}/accept`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.workspaceId) {
          router.replace(`/w/${data.workspaceId}`);
        } else {
          setErrorMsg(data.error || 'Invite not found or has been revoked.');
        }
      } catch {
        setErrorMsg('Something went wrong accepting this invite.');
      }
    })();
  }, [authLoading, user, router, token]);

  if (!errorMsg) return <LoadingScreen />;

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
