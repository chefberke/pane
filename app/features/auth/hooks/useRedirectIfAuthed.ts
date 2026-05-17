'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';
import { useNextParam } from './useNextParam';

/** On the sign-in / sign-up pages, bounce already-authenticated users to `next`. */
export function useRedirectIfAuthed() {
  const router = useRouter();
  const next = useNextParam();
  const { isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && user) router.replace(next);
  }, [isLoading, user, router, next]);
}
