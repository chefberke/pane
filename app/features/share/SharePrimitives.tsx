'use client';
import { memo } from 'react';
import { motion } from 'framer-motion';
import { ROLE_LABELS } from './constants';
import type { ShareRole } from './types';

/** Padded section wrapper with an optional muted label. */
function SectionImpl({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 flex flex-col gap-2">
      {label && (
        <p className="text-[11px] font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
      )}
      {children}
    </div>
  );
}
export const Section = memo(SectionImpl);

/** Circular initials avatar with an optional online indicator dot. */
function AvatarImpl({ label, isOnline = false, color }: { label: string; isOnline?: boolean; color?: string }) {
  return (
    <div className="relative flex-shrink-0">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{
          background: color ?? 'var(--color-bg-active)',
          color: color ? '#fff' : 'var(--color-text-secondary)',
        }}
      >
        {label}
      </div>
      {isOnline && (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          style={{ background: '#22c55e', borderColor: 'var(--color-surface)' }}
        />
      )}
    </div>
  );
}
export const Avatar = memo(AvatarImpl);

/** Static, non-interactive role label (used for owners and non-owner viewers). */
function RoleBadgeImpl({ role }: { role: string }) {
  return (
    <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
export const RoleBadge = memo(RoleBadgeImpl);

/** Segmented viewer/editor toggle with an animated selection pill. */
function RoleToggleImpl({ value, onChange }: { value: ShareRole; onChange: (r: ShareRole) => void }) {
  return (
    <div
      className="flex items-center rounded-[10px] p-0.5 flex-shrink-0 relative"
      style={{ background: 'var(--color-bg-active)', height: 36 }}
    >
      {(['viewer', 'editor'] as ShareRole[]).map(r => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className="relative px-2.5 h-full rounded-[8px] text-[11px] font-medium cursor-pointer z-10"
          style={{
            background: 'transparent',
            color:      value === r ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            border:     'none',
          }}
        >
          {value === r && (
            <motion.div
              layoutId="role-toggle-pill"
              className="absolute inset-0 rounded-[8px]"
              style={{ background: 'var(--color-surface-control-active, var(--color-surface))' }}
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{r === 'viewer' ? 'View' : 'Edit'}</span>
        </button>
      ))}
    </div>
  );
}
export const RoleToggle = memo(RoleToggleImpl);

/** Square ghost icon button with hover state and an optional danger color. */
function IconBtnImpl({
  children, onClick, title, disabled = false, danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title?: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
      style={{
        color:      danger ? 'var(--color-text-danger, #ef4444)' : 'var(--color-text-tertiary)',
        opacity:    disabled ? 0.4 : 1,
        cursor:     disabled ? 'default' : 'pointer',
        background: 'transparent',
        border:     'none',
      }}
      onMouseEnter={e => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.background =
          danger ? 'var(--color-bg-danger-hover, rgba(239,68,68,0.08))' : 'var(--color-bg-hover)';
      }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}
export const IconBtn = memo(IconBtnImpl);

/** Single row in a dropdown menu, with active and danger variants. */
function DropdownItemImpl({
  label, active = false, danger = false, onClick,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center px-3 text-[12px] cursor-pointer"
      style={{
        height:     34,
        color:      danger ? 'var(--color-text-danger, #ef4444)' : 'var(--color-text-primary)',
        background: active ? 'var(--color-bg-hover)' : 'transparent',
        fontWeight: active ? 500 : 400,
        border:     'none',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background =
          danger ? 'var(--color-bg-danger-hover, rgba(239,68,68,0.08))' : 'var(--color-bg-hover)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = active ? 'var(--color-bg-hover)' : 'transparent';
      }}
    >
      {label}
    </button>
  );
}
export const DropdownItem = memo(DropdownItemImpl);
