'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/app/lib/db';
import { safeNext, errorMessage } from '@/app/features/auth/utils';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get('code');
  const next = safeNext(params.get('next'));
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        await db.auth.exchangeOAuthCode({ code });
        if (!cancelled) router.replace(next);
      } catch (err) {
        if (!cancelled) setExchangeError(errorMessage(err, 'Sign-in failed.'));
      }
    })();
    return () => { cancelled = true; };
  }, [code, next, router]);

  const error = !code ? 'Missing authorization code.' : exchangeError;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ background: 'var(--color-canvas)' }}
    >
      <div
        className="flex flex-col items-center gap-3 p-6 text-center"
        style={{
          maxWidth: 'var(--panel-width-modal)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal)',
        }}
      >
        {error ? (
          <>
            <span style={{ color: 'var(--danger)', fontSize: 'var(--text-sm)' }}>{error}</span>
            <Link
              href="/sign-in"
              className="underline"
              style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-xs)' }}
            >
              Back to sign-in
            </Link>
          </>
        ) : (
          <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Signing you in…
          </span>
        )}
      </div>
    </div>
  );
}

/** OAuth redirect target — exchanges the `code` query param for a session. */
export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
