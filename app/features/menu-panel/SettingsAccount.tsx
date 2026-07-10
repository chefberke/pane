'use client';
import { memo } from 'react';
import Avatar from '../ui/Avatar';
import { displayNameFromEmail } from '../ui/utils';
import { ModalButton } from './primitives';

interface Props {
  email: string | null;
  isAuthed: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
}

/** Account section of the settings modal: profile card + sign-out when authed, sign-in prompt otherwise. */
function SettingsAccount({ email, isAuthed, onSignIn, onSignUp, onSignOut }: Props) {
  if (!isAuthed) {
    return (
      <div className="flex flex-col items-start gap-5" style={{ maxWidth: 360 }}>
        <Avatar size="xl" />
        <div>
          <p className="text-[16px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            You&apos;re signed out
          </p>
          <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Sign in to sync your canvases across devices and share them with others.
          </p>
        </div>
        <div className="flex gap-2">
          <ModalButton label="Sign in" primary onClick={onSignIn} />
          <ModalButton label="Sign up" onClick={onSignUp} />
        </div>
      </div>
    );
  }

  const value = email ?? '';
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar name={value} seed={value} size="xl" />
        <div className="min-w-0">
          <p className="text-[17px] font-semibold leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>
            {displayNameFromEmail(value)}
          </p>
          <p className="text-[13px] leading-tight mt-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>{value}</p>
        </div>
      </div>

      <div className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
        <span className="rounded-full" style={{ width: 7, height: 7, background: 'var(--color-text-success, #22c55e)' }} />
        <span className="text-[12px]">Signed in · Synced to cloud</span>
      </div>

      <div>
        <ModalButton label="Sign out" onClick={onSignOut} />
      </div>
    </div>
  );
}

export default memo(SettingsAccount);
