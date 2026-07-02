'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerUpLeft, X } from 'lucide-react';
import CommentList from './CommentList';
import { useCommentComposer } from './hooks/useCommentComposer';
import type { CommentsSheetProps } from './types';
import { MAX_TEXTAREA_HEIGHT } from './constants';

/** Right-side chat sheet for a block or frame's comment thread — slides in from the right, mirrors ItemsSheet. */
export default function CommentsSheet({ targetId, targetLabel, comments, onAdd, onDelete, onReply, onClose }: CommentsSheetProps) {
  const { text, setText, replyTo, startReply, cancelReply, submit, handleKeyDown, textareaRef } =
    useCommentComposer({ targetId, onAdd, onReply, onClose });
  const listRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, [textareaRef]);

  // The canvas viewport has a native wheel listener that preventDefaults to pan/zoom.
  // Since the sheet renders inside the viewport, stop wheel events here so the sheet
  // (and not the canvas behind it) scrolls under the mouse.
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const stop = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener('wheel', stop);
    return () => el.removeEventListener('wheel', stop);
  }, []);

  // Chat behaviour: keep the newest message in view whenever the thread changes.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight });
  }, [comments]);

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        className="fixed inset-0 z-[250] flex justify-end"
        style={{ background: 'var(--color-overlay-sheet)', backdropFilter: 'blur(2px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          className="flex flex-col h-full"
          style={{
            width: 'var(--panel-width-sheet)',
            maxWidth: '90vw',
            background: 'var(--color-surface)',
            borderLeft: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-sheet)',
          }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onDoubleClick={e => e.stopPropagation()}
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center px-4 flex-shrink-0"
            style={{ height: 52, borderBottom: '1px solid var(--color-border-default)' }}
          >
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                Comments
                {comments.length > 0 && (
                  <span className="ml-2 text-[11px] font-normal" style={{ color: 'var(--color-text-muted)' }}>
                    {comments.length}
                  </span>
                )}
              </span>
              {targetLabel && (
                <div className="text-[11px] truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {targetLabel}
                </div>
              )}
            </div>
            <button
              className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={onClose}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)'; }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="ui-scrollbar flex-1 overflow-y-auto overflow-x-hidden">
            {comments.length > 0 ? (
              <CommentList
                comments={comments}
                onDelete={id => onDelete(targetId, id)}
                onStartReply={startReply}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-1 px-6 text-center">
                <span className="text-[13px]" style={{ color: 'var(--color-text-tertiary)' }}>No comments yet</span>
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>Start the conversation.</span>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="flex-shrink-0" style={{ borderTop: '1px solid var(--color-border-default)' }}>
            {/* Reply context — a single subtle line above the composer */}
            {replyTo && (
              <div className="flex items-center gap-1.5 px-4 pt-3 -mb-1">
                <CornerUpLeft size={12} style={{ color: 'var(--color-text-muted)' }} className="shrink-0" />
                <span className="text-[11px] shrink-0" style={{ color: 'var(--color-text-muted)' }}>Replying to</span>
                <span className="text-[11px] font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
                  {replyTo.authorName ?? 'Unknown'}
                </span>
                <button
                  className="shrink-0 ml-0.5 p-1 rounded-md cursor-pointer transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-hover)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
                    (e.currentTarget as HTMLButtonElement).style.background = '';
                  }}
                  onClick={cancelReply}
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
                {replyTo ? '↵ to reply · ⇧↵ new line · Esc to cancel' : '↵ to add · ⇧↵ new line · Esc to close'}
              </span>
              <button
                className="text-xs text-blue-500 hover:text-blue-400 font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default"
                disabled={!text.trim()}
                onClick={submit}
              >
                {replyTo ? 'Reply' : 'Comment'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
