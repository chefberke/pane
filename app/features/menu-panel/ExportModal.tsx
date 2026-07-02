'use client';
import { memo, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { ModalButton } from './primitives';
import { useWorkspaceTransfer } from './hooks/useWorkspaceTransfer';
import type { ExportSource } from './hooks/useWorkspaceTransfer';
import { EXPORT_MODAL_WIDTH, Z_MODAL, COPY_FEEDBACK_MS } from './constants';

interface Props {
  title: string;
  rows: ExportSource[];
  filename: string;
  onClose: () => void;
}

/** Portaled export dialog: download the selected canvas(es) as a `.pane.json` file or copy the JSON. */
function ExportModal({ title, rows, filename, onClose }: Props) {
  const { exportWorkspaces } = useWorkspaceTransfer();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDownload = () => { void exportWorkspaces(rows, 'download', filename); onClose(); };
  const handleCopy = async () => {
    const ok = await exportWorkspaces(rows, 'copy', filename);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), COPY_FEEDBACK_MS); }
  };

  const count = rows.length;
  const subtitle = count === 1
    ? <>Export <strong style={{ color: 'var(--color-text-primary)' }}>{rows[0]?.name}</strong> as a JSON file you can back up or import later.</>
    : <>Export all <strong style={{ color: 'var(--color-text-primary)' }}>{count}</strong> canvases into a single JSON file.</>;

  return (
    <div
      data-menu-portal
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_MODAL, background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col gap-4 p-5"
        style={{
          width: EXPORT_MODAL_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 32, height: 32, borderRadius: 'var(--radius-lg)', background: 'var(--color-surface-sunken)', color: 'var(--color-text-secondary)' }}
          >
            <Download size={15} />
          </span>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
            <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <ModalButton label={copied ? 'Copied!' : 'Copy JSON'} onClick={handleCopy} />
          <ModalButton label="Download .json" primary onClick={handleDownload} />
        </div>
      </div>
    </div>
  );
}

export default memo(ExportModal);
