'use client';
import { useState, useEffect, useRef } from 'react';
import { CornerUpLeft, X } from 'lucide-react';
import CommentList from './CommentList';
import type { CommentsPopoverProps } from './types';
import type { Comment } from '@/app/features/types';
import { POPOVER_WIDTH, MAX_TEXTAREA_HEIGHT } from './constants';

/** Comment thread popover for a block or frame — viewport-positioned, same pattern as AddInput. */
export default function CommentsPopover({ targetId, comments, x, y, onAdd, onDelete, onReply, onClose }: CommentsPopoverProps) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const startReply = (comment: Comment) => {
    setReplyTo(comment);
    textareaRef.current?.focus();
  };

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (replyTo) {
      onReply(targetId, replyTo.id, trimmed);
      setReplyTo(null);
    } else {
      onAdd(targetId, trimmed);
    }
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      if (replyTo) { setReplyTo(null); return; }
      onClose();
      return;
    }
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
        <CommentList
          comments={comments}
          onDelete={id => onDelete(targetId, id)}
          onStartReply={startReply}
        />
      )}

      {/* Reply context — a single subtle line above the composer */}
      {replyTo && (
        <div className="flex items-center gap-1.5 px-4 pt-3 -mb-1">
          <CornerUpLeft size={12} style={{ color: 'var(--color-text-muted)' }} className="shrink-0" />
          <span className="text-[11px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>Replying to</span>
          <span className="text-[11px] font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {replyTo.authorName ?? 'Unknown'}
          </span>
          <button
            className="shrink-0 ml-0.5 p-0.5 rounded-full transition-colors"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
            onClick={() => { setReplyTo(null); textareaRef.current?.focus(); }}
            title="Cancel reply"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        className="w-full text-sm px-4 pt-3.5 pb-2 outline-none bg-transparent resize-none"
        style={{
          maxHeight: MAX_TEXTAREA_HEIGHT,
          color: 'var(--color-text-primary)',
        }}
        placeholder={replyTo ? `Reply to ${replyTo.authorName ?? 'comment'}...` : 'Write a comment...'}
        value={text}
        rows={2}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {replyTo ? '⌘↵ to reply · Esc to cancel' : '⌘↵ to add · Esc to close'}
        </span>
        <button
          className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors disabled:opacity-40"
          disabled={!text.trim()}
          onClick={submit}
        >
          {replyTo ? 'Reply' : 'Comment'}
        </button>
      </div>
    </div>
  );
}
