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
      className="absolute z-50 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden w-80"
      style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
    >
      <input
        ref={ref}
        type="text"
        className="w-full text-sm px-4 py-3.5 outline-none text-gray-800 dark:text-[#e8e8e8] placeholder:text-gray-300 dark:placeholder:text-[#555] bg-transparent"
        placeholder="Paste a URL or type a note..."
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs text-gray-300 dark:text-[#4a4a4a]">Enter to add · Esc to cancel</span>
        <button
          className="text-xs text-blue-500 hover:text-blue-400 dark:text-[#aaa] dark:hover:text-[#ccc] font-medium transition-colors"
          onClick={() => onSubmit(value)}
        >
          Add
        </button>
      </div>
    </div>
  );
}
