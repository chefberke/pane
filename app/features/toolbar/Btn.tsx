'use client';
import { memo } from 'react';

interface BtnProps {
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Icon-only square toolbar button with active/inactive visual states. */
function BtnImpl({ onClick, active = false, disabled = false, children, className = '' }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'w-8 h-8 flex items-center justify-center rounded-xl transition-colors duration-[var(--duration-fast)]',
        disabled ? 'opacity-30 cursor-default' : 'cursor-pointer',
        className,
      ].join(' ')}
      style={active ? {
        background: 'var(--color-text-primary)',
        color: 'var(--color-canvas)',
      } : {
        color: 'var(--color-text-tertiary)',
      }}
      onMouseEnter={e => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }
      }}
      onMouseLeave={e => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLButtonElement).style.background = '';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
        }
      }}
    >
      {children}
    </button>
  );
}

/** Icon-only square toolbar button with active/inactive visual states. */
export const Btn = memo(BtnImpl);

const SEP_STYLE = { background: 'var(--color-border-default)' };

/** 1px vertical divider between toolbar sections. */
function SepImpl() {
  return (
    <div
      className="w-px h-4 mx-0.5 flex-shrink-0"
      style={SEP_STYLE}
    />
  );
}

/** 1px vertical divider between toolbar sections. */
export const Sep = memo(SepImpl);
