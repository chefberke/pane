'use client';
import { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import Canvas from '@/app/features/canvas/Canvas';
import LoadingScreen from '@/app/features/loading/LoadingScreen';
import Share from '@/app/features/share/Share';
import FollowOverlay from '@/app/features/share/FollowOverlay';
import { usePresence } from '@/app/features/share/hooks/usePresence';
import { colorForId, displayNameFromEmail } from '@/app/features/share/utils';
import { useWorkspaceCanvas } from '@/app/features/workspace/hooks/useWorkspaceCanvas';
import { db } from '@/app/lib/db';

interface Props {
  params: Promise<{ workspaceId: string }>;
}

/** Cloud canvas page — loads workspace state from InstantDB and syncs changes back. */
export default function WorkspacePage({ params }: Props) {
  const { workspaceId } = use(params);
  const { user } = db.useAuth();
  const { syncedState, syncedAt, isLoading, notFound, handleSave, workspaceName, isOwner } = useWorkspaceCanvas(workspaceId);

  const identity = {
    id:    user?.id    ?? 'anon',
    // Display name, not the raw email — presence is visible to share-link guests.
    name:  displayNameFromEmail(user?.email ?? ''),
    color: colorForId(user?.id ?? 'anon'),
    role:  'owner' as const,
  };

  const { peers, publishCursor, publishSelection, publishViewport } = usePresence(workspaceId, identity);

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

  if (isLoading) return <LoadingScreen />;

  if (notFound) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full gap-3"
        style={{ background: 'var(--color-canvas)' }}
      >
        <p className="text-[14px]" style={{ color: 'var(--color-text-primary)' }}>Canvas not found.</p>
        <Link href="/w" className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          Go to my canvases
        </Link>
      </div>
    );
  }

  return (
    <>
      <Canvas
        initialState={syncedState}
        syncedAt={syncedAt}
        onSave={handleSave}
        canEdit
        peers={peers}
        onCursorMove={publishCursor}
        onSelectionChange={publishSelection}
        onViewportChange={handleViewportChange}
        isFollowing={isFollowing}
        followTarget={followedPeer?.viewport ?? null}
        identity={{ id: identity.id, name: identity.name, color: identity.color }}
        topRightSlot={
          <Share
            workspaceId={workspaceId}
            workspaceName={workspaceName}
            isOwner={isOwner}
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
