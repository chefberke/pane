'use client';
import { Trash2, CornerDownRight } from 'lucide-react';
import type { Comment } from '@/app/features/types';
import Avatar from '@/app/features/ui/Avatar';
import { formatTimestamp } from './utils';

interface Props {
  comment: Comment;
  onDelete: (commentId: string) => void;
  onStartReply: (comment: Comment) => void;
}

/** A single comment with author, timestamp, reply/delete actions, and nested replies. */
export default function CommentItem({ comment, onDelete, onStartReply }: Props) {
  return (
    <div
      className="group/item relative px-4 py-2.5"
      style={{ transition: 'background var(--duration-fast)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0">
          <Avatar name={comment.authorName} color={comment.authorColor} size="xs" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {comment.authorName ?? 'Unknown'}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
              {formatTimestamp(comment.createdAt)}
            </span>
          </div>
          <p
            className="text-sm whitespace-pre-wrap break-words leading-snug mt-0.5"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {comment.text}
          </p>

          {/* Replies */}
          {(comment.replies?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-col gap-2 pl-2" style={{ borderLeft: '1px solid var(--color-border-default)' }}>
              {comment.replies!.map(r => (
                <div key={r.id} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">
                    <Avatar name={r.authorName} color={r.authorColor} size="xs" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {r.authorName ?? 'Unknown'}
                      </span>
                      <span className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>
                        {formatTimestamp(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-[13px] whitespace-pre-wrap break-words leading-snug" style={{ color: 'var(--color-text-primary)' }}>
                      {r.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reply trigger — focuses the main composer with a reply banner */}
          <button
            className="mt-1 flex items-center gap-1 text-[11px] opacity-0 group-hover/item:opacity-100 transition-opacity"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => onStartReply(comment)}
            onPointerDown={e => e.stopPropagation()}
          >
            <CornerDownRight size={11} /> Reply
          </button>
        </div>

        {/* Delete */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-all">
          <button
            className="p-1 rounded-md"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-danger)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-danger-hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
              (e.currentTarget as HTMLButtonElement).style.background = '';
            }}
            onClick={() => onDelete(comment.id)}
            onPointerDown={e => e.stopPropagation()}
            title="Delete comment"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
