'use client';
import { memo } from 'react';
import type { CSSProperties } from 'react';
import { Trash2 } from 'lucide-react';
import type { ConnectorStyle } from '@/app/features/types';
import { STYLE_OPTIONS, CONNECTOR_SWATCHES, LINE_DASH, STROKE_COLOR } from './constants';

interface Props {
  /** Viewport-relative X/Y of the connector's midpoint; the bar floats centred above it. */
  x: number;
  y: number;
  style: ConnectorStyle;
  color?: string;
  onStyle: (style: ConnectorStyle) => void;
  onColor: (color: string) => void;
  onDelete: () => void;
}

const CONTAINER_STYLE: CSSProperties = {
  transform: 'translate(-50%, -100%) translateY(-14px)',
  background: 'var(--color-surface-raised)',
  border: '1px solid var(--color-border-default)',
  boxShadow: 'var(--shadow-float)',
};
const SEP_STYLE: CSSProperties = { background: 'var(--color-border-default)' };

/** A small inline-SVG line preview for a connector style, inheriting the button's text colour. */
function StylePreview({ dash }: { dash?: string }) {
  return (
    <svg width={22} height={12} viewBox="0 0 22 12" aria-hidden>
      <line x1={2} y1={6} x2={20} y2={6} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  );
}

/** Floating toolbar shown above a selected connector — switches its line style, colour, or deletes it. */
function ConnectorToolbar({ x, y, style, color, onStyle, onColor, onDelete }: Props) {
  const current = color ?? STROKE_COLOR;
  return (
    <div
      className="absolute z-50 flex items-center gap-0.5 backdrop-blur-md rounded-2xl px-1.5 py-1.5"
      style={{ left: x, top: y, ...CONTAINER_STYLE }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
    >
      {STYLE_OPTIONS.map(opt => {
        const active = style === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.label}
            aria-label={opt.label}
            aria-pressed={active}
            onClick={() => onStyle(opt.value)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
            style={active
              ? { background: 'var(--color-text-primary)', color: 'var(--color-canvas)' }
              : { color: 'var(--color-text-tertiary)' }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--color-text-tertiary)'; } }}
          >
            <StylePreview dash={LINE_DASH[opt.value]} />
          </button>
        );
      })}

      <div className="w-px h-4 mx-0.5 flex-shrink-0" style={SEP_STYLE} />

      <div className="flex items-center gap-1 px-0.5">
        {CONNECTOR_SWATCHES.map(({ value, swatch }) => (
          <button
            key={value}
            type="button"
            aria-label={value}
            onClick={() => onColor(value)}
            className="w-4 h-4 rounded-full transition-transform hover:scale-110 cursor-pointer"
            style={{
              background: swatch,
              outline: current === value ? '2px solid var(--color-text-primary)' : 'none',
              outlineOffset: 1,
            }}
          />
        ))}
      </div>

      <div className="w-px h-4 mx-0.5 flex-shrink-0" style={SEP_STYLE} />

      <button
        type="button"
        title="Delete connector"
        aria-label="Delete connector"
        onClick={onDelete}
        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
        style={{ color: 'var(--color-text-tertiary)' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-hover)'; e.currentTarget.style.color = 'var(--color-text-danger)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--color-text-tertiary)'; }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default memo(ConnectorToolbar);
