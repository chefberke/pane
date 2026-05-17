'use client';
import { Suspense } from 'react';
import AuthCard from '@/app/features/auth/AuthCard';
import { useRedirectIfAuthed } from '@/app/features/auth/hooks/useRedirectIfAuthed';

function SignUpInner() {
  useRedirectIfAuthed();
  return <AuthCard mode="sign-up" />;
}

/** Sign-up route: same magic-code flow as sign-in, different copy. */
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpInner />
    </Suspense>
  );
}
