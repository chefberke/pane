'use client';
import { ExternalLink, FileText } from 'lucide-react';

/** Props for the PDF preview fallback. */
interface Props {
  filename: string;
  /** When set, renders a blue "Open PDF" link (used in the lightbox, not the canvas block). */
  url?: string;
}

/** Fallback shown when a PDF can't be previewed inline — used by both the block and the lightbox. */
export default function PdfUnavailable({ filename, url }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 h-full w-full text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'var(--color-surface-embed)' }}
      >
        <FileText size={24} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <p
        className="text-sm font-medium truncate max-w-[80%]"
        style={{ color: 'var(--color-text-primary)' }}
        title={filename}
      >
        {filename}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        This PDF can’t be previewed here.
      </p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-500 hover:text-blue-400 flex items-center gap-1"
        >
          Open PDF <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}
