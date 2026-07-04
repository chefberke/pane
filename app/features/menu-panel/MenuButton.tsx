'use client';
import { useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import MenuPanel from './MenuPanel';
import type { ThemeChoice } from '../canvas/hooks/useTheme';

interface Props {
  themeChoice: ThemeChoice;
  onSetTheme: (choice: ThemeChoice) => void;
}

/** Floating menu button pinned to the top-left, opens an anchored dropdown panel on click. */
export default function MenuButton({ themeChoice, onSetTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [tipVisible, setTipVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const base: React.CSSProperties = {
    background: 'var(--color-surface-raised)',
    borderColor: 'var(--color-border-default)',
    boxShadow: 'var(--shadow-float)',
    color: 'var(--color-text-tertiary)',
  };

  const handleMouseEnter = () => {
    if (!open) timer.current = setTimeout(() => setTipVisible(true), 600);
  };
  const handleMouseLeave = () => {
    if (timer.current) clearTimeout(timer.current);
    setTipVisible(false);
  };

  return (
    <div
      className="absolute top-6 left-6 pointer-events-auto"
      style={{ position: 'absolute' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Tooltip — only shown when panel is closed */}
      {tipVisible && !open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 pointer-events-none z-50 flex flex-col items-center">
          <div
            className="w-2 h-2 rotate-45 -mb-1 rounded-[1px] border-l border-t"
            style={{ background: 'var(--color-surface-raised)', borderColor: 'var(--color-border-default)' }}
          />
          <div
            className="flex items-center gap-1.5 text-[11px] rounded-lg px-2.5 py-1.5 whitespace-nowrap backdrop-blur-sm"
            style={{
              background: 'var(--color-surface-raised)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
              boxShadow: 'var(--shadow-float)',
            }}
          >
            <span className="font-medium">Menu</span>
          </div>
        </div>
      )}

      <button
        className="w-9 h-9 flex items-center justify-center rounded-2xl backdrop-blur-md border transition-all duration-150 cursor-pointer"
        style={base}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onClick={() => { setOpen(p => !p); setTipVisible(false); }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.background = 'var(--color-surface-raised-hover)';
          el.style.color = 'var(--color-text-secondary)';
          el.style.boxShadow = 'var(--shadow-float-hover)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.background = 'var(--color-surface-raised)';
          el.style.color = 'var(--color-text-tertiary)';
          el.style.boxShadow = 'var(--shadow-float)';
        }}
      >
        <Menu size={16} />
      </button>

      <AnimatePresence>
        {open && <MenuPanel themeChoice={themeChoice} onSetTheme={onSetTheme} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
