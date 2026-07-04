'use client';
import { memo, useEffect } from 'react';
import { FileUp } from 'lucide-react';
import { ModalButton } from './primitives';
import { IMPORT_MODAL_WIDTH, Z_MODAL } from './constants';

interface Props {
  onPaste: () => void;
  onUpload: () => void;
  onClose: () => void;
}

/** Portaled import chooser: mirrors ExportModal — pick a source (paste JSON or upload a file). */
function ImportChooserModal({ onPaste, onUpload, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
          width: IMPORT_MODAL_WIDTH,
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
            <FileUp size={15} />
          </span>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Import canvas</p>
            <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Paste exported JSON or upload a .json file to create new canvases.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <ModalButton label="Paste JSON" onClick={onPaste} />
          <ModalButton label="Upload JSON" primary onClick={onUpload} />
        </div>
      </div>
    </div>
  );
}

export default memo(ImportChooserModal);
