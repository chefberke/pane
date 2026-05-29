'use client';
import { useEffect, useMemo } from 'react';
import { ExternalLink, FileText, X } from 'lucide-react';
import { assertHttpsUrl } from '@/app/features/canvas/utils';
import PdfUnavailable from './PdfUnavailable';

/** Props for the full-screen PDF viewer. */
interface Props {
  url: string;
  title?: string;
  onClose: () => void;
}

const btnBase: React.CSSProperties = { color: 'var(--color-text-tertiary)', background: 'transparent' };
function onEnter(e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
  e.currentTarget.style.color = 'var(--color-text-secondary)';
  e.currentTarget.style.background = 'var(--color-surface-raised-hover)';
}
function onLeave(e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) {
  e.currentTarget.style.color = 'var(--color-text-tertiary)';
  e.currentTarget.style.background = 'transparent';
}

/** Full-screen lightbox that previews a PDF inline instead of opening a new tab. */
export default function PdfLightbox({ url, title, onClose }: Props) {
  const safeSrc = useMemo(() => assertHttpsUrl(url), [url]);
  const filename = title || url.split('/').pop()?.split('?')[0] || 'document.pdf';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!safeSrc) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6"
      style={{ background: 'var(--color-overlay-modal)', backdropFilter: 'blur(6px)' }}
      onPointerDown={onClose}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden border w-[min(900px,92vw)] h-[min(90vh,1100px)]"
        style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)', boxShadow: 'var(--shadow-float)' }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--color-text-primary)' }} title={filename}>
            {filename}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-100"
            style={btnBase}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
          <button
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-colors duration-100 cursor-pointer"
            style={btnBase}
            onClick={onClose}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
            aria-label="Close"
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>

        {/* Content — <object> renders the browser's native PDF viewer reliably; a
            sandboxed <iframe> is blocked from running the PDF plugin and shows a
            blank "preview blocked" page. The children render as a fallback. */}
        <object data={safeSrc} type="application/pdf" className="flex-1 w-full block" title={filename}>
          <PdfUnavailable filename={filename} url={url} />
        </object>
      </div>
    </div>
  );
}
