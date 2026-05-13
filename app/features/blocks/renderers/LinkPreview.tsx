'use client';
import { useState } from 'react';
import type { LinkBlock } from '@/app/features/types';

function parseDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

/** Renders a rich link preview card with image, title, description, and favicon. */
export default function LinkPreview({ block }: { block: LinkBlock }) {
  const { url, title, description, image, favicon, loading } = block;
  const [imgFailed, setImgFailed] = useState(false);
  const domain = parseDomain(url);

  if (loading) {
    return (
      <div className="w-72 bg-white dark:bg-[#242424] flex flex-col gap-2 p-3 animate-pulse">
        <div className="h-32 bg-gray-100 dark:bg-[#2e2e2e] rounded-lg" />
        <div className="h-3 bg-gray-100 dark:bg-[#2e2e2e] rounded w-3/4" />
        <div className="h-3 bg-gray-100 dark:bg-[#2e2e2e] rounded w-1/2" />
        <div className="h-3 bg-gray-100 dark:bg-[#2e2e2e] rounded w-1/3" />
      </div>
    );
  }

  const showImage = image && !imgFailed;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-72 flex flex-col bg-white dark:bg-[#242424] no-underline group/link"
      onClick={e => e.stopPropagation()}
    >
      {showImage && (
        <div className="h-36 overflow-hidden bg-gray-50 dark:bg-[#2e2e2e] flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-pasted URLs */}
          <img
            src={image}
            alt={title ?? ''}
            className="w-full h-full object-cover group-hover/link:scale-105 transition-transform duration-300"
            onError={() => setImgFailed(true)}
          />
        </div>
      )}
      <div className="p-3 flex flex-col gap-1.5">
        {title && (
          <p className="text-sm font-semibold text-gray-900 dark:text-[#e8e8e8] line-clamp-2 leading-snug">
            {title}
          </p>
        )}
        {description && (
          <p className="text-xs text-gray-400 dark:text-[#666] line-clamp-2 leading-relaxed">
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
            />
          )}
          <span className="text-xs text-gray-400 dark:text-[#555] truncate">{domain}</span>
        </div>
      </div>
    </a>
  );
}
