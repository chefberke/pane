'use client';

interface Props extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'style'> {
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

/** Auth-flow button. Primary = dark action surface; secondary = raised + bordered. */
export default function AuthButton({
  variant = 'primary',
  icon,
  children,
  disabled,
  ...rest
}: Props) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        height: 'var(--input-height)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        background: isPrimary ? 'var(--color-surface-action)' : 'var(--color-surface-raised)',
        color: isPrimary ? 'var(--color-text-on-action)' : 'var(--color-text-primary)',
        border: isPrimary ? '1px solid transparent' : '1px solid var(--color-border-default)',
        boxShadow: isPrimary ? 'none' : 'var(--shadow-float-sm)',
        backdropFilter: isPrimary ? undefined : 'blur(12px)',
        transition: 'background var(--duration-fast), box-shadow var(--duration-base)',
      }}
      onMouseEnter={e => {
        if (disabled) return;
        const el = e.currentTarget;
        if (!isPrimary) el.style.boxShadow = 'var(--shadow-float-hover)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        if (!isPrimary) el.style.boxShadow = 'var(--shadow-float-sm)';
      }}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
