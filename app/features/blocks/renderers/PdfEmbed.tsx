'use client';
import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import type { PdfBlock } from '@/app/features/types';

/** Renders a PDF via an iframe with a fallback open-link for blocked embeds. */
export default function PdfEmbed({ block }: { block: PdfBlock }) {
  const [failed, setFailed] = useState(false);
  const filename = block.title || block.url.split('/').pop()?.split('?')[0] || 'document.pdf';

  return (
    <div className="w-[400px] h-[520px] flex flex-col overflow-hidden" style={{ background: 'var(--color-surface-raised)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 shrink-0 border-b"
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        <FileText size={13} style={{ color: 'var(--color-text-muted)' }} />
        <span
          className="text-xs font-medium truncate flex-1"
          style={{ color: 'var(--color-text-primary)' }}
          title={filename}
        >
          {filename}
        </span>
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          title="Open in new tab"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* PDF content */}
      {failed ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <FileText size={32} style={{ color: 'var(--color-text-muted)' }} />
          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            This PDF cannot be previewed here.
          </p>
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            Open PDF <ExternalLink size={11} />
          </a>
        </div>
      ) : (
        <div className="relative flex-1">
          <iframe
            className="w-full h-full border-0 block"
            src={block.url}
            title={filename}
            onError={() => setFailed(true)}
          />
          {/* Blocks iframe from stealing mouse events */}
          <div className="absolute inset-0" />
        </div>
      )}
    </div>
  );
}
