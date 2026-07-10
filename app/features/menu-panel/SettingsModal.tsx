'use client';
import { memo, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import ThemeSwitcher from './ThemeSwitcher';
import { ModalButton, Toggle } from './primitives';
import { SETTINGS_MODAL_WIDTH, Z_MODAL } from './constants';
import type { ThemeChoice } from './types';

interface Props {
  theme: { choice: ThemeChoice; onSet: (choice: ThemeChoice) => void };
  dotGrid: { enabled: boolean; onToggle: () => void };
  account: {
    email: string | null;
    isAuthed: boolean;
    onSignIn: () => void;
    onSignUp: () => void;
    onSignOut: () => void;
  };
  onClose: () => void;
}

/** Section wrapper with an uppercase label and a top divider. */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </div>
      {children}
    </div>
  );
}

/** Portaled settings dialog: appearance (theme) and account (identity + auth actions). */
function SettingsModal({ theme, dotGrid, account, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      data-menu-portal
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_MODAL, background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col overflow-hidden"
        style={{
          width: SETTINGS_MODAL_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 34, height: 34, borderRadius: 'var(--radius-xl)', background: 'var(--color-surface-sunken)', color: 'var(--color-text-secondary)' }}
          >
            <Settings size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>Settings</p>
            <p className="text-[12px] leading-tight mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Appearance and account</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="flex items-center justify-center flex-shrink-0 cursor-pointer"
            style={{ width: 28, height: 28, borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <Section label="Appearance">
          <ThemeSwitcher themeChoice={theme.choice} onSetTheme={theme.onSet} />
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium leading-tight" style={{ color: 'var(--color-text-primary)' }}>Dot grid</p>
              <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Show a dotted background behind your canvas</p>
            </div>
            <Toggle enabled={dotGrid.enabled} onToggle={dotGrid.onToggle} />
          </div>
        </Section>

        <Section label="Account">
          {account.isAuthed ? (
            <div className="flex items-center gap-3">
              <Avatar name={account.email ?? ''} seed={account.email ?? ''} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium leading-tight truncate" style={{ color: 'var(--color-text-primary)' }}>{account.email}</p>
                <p className="text-[11px] leading-tight mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Signed in</p>
              </div>
              <ModalButton label="Sign out" onClick={account.onSignOut} />
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                Sign in to sync your canvases across devices and share them.
              </p>
              <div className="flex gap-2">
                <ModalButton label="Sign in" primary onClick={account.onSignIn} />
                <ModalButton label="Sign up" onClick={account.onSignUp} />
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

export default memo(SettingsModal);
