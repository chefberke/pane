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
          <div className="flex items-center gap-1.5 bg-gray-900/95 dark:bg-[#0a0a0a]/95 text-white text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl backdrop-blur-sm">
            <span className="font-medium">{label}</span>
            {shortcut && (
              <kbd className="text-[9px] font-mono bg-white/15 rounded px-1.5 py-0.5 leading-none tracking-wide">
                {shortcut}
              </kbd>
            )}
          </div>
          <div className="w-2 h-2 bg-gray-900/95 dark:bg-[#0a0a0a]/95 rotate-45 -mt-1 rounded-[1px]" />
        </div>
      )}
    </div>
  );
}
