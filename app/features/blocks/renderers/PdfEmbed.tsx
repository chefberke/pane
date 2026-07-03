'use client';
import { memo, useMemo } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import type { PdfBlock } from '@/app/features/types';
import { assertHttpsUrl } from '@/app/features/canvas/utils';
import PdfUnavailable from '../PdfUnavailable';
import EmbedPlaceholder from './EmbedPlaceholder';

/** Renders a PDF via the browser's native viewer, with a styled fallback for blocked embeds and a
 *  lightweight placeholder when far offscreen. */
function PdfEmbed({ block, active }: { block: PdfBlock; active: boolean }) {
  const filename = block.title || block.url.split('/').pop()?.split('?')[0] || 'document.pdf';
  // Only allow https: URLs in the embed to prevent protocol-level attacks.
  const safeSrc = useMemo(() => assertHttpsUrl(block.url), [block.url]);

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
      {!safeSrc ? (
        <PdfUnavailable filename={filename} />
      ) : !active ? (
        // The native PDF viewer is heavy; show a placeholder until the block nears the viewport.
        <div className="relative flex-1">
          <EmbedPlaceholder icon={<FileText size={22} />} label="PDF preview" />
        </div>
      ) : (
        <div className="relative flex-1">
          {/* <object> uses the browser's native PDF viewer; a sandboxed <iframe>
              renders blank. Children show the styled fallback when it can't embed. */}
          <object data={safeSrc} type="application/pdf" className="w-full h-full block" title={filename}>
            <PdfUnavailable filename={filename} />
          </object>
          {/* Blocks the embed from stealing mouse events while dragging */}
          <div className="absolute inset-0" />
        </div>
      )}
    </div>
  );
}

export default memo(PdfEmbed);
