/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use, useCallback, useMemo, useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { db } from '@/app/lib/db';
import Canvas from '@/app/features/canvas/Canvas';
import LoadingScreen from '@/app/features/loading/LoadingScreen';
import Share from '@/app/features/share/Share';
import FollowOverlay from '@/app/features/share/FollowOverlay';
import { usePresence } from '@/app/features/share/hooks/usePresence';
import { guestName, colorForId } from '@/app/features/share/utils';
import { deserializeState } from '@/app/features/workspace/utils';
import type { CanvasState } from '@/app/features/canvas/types';

interface Props {
  params: Promise<{ token: string }>;
}

interface ResolvedShare {
  workspaceId: string;
  name: string;
  stateJson: string | null;
  role: 'viewer' | 'editor';
}

/** Public workspace view/edit page — no login required. Resolves a share token
 *  server-side via /api/share/[token] so the DB stays locked down to members. */
export default function SharePage({ params }: Props) {
  const { token } = use(params);
  const { user } = db.useAuth();

  const [share, setShare] = useState<ResolvedShare | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'revoked'>('loading');

  // Resolve the share token through the server route (admin-validated).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) { if (!cancelled) setStatus('revoked'); return; }
        const data = (await res.json()) as ResolvedShare;
        if (!cancelled) { setShare(data); setStatus('ok'); }
      } catch {
        if (!cancelled) setStatus('revoked');
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // Build a stable guest identity (sessionStorage so refresh keeps same cursor)
  const identity = useMemo(() => {
    const role = share?.role ?? 'viewer';
    if (user) {
      return { id: user.id, name: user.email ?? 'User', color: colorForId(user.id), role };
    }
    const key = `guest-id-${token}`;
    let id = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (!id) {
      id = crypto.randomUUID();
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, id);
    }
    return { id, name: guestName(id), color: colorForId(id), role };
  }, [user, token, share?.role]);

  const canEdit = share?.role === 'editor';

  if (status === 'loading') return <LoadingScreen />;

  if (status === 'revoked' || !share) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--color-canvas)' }}>
        <p className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
          This link is no longer active.
        </p>
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          The owner may have revoked it.
        </p>
      </div>
    );
  }

  const initialState: CanvasState | null = share.stateJson
    ? deserializeState(share.stateJson)
    : null;

  return (
    <div className="w-screen h-screen overflow-hidden">
      <ShareCanvas
        token={token}
        workspaceId={share.workspaceId}
        workspaceName={share.name}
        initialState={initialState}
        canEdit={canEdit}
        identity={identity}
      />
    </div>
  );
}

function ShareCanvas({
  token, workspaceId, workspaceName, initialState, canEdit, identity,
}: {
  token: string;
  workspaceId: string;
  workspaceName: string;
  initialState: CanvasState | null;
  canEdit: boolean;
  identity: { id: string; name: string; color: string; role: string };
}) {
  const { peers, publishCursor, publishSelection, publishViewport } = usePresence(workspaceId, identity as any);

  const [followedPeerId, setFollowedPeerId] = useState<string | null>(null);
  const followedPeer = peers.find(p => p.id === followedPeerId) ?? null;
  const isFollowing = !!followedPeer && !!followedPeer.viewport;

  // Esc to exit follow
  useEffect(() => {
    if (!followedPeerId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFollowedPeerId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [followedPeerId]);

  const handleSelectPeer = useCallback((id: string) => {
    setFollowedPeerId(prev => (prev === id ? null : id));
  }, []);

  const handleViewportChange = useCallback((
    offset: { x: number; y: number },
    scale: number,
    size: { w: number; h: number },
  ) => {
    publishViewport(offset, scale, size);
  }, [publishViewport]);

  const handleSave = useCallback((state: CanvasState) => {
    if (!canEdit) return;
    // Guests (and logged-in viewers of a share link) save through the server route,
    // which re-validates the share token + editor role with the admin token.
    void fetch('/api/workspace/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: workspaceId, stateJson: JSON.stringify(state), shareToken: token }),
    });
  }, [canEdit, workspaceId, token]);

  return (
    <>
      <Canvas
        initialState={initialState}
        onSave={canEdit ? handleSave : undefined}
        canEdit={canEdit}
        peers={peers}
        onCursorMove={publishCursor}
        onSelectionChange={publishSelection}
        onViewportChange={handleViewportChange}
        isFollowing={isFollowing}
        followTarget={followedPeer?.viewport ?? null}
        topRightSlot={
          <Share
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            isOwner={false}
            peers={peers}
            followedPeerId={followedPeerId}
            onSelectPeer={handleSelectPeer}
          />
        }
      />
      <AnimatePresence>
        {isFollowing && followedPeer && (
          <FollowOverlay
            key="follow"
            name={followedPeer.name}
            color={followedPeer.color}
            onExit={() => setFollowedPeerId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
