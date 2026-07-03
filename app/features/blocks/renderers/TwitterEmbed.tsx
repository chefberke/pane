'use client';
import { memo } from 'react';
import { MessageCircle } from 'lucide-react';
import type { TwitterBlock } from '@/app/features/types';
import EmbedPlaceholder from './EmbedPlaceholder';

/** Renders a tweet via the Twitter platform embed iframe, or a placeholder when far offscreen. */
function TwitterEmbed({ block, active }: { block: TwitterBlock; active: boolean }) {
  return (
    <div className="relative w-[320px] h-[480px] overflow-hidden" style={{ background: 'var(--color-surface-embed)' }}>
      {active ? (
        <>
          <iframe
            className="w-full h-full border-0 block"
            src={`https://platform.twitter.com/embed/Tweet.html?id=${block.tweetId}&theme=light&chrome=noheader`}
            title="Tweet"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
          {/* Blocks iframe from stealing mouse events; drag and double-click are handled by BlockContainer. */}
          <div className="absolute inset-0" />
        </>
      ) : (
        <EmbedPlaceholder icon={<MessageCircle size={22} />} label="Tweet" />
      )}
    </div>
  );
}

export default memo(TwitterEmbed);
