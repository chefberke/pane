'use client';
import { useEffect, useRef } from 'react';
import type { TextBlock } from '@/app/features/types';

/** Props for the editable sticky-note text block. */
interface Props {
  block: TextBlock;
  onUpdate: (content: string) => void;
  isEditing: boolean;
  onStopEdit: () => void;
}

export default function TextNote({ block, onUpdate, isEditing, onStopEdit }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) ref.current?.focus();
  }, [isEditing]);

  return (
    <div
      className="w-56 min-h-[88px] p-3.5 cursor-default"
      style={{ background: 'var(--color-surface-note)' }}
      onPointerDown={e => { if (isEditing) e.stopPropagation(); }}
    >
      {isEditing ? (
        <textarea
          ref={ref}
          className="w-full min-h-[60px] bg-transparent resize-none outline-none text-xs leading-relaxed font-medium"
          style={{
            color: 'var(--color-text-primary)',
          }}
          value={block.content}
          placeholder="Write something..."
          rows={4}
          onChange={e => onUpdate(e.target.value)}
          onBlur={onStopEdit}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <p
          className="text-xs whitespace-pre-wrap break-words leading-relaxed select-none"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {block.content || (
            <span style={{ color: 'var(--color-text-note-placeholder)' }}>Double-click to edit</span>
          )}
        </p>
      )}
    </div>
  );
}
