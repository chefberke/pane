'use client';
import { useRouter, useParams } from 'next/navigation';
import { Plus, LogOut } from 'lucide-react';
import { db } from '@/app/lib/db';
import { useAuth } from '../auth/hooks/useAuth';
import { useWorkspaces } from './hooks/useWorkspaces';
import WorkspaceItem from './WorkspaceItem';
import { uid } from './utils';
import { SIDEBAR_WIDTH } from './constants';
import type { Workspace } from './types';

/** Persistent left sidebar listing the current user's workspaces. */
export default function WorkspaceSidebar() {
  const router = useRouter();
  const params = useParams();
  const activeId = typeof params?.workspaceId === 'string' ? params.workspaceId : null;

  const { user } = useAuth();
  const { data } = useWorkspaces(user?.id ?? '__unauthenticated__');

  const workspaces: Workspace[] = ((data as { workspaces?: Workspace[] } | undefined)?.workspaces ?? [])
    .slice()
    .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

  const handleNewWorkspace = async () => {
    if (!user) return;
    const wid = uid();
    await db.transact(
      db.tx.workspaces[wid].update({
        userId: user.id,
        name: 'New canvas',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    );
    router.push(`/w/${wid}`);
  };

  const handleSignOut = () => {
    db.auth.signOut().catch(() => { /* ignore */ });
    router.replace('/');
  };

  return (
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

        {workspaces.map(ws => (
          <WorkspaceItem
            key={ws.id}
            workspace={ws}
            isActive={ws.id === activeId}
          />
        ))}

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
          onClick={handleNewWorkspace}
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
  );
}
