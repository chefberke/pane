'use client';
import type { ImageBlock } from '@/app/features/types';

/** Renders a direct image URL, constrained to a max height with object-contain. */
export default function ImageEmbed({ block }: { block: ImageBlock }) {
  return (
    <div className="w-72 bg-[#f5f5f5] dark:bg-[#242424]">
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted URLs */}
      <img
        src={block.url}
        alt={block.alt ?? ''}
        className="w-full h-auto block max-h-[360px] object-contain"
        draggable={false}
      />
    </div>
  );
}
