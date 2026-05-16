'use client';
import type { TwitterBlock } from '@/app/features/types';

/** Renders a tweet via the Twitter platform embed iframe. */
export default function TwitterEmbed({ block }: { block: TwitterBlock }) {
  return (
    <div className="relative w-[320px] h-[480px] overflow-hidden" style={{ background: 'var(--color-surface-embed)' }}>
      <iframe
        className="w-full h-full border-0 block"
        src={`https://platform.twitter.com/embed/Tweet.html?id=${block.tweetId}&theme=light&chrome=noheader`}
        title="Tweet"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
      {/* Blocks iframe from stealing mouse events; drag and double-click are handled by BlockContainer. */}
      <div className="absolute inset-0" />
    </div>
  );
}
