'use client';
import { useEffect, useRef, useState } from 'react';

import { ChevronRight, ChevronDown } from 'lucide-react';
import type { Frame } from '@/app/features/types';
import { FRAME_COLORS } from './constants';

interface Props {
  frame: Frame;
  memberCount: number;
  isEditing: boolean;
  /** When false (viewer), the title shows no grab affordance (drag is gated upstream). */
  canEdit: boolean;
  onToggleCollapse: () => void;
  onCommitRename: (title: string) => void;
  onCancelRename: () => void;
  onDragPointerDown: (e: React.PointerEvent) => void;
}

/** Outside header for a frame — chevron + title (or input) + member count. Sits above the frame, no background. */
export default function FrameTitle({
  frame, memberCount, isEditing, canEdit,
  onToggleCollapse, onCommitRename, onCancelRename, onDragPointerDown,
}: Props) {
  const [draft, setDraft] = useState(frame.title);
  const [lastTitle, setLastTitle] = useState(frame.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resync local draft when upstream title changes (React-blessed "adjust state during render").
  if (lastTitle !== frame.title) {
    setLastTitle(frame.title);
    setDraft(frame.title);
  }

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const tokens = FRAME_COLORS[frame.color];

  const commit = () => {
    const next = draft.trim();
    if (next && next !== frame.title) onCommitRename(next);
    else onCancelRename();
  };

  return (
    <div
      className="flex items-center gap-1 select-none"
      style={{ cursor: isEditing ? 'text' : canEdit ? 'grab' : 'default' }}
      onPointerDown={e => { if (!isEditing) onDragPointerDown(e); }}
    >
      <button
        type="button"
        aria-label={frame.collapsed ? 'Expand' : 'Collapse'}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onToggleCollapse(); }}
        className="flex items-center justify-center w-4 h-4 rounded transition-colors hover:bg-black/10 dark:hover:bg-white/10"
        style={{ color: tokens.swatch, cursor: 'default' }}
      >
        {frame.collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape') { e.preventDefault(); setDraft(frame.title); onCancelRename(); }
          }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          className="min-w-0 bg-transparent outline-none text-xs font-semibold px-1 rounded"
          style={{ color: 'var(--color-text-primary)', background: 'var(--color-surface-raised)' }}
          size={Math.max(8, draft.length + 1)}
        />
      ) : (
        <span
          className="min-w-0 truncate text-xs font-semibold"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {frame.title}
        </span>
      )}

      <span
        className="text-[10px] tabular-nums"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {memberCount}
      </span>
    </div>
  );
}
