'use client';
import { memo } from 'react';
import { Play } from 'lucide-react';
import type { YouTubeBlock } from '@/app/features/types';

/** Renders a privacy-enhanced YouTube embed (youtube-nocookie.com), or a thumbnail poster when far offscreen. */
function YoutubeEmbed({ block, active }: { block: YouTubeBlock; active: boolean }) {
  return (
    <div className="w-[400px]">
      <div className="relative aspect-video">
        {active ? (
          <>
            <iframe
              className="w-full h-full border-0 block"
              src={`https://www.youtube-nocookie.com/embed/${block.videoId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              title={block.title ?? 'YouTube video'}
            />
            {/* Blocks iframe from stealing mouse events — drag and double-click are handled by BlockContainer */}
            <div className="absolute inset-0" />
          </>
        ) : (
          // Lightweight poster (a single <img>, no iframe) while offscreen; swaps to the live player on approach.
          <div className="w-full h-full relative" style={{ background: 'var(--color-surface-embed)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- external YouTube thumbnail poster */}
            <img
              src={`https://i.ytimg.com/vi/${block.videoId}/hqdefault.jpg`}
              alt={block.title ?? 'YouTube video'}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full p-3" style={{ background: 'rgba(0,0,0,0.55)' }}>
                <Play size={20} fill="#fff" stroke="#fff" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(YoutubeEmbed);
