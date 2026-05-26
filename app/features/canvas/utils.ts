import type { Block, AlignMode } from '@/app/features/types';
import { BLOCK_SIZES } from './constants';

/** Generates a short random collision-resistant string ID. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Infers block type from a URL (or iframe HTML snippet) by inspecting hostname and file extension. */
export function detectType(input: string): Block['type'] {
  const trimmed = input.trim();
  if (trimmed.startsWith('<iframe')) {
    const src = (trimmed.match(/\bsrc="([^"]+)"/) ?? [])[1];
    if (src && src.includes('google.com/maps/embed')) return 'map';
    return 'link';
  }
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) return 'youtube';
    if (u.hostname.includes('twitter.com') || u.hostname.includes('x.com')) return 'twitter';
    if (u.hostname === 'open.spotify.com') return 'spotify';
    if (u.hostname.includes('google.com') && u.pathname.startsWith('/maps/embed')) return 'map';
    if (u.hostname === 'github.com' && /^\/[^/]+\/[^/]+\/?$/.test(u.pathname)) return 'github';
    if (/\.(png|jpg|jpeg|gif|webp|svg|avif)(\?.*)?$/i.test(u.pathname)) return 'image';
    if (/\.pdf(\?.*)?$/i.test(u.pathname)) return 'pdf';
  } catch { /* not a URL */ }
  return 'link';
}

/** Extracts Spotify embed type and ID from an open.spotify.com URL. */
export function extractSpotifyInfo(url: string): { spotifyType: 'track' | 'album' | 'playlist' | 'episode'; spotifyId: string } | null {
  const m = url.match(/open\.spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
  if (!m) return null;
  return { spotifyType: m[1] as 'track' | 'album' | 'playlist' | 'episode', spotifyId: m[2] };
}

/** Validates and returns a Google Maps embed URL. Accepts both the raw URL and a full iframe HTML snippet. */
export function extractMapEmbedUrl(input: string): string | null {
  const trimmed = input.trim();
  const candidate = trimmed.startsWith('<iframe')
    ? (trimmed.match(/\bsrc="([^"]+)"/) ?? [])[1] ?? null
    : trimmed;
  if (!candidate) return null;
  try {
    const u = new URL(candidate);
    if (u.hostname.includes('google.com') && u.pathname.startsWith('/maps/embed')) return candidate;
  } catch { /* ignore */ }
  return null;
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

/** Extracts owner and repo name from a github.com URL. */
export function extractGitHubRepo(url: string): { owner: string; repo: string } | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return { owner: m[1], repo: m[2] };
}

/**
 * Returns the URL string if it is a valid https:// URL, otherwise null.
 * Use this before rendering any user-supplied URL in an iframe or img tag.
 */
export function assertHttpsUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

const ARRANGE_GAP = 24;

/** Returns a new block list with selected blocks arranged in a row or column with equal spacing. */
export function alignBlocks(blocks: Block[], ids: Set<string>, mode: AlignMode): Block[] {
  const selected = blocks.filter(b => ids.has(b.id));
  if (selected.length < 2) return blocks;

  const dims = (b: Block) => ({
    w: b.width ?? BLOCK_SIZES[b.type].w,
    h: b.height ?? BLOCK_SIZES[b.type].h,
  });

  const positions = new Map<string, { x: number; y: number }>();

  if (mode === 'distributeH') {
    // sort left-to-right, arrange in a row, center all on shared vertical axis
    const sorted = [...selected].sort((a, b) => a.x - b.x);
    const totalH = sorted.reduce((sum, b) => sum + dims(b).h, 0) / sorted.length;
    const centerY = sorted.reduce((sum, b) => sum + b.y + dims(b).h / 2, 0) / sorted.length;
    let cursor = sorted[0].x;
    for (const b of sorted) {
      const { w, h } = dims(b);
      positions.set(b.id, { x: cursor, y: centerY - h / 2 });
      cursor += w + ARRANGE_GAP;
    }
    void totalH;
  } else {
    // sort top-to-bottom, arrange in a column, center all on shared horizontal axis
    const sorted = [...selected].sort((a, b) => a.y - b.y);
    const centerX = sorted.reduce((sum, b) => sum + b.x + dims(b).w / 2, 0) / sorted.length;
    let cursor = sorted[0].y;
    for (const b of sorted) {
      const { w, h } = dims(b);
      positions.set(b.id, { x: centerX - w / 2, y: cursor });
      cursor += h + ARRANGE_GAP;
    }
  }

  return blocks.map(b => {
    const pos = positions.get(b.id);
    return pos ? { ...b, ...pos } as Block : b;
  });
}
