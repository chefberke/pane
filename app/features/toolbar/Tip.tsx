'use client';
import { useRef, useState } from 'react';
import { TIP_DELAY } from './constants';

interface Props {
  label: string;
  shortcut?: string;
  children: React.ReactNode;
}

/** Floating tooltip with an optional keyboard shortcut badge, shown after a short hover delay. */
export default function Tip({ label, shortcut, children }: Props) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => { timer.current = setTimeout(() => setVisible(true), TIP_DELAY); };
  const hide = () => { if (timer.current) clearTimeout(timer.current); setVisible(false); };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 pointer-events-none z-50 flex flex-col items-center">
          <div className="flex items-center gap-1.5 bg-white/95 dark:bg-[#1e1e1e]/95 text-gray-800 dark:text-[#eee] text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl shadow-black/10 dark:shadow-black/50 border border-black/[0.06] dark:border-white/[0.06] backdrop-blur-sm">
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
