'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/lib/db';
import AuthInput from './AuthInput';
import AuthButton from './AuthButton';
import { COPY } from './constants';
import { isValidEmail, errorMessage } from './utils';
import type { AuthMode, AuthStep } from './types';
import { useNextParam } from './hooks/useNextParam';

interface Props {
  mode: AuthMode;
}

/** Two-step magic-code form: collect email → send code → enter code → sign in. */
export default function MagicCodeForm({ mode }: Props) {
  const router = useRouter();
  const next = useNextParam();
  const copy = COPY[mode];

  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const onSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !isValidEmail(email)) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setStep('code');
      setTimeout(() => codeInputRef.current?.focus(), 0);
    } catch (err) {
      setError(errorMessage(err, 'Could not send the code. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const onVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || code.trim().length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() });
      router.replace(next);
    } catch (err) {
      setError(errorMessage(err, 'That code did not work. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  if (step === 'email') {
    return (
      <form onSubmit={onSendEmail} className="flex flex-col gap-3">
        <AuthInput
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        {error && (
          <span className="text-[12px]" style={{ color: 'var(--danger)' }}>{error}</span>
        )}
        <AuthButton type="submit" disabled={busy || !isValidEmail(email)}>
          {busy ? 'Sending…' : copy.submitEmail}
        </AuthButton>
      </form>
    );
  }

  return (
    <form onSubmit={onVerifyCode} className="flex flex-col gap-3">
      <AuthInput
        ref={codeInputRef}
        id="code"
        label={`Code sent to ${email}`}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        required
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="123456"
      />
      {error && (
        <span className="text-[12px]" style={{ color: 'var(--danger)' }}>{error}</span>
      )}
      <AuthButton type="submit" disabled={busy || code.trim().length === 0}>
        {busy ? 'Verifying…' : copy.submitCode}
      </AuthButton>
      <button
        type="button"
        className="text-[12px] cursor-pointer self-center"
        style={{ color: 'var(--color-text-secondary)' }}
        onClick={() => { setStep('email'); setCode(''); setError(null); }}
      >
        Use a different email
      </button>
    </form>
  );
}
