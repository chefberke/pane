/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { Plus, LogOut, Users } from 'lucide-react';
import { db } from '@/app/lib/db';
import { useAuth } from '../auth/hooks/useAuth';
import { useWorkspaces } from './hooks/useWorkspaces';
import NameModal from '../ui/NameModal';
import WorkspaceItem from './WorkspaceItem';
import { uid, uniqueWorkspaceName } from './utils';
import { SIDEBAR_WIDTH, MAX_WORKSPACE_NAME_LENGTH } from './constants';
import type { Workspace } from './types';

/** Persistent left sidebar listing the current user's workspaces. */
export default function WorkspaceSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeId = typeof params?.workspaceId === 'string' ? params.workspaceId : null;

  const { user } = useAuth();
  const { data } = useWorkspaces(user?.id ?? '__unauthenticated__');

  // Member workspaces — query memberships then fetch each workspace by id
  const { data: memberData } = db.useQuery(
    user ? { workspaceMembers: { $: { where: { userId: user.id } as any } } } : null,
  );
  const memberWorkspaceIds: string[] = (
    ((memberData as any)?.workspaceMembers ?? []) as { workspaceId: string; role: string }[]
  )
    .filter(m => m.role !== 'owner')
    .map(m => m.workspaceId);

  const ownedWorkspaces: Workspace[] = ((data as { workspaces?: Workspace[] } | undefined)?.workspaces ?? [])
    .filter(w => !w.deletedAt)
    .slice()
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  const [createOpen, setCreateOpen] = useState(false);

  const handleNewWorkspace = useCallback(async (name: string) => {
    if (!user) return;
    const wid = uid();
    await db.transact(
      db.tx.workspaces[wid].update({
        userId: user.id,
        name: uniqueWorkspaceName(name, ownedWorkspaces.map(w => w.name)),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    router.push(`/w/${wid}`);
  }, [user, ownedWorkspaces, router]);

  const handleSignOut = () => {
    db.auth.signOut().catch(() => { /* ignore */ });
    router.replace('/');
  };

  return (
    <>
    <aside
      className="flex flex-col h-full flex-shrink-0"
      style={{
        width: SIDEBAR_WIDTH,
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border-default)',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center gap-2 px-4 flex-shrink-0"
        style={{ height: 48, borderBottom: '1px solid var(--color-border-default)' }}
      >
        <div
          style={{
            width: 16, height: 16, borderRadius: 4,
            background: 'var(--brand-gradient)',
            flexShrink: 0,
          }}
        />
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Pane
        </span>
      </div>

      {/* Workspace list */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        <div
          className="px-5 pb-1.5 text-[10px] font-medium uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Canvases
        </div>

        {ownedWorkspaces.map(ws => (
          <WorkspaceItem
            key={ws.id}
            workspace={ws}
            isActive={ws.id === activeId}
          />
        ))}

        {memberWorkspaceIds.length > 0 && (
          <>
            <div
              className="flex items-center gap-1.5 px-5 pt-3 pb-1.5 text-[10px] font-medium uppercase tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Users size={9} />
              Shared with me
            </div>
            {memberWorkspaceIds.map(wid => (
              <MemberWorkspaceItem key={wid} workspaceId={wid} isActive={wid === activeId} />
            ))}
          </>
        )}

        <button
          type="button"
          className="flex items-center gap-2 px-3 mx-2 rounded-lg cursor-pointer w-[calc(100%-16px)] mt-1"
          style={{
            height: 32,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={13} style={{ flexShrink: 0 }} />
          <span className="text-[13px]">New canvas</span>
        </button>
      </div>

      {/* Account */}
      <div style={{ borderTop: '1px solid var(--color-border-default)' }} className="flex-shrink-0">
        {user && (
          <div className="px-4 py-2">
            <p
              className="text-[11px] truncate"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {user.email}
            </p>
          </div>
        )}
        <button
          type="button"
          className="flex items-center gap-2 w-full px-4 cursor-pointer"
          style={{
            height: 36,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          onClick={handleSignOut}
        >
          <LogOut size={13} style={{ flexShrink: 0 }} />
          <span className="text-[13px]">Sign out</span>
        </button>
      </div>
    </aside>
    {createOpen && createPortal(
      <NameModal
        title="New canvas"
        description="Name your new canvas."
        initialValue={uniqueWorkspaceName('New canvas', ownedWorkspaces.map(w => w.name))}
        confirmLabel="Create"
        existingNames={ownedWorkspaces.map(w => w.name)}
        maxLength={MAX_WORKSPACE_NAME_LENGTH}
        onSubmit={async name => { setCreateOpen(false); await handleNewWorkspace(name); }}
        onClose={() => setCreateOpen(false)}
      />,
      document.body
    )}
    </>
  );
}

/** Sidebar row for a workspace the user is a member of (not owner). Fetches its own name. */
function MemberWorkspaceItem({ workspaceId, isActive }: { workspaceId: string; isActive: boolean }) {
  const { data } = db.useQuery({ workspaces: { $: { where: { id: workspaceId } as any } } });
  const ws = (data as any)?.workspaces?.[0];
  const name = ws?.name ?? 'Shared canvas';

  if (ws?.deletedAt) return null;

  return (
    <a
      href={`/w/${workspaceId}`}
      className="flex items-center gap-2 px-3 mx-2 rounded-lg cursor-pointer"
      style={{
        height: 32,
        background: isActive ? 'var(--color-bg-active)' : 'transparent',
        color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        textDecoration: 'none',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = isActive ? 'var(--color-bg-active)' : 'transparent'; }}
    >
      <Users size={13} style={{ flexShrink: 0, color: 'var(--color-text-muted)' }} />
      <span className="text-[13px] truncate flex-1">{name}</span>
    </a>
  );
}
