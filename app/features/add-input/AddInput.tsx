'use client';
import { useState, useEffect, useRef } from 'react';

/** Props for the double-click popover that lets users type a URL or note. */
interface Props {
  /** Viewport-relative X position of the popover center. */
  x: number;
  /** Viewport-relative Y position of the popover center. */
  y: number;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export default function AddInput({ x, y, onSubmit, onClose }: Props) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') onSubmit(value);
    else if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="absolute z-50 backdrop-blur-md rounded-2xl overflow-hidden w-80"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-modal)',
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
    >
      <div className="flex items-center">
        <input
          ref={ref}
          type="text"
          className="flex-1 text-sm px-4 py-3.5 outline-none bg-transparent"
          style={{ color: 'var(--color-text-primary)' }}
          placeholder="Paste a URL or type a note..."
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Enter to add · Esc to cancel
        </span>
        <button
          className="text-xs font-medium transition-colors text-blue-500 hover:text-blue-400"
          onClick={() => onSubmit(value)}
        >
          Add
        </button>
      </div>
    </div>
  );
}
