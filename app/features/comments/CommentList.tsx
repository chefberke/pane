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
    <div className="max-h-52 overflow-y-auto border-b border-gray-100 dark:border-white/[0.06]">
      {sorted.map(c => (
        <div key={c.id} className="group/item relative flex items-start gap-2 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03]">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-[#d0d0d0] whitespace-pre-wrap break-words leading-snug">{c.text}</p>
            <span className="text-[10px] text-gray-300 dark:text-[#4a4a4a] mt-1 block">{formatTimestamp(c.createdAt)}</span>
          </div>
          <button
            className="shrink-0 mt-0.5 p-1 rounded-md text-gray-300 dark:text-[#444] hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover/item:opacity-100 transition-all"
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
