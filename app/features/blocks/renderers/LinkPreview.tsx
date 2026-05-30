'use client';
import { memo, useState } from 'react';
import type { LinkBlock } from '@/app/features/types';

function parseDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

/** Renders a rich link preview card with image, title, description, and favicon. */
function LinkPreview({ block }: { block: LinkBlock }) {
  const { url, title, description, image, favicon, loading } = block;
  const [imgFailed, setImgFailed] = useState(false);
  const domain = parseDomain(url);

  if (loading) {
    return (
      <div
        className="w-72 flex flex-col gap-2 p-3 animate-pulse"
        style={{ background: 'var(--color-surface-embed)' }}
      >
        <div className="h-32 rounded-lg" style={{ background: 'var(--color-surface-sunken)' }} />
        <div className="h-3 rounded w-3/4" style={{ background: 'var(--color-surface-sunken)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'var(--color-surface-sunken)' }} />
        <div className="h-3 rounded w-1/3" style={{ background: 'var(--color-surface-sunken)' }} />
      </div>
    );
  }

  const showImage = image && !imgFailed;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-72 flex flex-col no-underline group/link"
      style={{ background: 'var(--color-surface-embed)' }}
      onClick={e => e.stopPropagation()}
    >
      {showImage && (
        <div
          className="h-36 overflow-hidden flex-shrink-0"
          style={{ background: 'var(--color-surface-sunken)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted URLs */}
          <img
            src={image}
            alt={title ?? ''}
            className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-300"
            onError={() => setImgFailed(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1.5">
        {title && (
          <p
            className="text-sm font-semibold line-clamp-2 leading-snug"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {title}
          </p>
        )}
        {description && (
          <p
            className="text-xs line-clamp-2 leading-relaxed"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {description}
          </p>
        )}
        <div className="flex items-center gap-1.5 pt-0.5">
          {favicon && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted URLs
            <img
              src={favicon}
              alt=""
              className="w-3.5 h-3.5 flex-shrink-0 rounded-sm"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              referrerPolicy="no-referrer"
              loading="lazy"
            />
          )}
          <span
            className="text-xs truncate"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {domain}
          </span>
        </div>
      </div>
    </a>
  );
}

export default memo(LinkPreview);
