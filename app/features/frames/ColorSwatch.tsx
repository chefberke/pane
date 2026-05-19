'use client';
import { useEffect, useRef, useState } from 'react';
import type { FrameColor } from '@/app/features/types';
import { FRAME_COLOR_ORDER, FRAME_COLORS } from './constants';

interface Props {
  color: FrameColor;
  onChange: (color: FrameColor) => void;
}

/** Small color swatch button that opens a popover with color presets. */
export default function ColorSwatch({ color, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', onDoc);
    return () => window.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Frame color"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); setOpen(p => !p); }}
        className="w-3.5 h-3.5 rounded-full border transition-transform hover:scale-110"
        style={{
          background: FRAME_COLORS[color].swatch,
          borderColor: 'var(--color-border-strong)',
          cursor: 'default',
        }}
      />
      {open && (
        <div
          className="absolute top-full left-0 mt-1.5 flex items-center gap-1.5 p-1.5 rounded-lg z-50"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-float)',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          {FRAME_COLOR_ORDER.map(c => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={e => { e.stopPropagation(); onChange(c); setOpen(false); }}
              className="w-4 h-4 rounded-full transition-transform hover:scale-110"
              style={{
                background: FRAME_COLORS[c].swatch,
                outline: c === color ? '2px solid var(--color-ring-selection)' : 'none',
                outlineOffset: 1,
                cursor: 'default',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
