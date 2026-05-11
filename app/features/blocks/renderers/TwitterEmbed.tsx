'use client';
import type { TwitterBlock } from '@/types';

/** Renders a tweet via the Twitter platform embed iframe. */
export default function TwitterEmbed({ block }: { block: TwitterBlock }) {
  return (
    <div className="w-[320px] h-[480px] bg-white dark:bg-[#242424] overflow-hidden">
      <iframe
        className="w-full h-full border-0 block"
        src={`https://platform.twitter.com/embed/Tweet.html?id=${block.tweetId}&theme=light&chrome=noheader`}
        title="Tweet"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    </div>
  );
}
