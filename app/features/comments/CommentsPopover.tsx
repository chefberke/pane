'use client';
import { useState, useEffect, useRef } from 'react';
import CommentList from './CommentList';
import type { CommentsPopoverProps } from './types';
import { POPOVER_WIDTH, MAX_TEXTAREA_HEIGHT } from './constants';

/** Comment thread popover for a block or frame — viewport-positioned, same pattern as AddInput. */
export default function CommentsPopover({ targetId, comments, x, y, onAdd, onDelete, onClose }: CommentsPopoverProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(targetId, trimmed);
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { submit(); }
  };

  return (
    <div
      className="absolute z-50 backdrop-blur-md rounded-2xl overflow-hidden"
      style={{
        left: x,
        top: y,
        width: POPOVER_WIDTH,
        transform: 'translate(-50%, -100%) translateY(-24px)',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-modal)',
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
      onPointerDown={e => e.stopPropagation()}
    >
      {comments.length > 0 && (
        <CommentList comments={comments} onDelete={id => onDelete(targetId, id)} />
      )}

      <textarea
        ref={textareaRef}
        className="w-full text-sm px-4 pt-3.5 pb-2 outline-none bg-transparent resize-none"
        style={{
          maxHeight: MAX_TEXTAREA_HEIGHT,
          color: 'var(--color-text-primary)',
        }}
        placeholder="Write a comment..."
        value={text}
        rows={2}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>⌘↵ to add · Esc to close</span>
        <button
          className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors disabled:opacity-40"
          disabled={!text.trim()}
          onClick={submit}
        >
          Comment
        </button>
      </div>
    </div>
  );
}
