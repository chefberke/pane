'use client';
import { memo, type RefObject } from 'react';
import type { TextBlock } from '@/app/features/types';
import { useAutoGrowTextarea } from '../hooks/useAutoGrowTextarea';

/** Props for the editable sticky-note text block. */
interface Props {
  block: TextBlock;
  onUpdate: (content: string) => void;
  isEditing: boolean;
  onStopEdit: () => void;
  /** Root element ref — its measured height is the resize floor (box never shrinks below the text). */
  rootRef?: RefObject<HTMLDivElement | null>;
}

function TextNote({ block, onUpdate, isEditing, onStopEdit, rootRef }: Props) {
  const ref = useAutoGrowTextarea(isEditing, block.content);

  return (
    <div
      ref={rootRef}
      className="w-full min-h-[88px] p-3.5 cursor-default"
      style={{ background: 'var(--color-surface-note)' }}
      onPointerDown={e => { if (isEditing) e.stopPropagation(); }}
    >
      {isEditing ? (
        <textarea
          ref={ref}
          className="w-full min-h-[60px] bg-transparent resize-none overflow-hidden outline-none text-xs leading-relaxed font-medium"
          style={{
            color: 'var(--color-text-primary)',
          }}
          value={block.content}
          placeholder="Write something..."
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

export default memo(TextNote);
