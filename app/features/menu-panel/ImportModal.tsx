'use client';
import { memo, useEffect } from 'react';
import { FileUp, AlertTriangle } from 'lucide-react';
import { ModalButton } from './primitives';
import { IMPORT_MODAL_WIDTH, Z_MODAL } from './constants';
import type { ImportPreview } from '../workspace/types';

interface Props {
  preview: ImportPreview;
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/** Portaled import preview: lists the canvas(es) a file will create as new workspaces, then confirms. */
function ImportModal({ preview, busy, onConfirm, onClose }: Props) {
  const { workspaces, errors } = preview;
  const canImport = workspaces.length > 0 && !busy;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  return (
    <div
      data-menu-portal
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: Z_MODAL, background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div
        className="flex flex-col p-5 gap-4"
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
              {workspaces.length > 0
                ? <>This creates {workspaces.length === 1 ? 'a new canvas' : `${workspaces.length} new canvases`}. Nothing existing is changed.</>
                : 'Nothing in this file could be imported.'}
            </p>
          </div>
        </div>

        {workspaces.length > 0 && (
          <div className="flex flex-col max-h-72 overflow-y-auto -mx-1">
            {workspaces.map((ws, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-1"
                style={{ height: 'var(--row-height)' }}
              >
                <span className="flex-1 min-w-0 text-[13px] font-mono truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {ws.name}
                </span>
                <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {ws.state.blocks.length} {ws.state.blocks.length === 1 ? 'block' : 'blocks'}
                </span>
              </div>
            ))}
          </div>
        )}

        {errors.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--color-text-danger)' }}>
                <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <ModalButton label={busy ? 'Importing…' : 'Import'} primary onClick={onConfirm} disabled={!canImport} />
        </div>
      </div>
    </div>
  );
}

export default memo(ImportModal);
