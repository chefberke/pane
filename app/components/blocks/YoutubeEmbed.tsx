'use client';
import type { YouTubeBlock } from '@/types';

export default function YoutubeEmbed({ block }: { block: YouTubeBlock }) {
  return (
    <div className="w-[400px]">
      <div className="aspect-video">
        <iframe
          className="w-full h-full border-0 block"
          src={`https://www.youtube-nocookie.com/embed/${block.videoId}?rel=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title={block.title ?? 'YouTube video'}
        />
      </div>
    </div>
  );
}
