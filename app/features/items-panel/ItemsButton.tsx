'use client';
import { useRef, useState } from 'react';
import { PanelRight } from 'lucide-react';

interface Props {
  count: number;
  onClick: () => void;
}

/** Floating items panel button pinned to the top-right, with a tooltip on hover. */
export default function ItemsButton({ count, onClick }: Props) {
  const [tipVisible, setTipVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const base: React.CSSProperties = {
    background: 'var(--color-surface-raised)',
    borderColor: 'var(--color-border-default)',
    boxShadow: 'var(--shadow-float)',
    color: 'var(--color-text-tertiary)',
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => { timer.current = setTimeout(() => setTipVisible(true), 600); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setTipVisible(false); }}
    >
      {tipVisible && (
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
            <span className="font-medium">Items</span>
            {count > 0 && (
              <span
                className="text-[9px] font-mono rounded px-1.5 py-0.5 leading-none"
                style={{ background: 'var(--color-bg-active)', color: 'var(--color-text-secondary)' }}
              >
                {count}
              </span>
            )}
          </div>
        </div>
      )}
      <button
        className="w-9 h-9 flex items-center justify-center rounded-2xl backdrop-blur-md border transition-all duration-150 hover:scale-105 cursor-pointer"
        style={base}
        onPointerDown={e => e.stopPropagation()}
        onDoubleClick={e => e.stopPropagation()}
        onClick={onClick}
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
        <PanelRight size={16} />
      </button>
    </div>
  );
}
