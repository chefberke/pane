'use client';
import Link from 'next/link';
import MagicCodeForm from './MagicCodeForm';
import OAuthButtons from './OAuthButtons';
import { COPY } from './constants';
import type { AuthMode } from './types';

interface Props {
  mode: AuthMode;
}

/** Full-screen centred auth card used by /sign-in and /sign-up. */
export default function AuthCard({ mode }: Props) {
  const copy = COPY[mode];

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ background: 'var(--color-canvas)' }}
    >
      <div
        className="w-full flex flex-col gap-5 p-6"
        style={{
          maxWidth: 'var(--panel-width-modal)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 self-start"
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
