'use client';
import { memo, useEffect, useRef } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { ACTION_MENU_WIDTH, Z_ACTION_DROPDOWN } from './constants';

interface Props {
  pos: { top: number; left: number };
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/** Portaled rename/delete dropdown anchored to a workspace row's 3-dot button. */
function ActionDropdown({ pos, onRename, onDelete, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      data-menu-portal
      className="fixed overflow-hidden"
      style={{
        top: pos.top, left: pos.left,
        zIndex: Z_ACTION_DROPDOWN,
        width: ACTION_MENU_WIDTH,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--shadow-modal)',
      }}
    >
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
        style={{ height: 34, background: 'transparent', border: 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        onClick={onRename}
      >
        <Pencil size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <span className="text-[13px]" style={{ color: 'var(--color-text-primary)' }}>Rename</span>
      </button>
      <button
        type="button"
        className="w-full flex items-center gap-2.5 px-3 cursor-pointer"
        style={{ height: 34, background: 'transparent', border: 'none' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-danger-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        onClick={onDelete}
      >
        <Trash2 size={13} style={{ color: 'var(--color-text-danger)', flexShrink: 0 }} />
        <span className="text-[13px]" style={{ color: 'var(--color-text-danger)' }}>Delete</span>
      </button>
    </div>
  );
}

export default memo(ActionDropdown);
