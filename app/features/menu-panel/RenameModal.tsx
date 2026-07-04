'use client';
import { memo, useEffect, useRef, useState } from 'react';
import { ModalButton } from './primitives';
import { RENAME_MODAL_WIDTH, Z_MODAL } from './constants';
import type { WorkspaceItem } from './types';

interface Props {
  workspace: WorkspaceItem;
  existingNames: string[];
  onSave: (name: string) => void;
  onClose: () => void;
}

/** Portaled modal to rename a canvas. Blocks names that exactly match another canvas. */
function RenameModal({ workspace, existingNames, onSave, onClose }: Props) {
  const [value, setValue] = useState(workspace.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = value.trim();
  const duplicate = trimmed.length > 0 && existingNames.some(n => n.trim() === trimmed);

  const handleSave = () => {
    if (trimmed && !duplicate) onSave(trimmed);
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
          width: RENAME_MODAL_WIDTH,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>Rename canvas</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Enter a new name for this canvas.</p>
        </div>
        <input
          ref={inputRef}
          className="w-full px-3 text-[13px] outline-none"
          style={{
            height: 36,
            background: 'var(--color-surface-input)',
            border: `1px solid ${duplicate ? 'var(--color-border-danger, var(--color-text-danger))' : 'var(--color-border-default)'}`,
            borderRadius: 'var(--radius-lg)',
            color: 'var(--color-text-primary)',
          }}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
          placeholder="Canvas name"
        />
        {duplicate && (
          <span className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-danger)' }}>
            A canvas with this name already exists.
          </span>
        )}
        <div className="flex justify-end gap-2">
          <ModalButton label="Cancel" onClick={onClose} />
          <ModalButton label="Save" primary onClick={handleSave} disabled={!trimmed || duplicate} />
        </div>
      </div>
    </div>
  );
}

export default memo(RenameModal);
