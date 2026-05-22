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

/** Public workspace view/edit page — no login required. Resolves a share token. */
export default function SharePage({ params }: Props) {
  const { token } = use(params);
  const { user } = db.useAuth();

  // Resolve share link
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shareData, isLoading: shareLoading } = db.useQuery({
    workspaceShares: { $: { where: { token } as any } },
  });

  const share = (shareData as any)?.workspaceShares?.[0];

  // Resolve workspace once we have the share
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wsData, isLoading: wsLoading } = db.useQuery(
    share && !share.revokedAt
      ? { workspaces: { $: { where: { id: share.workspaceId } as any } } }
      : null,
  );

  const workspace = (wsData as any)?.workspaces?.[0];

  // Build a stable guest identity (sessionStorage so refresh keeps same cursor)
  const identity = useMemo(() => {
    if (user) {
      return { id: user.id, name: user.email ?? 'User', color: colorForId(user.id), role: share?.role ?? 'viewer' as const };
    }
    const key = `guest-id-${token}`;
    let id = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (!id) {
      id = crypto.randomUUID();
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(key, id);
    }
    return { id, name: guestName(id), color: colorForId(id), role: share?.role ?? 'viewer' as const };
  }, [user, token, share?.role]);

  const canEdit = share?.role === 'editor' && !share?.revokedAt;

  if (shareLoading || wsLoading) return <LoadingScreen />;

  if (!share || share.revokedAt) {
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

  if (!workspace) {
    return (
      <div className="w-screen h-screen flex items-center justify-center"
        style={{ background: 'var(--color-canvas)' }}>
        <p className="text-[14px]" style={{ color: 'var(--color-text-primary)' }}>Workspace not found.</p>
      </div>
    );
  }

  const initialState: CanvasState | null = workspace.stateJson
    ? deserializeState(workspace.stateJson)
    : null;

  return (
    <div className="w-screen h-screen overflow-hidden">
      <ShareCanvas
        workspaceId={share.workspaceId}
        workspaceName={workspace.name ?? 'Shared workspace'}
        initialState={initialState}
        canEdit={canEdit}
        identity={identity}
      />
    </div>
  );
}

function ShareCanvas({
  workspaceId, workspaceName, initialState, canEdit, identity,
}: {
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

  // Auto-exit if followed peer leaves
  useEffect(() => {
    if (followedPeerId && !peers.some(p => p.id === followedPeerId)) setFollowedPeerId(null);
  }, [peers, followedPeerId]);

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
    db.transact((db.tx as any).workspaces[workspaceId].update({
      stateJson: JSON.stringify(state),
      updatedAt: Date.now(),
    }));
  }, [canEdit, workspaceId]);

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
