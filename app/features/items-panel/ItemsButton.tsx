'use client';
import { useRef, useState } from 'react';
import { PanelRight } from 'lucide-react';

interface Props {
  isDark: boolean;
  count: number;
  onClick: () => void;
}

/** Floating items panel button pinned to the top-right, with a tooltip on hover. */
export default function ItemsButton({ isDark, count, onClick }: Props) {
  const [tipVisible, setTipVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bg = isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)';
  const bgHover = isDark ? 'rgba(50,50,50,0.98)' : 'rgba(245,245,245,0.98)';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const boxShadow = isDark
    ? '0 10px 15px -3px rgba(0,0,0,0.5),0 4px 6px -4px rgba(0,0,0,0.5)'
    : '0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1)';
  const boxShadowHover = isDark
    ? '0 10px 15px -3px rgba(0,0,0,0.6),0 4px 6px -4px rgba(0,0,0,0.6)'
    : '0 10px 15px -3px rgba(0,0,0,0.15),0 4px 6px -4px rgba(0,0,0,0.15)';
  const color = isDark ? '#888' : '#999';
  const colorHover = isDark ? '#ccc' : '#555';

  return (
    <div
      className="absolute top-6 right-6 pointer-events-auto"
      onMouseEnter={() => { timer.current = setTimeout(() => setTipVisible(true), 600); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setTipVisible(false); }}
    >
      {tipVisible && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 pointer-events-none z-50 flex flex-col items-center">
          <div className="w-2 h-2 bg-white/95 dark:bg-[#1e1e1e]/95 border-l border-t border-black/[0.06] dark:border-white/[0.06] rotate-45 -mb-1 rounded-[1px]" />
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1e1e1e]/95 text-gray-800 dark:text-[#eee] text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg shadow-black/10 dark:shadow-black/50 border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm">
            <span className="font-medium">Items</span>
            {count > 0 && (
              <span className="text-[9px] font-mono bg-black/[0.07] dark:bg-white/15 text-gray-600 dark:text-[#aaa] rounded px-1.5 py-0.5 leading-none">
                {count}
              </span>
            )}
          </div>
        </div>
      )}
      <button
        className="w-9 h-9 flex items-center justify-center rounded-2xl backdrop-blur-md border transition-all duration-150 hover:scale-105 cursor-pointer"
        style={{ background: bg, borderColor, boxShadow, color }}
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
        <PanelRight size={16} />
      </button>
    </div>
  );
}
