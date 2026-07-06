'use client';
import Link from 'next/link';
import MagicCodeForm from './MagicCodeForm';
import OAuthButtons from './OAuthButtons';
import AuthSidePanel from './AuthSidePanel';
import ThemeToggleTemp from './ThemeToggleTemp'; // ponytail: TEMPORARY — remove with the file
import { COPY } from './constants';
import type { AuthMode } from './types';

interface Props {
  mode: AuthMode;
}

/** Split-screen auth layout used by /sign-in and /sign-up. */
export default function AuthCard({ mode }: Props) {
  const copy = COPY[mode];

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-canvas)' }}>
      <ThemeToggleTemp />
      <AuthSidePanel />

      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-16">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <Link
            href="/"
            className="flex items-center gap-2.5 self-start md:hidden"
            aria-label="Home"
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 'var(--radius-md)',
                background: 'var(--brand-gradient)',
                boxShadow: 'var(--shadow-brand-logo)',
              }}
            />
            <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Pane
            </span>
          </Link>

          <div className="flex flex-col gap-1">
            <h1
              className="font-semibold tracking-tight"
              style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-2xl)' }}
            >
              {copy.title}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
              {copy.subtitle}
            </p>
          </div>

          <OAuthButtons />

          <Divider label="or" />

          <MagicCodeForm mode={mode} />

          <p
            className="text-center"
            style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}
          >
            {copy.altPrompt}{' '}
            <Link
              href={copy.altLinkHref}
              className="underline"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {copy.altLinkLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: 'var(--color-border-subtle)' }} />
      <span
        className="uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-2xs)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--color-border-subtle)' }} />
    </div>
  );
}
