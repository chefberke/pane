'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import type { Comment } from '@/app/features/types';
import { getBlockLabel, TYPE_LABELS } from '@/app/features/blocks/utils';
import { formatTimestamp } from '@/app/features/comments/utils';
import { MAX_COMMENT_TEXTAREA_HEIGHT } from './constants';
import type { DetailPanelProps } from './types';

function getBlockUrl(block: DetailPanelProps['block']): string | null {
  if (block.type === 'link') return block.url;
  if (block.type === 'youtube') return `https://www.youtube.com/watch?v=${block.videoId}`;
  if (block.type === 'twitter') return block.url;
  if (block.type === 'image') return block.url;
  if (block.type === 'pdf') return block.url;
  if (block.type === 'spotify') return block.url;
  if (block.type === 'map') return block.embedUrl;
  if (block.type === 'github') return block.url;
  return null;
}

function getBlockMeta(block: DetailPanelProps['block']): string | null {
  if (block.type === 'link') return block.description ?? null;
  if (block.type === 'youtube') return block.title ?? null;
  if (block.type === 'twitter') return null;
  if (block.type === 'image') return block.alt ?? null;
  if (block.type === 'text') return block.content ? block.content.slice(0, 140) : null;
  if (block.type === 'pdf') return block.title ?? null;
  if (block.type === 'github') {
    const parts: string[] = [];
    if (block.language) parts.push(block.language);
    if (block.stars != null) parts.push(`★ ${block.stars}`);
    if (block.description) parts.push(block.description);
    return parts.join('  ·  ') || null;
  }
  return null;
}

/** Comment row with relative timestamp and hover-reveal delete. */
function CommentRow({ comment, onDelete }: { comment: Comment; onDelete: () => void }) {
  return (
    <div
      className="group/row relative flex items-start gap-2 px-4 py-3"
      style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug whitespace-pre-wrap break-words" style={{ color: 'var(--color-text-primary)' }}>
          {comment.text}
        </p>
        <span className="text-[10px] mt-1 block" style={{ color: 'var(--color-text-muted)' }}>
          {formatTimestamp(comment.createdAt)}
        </span>
      </div>
      <button
        className="shrink-0 mt-0.5 p-1 rounded-md opacity-0 group-hover/row:opacity-100 transition-opacity"
        style={{ color: 'var(--color-text-muted)' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-danger)';
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-danger-hover)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
          (e.currentTarget as HTMLButtonElement).style.background = '';
        }}
        onClick={onDelete}
        onPointerDown={e => e.stopPropagation()}
        title="Delete comment"
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}

/** Right-side detail panel for a selected block — shows metadata and comment thread. */
export default function DetailPanel({ block, onClose, onAddComment, onDeleteComment }: DetailPanelProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const comments = block.comments ?? [];
  const url = getBlockUrl(block);
  const meta = getBlockMeta(block);
  const label = getBlockLabel(block);
  const typeLabel = TYPE_LABELS[block.type];

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(block.id, trimmed);
    setText('');
    textareaRef.current?.focus();
    setTimeout(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50);
  }, [text, block.id, onAddComment]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  }, [submit, onClose]);

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [block.id]);

  return (
    <motion.div
      className="fixed right-6 top-6 bottom-6 flex flex-col overflow-hidden"
      style={{
        width: 'var(--panel-width-sheet)',
        zIndex: 'var(--z-menu-panel)' as React.CSSProperties['zIndex'],
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 'var(--radius-4xl)',
        boxShadow: 'var(--shadow-modal)',
      }}
      initial={{ opacity: 0, x: 16, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onDoubleClick={e => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 flex-shrink-0"
        style={{ height: 52, borderBottom: '1px solid var(--color-border-default)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-medium uppercase tracking-widest mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
            {typeLabel}
          </div>
          <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </div>
        </div>
        <button
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer"
          style={{ color: 'var(--color-text-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      {/* Metadata */}
      {(url || meta) && (
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 group/link mb-1.5"
              onClick={e => e.stopPropagation()}
            >
              <span
                className="text-[11px] truncate underline underline-offset-2 decoration-transparent group-hover/link:decoration-current transition-all"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {url.replace(/^https?:\/\//, '')}
              </span>
              <ExternalLink size={10} className="shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" style={{ color: 'var(--color-text-muted)' }} />
            </a>
          )}
          {meta && (
            <p className="text-[12px] leading-snug line-clamp-3" style={{ color: 'var(--color-text-secondary)' }}>
              {meta}
            </p>
          )}
        </div>
      )}

      {/* Comments section header */}
      <div
        className="flex items-center gap-1.5 px-4 py-2.5 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border-default)' }}
      >
        <MessageCircle size={12} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-[11px] font-medium uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
          Comments
        </span>
        {comments.length > 0 && (
          <span className="text-[10px] ml-auto" style={{ color: 'var(--color-text-muted)' }}>
            {comments.length}
          </span>
        )}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <span className="text-[12px]" style={{ color: 'var(--color-text-tertiary)' }}>No comments yet</span>
          </div>
        ) : (
          comments.map(c => (
            <CommentRow
              key={c.id}
              comment={c}
              onDelete={() => onDeleteComment(block.id, c.id)}
            />
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Add comment */}
      <div
        className="flex-shrink-0"
        style={{ borderTop: '1px solid var(--color-border-default)' }}
      >
        <textarea
          ref={textareaRef}
          className="w-full text-[13px] px-4 pt-3 pb-2 outline-none bg-transparent resize-none"
          style={{
            maxHeight: MAX_COMMENT_TEXTAREA_HEIGHT,
            color: 'var(--color-text-primary)',
          }}
          placeholder="Write a comment…"
          value={text}
          rows={2}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="px-4 pb-3 flex items-center justify-between">
          <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>⌘↵ to add</span>
          <button
            className="text-[11px] text-blue-500 hover:text-blue-400 font-medium transition-colors disabled:opacity-40 cursor-pointer"
            disabled={!text.trim()}
            onClick={submit}
            onPointerDown={e => e.stopPropagation()}
          >
            Comment
          </button>
        </div>
      </div>
    </motion.div>
  );
}
