import { AVATAR_COLORS } from './constants';

/** Returns a deterministic unsigned 31-bit hash from a string id. */
export function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Returns a deterministic palette color for an id. */
export function colorForId(id: string): string {
  return AVATAR_COLORS[hashId(id) % AVATAR_COLORS.length];
}

/** Returns up to 2 uppercase initials from a name or email ('?' when empty). */
export function initials(nameOrEmail: string): string {
  const raw = (nameOrEmail ?? '').trim();
  if (!raw) return '?';
  // For emails, derive from the local-part only (before the @).
  const base = raw.includes('@') ? raw.split('@')[0] : raw;
  const parts = base
    .split(/[\s._\-]+/)
    .map(p => p.replace(/^[^a-zA-Z0-9]+/, ''))
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
