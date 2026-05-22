import { TOKEN_LENGTH, CURSOR_COLORS, GUEST_NAME_PREFIX } from './constants';

/** Generates a URL-safe random share token. */
export function mintToken(): string {
  const full = crypto.randomUUID().replace(/-/g, '');
  return full.slice(0, TOKEN_LENGTH);
}

/** Returns a deterministic 4-digit number from a string id for guest display names. */
function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Returns a human-readable guest name from a random session id. */
export function guestName(id: string): string {
  return `${GUEST_NAME_PREFIX} #${String(hashId(id) % 9000 + 1000)}`;
}

/** Returns a deterministic cursor color for an id. */
export function colorForId(id: string): string {
  return CURSOR_COLORS[hashId(id) % CURSOR_COLORS.length];
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

/** Returns initials (up to 2 chars) from an email or name string. */
export function initials(nameOrEmail: string): string {
  const parts = nameOrEmail.split(/[@.\s]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
