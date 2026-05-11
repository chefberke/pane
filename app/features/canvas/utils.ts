import type { Block } from '@/types';

/** Generates a short random collision-resistant string ID. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Infers block type from a URL by inspecting hostname and file extension. */
export function detectType(url: string): Block['type'] {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) return 'youtube';
    if (u.hostname.includes('twitter.com') || u.hostname.includes('x.com')) return 'twitter';
    if (/\.(png|jpg|jpeg|gif|webp|svg|avif)(\?.*)?$/i.test(u.pathname)) return 'image';
  } catch { /* not a URL */ }
  return 'link';
}

/** Extracts the 11-character video ID from any YouTube URL format. */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m?.[1]) return m[1]; }
  return null;
}

/** Extracts the numeric tweet ID from a twitter.com or x.com status URL. */
export function extractTweetId(url: string): string | null {
  return url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/)?.[1] ?? null;
}
