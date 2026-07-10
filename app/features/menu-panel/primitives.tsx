'use client';
import { memo } from 'react';

/** Footer button for menu-panel modals (default / primary / danger variants). */
function ModalButtonImpl({ label, onClick, primary, danger, disabled }: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  const bg = danger
    ? 'var(--danger)'
    : primary
    ? 'var(--color-surface-action)'
    : 'var(--color-surface-sunken)';
  const color = danger || primary ? 'var(--color-text-on-action)' : 'var(--color-text-primary)';

  return (
    <button
      type="button"
      className="px-4 text-[13px] font-medium cursor-pointer"
      style={{
        height: 32,
        borderRadius: 'var(--radius-lg)',
        background: bg,
        color,
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
export const ModalButton = memo(ModalButtonImpl);

/** Generic full-width menu row with icon, label, and optional shortcut badge. */
function RowImpl({ icon, label, shortcut, onClick }: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
      style={{ height: 'var(--row-height)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      onClick={onClick}
    >
      <span style={{ color: 'var(--color-text-muted)', flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span className="flex-1 text-left text-[13px]" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      {shortcut && (
        <span className="text-[10px] font-mono rounded px-1.5 py-0.5 leading-none flex-shrink-0" style={{ background: 'var(--color-bg-active)', color: 'var(--color-text-muted)' }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}
export const Row = memo(RowImpl);

/** Small on/off switch for boolean settings. */
function ToggleImpl({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className="relative flex-shrink-0 cursor-pointer transition-colors duration-150"
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        background: enabled ? 'var(--color-surface-action)' : 'var(--color-surface-sunken)',
        border: 'none',
      }}
    >
      <span
        className="absolute rounded-full transition-transform duration-150"
        style={{
          top: 3,
          left: 3,
          width: 16,
          height: 16,
          background: 'var(--color-text-on-action)',
          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
          transform: enabled ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}
export const Toggle = memo(ToggleImpl);
