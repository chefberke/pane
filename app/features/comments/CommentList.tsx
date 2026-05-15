'use client';
import { Trash2 } from 'lucide-react';
import type { Comment } from '@/app/features/types';
import { formatTimestamp } from './utils';

interface Props {
  comments: Comment[];
  onDelete: (commentId: string) => void;
}

/** Renders existing comments newest-first, each with a relative timestamp and delete button. */
export default function CommentList({ comments, onDelete }: Props) {
  if (!comments.length) return null;
  const sorted = [...comments].reverse();
  return (
    <div
      className="max-h-52 overflow-y-auto"
      style={{ borderBottom: '1px solid var(--color-border-default)' }}
    >
      {sorted.map(c => (
        <div
          key={c.id}
          className="group/item relative flex items-start gap-2 px-4 py-2.5"
          style={{ transition: 'background var(--duration-fast)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'var(--color-bg-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-sm whitespace-pre-wrap break-words leading-snug"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {c.text}
            </p>
            <span
              className="text-[10px] mt-1 block"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {formatTimestamp(c.createdAt)}
            </span>
          </div>
          <button
            className="shrink-0 mt-0.5 p-1 rounded-md opacity-0 group-hover/item:opacity-100 transition-all"
            style={{ color: 'var(--color-text-muted)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-danger)';
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-danger-hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-muted)';
              (e.currentTarget as HTMLButtonElement).style.background = '';
            }}
            onClick={() => onDelete(c.id)}
            onPointerDown={e => e.stopPropagation()}
            title="Delete comment"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
