'use client';
import { memo, useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { ModalButton } from './primitives';
import { DELETE_MODAL_WIDTH, Z_MODAL, COPY_FEEDBACK_MS, DELETE_FOCUS_DELAY_MS } from './constants';
import type { WorkspaceItem } from './types';

interface Props {
  workspace: WorkspaceItem;
  onConfirm: () => void;
  onClose: () => void;
}

/** Portaled destructive-delete modal that requires typing the canvas name to confirm. */
function DeleteModal({ workspace, onConfirm, onClose }: Props) {
  const [value, setValue] = useState('');
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirmed = value === workspace.name;

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), DELETE_FOCUS_DELAY_MS); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(workspace.name).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    });
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
          width: DELETE_MODAL_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Delete canvas?</p>
          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            This will permanently delete <strong style={{ color: 'var(--color-text-primary)' }}>{workspace.name}</strong> and all its content. This action cannot be undone.
          </p>
        </div>

        {/* Name confirmation */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Type the canvas name to confirm
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold font-mono truncate" style={{ color: 'var(--color-text-primary)' }}>
              {workspace.name}
            </span>
            <button
              type="button"
              className="flex items-center justify-center flex-shrink-0 cursor-pointer"
              style={{
                width: 20, height: 20, borderRadius: 'var(--radius-md)',
                background: 'transparent', border: 'none',
                color: copied ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
              }}
              onClick={handleCopy}
              title="Copy name"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <input
            ref={inputRef}
            className="w-full px-3 text-[13px] outline-none"
            style={{
              height: 36,
              background: 'var(--color-surface-input)',
              border: `1px solid ${value && !confirmed ? 'var(--danger)' : 'var(--color-border-default)'}`,
              borderRadius: 'var(--radius-lg)',
              color: 'var(--color-text-primary)',
            }}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && confirmed) onConfirm(); }}
            placeholder={workspace.name}
            autoComplete="off"
          />
        </div>

        <div className="flex justify-end gap-2">
          <ModalButton label="Cancel" onClick={onClose} />
          <ModalButton label="Delete" danger onClick={onConfirm} disabled={!confirmed} />
        </div>
      </div>
    </div>
  );
}

export default memo(DeleteModal);
