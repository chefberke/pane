import { useState, useCallback, useEffect, type Dispatch, type SetStateAction } from 'react';
import type { Block, LinkBlock } from '@/types';
import { uid, detectType, extractYouTubeId, extractTweetId } from '../utils';
import { BLOCK_SIZES } from '../constants';

async function hydrateLinkBlock(
  id: string,
  url: string,
  setBlocks: Dispatch<SetStateAction<Block[]>>,
) {
  try {
    const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    setBlocks(prev => prev.map(b => b.id === id
      ? { ...b, loading: false, title: data.title, description: data.description, image: data.image, favicon: data.favicon }
      : b
    ));
  } catch {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, loading: false } : b));
  }
}

/** Manages the block collection, localStorage persistence, CRUD operations, and link-preview hydration. */
export function useBlocks({ screenToCanvas }: {
  screenToCanvas: (sx: number, sy: number) => { x: number; y: number };
}) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    try { const saved = localStorage.getItem('termal-blocks'); if (saved) setBlocks(JSON.parse(saved)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('termal-blocks', JSON.stringify(blocks)); } catch { /* ignore */ }
  }, [blocks]);

  /** Adds a block from a URL, auto-detecting the type and fetching link metadata. */
  const addBlockFromUrl = useCallback(async (url: string, screenX: number, screenY: number) => {
    const pos = screenToCanvas(screenX, screenY);
    const type = detectType(url);

    if (type === 'youtube') {
      const videoId = extractYouTubeId(url);
      if (!videoId) return;
      const { w, h } = BLOCK_SIZES.youtube;
      setBlocks(prev => [...prev, { id: uid(), type: 'youtube', videoId, x: pos.x - w / 2, y: pos.y - h / 2 }]);
      return;
    }
    if (type === 'twitter') {
      const tweetId = extractTweetId(url);
      if (!tweetId) return;
      const { w, h } = BLOCK_SIZES.twitter;
      setBlocks(prev => [...prev, { id: uid(), type: 'twitter', tweetId, url, x: pos.x - w / 2, y: pos.y - h / 2 }]);
      return;
    }
    if (type === 'image') {
      const { w, h } = BLOCK_SIZES.image;
      setBlocks(prev => [...prev, { id: uid(), type: 'image', url, x: pos.x - w / 2, y: pos.y - h / 2 }]);
      return;
    }

    const id = uid();
    const { w, h } = BLOCK_SIZES.link;
    setBlocks(prev => [...prev, { id, type: 'link', url, loading: true, x: pos.x - w / 2, y: pos.y - h / 2 }]);
    await hydrateLinkBlock(id, url, setBlocks);
  }, [screenToCanvas]);

  /** Refreshes metadata for all link blocks on the canvas. */
  const refreshEmbeds = useCallback(async () => {
    const linkBlocks = blocks.filter(b => b.type === 'link') as LinkBlock[];
    if (!linkBlocks.length) return;
    setIsRefreshing(true);
    setBlocks(prev => prev.map(b => b.type === 'link' ? { ...b, loading: true } : b));
    await Promise.all(linkBlocks.map(b => hydrateLinkBlock(b.id, b.url, setBlocks)));
    setIsRefreshing(false);
  }, [blocks]);

  /** Updates a subset of a block's fields by id. */
  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } as Block : b));
  }, []);

  /** Removes a block by id. */
  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  /** Removes all blocks from the canvas. */
  const clearBlocks = useCallback(() => { setBlocks([]); }, []);

  return { blocks, setBlocks, isRefreshing, addBlockFromUrl, refreshEmbeds, updateBlock, deleteBlock, clearBlocks };
}
