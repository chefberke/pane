'use client';
import type { YouTubeBlock } from '@/types';

/** Renders a privacy-enhanced YouTube embed (youtube-nocookie.com). */
export default function YoutubeEmbed({ block }: { block: YouTubeBlock }) {
  return (
    <div className="w-[400px]">
      <div className="relative aspect-video">
        <iframe
          className="w-full h-full border-0 block"
          src={`https://www.youtube-nocookie.com/embed/${block.videoId}?rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={block.title ?? 'YouTube video'}
        />
        {/* Blocks iframe from stealing mouse events — drag and double-click are handled by BlockContainer */}
        <div className="absolute inset-0" />
      </div>
    </div>
  );
}
