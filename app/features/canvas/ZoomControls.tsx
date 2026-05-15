'use client';
import { useRef, useState } from 'react';
import { Minus, Plus, Undo2, Redo2 } from 'lucide-react';

interface Props {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

function Tip({ label, shortcut, children }: { label: string; shortcut?: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = () => { timer.current = setTimeout(() => setVisible(true), 600); };
  const hide = () => { if (timer.current) clearTimeout(timer.current); setVisible(false); };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 pointer-events-none z-50 flex flex-col items-center">
          <div
            className="flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap backdrop-blur-sm"
            style={{
              background: 'var(--color-surface-raised)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <span className="font-medium">{label}</span>
            {shortcut && (
              <kbd
                className="text-[9px] font-mono rounded px-1.5 py-0.5 leading-none tracking-wide"
                style={{ background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)' }}
              >
                {shortcut}
              </kbd>
            )}
          </div>
          <div
            className="w-2 h-2 rotate-45 -mt-1 rounded-[1px] border-r border-b"
            style={{
              background: 'var(--color-surface-raised)',
              borderColor: 'var(--color-border-default)',
            }}
          />
        </div>
      )}
    </div>
  );
}

const btnBase: React.CSSProperties = {
  color: 'var(--color-text-tertiary)',
  background: 'transparent',
};

function onEnter(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--color-text-secondary)';
  e.currentTarget.style.background = 'var(--color-surface-raised-hover)';
}
function onLeave(e: React.MouseEvent<HTMLButtonElement>) {
  e.currentTarget.style.color = 'var(--color-text-tertiary)';
  e.currentTarget.style.background = 'transparent';
}

const groupStyle: React.CSSProperties = {
  background: 'var(--color-surface-raised)',
  borderColor: 'var(--color-border-default)',
  boxShadow: 'var(--shadow-float)',
};

/** Floating zoom + undo/redo widget pinned to the bottom-left. */
export default function ZoomControls({ scale, onZoomIn, onZoomOut, onReset, canUndo, canRedo, onUndo, onRedo }: Props) {
  return (
    <div className="absolute bottom-6 left-6 flex items-center gap-2 pointer-events-auto">
      {/* Zoom controls */}
      <div
        className="flex items-center rounded-2xl backdrop-blur-md border"
        style={groupStyle}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-float-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-float)'; }}
      >
        <Tip label="Zoom out" shortcut="−">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-l-2xl transition-colors duration-100 cursor-pointer"
            style={btnBase}
            onClick={onZoomOut}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <Minus size={12} strokeWidth={1.6} />
          </button>
        </Tip>

        <div style={{ width: 1, height: 16, background: 'var(--color-border-default)', flexShrink: 0 }} />

        <Tip label="Reset zoom" shortcut="0">
          <button
            className="h-9 px-2 flex items-center justify-center transition-colors duration-100 tabular-nums cursor-pointer"
            style={{ ...btnBase, fontSize: 11, fontWeight: 600, minWidth: 42 }}
            onClick={onReset}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {Math.round(scale * 100)}%
          </button>
        </Tip>

        <div style={{ width: 1, height: 16, background: 'var(--color-border-default)', flexShrink: 0 }} />

        <Tip label="Zoom in" shortcut="+">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-r-2xl transition-colors duration-100 cursor-pointer"
            style={btnBase}
            onClick={onZoomIn}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <Plus size={12} strokeWidth={1.6} />
          </button>
        </Tip>
      </div>

      {/* Undo / Redo */}
      <div
        className="flex items-center rounded-2xl backdrop-blur-md border"
        style={groupStyle}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-float-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-float)'; }}
      >
        <Tip label="Undo" shortcut="⌘Z">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-l-2xl transition-colors duration-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"
            style={canUndo ? btnBase : { ...btnBase, pointerEvents: 'none' }}
            onClick={onUndo}
            onMouseEnter={canUndo ? onEnter : undefined}
            onMouseLeave={canUndo ? onLeave : undefined}
            disabled={!canUndo}
          >
            <Undo2 size={12} strokeWidth={1.6} />
          </button>
        </Tip>

        <div style={{ width: 1, height: 16, background: 'var(--color-border-default)', flexShrink: 0 }} />

        <Tip label="Redo" shortcut="⌘⇧Z">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-r-2xl transition-colors duration-100 disabled:opacity-30 cursor-pointer disabled:cursor-default"
            style={canRedo ? btnBase : { ...btnBase, pointerEvents: 'none' }}
            onClick={onRedo}
            onMouseEnter={canRedo ? onEnter : undefined}
            onMouseLeave={canRedo ? onLeave : undefined}
            disabled={!canRedo}
          >
            <Redo2 size={12} strokeWidth={1.6} />
          </button>
        </Tip>
      </div>
    </div>
  );
}
