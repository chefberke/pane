'use client';
import { useState, useRef, useEffect } from 'react';
import type { TextBlock } from '@/types';

/** Props for the editable sticky-note text block. */
interface Props {
  block: TextBlock;
  onUpdate: (content: string) => void;
}

export default function TextNote({ block, onUpdate }: Props) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  return (
    <div
      className="w-56 min-h-[88px] p-3.5 cursor-default bg-yellow-50 dark:bg-[#252218]"
      onDoubleClick={e => { e.stopPropagation(); setEditing(true); }}
    >
      {editing ? (
        <textarea
          ref={ref}
          className="w-full min-h-[60px] bg-transparent resize-none outline-none text-sm text-gray-800 dark:text-[#e8e8e8] leading-relaxed font-medium placeholder:text-yellow-300 dark:placeholder:text-yellow-900"
          value={block.content}
          placeholder="Write something..."
          rows={4}
          onChange={e => onUpdate(e.target.value)}
          onBlur={() => setEditing(false)}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <p className="text-sm text-gray-800 dark:text-[#e8e8e8] whitespace-pre-wrap break-words leading-relaxed select-none">
          {block.content || <span className="text-yellow-300 dark:text-yellow-900">Double-click to edit</span>}
        </p>
      )}
    </div>
  );
}
