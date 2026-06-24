'use client';
import { memo } from 'react';
import { User, ChevronRight, LogOut } from 'lucide-react';
import Avatar from '../ui/Avatar';

interface Props {
  isLoading: boolean;
  email: string | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

/** Account block — loading, signed-in (with sign-out), or signed-out (sign-in CTA). */
function AccountRow({ isLoading, email, onSignIn, onSignOut }: Props) {
  if (isLoading) {
    return (
      <div
        className="w-full flex items-center gap-2.5 px-3"
        style={{ height: 56, borderBottom: '1px solid var(--color-border-default)', opacity: 0.5 }}
      >
        <div className="flex-shrink-0" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-surface-sunken)' }} />
        <span className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>Loading…</span>
      </div>
    );
  }

  if (email) {
    return (
      <div style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <div className="w-full flex items-center gap-2.5 px-3" style={{ height: 56 }}>
          <Avatar name={email} seed={email} size="md" />
          <div className="flex flex-col items-start flex-1 min-w-0">
            <span className="text-[13px] font-medium leading-tight truncate w-full text-left" style={{ color: 'var(--color-text-primary)' }}>{email}</span>
            <span className="text-[11px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>Signed in</span>
          </div>
        </div>
        <button
          type="button"
          className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
          style={{ height: 'var(--row-height)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          onClick={onSignOut}
        >
          <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex' }}><LogOut size={14} /></span>
          <span className="flex-1 text-left text-[13px]" style={{ color: 'var(--color-text-primary)' }}>Sign out</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
      style={{ height: 56, borderBottom: '1px solid var(--color-border-default)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      onClick={onSignIn}
    >
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: 28, height: 28, borderRadius: '50%', border: '1px dashed var(--color-border-default)', color: 'var(--color-text-muted)' }}
      >
        <User size={12} />
      </div>
      <div className="flex flex-col items-start flex-1 min-w-0">
        <span className="text-[13px] font-medium leading-tight" style={{ color: 'var(--color-text-primary)' }}>Sign in</span>
        <span className="text-[11px] leading-tight" style={{ color: 'var(--color-text-muted)' }}>Save your canvas</span>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
    </button>
  );
}

export default memo(AccountRow);
