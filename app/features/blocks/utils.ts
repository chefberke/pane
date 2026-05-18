import type { Block } from '@/app/features/types';

/** Human-readable labels for each block type. */
export const TYPE_LABELS: Record<Block['type'], string> = {
  link: 'Link',
  youtube: 'YouTube',
  twitter: 'Tweet',
  image: 'Image',
  text: 'Note',
  pdf: 'PDF',
  spotify: 'Spotify',
  map: 'Map',
  github: 'GitHub',
};

/** Returns a human-readable label for a block, used for search and display. */
export function getBlockLabel(block: Block): string {
  if (block.type === 'link') return block.title || block.url;
  if (block.type === 'youtube') return block.title || 'YouTube video';
  if (block.type === 'twitter') return `Tweet · ${block.url}`;
  if (block.type === 'image') return block.alt || block.url;
  if (block.type === 'text') return block.content || 'Empty note';
  if (block.type === 'pdf') return block.title || block.url.split('/').pop()?.split('?')[0] || 'PDF';
  if (block.type === 'spotify') return `Spotify ${block.spotifyType}`;
  if (block.type === 'map') return block.title || 'Map';
  if (block.type === 'github') return `${block.owner}/${block.repo}`;
  return '';
}

/** Groups blocks by type in a fixed display order, omitting empty groups. */
export function groupBlocksByType(blocks: Block[]): Array<{ type: Block['type']; items: Block[] }> {
  const order: Block['type'][] = ['youtube', 'spotify', 'twitter', 'image', 'pdf', 'link', 'map', 'github', 'text'];
  return order
    .map(type => ({ type, items: blocks.filter(b => b.type === type) }))
    .filter(g => g.items.length > 0);
}

/** Returns blocks whose searchable fields contain the query (case-insensitive). */
export function searchBlocks(blocks: Block[], query: string): Block[] {
  const q = query.toLowerCase().trim();
  if (!q) return blocks;
  return blocks.filter(block => {
    if (block.type === 'link') {
      return [block.url, block.title, block.description].some(v => v?.toLowerCase().includes(q));
    }
    if (block.type === 'youtube') {
      return [block.title, block.videoId].some(v => v?.toLowerCase().includes(q));
    }
    if (block.type === 'twitter') {
      return [block.url, block.tweetId].some(v => v?.toLowerCase().includes(q));
    }
    if (block.type === 'image') {
      return [block.url, block.alt].some(v => v?.toLowerCase().includes(q));
    }
    if (block.type === 'text') {
      return block.content?.toLowerCase().includes(q);
    }
    if (block.type === 'pdf') {
      return [block.url, block.title].some(v => v?.toLowerCase().includes(q));
    }
    if (block.type === 'spotify') {
      return [block.url, block.spotifyType, block.spotifyId].some(v => v?.toLowerCase().includes(q));
    }
    if (block.type === 'map') {
      return [block.embedUrl, block.title].some(v => v?.toLowerCase().includes(q));
    }
    if (block.type === 'github') {
      return [block.owner, block.repo, block.description, block.language].some(v => v?.toLowerCase().includes(q));
    }
    return false;
  });
}
