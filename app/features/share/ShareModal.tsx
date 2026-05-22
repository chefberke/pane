/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Trash2, ChevronDown, RotateCcw } from 'lucide-react';
import { db } from '@/app/lib/db';
import type { RemotePresencePeer } from '@/app/features/types';
import { useShareLinks } from './hooks/useShareLinks';
import { useInvites } from './hooks/useInvites';
import { useMembers } from './hooks/useMembers';
import { shareUrl, inviteUrl, copyToClipboard, initials } from './utils';
import type { MemberRole, ShareRole } from './types';

interface Props {
  workspaceId: string;
  workspaceName: string;
  isOwner: boolean;
  peers: RemotePresencePeer[];
  onClose: () => void;
}

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

/* ─── Section wrapper ─── */

function Section({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex flex-col gap-2">
      {label && (
        <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

/* ─── Invite section ─── */

function InviteSection({ workspaceId, userId }: { workspaceId: string; userId: string }) {
  const { invites, isLoading, createInvite, revokeInvite } = useInvites(workspaceId, userId);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('editor');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');

  const handleCreate = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError('Enter a valid email');
      return;
    }
    setEmailError('');
    setCreating(true);
    const invite = await createInvite(trimmed, role);
    setCreating(false);
    setEmail('');
    const ok = await copyToClipboard(inviteUrl(invite.token));
    if (ok) { setCopiedId(invite.id); setTimeout(() => setCopiedId(null), 1500); }
  }, [email, role, createInvite]);

  return (
    <Section>
      {/* Input row */}
      <div className="flex items-start gap-2">
        <div className="flex flex-col flex-1 min-w-0">
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setEmailError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="Invite by email…"
            className="outline-none bg-transparent text-[13px] px-3 w-full"
            style={{
              height:     36,
              background: 'var(--color-bg-active)',
              border:     emailError ? '1px solid var(--danger, #ef4444)' : '1px solid var(--color-border-subtle)',
              borderRadius: 10,
              color:      'var(--color-text-primary)',
            }}
          />
          {emailError && (
            <p className="text-[11px] px-1 mt-1" style={{ color: 'var(--danger, #ef4444)' }}>{emailError}</p>
          )}
        </div>
        <RoleToggle value={role} onChange={setRole} />
        <button
          onClick={handleCreate}
          disabled={creating || !email.trim()}
          className="text-[12px] font-medium cursor-pointer flex-shrink-0"
          style={{
            height:     36,
            padding:    '0 14px',
            background: 'var(--color-text-primary)',
            color:      'var(--color-canvas)',
            opacity:    creating || !email.trim() ? 0.4 : 1,
            border:     'none',
            borderRadius: 10,
            cursor:     creating || !email.trim() ? 'default' : 'pointer',
          }}
        >
          {creating ? 'Inviting…' : 'Invite'}
        </button>
      </div>

      {/* Pending invites */}
      {!isLoading && invites.length > 0 && (
        <div className="flex flex-col gap-0.5 mt-1">
          {invites.map(inv => (
            <div
              key={inv.id}
              className="flex items-center gap-3 px-1 rounded-lg"
              style={{ height: 36 }}
            >
              <span className="flex-1 text-[12px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                {inv.email}
              </span>
              <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                {inv.role === 'editor' ? 'Can edit' : 'View only'}
              </span>
              <IconBtn
                title="Copy invite link"
                onClick={async () => {
                  const ok = await copyToClipboard(inviteUrl(inv.token));
                  if (ok) { setCopiedId(inv.id); setTimeout(() => setCopiedId(null), 1200); }
                }}
              >
                {copiedId === inv.id ? <Check size={12} /> : <Copy size={12} />}
              </IconBtn>
              <IconBtn title="Revoke" danger onClick={() => revokeInvite(inv.id)}>
                <Trash2 size={12} />
              </IconBtn>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ─── Links section ─── */

function LinksSection({ workspaceId, isOwner, userId }: { workspaceId: string; isOwner: boolean; userId: string }) {
  const { shares, isLoading, createShare, revokeShare, regenerateShare } = useShareLinks(workspaceId, userId);
  const viewerShare = shares.find(s => s.role === 'viewer');
  const editorShare = shares.find(s => s.role === 'editor');

  return (
    <Section label="Share link">
      <LinkRow
        label="View only"
        share={viewerShare}
        isOwner={isOwner}
        isLoading={isLoading}
        onCreate={() => createShare('viewer')}
        onRevoke={id => revokeShare(id)}
        onRegenerate={id => regenerateShare(id, 'viewer')}
      />
      <LinkRow
        label="Can edit"
        share={editorShare}
        isOwner={isOwner}
        isLoading={isLoading}
        onCreate={() => createShare('editor')}
        onRevoke={id => revokeShare(id)}
        onRegenerate={id => regenerateShare(id, 'editor')}
      />
    </Section>
  );
}

function LinkRow({
  label, share, isOwner, isLoading, onCreate, onRevoke, onRegenerate,
}: {
  label: string;
  share: ReturnType<typeof useShareLinks>['shares'][0] | undefined;
  isOwner: boolean;
  isLoading: boolean;
  onCreate: () => Promise<any>;
  onRevoke: (id: string) => void;
  onRegenerate: (id: string) => Promise<any>;
}) {
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCopy = useCallback(async () => {
    let target = share;
    if (!target && isOwner) {
      setCreating(true);
      target = await onCreate();
      setCreating(false);
    }
    if (!target) return;
    const ok = await copyToClipboard(shareUrl(target.token));
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1200); }
  }, [share, isOwner, onCreate]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const url = share ? shareUrl(share.token) : '';

  return (
    <div className="flex items-center gap-2.5" style={{ height: 36 }}>
      {/* Label */}
      <span
        className="text-[12px] flex-shrink-0"
        style={{ width: 70, color: 'var(--color-text-secondary)' }}
      >
        {label}
      </span>

      {/* URL — only shown once link exists */}
      {share && (
        <div className="flex-1 min-w-0">
          <span
            className="text-[11px] font-mono truncate block"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {url}
          </span>
        </div>
      )}
      {!share && (
        <span className="flex-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
          {creating ? 'Generating…' : 'No link yet'}
        </span>
      )}

      {/* Copy */}
      {(isOwner || share) && (
        <IconBtn onClick={handleCopy} disabled={creating || isLoading} title={copied ? 'Copied!' : 'Copy link'}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </IconBtn>
      )}

      {/* Revoke menu */}
      {isOwner && share && (
        <div className="relative flex-shrink-0" ref={menuRef}>
          <IconBtn onClick={() => setShowMenu(p => !p)} title="Options">
            <RotateCcw size={12} />
          </IconBtn>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 bottom-full mb-1 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'var(--color-surface)',
                  border:     '1px solid var(--color-border-default)',
                  boxShadow:  'var(--shadow-float)',
                  minWidth:   170,
                }}
              >
                <DropdownItem
                  label="Regenerate link"
                  onClick={async () => { setShowMenu(false); await onRegenerate(share.id); }}
                />
                <DropdownItem
                  label="Revoke link"
                  danger
                  onClick={() => { setShowMenu(false); onRevoke(share.id); }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ─── People section ─── */

function PeopleSection({
  workspaceId, isOwner, peers, userId,
}: {
  workspaceId: string;
  isOwner: boolean;
  peers: RemotePresencePeer[];
  userId: string;
}) {
  const { members, isLoading, updateRole, removeMember } = useMembers(workspaceId);
  const onlinePeerIds = useMemo(() => new Set(peers.map(p => p.id)), [peers]);

  const guestPeers = peers.filter(p => !members.find(m => m.userId === p.id));

  if (isLoading) return null;
  if (members.length === 0 && guestPeers.length === 0) return null;

  return (
    <Section label={`People with access`}>
      {members.map(member => {
        const isOnline = onlinePeerIds.has(member.userId);
        const isSelf   = member.userId === userId;
        return (
          <div key={member.id} className="flex items-center gap-3" style={{ height: 36 }}>
            <Avatar label={initials(member.userId)} isOnline={isOnline} />
            <span className="flex-1 text-[12px] truncate" style={{ color: 'var(--color-text-primary)' }}>
              {member.userId}
              {isSelf && <span style={{ color: 'var(--color-text-muted)' }}> (you)</span>}
            </span>
            {member.role === 'owner' || !isOwner ? (
              <RoleBadge role={member.role} />
            ) : (
              <RoleDropdown
                role={member.role as MemberRole}
                onChange={r => {
                  if (r === 'remove') removeMember(member.id);
                  else updateRole(member.id, r);
                }}
              />
            )}
          </div>
        );
      })}

      {guestPeers.map(peer => (
        <div key={peer.id} className="flex items-center gap-3" style={{ height: 36 }}>
          <Avatar label={initials(peer.name)} isOnline color={peer.color} />
          <span className="flex-1 text-[12px] truncate" style={{ color: 'var(--color-text-primary)' }}>
            {peer.name}
          </span>
          <RoleBadge role="viewer" />
        </div>
      ))}
    </Section>
  );
}

/* ─── Primitives ─── */

function Avatar({ label, isOnline = false, color }: { label: string; isOnline?: boolean; color?: string }) {
  return (
    <div className="relative flex-shrink-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{
          background: color ?? 'var(--color-bg-active)',
          color: color ? '#fff' : 'var(--color-text-secondary)',
        }}
      >
        {label}
      </div>
      {isOnline && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{ background: '#22c55e', borderColor: 'var(--color-surface)' }}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'View only' };
  return (
    <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
      {labels[role] ?? role}
    </span>
  );
}

function RoleToggle({ value, onChange }: { value: ShareRole; onChange: (r: ShareRole) => void }) {
  return (
    <div
      className="flex items-center rounded-[10px] p-0.5 flex-shrink-0 relative"
      style={{ background: 'var(--color-bg-active)', height: 36 }}
    >
      {(['viewer', 'editor'] as ShareRole[]).map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className="relative px-2.5 h-full rounded-[8px] text-[11px] font-medium cursor-pointer z-10"
          style={{
            background: 'transparent',
            color:      value === r ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            border:     'none',
          }}
        >
          {value === r && (
            <motion.div
              layoutId="role-toggle-pill"
              className="absolute inset-0 rounded-[8px]"
              style={{ background: 'var(--color-surface-control-active, var(--color-surface))' }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{r === 'viewer' ? 'View' : 'Edit'}</span>
        </button>
      ))}
    </div>
  );
}

function RoleDropdown({
  role, onChange,
}: {
  role: MemberRole;
  onChange: (r: MemberRole | 'remove') => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labels: Record<string, string> = { editor: 'Can edit', viewer: 'View only' };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1 text-[11px] cursor-pointer"
        style={{
          color:      'var(--color-text-muted)',
          background: 'transparent',
          border:     'none',
          padding:    '2px 4px',
          borderRadius: 6,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {labels[role] ?? role}
        <ChevronDown size={10} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-50"
            style={{
              background: 'var(--color-surface)',
              border:     '1px solid var(--color-border-default)',
              boxShadow:  'var(--shadow-float)',
              minWidth:   130,
            }}
          >
            {(['viewer', 'editor'] as MemberRole[]).map(r => (
              <DropdownItem
                key={r}
                label={labels[r]}
                active={role === r}
                onClick={() => { setOpen(false); onChange(r); }}
              />
            ))}
            <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '2px 0' }} />
            <DropdownItem
              label="Remove"
              danger
              onClick={() => { setOpen(false); onChange('remove'); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconBtn({
  children, onClick, title, disabled = false, danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
      style={{
        color:      danger ? 'var(--color-text-danger, #ef4444)' : 'var(--color-text-tertiary)',
        opacity:    disabled ? 0.4 : 1,
        cursor:     disabled ? 'default' : 'pointer',
        background: 'transparent',
        border:     'none',
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background =
          danger ? 'var(--color-bg-danger-hover, rgba(239,68,68,0.08))' : 'var(--color-bg-hover)';
      }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function DropdownItem({
  label, active = false, danger = false, onClick,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-3 text-[12px] cursor-pointer"
      style={{
        height:     34,
        color:      danger ? 'var(--color-text-danger, #ef4444)' : 'var(--color-text-primary)',
        background: active ? 'var(--color-bg-hover)' : 'transparent',
        fontWeight: active ? 500 : 400,
        border:     'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background =
          danger ? 'var(--color-bg-danger-hover, rgba(239,68,68,0.08))' : 'var(--color-bg-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = active ? 'var(--color-bg-hover)' : 'transparent';
      }}
    >
      {label}
    </button>
  );
}
