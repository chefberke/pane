'use client';
import { Check } from 'lucide-react';
import type { FrameColor } from '@/app/features/types';
import { MENU_ROW_HEIGHT } from './constants';
import { frameSwatch } from './utils';

interface Props {
  label: string;
  color: FrameColor;
  onClick: () => void;
  /** When true, this is the block's current group — shown with a check and non-interactive. */
  current?: boolean;
}

/** A menu row representing one existing frame — colored dot + title, used by a block's "Add to group" list. */
export default function GroupRow({ label, color, onClick, current }: Props) {
  const swatch = frameSwatch(color);
  return (
    <button
      type="button"
      disabled={current}
      onClick={current ? undefined : onClick}
      className="w-full flex items-center gap-2.5 px-2.5 text-left text-[13px] transition-colors"
      style={{ height: MENU_ROW_HEIGHT, color: 'var(--color-text-primary)', cursor: current ? 'default' : 'pointer', opacity: current ? 0.55 : 1 }}
      onMouseEnter={e => { if (!current) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: swatch }} />
      <span className="flex-1 truncate">{label}</span>
      {current && <Check size={14} style={{ flexShrink: 0, opacity: 0.8 }} />}
    </button>
  );
}
