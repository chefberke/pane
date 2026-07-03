'use client';
import { memo, useState, type RefObject } from 'react';
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
  // While editing, hold the text locally so each keystroke doesn't rebuild the whole blocks array
  // (and re-serialise the canvas for the save diff). The edit commits to the block once, on blur.
  const [draft, setDraft] = useState(block.content);

  // Seed the draft from the block when an edit session starts — render-phase "previous value" pattern
  // (mirrors Frame's rename handling), so a remote content update can't clobber in-progress typing.
  const [wasEditing, setWasEditing] = useState(isEditing);
  if (isEditing !== wasEditing) {
    setWasEditing(isEditing);
    if (isEditing) setDraft(block.content);
  }

  const ref = useAutoGrowTextarea(isEditing, draft);

  const commit = () => {
    if (draft !== block.content) onUpdate(draft);
    onStopEdit();
  };

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
          value={draft}
          placeholder="Write something..."
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
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
