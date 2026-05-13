'use client';
import { useRef, useState } from 'react';
import { Minus, Plus, Undo2, Redo2 } from 'lucide-react';

interface Props {
  scale: number;
  isDark: boolean;
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
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1e1e1e]/95 text-gray-800 dark:text-[#eee] text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg shadow-black/10 dark:shadow-black/50 border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm">
            <span className="font-medium">{label}</span>
            {shortcut && (
              <kbd className="text-[9px] font-mono bg-black/[0.07] dark:bg-white/15 text-gray-600 dark:text-[#aaa] rounded px-1.5 py-0.5 leading-none tracking-wide">
                {shortcut}
              </kbd>
            )}
          </div>
          <div className="w-2 h-2 bg-white/95 dark:bg-[#1e1e1e]/95 border-r border-b border-black/[0.06] dark:border-white/[0.06] rotate-45 -mt-1 rounded-[1px]" />
        </div>
      )}
    </div>
  );
}

/** Floating zoom + undo/redo widget pinned to the bottom-left. */
export default function ZoomControls({ scale, isDark, onZoomIn, onZoomOut, onReset, canUndo, canRedo, onUndo, onRedo }: Props) {
  const bg = isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)';
  const bgHover = isDark ? 'rgba(50,50,50,0.98)' : 'rgba(245,245,245,0.98)';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const boxShadow = isDark ? '0 10px 15px -3px rgba(0,0,0,0.5),0 4px 6px -4px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)';
  const boxShadowHover = isDark ? '0 10px 15px -3px rgba(0,0,0,0.6),0 4px 6px -4px rgba(0,0,0,0.6)' : '0 10px 15px -3px rgba(0,0,0,0.15),0 4px 6px -4px rgba(0,0,0,0.15)';
  const color = isDark ? '#888' : '#999';
  const colorHover = isDark ? '#ccc' : '#555';
  const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const btnStyle: React.CSSProperties = { color, background: 'transparent' };

  function onEnter(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.color = colorHover;
    e.currentTarget.style.background = bgHover;
  }
  function onLeave(e: React.MouseEvent<HTMLButtonElement>) {
    e.currentTarget.style.color = color;
    e.currentTarget.style.background = 'transparent';
  }

  return (
    <div className="absolute bottom-6 left-6 flex items-center gap-2 pointer-events-auto">
      {/* Zoom controls */}
      <div
        className="flex items-center rounded-2xl backdrop-blur-md border"
        style={{ background: bg, borderColor, boxShadow }}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = boxShadowHover; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = boxShadow; }}
      >
        <Tip label="Zoom out" shortcut="−">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-l-2xl transition-colors duration-100"
            style={btnStyle}
            onClick={onZoomOut}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            <Minus size={12} strokeWidth={1.6} />
          </button>
        </Tip>

        <div style={{ width: 1, height: 16, background: divider, flexShrink: 0 }} />

        <Tip label="Reset zoom" shortcut="0">
          <button
            className="h-9 px-2 flex items-center justify-center transition-colors duration-100 tabular-nums"
            style={{ ...btnStyle, fontSize: 11, fontWeight: 600, minWidth: 42 }}
            onClick={onReset}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
          >
            {Math.round(scale * 100)}%
          </button>
        </Tip>

        <div style={{ width: 1, height: 16, background: divider, flexShrink: 0 }} />

        <Tip label="Zoom in" shortcut="+">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-r-2xl transition-colors duration-100"
            style={btnStyle}
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
        style={{ background: bg, borderColor, boxShadow }}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = boxShadowHover; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = boxShadow; }}
      >
        <Tip label="Undo" shortcut="⌘Z">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-l-2xl transition-colors duration-100 disabled:opacity-30"
            style={canUndo ? btnStyle : { ...btnStyle, pointerEvents: 'none' }}
            onClick={onUndo}
            onMouseEnter={canUndo ? onEnter : undefined}
            onMouseLeave={canUndo ? onLeave : undefined}
            disabled={!canUndo}
          >
            <Undo2 size={12} strokeWidth={1.6} />
          </button>
        </Tip>

        <div style={{ width: 1, height: 16, background: divider, flexShrink: 0 }} />

        <Tip label="Redo" shortcut="⌘⇧Z">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-r-2xl transition-colors duration-100 disabled:opacity-30"
            style={canRedo ? btnStyle : { ...btnStyle, pointerEvents: 'none' }}
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
