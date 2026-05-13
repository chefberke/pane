'use client';
import { useRef, useState } from 'react';

interface Props {
  isDark: boolean;
  onClick: () => void;
}

/** Floating shortcuts help button pinned to the bottom-right, with a tooltip on hover. */
export default function ShortcutsButton({ isDark, onClick }: Props) {
  const [tipVisible, setTipVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bg = isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)';
  const bgHover = isDark ? 'rgba(50,50,50,0.98)' : 'rgba(245,245,245,0.98)';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const boxShadow = isDark ? '0 10px 15px -3px rgba(0,0,0,0.5),0 4px 6px -4px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)';
  const boxShadowHover = isDark ? '0 10px 15px -3px rgba(0,0,0,0.6),0 4px 6px -4px rgba(0,0,0,0.6)' : '0 10px 15px -3px rgba(0,0,0,0.15),0 4px 6px -4px rgba(0,0,0,0.15)';
  const color = isDark ? '#888' : '#999';
  const colorHover = isDark ? '#ccc' : '#555';

  return (
    <div
      className="absolute bottom-6 right-6 pointer-events-auto"
      onMouseEnter={() => { timer.current = setTimeout(() => setTipVisible(true), 600); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setTipVisible(false); }}
    >
      {tipVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 pointer-events-none z-50 flex flex-col items-center">
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1e1e1e]/95 text-gray-800 dark:text-[#eee] text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg shadow-black/10 dark:shadow-black/50 border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm">
            <span className="font-medium">Shortcuts</span>
            <kbd className="text-[9px] font-mono bg-black/[0.07] dark:bg-white/15 text-gray-600 dark:text-[#aaa] rounded px-1.5 py-0.5 leading-none tracking-wide">
              ?
            </kbd>
          </div>
          <div className="w-2 h-2 bg-white/95 dark:bg-[#1e1e1e]/95 border-r border-b border-black/[0.06] dark:border-white/[0.06] rotate-45 -mt-1 rounded-[1px]" />
        </div>
      )}
      <button
        className="w-9 h-9 flex items-center justify-center rounded-2xl backdrop-blur-md border transition-all duration-150 hover:scale-105"
        style={{ background: bg, borderColor, boxShadow, color, fontSize: 14, fontWeight: 500 }}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onClick={onClick}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.background = bgHover;
          el.style.color = colorHover;
          el.style.boxShadow = boxShadowHover;
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.background = bg;
          el.style.color = color;
          el.style.boxShadow = boxShadow;
        }}
      >
        ?
      </button>
    </div>
  );
}
