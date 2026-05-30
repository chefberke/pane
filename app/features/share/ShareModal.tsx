'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { db } from '@/app/lib/db';
import type { RemotePresencePeer } from '@/app/features/types';
import InviteSection from './InviteSection';
import LinksSection from './LinksSection';
import PeopleSection from './PeopleSection';

interface Props {
  workspaceId: string;
  workspaceName: string;
  isOwner: boolean;
  peers: RemotePresencePeer[];
  onClose: () => void;
}

/** Share dialog — orchestrates invite, share-link, and people sections. */
export default function ShareModal({ workspaceId, workspaceName, isOwner, peers, onClose }: Props) {
  const { user } = db.useAuth();
  const userId = user?.id ?? '';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'var(--color-overlay-modal)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col max-w-[calc(100vw-32px)]"
        style={{
          width:      'var(--panel-width-modal-share)',
          maxHeight:  'min(82vh, 580px)',
          background: 'var(--color-surface)',
          border:     '1px solid var(--color-border-default)',
          boxShadow:  'var(--shadow-modal-lg)',
          borderRadius: 16,
          overflow:   'hidden',
        }}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 flex-shrink-0"
          style={{ height: 52, borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <span className="text-[13px] font-semibold truncate pr-3" style={{ color: 'var(--color-text-primary)' }}>
            {workspaceName}
          </span>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
            style={{ color: 'var(--color-text-muted)', background: 'transparent', border: 'none' }}
            onClick={onClose}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {isOwner && (
            <InviteSection workspaceId={workspaceId} userId={userId} />
          )}
          <LinksSection workspaceId={workspaceId} isOwner={isOwner} userId={userId} />
          <PeopleSection workspaceId={workspaceId} isOwner={isOwner} peers={peers} userId={userId} />
        </div>
      </div>
    </div>
  );
}
