/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { use } from 'react';
import Link from 'next/link';
import Canvas from '@/app/features/canvas/Canvas';
import LoadingScreen from '@/app/features/loading/LoadingScreen';
import Share from '@/app/features/share/Share';
import { usePresence } from '@/app/features/share/hooks/usePresence';
import { colorForId } from '@/app/features/share/utils';
import { useWorkspaceCanvas } from '@/app/features/workspace/hooks/useWorkspaceCanvas';
import { db } from '@/app/lib/db';

interface Props {
  params: Promise<{ workspaceId: string }>;
}

/** Cloud canvas page — loads workspace state from InstantDB and syncs changes back. */
export default function WorkspacePage({ params }: Props) {
  const { workspaceId } = use(params);
  const { user } = db.useAuth();
  const { initialState, isLoading, notFound, handleSave, workspaceName, isOwner } = useWorkspaceCanvas(workspaceId);

  const identity = {
    id:    user?.id    ?? 'anon',
    name:  user?.email ?? 'User',
    color: colorForId(user?.id ?? 'anon'),
    role:  'owner' as const,
  };

  const { peers, publishCursor, publishSelection } = usePresence(workspaceId, identity);

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
    <Canvas
      initialState={initialState}
      onSave={handleSave}
      canEdit
      peers={peers}
      onCursorMove={publishCursor}
      onSelectionChange={publishSelection}
      topRightSlot={
        <Share
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          isOwner={isOwner}
          peers={peers}
        />
      }
    />
  );
}
