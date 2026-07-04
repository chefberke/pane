'use client';
import { memo, useEffect, useRef, useState } from 'react';

interface Props {
  title: string;
  description: string;
  initialValue: string;
  confirmLabel: string;
  existingNames: string[];
  maxLength: number;
  onSubmit: (name: string) => void;
  onClose: () => void;
}

/** Shared portaled modal for naming a canvas (create + rename). Blocks names that exactly match an existing one. */
function NameModal({ title, description, initialValue, confirmLabel, existingNames, maxLength, onSubmit, onClose }: Props) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = value.trim();
  const duplicate = trimmed.length > 0 && existingNames.some(n => n.trim() === trimmed);

  const handleSubmit = () => {
    if (trimmed && !duplicate) onSubmit(trimmed);
  };

  return (
    <div
      data-menu-portal
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 600, background: 'var(--color-overlay-modal)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col gap-4 p-5"
        style={{
          width: 340,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-default)',
          borderRadius: 'var(--radius-4xl)',
          boxShadow: 'var(--shadow-modal-lg)',
        }}
      >
        <div>
          <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>{title}</p>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{description}</p>
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
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
          placeholder="Canvas name"
          maxLength={maxLength}
        />
        <div className="flex items-center justify-between gap-2" style={{ minHeight: 14 }}>
          <span className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-danger)' }}>
            {duplicate ? 'A canvas with this name already exists.' : ''}
          </span>
          <span
            className="text-[11px] tabular-nums flex-shrink-0"
            style={{ color: value.length >= maxLength ? 'var(--color-text-danger)' : 'var(--color-text-muted)' }}
          >
            {value.length}/{maxLength}
          </span>
        </div>
        <div className="flex justify-end gap-2">
          <NameModalButton label="Cancel" onClick={onClose} />
          <NameModalButton label={confirmLabel} primary onClick={handleSubmit} disabled={!trimmed || duplicate} />
        </div>
      </div>
    </div>
  );
}

/** Footer button for NameModal (default / primary variants). Self-contained so ui/ owns no cross-feature deps. */
function NameModalButton({ label, onClick, primary, disabled }: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="px-4 text-[13px] font-medium"
      style={{
        height: 32,
        borderRadius: 'var(--radius-lg)',
        background: primary ? 'var(--color-surface-action)' : 'var(--color-surface-sunken)',
        color: primary ? 'var(--color-text-on-action)' : 'var(--color-text-primary)',
        border: 'none',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onClick}
    >
      {label}
    </button>
  );
}

export default memo(NameModal);
