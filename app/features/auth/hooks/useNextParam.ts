'use client';
import { useSearchParams } from 'next/navigation';
import { safeNext } from '../utils';

/** Read the `next` query param, sanitised against open-redirect attacks. */
export function useNextParam(): string {
  const params = useSearchParams();
  return safeNext(params.get('next'));
}
