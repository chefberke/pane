import type { Comment } from '@/app/features/types';

/** Creates a new Comment with a random id and the current timestamp. */
export function makeComment(text: string): Comment {
  return { id: Math.random().toString(36).slice(2), text, createdAt: Date.now() };
}

/** Formats a timestamp as a relative string (e.g. "just now", "5m ago", "3h ago", "2d ago"). */
export function formatTimestamp(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
