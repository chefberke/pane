'use client';

interface BtnProps {
  onClick?: () => void;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

/** Icon-only square toolbar button with active/inactive visual states. */
export function Btn({ onClick, active = false, children, className = '' }: BtnProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-8 h-8 flex items-center justify-center rounded-xl transition-colors duration-[var(--duration-fast)] cursor-pointer',
        className,
      ].join(' ')}
      style={active ? {
        background: 'var(--color-text-primary)',
        color: 'var(--color-canvas)',
      } : {
        color: 'var(--color-text-tertiary)',
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = '';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-tertiary)';
        }
      }}
    >
      {children}
    </button>
  );
}

/** 1px vertical divider between toolbar sections. */
export function Sep() {
  return (
    <div
      className="w-px h-4 mx-0.5 flex-shrink-0"
      style={{ background: 'var(--color-border-default)' }}
    />
  );
}
