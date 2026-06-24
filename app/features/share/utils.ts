import { TOKEN_LENGTH, GUEST_NAME_PREFIX } from './constants';
import { hashId } from '../ui/utils';

// Avatar/identity helpers live in the shared ui primitives; re-exported here for back-compat.
export { colorForId, initials } from '../ui/utils';

/** Generates a URL-safe random share token. */
export function mintToken(): string {
  const full = crypto.randomUUID().replace(/-/g, '');
  return full.slice(0, TOKEN_LENGTH);
}

/** Returns a human-readable guest name from a random session id. */
export function guestName(id: string): string {
  return `${GUEST_NAME_PREFIX} #${String(hashId(id) % 9000 + 1000)}`;
}

/** Copies text to clipboard; returns true on success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Builds the full viewer/editor share URL for a token. */
export function shareUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/s/${token}`;
}

/** Builds the full invite accept URL for a token. */
export function inviteUrl(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/s/invite/${token}`;
}
