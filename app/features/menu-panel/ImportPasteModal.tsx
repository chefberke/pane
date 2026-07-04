'use client';
import { memo, useEffect, useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import { ModalButton } from './primitives';
import { IMPORT_MODAL_WIDTH, Z_MODAL } from './constants';
import { parseImport } from '../workspace/utils';
import type { ImportPreview } from '../workspace/types';

interface Props {
  onSubmit: (preview: ImportPreview) => void;
  onClose: () => void;
}

/** Portaled paste dialog: paste exported JSON, validate inline, then hand a preview up. */
function ImportPasteModal({ onSubmit, onClose }: Props) {
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const setInput = (value: string) => { setText(value); if (errors.length) setErrors([]); };

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) setInput(clip);
    } catch {
      // Clipboard read blocked (permissions/insecure context) — user can still ⌘V into the textarea.
    }
  };

  // Parse up front: only advance to the preview when there's something importable; otherwise
  // surface the error right here instead of bouncing the user to an empty preview modal.
  const handleContinue = () => {
    const preview = parseImport(text);
    if (preview.workspaces.length === 0) {
      setErrors(preview.errors.length ? preview.errors : ['Unrecognized data — expected a pane workspace export.']);
      return;
    }
    onSubmit(preview);
  };

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
            <ClipboardPaste size={15} />
          </span>
          <div>
            <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Paste JSON</p>
            <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Paste an exported canvas below, then continue to preview.
            </p>
          </div>
        </div>

        <textarea
          value={text}
          onChange={e => setInput(e.target.value)}
          spellCheck={false}
          placeholder='{ "format": "pane-workspace", … }'
          autoFocus
          className="w-full resize-none text-[12px] font-mono leading-relaxed p-3 outline-none"
          style={{
            height: 132,
            background: 'var(--color-surface-sunken)',
            border: `1px solid ${errors.length ? 'var(--color-border-danger, var(--color-text-danger))' : 'var(--color-border-default)'}`,
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-primary)',
          }}
        />

        {errors.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {errors.map((err, i) => (
              <span key={i} className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-danger)' }}>{err}</span>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <ModalButton label="Paste from clipboard" onClick={handlePaste} />
          <ModalButton label="Continue" primary onClick={handleContinue} disabled={text.trim().length === 0} />
        </div>
      </div>
    </div>
  );
}

export default memo(ImportPasteModal);
