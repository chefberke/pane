'use client';
import { use } from 'react';
import Link from 'next/link';
import Canvas from '@/app/features/canvas/Canvas';
import { useWorkspaceCanvas } from '@/app/features/workspace/hooks/useWorkspaceCanvas';

interface Props {
  params: Promise<{ workspaceId: string }>;
}

/** Cloud canvas page — loads workspace state from InstantDB and syncs changes back. */
export default function WorkspacePage({ params }: Props) {
  const { workspaceId } = use(params);
  const { initialState, isLoading, notFound, handleSave } = useWorkspaceCanvas(workspaceId);

  if (isLoading) {
    return (
      <div
        className="w-full h-full"
        style={{ background: 'var(--color-canvas)' }}
      />
    );
  }

  if (notFound) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full h-full gap-3"
        style={{ background: 'var(--color-canvas)' }}
      >
        <p className="text-[14px]" style={{ color: 'var(--color-text-primary)' }}>Canvas not found.</p>
        <Link
          href="/w"
          className="text-[13px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Go to my canvases
        </Link>
      </div>
    );
  }

  return <Canvas initialState={initialState} onSave={handleSave} />;
}
