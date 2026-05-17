import { db } from '@/app/lib/db';

/** Reactive auth state for the current user (re-renders when auth changes). */
export function useAuth() {
  return db.useAuth();
}
