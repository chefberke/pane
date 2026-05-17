'use client';
import { forwardRef } from 'react';

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'style'> {
  label: string;
}

/** Single-line text input styled to match the design-system token set. */
const AuthInput = forwardRef<HTMLInputElement, Props>(function AuthInput({ label, id, ...rest }, ref) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span
        className="text-[10px] font-medium uppercase tracking-widest"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {label}
      </span>
      <input
        ref={ref}
        id={id}
        {...rest}
        className="w-full px-3 outline-none"
        style={{
          height: 'var(--input-height)',
          background: 'var(--color-surface-input)',
          border: '1px solid var(--color-border-strong)',
          borderRadius: 'var(--radius-lg)',
          color: 'var(--color-text-primary)',
          fontSize: 'var(--text-xs)',
        }}
      />
    </label>
  );
});

export default AuthInput;
