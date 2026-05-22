'use client';

interface Props {
  onClick: () => void;
}

/** Floating Share text button — mirrors the ItemsButton style but shows a "Share" label. */
export default function ShareButton({ onClick }: Props) {
  const base: React.CSSProperties = {
    background:  'var(--color-surface-raised)',
    borderColor: 'var(--color-border-default)',
    boxShadow:   'var(--shadow-float)',
    color:       'var(--color-text-tertiary)',
  };

  return (
    <button
      className="h-9 flex items-center justify-center rounded-2xl backdrop-blur-md border transition-all duration-150 hover:scale-105 cursor-pointer px-3.5"
      style={base}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onClick={onClick}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.background  = 'var(--color-surface-raised-hover)';
        el.style.color       = 'var(--color-text-secondary)';
        el.style.boxShadow   = 'var(--shadow-float-hover)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.background  = 'var(--color-surface-raised)';
        el.style.color       = 'var(--color-text-tertiary)';
        el.style.boxShadow   = 'var(--shadow-float)';
      }}
    >
      <span className="text-[12px] font-medium">Share</span>
    </button>
  );
}
