'use client';
import { useEffect, useRef, useState } from 'react';
import { Columns2, Rows2, AlignJustify } from 'lucide-react';
import type { AlignMode } from '@/app/features/types';
import Tip from './Tip';
import { Btn } from './Btn';

const ITEMS: { mode: AlignMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'distributeH', label: 'Arrange side by side', icon: <Columns2 size={13} /> },
  { mode: 'distributeV', label: 'Arrange top to bottom', icon: <Rows2 size={13} /> },
];

/** Single toolbar button that opens an alignment popup above; active when 2+ blocks are selected. */
export default function AlignGroup({
  selectedCount,
  onAlign,
}: {
  selectedCount: number;
  onAlign: (mode: AlignMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [prevActive, setPrevActive] = useState(selectedCount >= 2);
  const ref = useRef<HTMLDivElement>(null);
  const active = selectedCount >= 2;

  // Adjust state during render when `active` flips false — avoids a setState-in-effect.
  if (active !== prevActive) {
    setPrevActive(active);
    if (!active && open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Tip label="Align">
        <Btn
          onClick={() => { if (active) setOpen(o => !o); }}
          active={open}
          disabled={!active}
        >
          <AlignJustify size={14} />
        </Btn>
      </Tip>

      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 flex gap-0.5 rounded-xl p-1.5 pointer-events-auto"
          style={{
            background: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          {ITEMS.map(({ mode, label, icon }) => (
            <Tip key={mode} label={label}>
              <Btn onClick={() => { onAlign(mode); setOpen(false); }}>
                {icon}
              </Btn>
            </Tip>
          ))}
        </div>
      )}
    </div>
  );
}
