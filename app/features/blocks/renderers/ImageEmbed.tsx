'use client';
import { useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import type { ImageBlock } from '@/app/features/types';
import { assertHttpsUrl } from '@/app/features/canvas/utils';

/** Renders a direct image URL, constrained to a max height with object-contain. */
export default function ImageEmbed({ block }: { block: ImageBlock }) {
  const safeSrc = useMemo(() => assertHttpsUrl(block.url), [block.url]);

  if (block.uploading) return (
    <div
      className="w-72 h-48 flex flex-col items-center justify-center gap-2"
      style={{ background: 'var(--color-surface-embed)', color: 'var(--color-text-muted)' }}
    >
      <Loader2 size={20} className="animate-spin" />
      <span className="text-xs truncate max-w-[80%]" title={block.alt}>{block.alt || 'Uploading…'}</span>
    </div>
  );

  if (!safeSrc) return (
    <div
      className="w-72 h-24 flex items-center justify-center text-xs"
      style={{ background: 'var(--color-surface-embed)', color: 'var(--color-text-muted)' }}
    >
      Invalid image URL
    </div>
  );

  return (
    <div className="w-72" style={{ background: 'var(--color-surface-embed)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted URLs */}
      <img
        src={safeSrc}
        alt={block.alt ?? ''}
        className="w-full h-auto block max-h-[360px] object-contain"
        draggable={false}
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
}
