import { DEFAULT_NEXT_PATH, OAUTH_CALLBACK_PATH } from './constants';

/** Minimal email shape check — used to gate the magic-code submit button. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Sanitise a `next` redirect target so an attacker cannot bounce the user to
 * an external site after sign-in. Only same-origin paths (`/foo`) are kept.
 */
export function safeNext(next: string | null | undefined): string {
  if (!next) return DEFAULT_NEXT_PATH;
  if (!next.startsWith('/')) return DEFAULT_NEXT_PATH;
  if (next.startsWith('//')) return DEFAULT_NEXT_PATH;
  // Browsers can normalise '\' to '/', so '/\evil.com' would escape same-origin like
  // '//evil.com'. Reject any backslash to close that bypass.
  if (next.includes('\\')) return DEFAULT_NEXT_PATH;
  return next;
}

/** Build the absolute URL to send to the OAuth provider as the redirect target. */
export function buildOAuthRedirectURL(origin: string, next: string): string {
  const safe = safeNext(next);
  const params = new URLSearchParams({ next: safe });
  return `${origin}${OAUTH_CALLBACK_PATH}?${params.toString()}`;
}

/** Extract a human-readable message from an unknown thrown value. */
export function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
