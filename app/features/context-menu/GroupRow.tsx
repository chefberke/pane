'use client';
import type { FrameColor } from '@/app/features/types';
import { MENU_FRAME_SWATCHES, MENU_ROW_HEIGHT } from './constants';

interface Props {
  label: string;
  color: FrameColor;
  onClick: () => void;
}

/** A menu row representing one existing frame — colored dot + title, used by a block's "Add to group" list. */
export default function GroupRow({ label, color, onClick }: Props) {
  const swatch = MENU_FRAME_SWATCHES.find(s => s.color === color)?.swatch ?? MENU_FRAME_SWATCHES[0].swatch;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-2.5 text-left text-[13px] transition-colors"
      style={{ height: MENU_ROW_HEIGHT, color: 'var(--color-text-primary)', cursor: 'pointer' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: swatch }} />
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}
