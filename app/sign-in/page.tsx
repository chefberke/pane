'use client';
import { Suspense } from 'react';
import AuthCard from '@/app/features/auth/AuthCard';
import { useRedirectIfAuthed } from '@/app/features/auth/hooks/useRedirectIfAuthed';

function SignInInner() {
  useRedirectIfAuthed();
  return <AuthCard mode="sign-in" />;
}

/** Sign-in route: magic-code form + Google/GitHub OAuth. */
export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
