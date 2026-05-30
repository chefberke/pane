'use client';
import { memo, useCallback, useState } from 'react';
import { Copy, Check, Trash2 } from 'lucide-react';
import { Section, RoleToggle, IconBtn } from './SharePrimitives';
import { useInvites } from './hooks/useInvites';
import { copyToClipboard, inviteUrl } from './utils';
import { EMAIL_REGEX } from './constants';
import type { ShareRole } from './types';

interface Props {
  workspaceId: string;
  userId: string;
}

/** Email-invite composer plus the list of pending invites (owner only). */
function InviteSection({ workspaceId, userId }: Props) {
  const { invites, isLoading, createInvite, revokeInvite } = useInvites(workspaceId, userId);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('editor');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');

  const handleCreate = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed)) {
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

export default memo(InviteSection);
