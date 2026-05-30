'use client';
import type { FrameColor } from '@/app/features/types';
import { MENU_FRAME_SWATCHES } from './constants';

interface Props {
  current: FrameColor;
  onSelect: (color: FrameColor) => void;
}

/** A menu row showing the six frame color swatches; ringed swatch is the current color. */
export default function ColorSwatchRow({ current, onSelect }: Props) {
  return (
    <div className="flex items-center justify-between px-2.5 py-1.5">
      {MENU_FRAME_SWATCHES.map(({ color, swatch }) => (
        <button
          key={color}
          type="button"
          aria-label={color}
          onClick={() => onSelect(color)}
          onPointerDown={e => e.stopPropagation()}
          className="w-4 h-4 rounded-full transition-transform hover:scale-110"
          style={{
            background: swatch,
            outline: current === color ? '2px solid var(--color-text-primary)' : 'none',
            outlineOffset: 1,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  );
}
