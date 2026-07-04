'use client';
import { useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { postJson } from '@/app/lib/authedFetch';
import type { FeedbackDraft } from '../types';

/** Returns a submit fn that POSTs feedback to /api/feedback; resolves true on success. */
export function useFeedback() {
  const { user } = useAuth();
  return useCallback(async (draft: FeedbackDraft): Promise<boolean> => {
    try {
      // Anonymous feedback is allowed — postJson omits the auth header when there's no token.
      const res = await postJson('/api/feedback', draft, user);
      return res.ok;
    } catch {
      return false;
    }
  }, [user]);
}
